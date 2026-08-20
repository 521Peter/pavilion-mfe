import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Prisma } from '@/../generated/prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { ProviderFactory } from '../providers/provider.factory';
import type { ProviderConfig, ModelConfig } from '../interfaces/provider-adapter.interface';
import '../providers'; // 副作用导入：注册内置 Adapter Builder
import { SecretEncryptionService } from '@/common/security/secret-encryption.service';
import { UrlSafetyService } from '@/common/security/url-safety.service';

/**
 * LLM Provider Service
 *
 * 职责：
 *   - Provider / Model 的数据库 CRUD
 *   - LangChain ChatModel 实例缓存（以 providerId:modelId 为 key）
 *   - 配置变更时主动失效缓存，下次请求重建实例（热切换）
 */
@Injectable()
export class LlmProviderService {
    // 缓存 key 格式: `${providerId}:${modelId}`
    private readonly modelCache = new Map<string, BaseChatModel>();

    constructor(
        private readonly prisma: PrismaService,
        private readonly secrets: SecretEncryptionService,
        private readonly urlSafety: UrlSafetyService
    ) {}

    // ── 模型实例获取 ──────────────────────────────

    /**
     * 获取 LangChain ChatModel 实例（带缓存）
     * 配置变更后调用 invalidateModel() 清缓存，下次请求自动重建。
     */
    async getModel(providerId: string, modelId: string): Promise<BaseChatModel> {
        const cacheKey = `${providerId}:${modelId}`;
        const cached = this.modelCache.get(cacheKey);
        if (cached) return cached;

        const provider = await this.prisma.llmProvider.findUnique({
            where: { id: providerId },
            include: {
                models: { where: { id: modelId } },
                credentials: { where: { isActive: true }, orderBy: { createdAt: 'asc' }, take: 1 }
            }
        });
        if (!provider) throw new NotFoundException('Provider 不存在');
        if (!provider.isActive) throw new BadRequestException('Provider 已禁用');

        const model = provider.models[0];
        if (!model) throw new NotFoundException('Model 不存在');
        if (!model.isActive) throw new BadRequestException('Model 已禁用');

        const providerConfig: ProviderConfig = {
            type: provider.type,
            baseUrl: provider.baseUrl ?? undefined,
            apiKey: provider.credentials[0]
                ? this.secrets.decrypt(provider.credentials[0].encryptedPayload)
                : undefined,
            extra: (provider.config as Record<string, unknown>) ?? {}
        };

        const modelConfig: ModelConfig = {
            ...((model.config as Record<string, unknown>) ?? {}),
            modelName: model.modelName
        };

        const instance = ProviderFactory.create(providerConfig, modelConfig);
        this.modelCache.set(cacheKey, instance);
        return instance;
    }

    async getDeploymentModel(deploymentId: string): Promise<BaseChatModel> {
        const cacheKey = `deployment:${deploymentId}`;
        const cached = this.modelCache.get(cacheKey);
        if (cached) return cached;
        const deployment = await this.prisma.modelDeployment.findUnique({
            where: { id: deploymentId },
            include: { provider: true }
        });
        if (!deployment || !deployment.isActive || !deployment.provider.isActive) {
            throw new NotFoundException('Model Deployment 不存在或已禁用');
        }
        const credential = deployment.credentialId
            ? await this.prisma.providerCredential.findFirst({
                  where: { id: deployment.credentialId, providerId: deployment.providerId, isActive: true }
              })
            : await this.prisma.providerCredential.findFirst({
                  where: { providerId: deployment.providerId, isActive: true },
                  orderBy: { createdAt: 'asc' }
              });
        const instance = ProviderFactory.create(
            {
                type: deployment.provider.type,
                baseUrl: deployment.provider.baseUrl ?? undefined,
                apiKey: credential ? this.secrets.decrypt(credential.encryptedPayload) : undefined,
                extra: (deployment.provider.config as Record<string, unknown>) ?? {}
            },
            { ...((deployment.config as Record<string, unknown>) ?? {}), modelName: deployment.upstreamModel }
        );
        this.modelCache.set(cacheKey, instance);
        return instance;
    }

    // ── 缓存失效（热切换） ──────────────────────

    /** 使某个 Provider 下的某个 Model 缓存失效 */
    invalidateModel(providerId: string, modelId: string): void {
        this.modelCache.delete(`${providerId}:${modelId}`);
    }

    /** 使某个 Provider 下所有 Model 缓存失效 */
    invalidateProvider(providerId: string): void {
        for (const key of this.modelCache.keys()) {
            if (key.startsWith(`${providerId}:`)) {
                this.modelCache.delete(key);
            }
        }
    }

    /** 清空全部缓存 */
    invalidateAll(): void {
        this.modelCache.clear();
    }

    // ── Provider CRUD ────────────────────────────

    async listProviders() {
        const providers = await this.prisma.llmProvider.findMany({
            orderBy: { createdAt: 'asc' },
            include: { credentials: { select: { id: true, name: true, kind: true, maskedHint: true, isActive: true } } }
        });
        return providers.map((provider) => ({
            ...provider,
            apiKey: provider.credentials.some((credential) => credential.isActive) ? '********' : undefined
        }));
    }

    async getProvider(id: string) {
        const provider = await this.prisma.llmProvider.findUnique({
            where: { id },
            include: {
                models: { orderBy: { createdAt: 'asc' } },
                credentials: { select: { id: true, name: true, kind: true, maskedHint: true, isActive: true } }
            }
        });
        if (!provider) throw new NotFoundException('Provider 不存在');
        return {
            ...provider,
            apiKey: provider.credentials.some((credential) => credential.isActive) ? '********' : undefined
        };
    }

    async createProvider(data: {
        name: string;
        type: string;
        baseUrl?: string;
        apiKey?: string;
        isActive?: boolean;
        config?: Record<string, unknown>;
    }) {
        await this.urlSafety.assertSafe(data.baseUrl);
        const provider = await this.prisma.llmProvider.create({
            data: {
                name: data.name,
                type: data.type,
                baseUrl: data.baseUrl,
                isActive: data.isActive ?? true,
                config: (data.config ?? {}) as Prisma.InputJsonValue
            }
        });
        if (data.apiKey) {
            await this.prisma.providerCredential.create({
                data: {
                    providerId: provider.id,
                    name: 'default',
                    encryptedPayload: this.secrets.encrypt(data.apiKey),
                    maskedHint: this.secrets.mask(data.apiKey)
                }
            });
        }
        return this.getProvider(provider.id);
    }

    async updateProvider(
        id: string,
        data: Partial<{
            name: string;
            type: string;
            baseUrl: string;
            apiKey: string;
            isActive: boolean;
            config: Record<string, unknown>;
        }>
    ) {
        await this.urlSafety.assertSafe(data.baseUrl);
        const { apiKey, ...providerFields } = data;
        const updateData: Record<string, unknown> = { ...providerFields };
        if (data.config !== undefined) {
            updateData.config = data.config as Prisma.InputJsonValue;
        }
        await this.prisma.llmProvider.update({
            where: { id },
            data: updateData as Prisma.LlmProviderUpdateInput
        });
        if (apiKey) {
            const credential = await this.prisma.providerCredential.findFirst({
                where: { providerId: id },
                orderBy: { createdAt: 'asc' }
            });
            const credentialData = {
                encryptedPayload: this.secrets.encrypt(apiKey),
                maskedHint: this.secrets.mask(apiKey),
                isActive: true
            };
            if (credential) {
                await this.prisma.providerCredential.update({ where: { id: credential.id }, data: credentialData });
            } else {
                await this.prisma.providerCredential.create({
                    data: { providerId: id, name: 'default', ...credentialData }
                });
            }
        }
        // 配置变更 → 失效该 Provider 下所有缓存
        this.invalidateProvider(id);
        return this.getProvider(id);
    }

    async deleteProvider(id: string) {
        await this.prisma.llmProvider.delete({ where: { id } });
        this.invalidateProvider(id);
    }

    // ── Model CRUD ───────────────────────────────

    async listModels(providerId: string) {
        return this.prisma.llmModel.findMany({
            where: { providerId },
            orderBy: { createdAt: 'asc' }
        });
    }

    async createModel(
        providerId: string,
        data: {
            modelName: string;
            displayName?: string;
            isActive?: boolean;
            config?: Record<string, unknown>;
        }
    ) {
        return this.prisma.llmModel.create({
            data: {
                providerId,
                modelName: data.modelName,
                displayName: data.displayName,
                isActive: data.isActive ?? true,
                config: (data.config ?? {}) as Prisma.InputJsonValue
            }
        });
    }

    async updateModel(
        modelId: string,
        data: Partial<{
            modelName: string;
            displayName: string;
            isActive: boolean;
            config: Record<string, unknown>;
        }>
    ) {
        const updateData: Record<string, unknown> = { ...data };
        if (data.config !== undefined) {
            updateData.config = data.config as Prisma.InputJsonValue;
        }
        const model = await this.prisma.llmModel.findUnique({
            where: { id: modelId },
            select: { providerId: true }
        });
        if (!model) throw new NotFoundException('Model 不存在');

        const updated = await this.prisma.llmModel.update({
            where: { id: modelId },
            data: updateData as Prisma.LlmModelUpdateInput
        });
        this.invalidateModel(model.providerId, modelId);
        return updated;
    }

    async deleteModel(modelId: string) {
        const model = await this.prisma.llmModel.findUnique({
            where: { id: modelId },
            select: { providerId: true }
        });
        if (!model) throw new NotFoundException('Model 不存在');

        await this.prisma.llmModel.delete({ where: { id: modelId } });
        this.invalidateModel(model.providerId, modelId);
    }

    // ── 平台元信息 ───────────────────────────────

    /** 聊天端可用模型列表（不暴露 Provider 密钥与配置）。 */
    async listAvailableModels() {
        const providers = await this.prisma.llmProvider.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                name: true,
                type: true,
                models: {
                    where: { isActive: true },
                    orderBy: { createdAt: 'asc' },
                    select: { id: true, modelName: true, displayName: true }
                }
            }
        });
        return providers.flatMap((provider) =>
            provider.models.map((model) => ({
                id: model.id,
                providerId: provider.id,
                providerName: provider.name,
                providerType: provider.type,
                modelName: model.modelName,
                displayName: model.displayName ?? model.modelName
            }))
        );
    }

    /** 获取已注册的 Provider 类型列表 */
    getSupportedTypes(): string[] {
        return ProviderFactory.getSupportedTypes();
    }
}
