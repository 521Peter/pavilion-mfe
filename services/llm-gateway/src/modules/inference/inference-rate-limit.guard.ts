import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  ServiceUnavailableException
} from "@nestjs/common";
import type { Response } from "express";
import type Redis from "ioredis";
import type { DataPlaneRequest } from "./data-plane-auth.guard";

const REDIS_OPTION = "REDIS_OPTION";

const RATE_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
if current > tonumber(ARGV[2]) then return 0 end
return current
`;

class TooManyRequestsException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}

@Injectable()
export class InferenceRateLimitGuard implements CanActivate {
  private readonly perMinute = Number(process.env.LLM_RATE_LIMIT_PER_MINUTE ?? "60");
  private readonly concurrency = Number(process.env.LLM_CONCURRENCY_LIMIT ?? "10");

  constructor(@Inject(REDIS_OPTION) private readonly redis: Redis) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<DataPlaneRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const subject = request.principal.applicationId
      ? `app:${request.principal.applicationId}`
      : `user:${request.principal.userId}`;
    const model = typeof request.body?.model === "string" ? request.body.model : "none";
    const rateKey = `pavilion:llm:rate:${subject}:${model}`;
    const concurrencyKey = `pavilion:llm:concurrency:${subject}:${model}`;
    try {
      const allowed = Number(await this.redis.eval(RATE_SCRIPT, 1, rateKey, 60_000, this.perMinute));
      if (allowed === 0) throw new TooManyRequestsException("LLM 请求频率超过限制");
      const active = await this.redis.incr(concurrencyKey);
      if (active === 1) await this.redis.expire(concurrencyKey, 600);
      if (active > this.concurrency) {
        await this.redis.decr(concurrencyKey);
        throw new TooManyRequestsException("LLM 并发请求超过限制");
      }
      let released = false;
      const release = () => {
        if (released) return;
        released = true;
        void this.redis.decr(concurrencyKey);
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
