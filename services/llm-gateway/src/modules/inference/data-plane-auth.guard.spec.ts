/* oxlint-disable typescript/no-unsafe-type-assertion -- Nest guard dependencies are mocked structurally. */
import { BadRequestException, type ExecutionContext } from "@nestjs/common";
import type { JwtService } from "@nestjs/jwt";
import type { PrismaService } from "@/database/prisma.service";
import type { ApplicationKeyService } from "@/modules/application/application-key.service";
import { DataPlaneAuthGuard, type DataPlaneRequest } from "./data-plane-auth.guard";

describe("DataPlaneAuthGuard", () => {
  const jwt = { verifyAsync: jest.fn() };
  const prisma = {
    user: { findUnique: jest.fn() },
    application: { findUnique: jest.fn() }
  };
  const applicationKeys = { authenticate: jest.fn() };
  const guard = new DataPlaneAuthGuard(
    jwt as unknown as JwtService,
    prisma as unknown as PrismaService,
    applicationKeys as unknown as ApplicationKeyService
  );
  const currentRequest = {} as unknown as DataPlaneRequest;

  const activate = async (headers: Record<string, string>) => {
    Object.assign(currentRequest, { headers });
    return guard.canActivate({
      switchToHttp: () => ({ getRequest: () => currentRequest })
    } as unknown as ExecutionContext);
  };

  beforeEach(() => jest.resetAllMocks());

  it("requires an active source application for JWT callers", async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: "user-1" });
    prisma.user.findUnique.mockResolvedValue({ id: "user-1", status: "ACTIVE" });
    prisma.application.findUnique.mockResolvedValue({ id: "app-1", code: "ai-chat", isActive: true });

    await expect(activate({ authorization: "Bearer jwt" })).rejects.toThrow("X-Pavilion-App-Code");
    await expect(activate({ authorization: "Bearer jwt", "x-pavilion-app-code": "ai-chat" })).resolves.toBe(true);
    expect(currentRequest.principal).toEqual({
      authenticationType: "user",
      userId: "user-1",
      applicationId: "app-1"
    });
  });

  it("rejects invalid JWT credentials with a bad request", async () => {
    jwt.verifyAsync.mockRejectedValue(new Error("invalid"));

    await expect(activate({ authorization: "Bearer jwt", "x-pavilion-app-code": "ai-chat" })).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it("rejects an unknown or inactive JWT source application", async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: "user-1" });
    prisma.user.findUnique.mockResolvedValue({ id: "user-1", status: "ACTIVE" });
    prisma.application.findUnique.mockResolvedValue(null);

    await expect(activate({ authorization: "Bearer jwt", "x-pavilion-app-code": "unknown-app" })).rejects.toThrow(
      "来源应用不存在或已停用"
    );
  });

  it("keeps the Application Key application when an app code is forged", async () => {
    applicationKeys.authenticate.mockResolvedValue({
      applicationId: "app-key-1",
      application: { allowedModels: ["pavilion-default"] }
    });

    await expect(activate({ "x-api-key": "pav_key", "x-pavilion-app-code": "forged-app" })).resolves.toBe(true);

    expect(currentRequest.principal).toEqual({
      authenticationType: "application",
      applicationId: "app-key-1",
      allowedModels: ["pavilion-default"]
    });
    expect(prisma.application.findUnique).not.toHaveBeenCalled();
  });
});
