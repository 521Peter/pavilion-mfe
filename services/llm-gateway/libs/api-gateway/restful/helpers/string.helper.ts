/**
 * 验证某个值是否为有效 URL。
 * @param {any} string 任意值
 * @returns {boolean} URL 是否有效
 */
export function isValidUrl(string: any): boolean {
    try {
        new URL(string);
        return true;
    } catch {
        return false;
    }
}

/**
 * 从 URL 获取路径。
 * @param {string} value URL
 * @returns {string} 路径
 */
export function getPathFromUrl(value: string): string {
    if (isValidUrl(value)) {
        return new URL(value).pathname;
    }

    return new URL(`http://localhost${value}`).pathname;
}

/**
 * 将 ttl 转换为便于阅读的描述。
 * @param {number} ttl 生存时间
 * @returns {string} 描述字符串
 */
export function ttlToHumanReadable(ttl: number): string {
    const minutes = Math.floor(ttl / 60);
    if (minutes < 1) {
        return 'less than a minute';
    } else if (minutes === 1) {
        return 'the next one minute';
    } else if (minutes < 60) {
        return `the next ${minutes} minutes`;
    } else if (minutes < 120) {
        return 'the next one hour';
    } else {
        return `the next ${Math.floor(minutes / 60)} hours`;
    }
}
