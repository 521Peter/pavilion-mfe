/**
 * 按完整路径段判断请求 URL 是否属于某个前缀。
 *
 * 当 URL 等于前缀，或前缀后紧跟路径段边界（`/`、`?`、`#`）时匹配。
 * URL 开头的单个斜杠可省略，因此 `/oauth/authorize` 和 `oauth/authorize`
 * 都匹配前缀 `oauth`，而 `oauthtoken/...` 不匹配（避免部分名称冲突）。
 * @param {string} url 传入的请求 URL/路径
 * @param {string} prefix 待测试的前缀（不含首尾斜杠），例如 `oauth`
 * @returns {boolean} URL 是否位于此前缀的路径命名空间内
 */
export function matchesPrefixSegment(url: string, prefix: string): boolean {
    for (const base of [prefix, `/${prefix}`]) {
        if (url === base) {
            return true;
        }
        if (url.startsWith(base)) {
            const next = url.charAt(base.length);
            if (next === '/' || next === '?' || next === '#') {
                return true;
            }
        }
    }
    return false;
}
