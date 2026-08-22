/* 此 Lua 脚本通过管理 Redis 中的计数器执行限流。
- 计数器低于限制时，允许操作并递增计数器。
- 计数器达到限制时，返回剩余 TTL 以指示限制何时重置。
- 键不存在时，将计数初始化为 1 并设置过期时间。
*/
export const LUA_INCREASE_AND_GET_SCRIPT = `
local key = KEYS[1]
    local limit = tonumber(ARGV[1])
    local expire_time = ARGV[2]

    local current = tonumber(redis.call('get', key) or "0")
    if current > 0 then
     if current >= limit then
     return redis.call("PTTL",key)
     else
            redis.call("INCR", key)
     return 0
     end
    else
        redis.call("SET", key, 1,"px",expire_time)
     return 0
    end
`;
