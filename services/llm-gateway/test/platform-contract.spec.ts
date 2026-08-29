import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import request from "supertest";
import { AuditInterceptor } from "@/modules/audit/audit.interceptor";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { RolesGuard } from "@/common/guards/roles.guard";
import { AuthController } from "@/modules/auth/auth.controller";
import { AuthService } from "@/modules/auth/auth.service";
import { LlmProviderController } from "@/modules/llm/controllers/llm-provider.controller";
import { LlmChatController } from "@/modules/llm/controllers/llm-chat.controller";
import { LlmProviderService } from "@/modules/llm/services/llm-provider.service";
import { LlmChatService } from "@/modules/llm/services/llm-chat.service";
import { ChatThreadService } from "@/modules/llm/services/chat-thread.service";
import { SkillController } from "@/modules/skill/controllers/skill.controller";
import { SkillService } from "@/modules/skill/services/skill.service";
import { McpController } from "@/modules/mcp/controllers/mcp.controller";
import { McpServerService } from "@/modules/mcp/services/mcp-server.service";
import { McpClientService } from "@/modules/mcp/services/mcp-client.service";

describe("Pavilion /api compatibility contracts", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const builder = Test.createTestingModule({
      controllers: [AuthController, LlmProviderController, LlmChatController, SkillController, McpController],
      providers: [
        { provide: AuthService, useValue: { login: (dto: unknown) => ({ accessToken: "jwt", user: dto }) } },
        {
          provide: LlmProviderService,
          useValue: {
            listProviders: () => [{ id: "provider-1", name: "OpenAI", apiKey: undefined }],
            listAvailableModels: () => [],
            getSupportedTypes: () => ["openai", "ollama"]
          }
        },
        {
          provide: LlmChatService,
          useValue: {
            chat: () => ({ content: "hello", model: "test", providerType: "openai" }),
            stream: async function* () {
              yield "hel";
              yield "lo";
            }
          }
        },
        { provide: ChatThreadService, useValue: { list: () => [] } },
        { provide: SkillService, useValue: { list: () => [{ name: "test-skill", isActive: true }] } },
        { provide: McpServerService, useValue: { list: () => [{ id: "mcp-1", transport: "stdio" }] } },
        { provide: McpClientService, useValue: {} }
      ]
    });
    builder.overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true });
    builder.overrideGuard(RolesGuard).useValue({ canActivate: () => true });
    builder
      .overrideInterceptor(AuditInterceptor)
      .useValue({ intercept: (_context: unknown, next: any) => next.handle() });
    const moduleRef = await builder.compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => app?.close());

  it("keeps auth login path and response envelope", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ username: "admin", password: "password" })
      .expect(201);
    expect(response.body).toEqual({
      code: 0,
      data: { accessToken: "jwt", user: { username: "admin", password: "password" } },
      msg: "ok"
    });
  });

  it.each([
    ["/api/llm/providers", "provider-1"],
    ["/api/skills", "test-skill"],
    ["/api/mcp/servers", "mcp-1"]
  ])("keeps GET %s enveloped", async (path, id) => {
    const response = await request(app.getHttpServer()).get(path).expect(200);
    expect(response.body.code).toBe(0);
    expect(JSON.stringify(response.body.data)).toContain(id);
  });

  it("keeps legacy chat SSE framing", async () => {
    const response = await request(app.getHttpServer())
      .post("/api/llm/chat/stream")
      .send({ providerId: "provider-1", modelId: "model-1", messages: [{ role: "user", content: "hello" }] })
      .expect(200);
    expect(response.headers["content-type"]).toContain("text/event-stream");
    expect(response.text).toContain('"type":"delta"');
    expect(response.text).toContain('"type":"done"');
  });

  it("declares recoverable and idempotent usage storage", () => {
    const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");
    const seed = readFileSync(join(process.cwd(), "prisma/seed.ts"), "utf8");
    expect(schema).toContain("usageSnapshot Json?");
    expect(schema).toContain("idempotencyKey String?");
    expect(schema).toContain("@@index([status, createdAt])");
    expect(schema).toContain("@@index([deploymentId, createdAt])");
    expect(seed).toContain('code: "git-report-generator"');
  });
});
