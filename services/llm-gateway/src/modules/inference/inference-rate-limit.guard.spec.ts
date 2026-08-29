/* oxlint-disable typescript/no-unsafe-type-assertion -- Nest context and Redis are mocked structurally. */
import { type ExecutionContext } from "@nestjs/common";
import { EventEmitter } from "node:events";
import type Redis from "ioredis";
import { InferenceRateLimitGuard } from "./inference-rate-limit.guard";

describe("InferenceRateLimitGuard", () => {
  it("rate limits JWT callers by user even when a source application is present", async () => {
    const redis = {
      eval: jest.fn().mockResolvedValue(1),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      decr: jest.fn().mockResolvedValue(1)
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
});
