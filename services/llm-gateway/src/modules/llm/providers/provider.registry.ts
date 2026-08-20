import type { ProviderAdapterBuilder } from '../interfaces/provider-adapter.interface';

/**
 * Provider 注册表（Registry 模式）
 *
 * 新增一个 Provider 类型时：
 *   1. 实现一个 ProviderAdapterBuilder
 *   2. 在本模块开头调用 registerProviderBuilder(builder) 注册
 * 不需要修改 Factory / Service / Controller 现有代码。
 */
const builderMap = new Map<string, ProviderAdapterBuilder>();

export function registerProviderBuilder(builder: ProviderAdapterBuilder): void {
    if (builderMap.has(builder.type)) {
        throw new Error(`Provider builder for type "${builder.type}" already registered`);
    }
    builderMap.set(builder.type, builder);
}

export function getProviderBuilder(type: string): ProviderAdapterBuilder {
    const builder = builderMap.get(type);
    if (!builder) {
        throw new Error(`Unsupported provider type: ${type}`);
    }
    return builder;
}

export function getSupportedProviderTypes(): string[] {
    return Array.from(builderMap.keys());
}
