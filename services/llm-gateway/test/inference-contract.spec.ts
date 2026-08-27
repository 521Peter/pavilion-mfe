import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { InferenceController } from "@/modules/inference/inference.controller";
import { InferenceService } from "@/modules/inference/inference.service";
import { DataPlaneAuthGuard } from "@/modules/inference/data-plane-auth.guard";
import { RunService } from "@/modules/inference/run.service";
import { ModelRoutingService } from "@/modules/model-routing/model-routing.service";
import { InferenceRateLimitGuard } from "@/modules/inference/inference-rate-limit.guard";

describe("OpenAI-compatible data plane contracts", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const builder = Test.createTestingModule({
      controllers: [InferenceController],
      providers: [
        {
          provide: InferenceService,
          useValue: {
            execute: (input: any) => ({
              id: "run-1",
              requestId: input.requestId,
              model: input.model,
              content: "hello",
              usage: { inputTokens: 2, outputTokens: 1, cachedTokens: 0, reasoningTokens: 0 },
              deploymentId: "deployment-1"
            })
          }
        },
        {
          provide: ModelRoutingService,
          useValue: { listVirtualModels: () => [{ name: "pavilion-default", createdAt: new Date(0) }] }
        },
        { provide: RunService, useValue: { get: () => ({ id: "run-1" }), cancel: () => undefined } }
      ]
    });
    builder.overrideGuard(DataPlaneAuthGuard).useValue({
      canActivate: (context: any) => {
        context.switchToHttp().getRequest().principal = { type: "application", applicationId: "app-1" };
        return true;
      }
    });
    builder.overrideGuard(InferenceRateLimitGuard).useValue({ canActivate: () => true });
    const moduleRef = await builder.compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => app?.close());

  it("returns the OpenAI models list shape", async () => {
    const response = await request(app.getHttpServer())
      .get("/v1/models")
      .set("Authorization", "Bearer test")
      .expect(200);
    expect(response.body).toMatchObject({ object: "list", data: [{ id: "pavilion-default", object: "model" }] });
  });

  it("returns Chat Completions-compatible output", async () => {
    const response = await request(app.getHttpServer())
      .post("/v1/chat/completions")
      .set("Authorization", "Bearer test")
      .send({
        model: "pavilion-default",
        messages: [{ role: "user", content: "hi" }]
      })
      .expect(200);
    expect(response.body.object).toBe("chat.completion");
    expect(response.body.choices[0].message.content).toBe("hello");
    expect(response.body.usage.total_tokens).toBe(3);
  });

  it("returns Responses-compatible output", async () => {
    const response = await request(app.getHttpServer())
      .post("/v1/responses")
      .set("Authorization", "Bearer test")
      .send({
        model: "pavilion-default",
        input: "hi"
      })
      .expect(200);
    expect(response.body.object).toBe("response");
    expect(response.body.output_text).toBe("hello");
  });
});
