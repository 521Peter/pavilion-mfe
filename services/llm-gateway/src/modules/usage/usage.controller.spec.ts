import { INestApplication, UnauthorizedException, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AuditInterceptor } from "@/modules/audit/audit.interceptor";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { ROLES_KEY } from "@/common/decorators/roles.decorator";
import { UsageController } from "./usage.controller";
import { UsageService } from "./usage.service";

function createUsageDouble() {
  return {
    overview: jest.fn().mockResolvedValue({ totalRuns: 0 }),
    timeseries: jest.fn().mockResolvedValue([]),
    breakdown: jest
      .fn()
      .mockResolvedValue({ applications: [], virtualModels: [], providers: [], failures: [], fallbacks: [] }),
    runs: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 })
  };
}

async function initApp(kind: "admin" | "user"): Promise<INestApplication> {
  const builder = Test.createTestingModule({
    controllers: [UsageController],
    providers: [{ provide: UsageService, useValue: createUsageDouble() }]
  });

  if (kind === "admin") {
    builder.overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true });
    builder.overrideGuard(RolesGuard).useValue({ canActivate: () => true });
  } else {
    builder.overrideGuard(JwtAuthGuard).useValue({
      canActivate: (context: {
        switchToHttp(): { getRequest(): { headers: Record<string, string>; user?: unknown } };
      }) => {
        const req = context.switchToHttp().getRequest();
        if (req.headers.authorization !== "Bearer user-jwt") throw new UnauthorizedException();
        req.user = { sub: "user-1", username: "member", roles: ["USER"] };
        return true;
      }
    });
  }

  builder
    .overrideInterceptor(AuditInterceptor)
    .useValue({ intercept: (_context: unknown, next: { handle(): unknown }) => next.handle() });
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  await app.init();
  return app;
}

describe("UsageController", () => {
  let adminApp: INestApplication;
  let permissionApp: INestApplication;

  beforeAll(async () => {
    [adminApp, permissionApp] = await Promise.all([initApp("admin"), initApp("user")]);
  });

  afterAll(async () => {
    await Promise.all([adminApp?.close(), permissionApp?.close()]);
  });

  it.each(["overview", "timeseries", "breakdown", "runs"])("exposes admin usage %s", async endpoint => {
    const response = await request(adminApp.getHttpServer()).get(`/api/usage/${endpoint}`).expect(200);
    expect(response.body).toMatchObject({ code: 0, msg: "ok" });
  });

  it("marks the controller as ADMIN only", () => {
    expect(Reflect.getMetadata(ROLES_KEY, UsageController)).toEqual(["ADMIN"]);
  });

  it("rejects an ordinary USER JWT with 403", async () => {
    await request(permissionApp.getHttpServer())
      .get("/api/usage/overview")
      .set("Authorization", "Bearer user-jwt")
      .expect(403);
  });

  it("rejects an Application Key with 401", async () => {
    await request(permissionApp.getHttpServer()).get("/api/usage/overview").set("x-api-key", "pav_test").expect(401);
  });

  it("validates pagination at the HTTP boundary", async () => {
    await request(adminApp.getHttpServer()).get("/api/usage/runs?pageSize=101").expect(400);
  });
});
