import { kebabCase } from 'lodash';

/**
 * 缓存 kebab-case 转换结果。键来自网关中间件，因此集合规模小且稳定；
 * 上限仅用于防止动态键导致无限增长。
 */
const kebabKeyCache = new Map<string, string>();
const kebabKeyCacheLimit = 1000;

function toKebabKey(key: string): string {
    let kebabKey = kebabKeyCache.get(key);
    if (kebabKey === undefined) {
        kebabKey = kebabCase(key);
        if (kebabKeyCache.size < kebabKeyCacheLimit) {
            kebabKeyCache.set(key, kebabKey);
        }
    }
    return kebabKey;
}

/**
 * 将对象的键从原格式（如 camelCase 或 snake_case）转换为 kebab-case。
 * @param {Object} object 待转换的对象
 * @returns {Object} 所有键均为 kebab-case 的转换后对象
 */
export function kebabConvertKeys<T>(object: object): T {
    const newObject: any = {};
    for (const key in object) {
        newObject[toKebabKey(key)] = object[key];
    }
    return newObject;
}
