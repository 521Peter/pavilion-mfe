import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException
} from "@nestjs/common";
import type { Response } from "express";
import type Redis from "ioredis";
import { randomUUID } from "node:crypto";
import type { DataPlaneRequest } from "./data-plane-auth.guard";

const REDIS_OPTION = "REDIS_OPTION";

const RATE_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
if current > tonumber(ARGV[2]) then return 0 end
return current
`;

const CONCURRENCY_TTL_MS = 10 * 60 * 1000;
const CONCURRENCY_RENEW_INTERVAL_MS = CONCURRENCY_TTL_MS / 3;
const CONCURRENCY_ACQUIRE_SCRIPT = `
local now = tonumber(ARGV[2])
local ttl = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now)
redis.call('ZADD', KEYS[1], now + ttl, ARGV[1])
local current = redis.call('ZCARD', KEYS[1])
if current > tonumber(ARGV[4]) then
  redis.call('ZREM', KEYS[1], ARGV[1])
  if redis.call('ZCARD', KEYS[1]) == 0 then redis.call('DEL', KEYS[1]) end
  return 0
end
redis.call('PEXPIRE', KEYS[1], ttl)
return current
`;
const CONCURRENCY_RENEW_SCRIPT = `
local now = tonumber(ARGV[2])
local ttl = tonumber(ARGV[3])
local score = redis.call('ZSCORE', KEYS[1], ARGV[1])
local active = score and tonumber(score) > now
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now)
redis.call('ZADD', KEYS[1], now + ttl, ARGV[1])
redis.call('PEXPIRE', KEYS[1], ttl)
if active then return 1 end
return 0
`;
const CONCURRENCY_RELEASE_SCRIPT = `
redis.call('ZREM', KEYS[1], ARGV[1])
local current = redis.call('ZCARD', KEYS[1])
if current == 0 then redis.call('DEL', KEYS[1]) end
return current
`;

class TooManyRequestsException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}

@Injectable()
export class InferenceRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(InferenceRateLimitGuard.name);
  private readonly perMinute = Number(process.env.LLM_RATE_LIMIT_PER_MINUTE ?? "60");
  private readonly concurrency = Number(process.env.LLM_CONCURRENCY_LIMIT ?? "10");

  constructor(@Inject(REDIS_OPTION) private readonly redis: Redis) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<DataPlaneRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const subject =
      request.principal.authenticationType === "application"
        ? `app:${request.principal.applicationId}`
        : `user:${request.principal.userId}`;
    const model = typeof request.body?.model === "string" ? request.body.model : "none";
    const rateKey = `pavilion:llm:rate:${subject}:${model}`;
    const concurrencyKey = `pavilion:llm:concurrency:${subject}:${model}`;
    try {
      const allowed = Number(await this.redis.eval(RATE_SCRIPT, 1, rateKey, 60_000, this.perMinute));
      if (allowed === 0) throw new TooManyRequestsException("LLM 请求频率超过限制");
      const leaseId = randomUUID();
      const active = Number(
        await this.redis.eval(
          CONCURRENCY_ACQUIRE_SCRIPT,
          1,
          concurrencyKey,
          leaseId,
          Date.now(),
          CONCURRENCY_TTL_MS,
          this.concurrency
        )
      );
      if (active === 0) throw new TooManyRequestsException("LLM 并发请求超过限制");
      let released = false;
      const renewal = setInterval(() => {
        void this.redis
          .eval(CONCURRENCY_RENEW_SCRIPT, 1, concurrencyKey, leaseId, Date.now(), CONCURRENCY_TTL_MS)
          .then(result => {
            if (Number(result) === 0) this.logger.warn({ event: "inference.concurrency.lease_recovered" });
            return undefined;
          })
          .catch(error => {
            this.logger.error({
              event: "inference.concurrency.renew_failed",
              errorType: error instanceof Error ? error.name : "UnknownError"
            });
          });
      }, CONCURRENCY_RENEW_INTERVAL_MS);
      renewal.unref();
      const release = () => {
        if (released) return;
        released = true;
        clearInterval(renewal);
        void this.redis.eval(CONCURRENCY_RELEASE_SCRIPT, 1, concurrencyKey, leaseId).catch(error => {
          this.logger.error({
            event: "inference.concurrency.release_failed",
            errorType: error instanceof Error ? error.name : "UnknownError"
          });
        });
      };
      response.once("finish", release);
      response.once("close", release);
      return true;
    } catch (error) {
      if (error instanceof TooManyRequestsException) throw error;
      throw new ServiceUnavailableException("限流服务暂不可用");
    }
  }
}
