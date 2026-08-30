/* oxlint-disable typescript/no-unsafe-type-assertion -- Nest context and Redis are mocked structurally. */
import { type ExecutionContext } from "@nestjs/common";
import { EventEmitter } from "node:events";
import type Redis from "ioredis";
import { InferenceRateLimitGuard } from "./inference-rate-limit.guard";

describe("InferenceRateLimitGuard", () => {
  afterEach(() => jest.useRealTimers());

  it("rate limits JWT callers by user even when a source application is present", async () => {
    const redis = {
      eval: jest.fn().mockResolvedValue(1)
    };
    const guard = new InferenceRateLimitGuard(redis as unknown as Redis);
    const request = {
      principal: { authenticationType: "user" as const, userId: "user-1", applicationId: "app-1" },
      body: { model: "pavilion-default" }
    };
    const response = new EventEmitter();
    const context = {
      switchToHttp: () => ({ getRequest: () => request, getResponse: () => response })
    };

    await expect(guard.canActivate(context as unknown as ExecutionContext)).resolves.toBe(true);

    expect(redis.eval).toHaveBeenCalledWith(
      expect.any(String),
      1,
      expect.stringContaining("user:user-1"),
      60_000,
      expect.any(Number)
    );
  });

  it("使用带唯一租约的原子脚本登记并释放并发请求", async () => {
    const redis = { eval: jest.fn().mockResolvedValue(1) };
    const guard = new InferenceRateLimitGuard(redis as unknown as Redis);
    const request = {
      principal: { authenticationType: "application" as const, applicationId: "app-1" },
      body: { model: "pavilion-default" }
    };
    const response = new EventEmitter();
    const context = {
      switchToHttp: () => ({ getRequest: () => request, getResponse: () => response })
    };

    await expect(guard.canActivate(context as unknown as ExecutionContext)).resolves.toBe(true);
    expect(redis.eval).toHaveBeenCalledTimes(2);
    expect(redis.eval.mock.calls[1]).toEqual([
      expect.stringContaining("ZADD"),
      1,
      expect.stringContaining("pavilion:llm:concurrency:app:app-1"),
      expect.any(String),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number)
    ]);

    response.emit("finish");
    response.emit("close");
    await new Promise(resolve => setImmediate(resolve));

    expect(redis.eval).toHaveBeenCalledTimes(3);
    expect(redis.eval.mock.calls[2]).toEqual([
      expect.stringContaining("ZREM"),
      1,
      expect.stringContaining("pavilion:llm:concurrency:app:app-1"),
      expect.any(String)
    ]);
  });

  it("单次续租失败后仍会在租约到期前再次续租", async () => {
    jest.useFakeTimers();
    const redis = {
      eval: jest
        .fn()
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1)
        .mockRejectedValueOnce(new Error("redis unavailable"))
        .mockResolvedValue(1)
    };
    const guard = new InferenceRateLimitGuard(redis as unknown as Redis);
    const request = {
      principal: { authenticationType: "application" as const, applicationId: "app-1" },
      body: { model: "pavilion-default" }
    };
    const response = new EventEmitter();
    const context = {
      switchToHttp: () => ({ getRequest: () => request, getResponse: () => response })
    };

    await guard.canActivate(context as unknown as ExecutionContext);
    await jest.advanceTimersByTimeAsync(200_000);
    expect(redis.eval).toHaveBeenCalledTimes(3);
    await jest.advanceTimersByTimeAsync(200_000);
    expect(redis.eval).toHaveBeenCalledTimes(4);
    expect(redis.eval.mock.calls[3]?.[0]).toEqual(expect.stringContaining("ZSCORE"));

    response.emit("finish");
    await jest.runOnlyPendingTimersAsync();
  });

  it("租约已丢失时续租脚本会重新登记并记录告警", async () => {
    jest.useFakeTimers();
    const redis = {
      eval: jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(1).mockResolvedValueOnce(0).mockResolvedValue(1)
    };
    const guard = new InferenceRateLimitGuard(redis as unknown as Redis);
    const logger = Reflect.get(guard, "logger") as { warn: (entry: unknown) => void };
    const warning = jest.spyOn(logger, "warn").mockImplementation(() => undefined);
    const request = {
      principal: { authenticationType: "application" as const, applicationId: "app-1" },
      body: { model: "pavilion-default" }
    };
    const response = new EventEmitter();
    const context = {
      switchToHttp: () => ({ getRequest: () => request, getResponse: () => response })
    };

    await guard.canActivate(context as unknown as ExecutionContext);
    await jest.advanceTimersByTimeAsync(200_000);

    expect(redis.eval.mock.calls[2]?.[0]).toEqual(expect.stringContaining("ZADD"));
    expect(warning).toHaveBeenCalledWith({ event: "inference.concurrency.lease_recovered" });

    response.emit("finish");
    await jest.runOnlyPendingTimersAsync();
  });
});
