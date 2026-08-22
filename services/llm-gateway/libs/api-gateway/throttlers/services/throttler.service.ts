import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Request, Response } from 'express';
import Redis from 'ioredis';
import { ttlToHumanReadable } from '../../restful/helpers/string.helper';
import { RateLimit, RouterDetail } from '../../restful/types/router-path.type';
import { LUA_INCREASE_AND_GET_SCRIPT } from '../constants/lua-script.constant';
import { RATE_LIMIT_KEY, THROTTLER_OPTION } from '../constants/rate-limit.constant';
import { TooManyRequestException } from '../exceptions/too-many-request.exception';
import { ThrottlerOption } from '../types/throttler-option.type';
import { REDIS_OPTION } from '../../redis/constants/redis.constant';

const resolvedIdentityKey = Symbol('throttler.resolvedIdentity');
const globalIpCheckedKey = Symbol('throttler.globalIpChecked');
const skipThrottle = Symbol('throttler.skip');

type ResolvedIdentity = string | typeof skipThrottle;

function isEmptyKey(value: unknown): boolean {
    if (value === null || value === undefined) {
        return true;
    }
    return typeof value === 'string' && value.trim() === '';
}

@Injectable()
export class ThrottlerService implements OnModuleInit {
    private luaSha: string;

    constructor(
        @Inject(THROTTLER_OPTION) private option: ThrottlerOption,
        @Inject(REDIS_OPTION) private readonly redis: Redis
    ) {}

    async onModuleInit(): Promise<any> {
        await this.loadLuaScript();
        this.redis.on('ready', async () => {
            await this.loadLuaScript();
        });
    }

    async loadLuaScript(): Promise<void> {
        this.luaSha = (await this.redis.script('LOAD', LUA_INCREASE_AND_GET_SCRIPT)) as string;
    }

    async getExpireAndIncreaseLimit(key: string, times: number, ttl: number): Promise<number> {
        return this.redis.evalsha(this.luaSha, 1, key, String(times), String(Math.floor(ttl * 1000))) as any;
    }

    async checkLimitOfRequest(routerDetail: RouterDetail, request: Request): Promise<void> {
        if (!this.option.isEnable) {
            return;
        }

        // 全局 IP 上限是以网络地址为键、始终启用的安全网。它在键解析器前执行，
        // 且不受解析器返回值影响（包括 skip-on-empty），因此豁免请求仍计入每 IP DoS 限制。
        // 已在管线前段执行过检查的调用方（如认证前的代理）会标记请求，避免在此重复计数；
        // 独立调用方（如 MCP 路径）仍会执行此检查。
        if (!(request as any)[globalIpCheckedKey]) {
            await this.checkGlobalIpRequest(request);
        }

        const identity = await this.resolveIdentity(routerDetail, request);
        (request as any)[resolvedIdentityKey] = identity;

        if (identity === skipThrottle) {
            return;
        }

        await this.checkGlobalCustomRequest(identity);

        if (routerDetail?.rateLimits?.length) {
            for (const rateLimit of routerDetail.rateLimits) {
                await this.checkRouterRequest(routerDetail, request, rateLimit, identity);
            }
        }
    }

    async checkGlobalIpRequest(request: Request): Promise<void> {
        if (!this.option.isEnable) {
            return;
        }
        // 标记请求，避免后续调用 checkLimitOfRequest 时重复执行 IP 检查。
        (request as any)[globalIpCheckedKey] = true;
        const key = this.getGlobalIpKey(request.ip);
        const expire = await this.getExpireAndIncreaseLimit(
            key,
            this.option.globalIpRateLimit,
            this.option.globalIpRateLimitTTL
        );
        if (expire > 0) {
            throw new TooManyRequestException();
        }
    }

    async checkGlobalCustomRequest(identity: string): Promise<void> {
        const key = this.getGlobalCustomKey(identity);
        const expire = await this.getExpireAndIncreaseLimit(
            key,
            this.option.globalCustomRateLimit,
            this.option.globalCustomRateLimitTTL
        );
        if (expire > 0) {
            throw new TooManyRequestException();
        }
    }

    async checkRouterRequest(
        routerDetail: RouterDetail,
        request: Request,
        rateLimit: RateLimit,
        identity: string
    ): Promise<void> {
        const key = this.getRouterKey(routerDetail, request, identity);

        let isAllowRequest: boolean;
        if (!rateLimit.status) {
            const expire = await this.getExpireAndIncreaseLimit(key, rateLimit.limit, rateLimit.ttl);
            isAllowRequest = expire === 0;
        } else {
            const countRequest = Number(await this.redis.get(key)) || 0;
            isAllowRequest = countRequest < rateLimit.limit;
        }

        if (!isAllowRequest) {
            throw new TooManyRequestException('error.too_many_requests_with_custom_ttl', {
                ttl: ttlToHumanReadable(rateLimit.ttl)
            });
        }
    }

    async increaseRouterLimit(routerDetail: RouterDetail, request: Request, response: Response): Promise<void> {
        const identity = (request as any)[resolvedIdentityKey] as ResolvedIdentity | undefined;
        if (identity === skipThrottle) {
            return;
        }
        const effectiveIdentity = identity ?? request.ip;

        for (const rateLimit of routerDetail.rateLimits) {
            if (rateLimit.status === response.statusCode) {
                const key = this.getRouterKey(routerDetail, request, effectiveIdentity);
                await this.getExpireAndIncreaseLimit(key, rateLimit.limit, rateLimit.ttl);
            }
        }
    }

    checkRouterHasCustomLimit(routerDetail: RouterDetail): boolean {
        if (!routerDetail?.rateLimits?.length) {
            return false;
        }
        return routerDetail.rateLimits.some((rateLimit) => rateLimit.status);
    }

    getRouterKey(routerDetail: RouterDetail, request: Request, identity: string): string {
        return `${RATE_LIMIT_KEY}-${identity}-${request.method}-${routerDetail.routerPath}`;
    }

    getGlobalIpKey(ip: string): string {
        return `${RATE_LIMIT_KEY}-ip-${ip}`;
    }

    getGlobalCustomKey(identity: string): string {
        return `${RATE_LIMIT_KEY}-custom-${identity}`;
    }

    private async resolveIdentity(routerDetail: RouterDetail, request: Request): Promise<ResolvedIdentity> {
        if (!this.option.keyResolver) {
            return request.ip;
        }

        const raw = await this.option.keyResolver({ request, routerDetail });

        if (isEmptyKey(raw)) {
            return skipThrottle;
        }

        if (typeof raw !== 'string') {
            throw new Error(
                `ThrottlerOption.keyResolver must return a string, null, or undefined. Received: ${typeof raw}`
            );
        }

        return raw;
    }
}
