import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is required');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
    const adminUsername = process.env.SEED_ADMIN_USERNAME ?? 'admin';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;
    if (!adminPassword) {
        throw new Error('SEED_ADMIN_PASSWORD is required when seeding the database');
    }

    const hashed = await bcrypt.hash(adminPassword, 10);

    await prisma.user.upsert({
        where: { username: adminUsername },
        update: {},
        create: {
            username: adminUsername,
            password: hashed,
            nickname: 'Administrator',
            status: 'ACTIVE',
            roles: ['ADMIN', 'USER']
        }
    });

    // ─── LLM Provider 种子数据 ───
    const providers = [
        {
            name: 'Ollama 本地',
            type: 'ollama',
            baseUrl: 'http://localhost:11434',
            isActive: true,
            config: {},
            models: [
                { modelName: 'llama3.2', displayName: 'Llama 3.2', isActive: true, config: {} },
                { modelName: 'qwen2.5', displayName: 'Qwen 2.5', isActive: true, config: {} }
            ]
        },
        {
            name: 'OpenAI 兼容代理',
            type: 'openai',
            baseUrl: 'http://localhost:8080/v1',
            isActive: true,
            config: {},
            models: [
                { modelName: 'gpt-4o', displayName: 'GPT-4o', isActive: true, config: {} },
                { modelName: 'gpt-4o-mini', displayName: 'GPT-4o mini', isActive: false, config: {} }
            ]
        }
    ];

    for (const p of providers) {
        const existing = await prisma.llmProvider.findFirst({
            where: { name: p.name, type: p.type }
        });
        const provider =
            existing ??
            (await prisma.llmProvider.create({
                data: {
                    name: p.name,
                    type: p.type,
                    baseUrl: p.baseUrl,
                    isActive: p.isActive,
                    config: p.config
                }
            }));
        for (const m of p.models) {
            await prisma.llmModel.upsert({
                where: {
                    providerId_modelName: { providerId: provider.id, modelName: m.modelName }
                },
                update: { isActive: m.isActive },
                create: { providerId: provider.id, ...m }
            });
        }
    }
    await Promise.all([
        prisma.application.upsert({
            where: { code: 'main-app' },
            update: {},
            create: { code: 'main-app', name: 'Pavilion Main App' }
        }),
        prisma.application.upsert({
            where: { code: 'ai-chat' },
            update: {},
            create: { code: 'ai-chat', name: 'Pavilion AI Chat', allowedModels: ['pavilion-default'] }
        })
    ]);

    const ollama = await prisma.llmProvider.findFirstOrThrow({ where: { name: 'Ollama 本地' } });
    const ollamaModels = await prisma.llmModel.findMany({ where: { providerId: ollama.id, isActive: true } });
    const deployments = [];
    for (const model of ollamaModels) {
        deployments.push(
            await prisma.modelDeployment.upsert({
                where: { name: `ollama-${model.modelName}` },
                update: { providerId: ollama.id, modelId: model.id, upstreamModel: model.modelName },
                create: {
                    name: `ollama-${model.modelName}`,
                    providerId: ollama.id,
                    modelId: model.id,
                    upstreamModel: model.modelName
                }
            })
        );
    }
    if (deployments.length > 0) {
        const virtualModel = await prisma.virtualModel.upsert({
            where: { name: 'pavilion-default' },
            update: { isActive: true },
            create: { name: 'pavilion-default', displayName: 'Pavilion Default' }
        });
        const policy = await prisma.routingPolicy.upsert({
            where: { virtualModelId: virtualModel.id },
            update: { strategy: 'fallback' },
            create: { virtualModelId: virtualModel.id, strategy: 'fallback' }
        });
        for (const [priority, deployment] of deployments.entries()) {
            await prisma.routeTarget.upsert({
                where: { policyId_deploymentId: { policyId: policy.id, deploymentId: deployment.id } },
                update: { priority, isActive: true },
                create: { policyId: policy.id, deploymentId: deployment.id, priority }
            });
        }
    }
    console.log(`Seed complete: ${providers.length} LLM providers seeded.`);

    console.log(`Seed complete: admin user "${adminUsername}" is ready.`);
}

main()
    .catch((e) => {
        console.error('Seed failed:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
