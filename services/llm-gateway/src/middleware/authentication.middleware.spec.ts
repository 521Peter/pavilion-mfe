import { IncomingMessage } from "http";
import { AuthenticationMiddleware } from "./authentication.middleware";
import { ProxyRequest } from "../../libs/api-gateway/restful/models/proxy-request.model";
import type { RouterDetail } from "../../libs/api-gateway/restful/types/router-path.type";

function createMiddleware() {
  const jwt = { verifyAsync: jest.fn() };
  const prisma = { user: { findUnique: jest.fn() } };
  const applicationKeys = { authenticate: jest.fn() };
  const middleware = new AuthenticationMiddleware(jwt as never, prisma as never, applicationKeys as never);
  return { middleware, jwt, prisma, applicationKeys };
}

function request(headers: IncomingMessage["headers"] = {}): IncomingMessage {
  return { headers } as IncomingMessage;
}

function route(overrides: Partial<RouterDetail> = {}): RouterDetail {
  return { isBearerAuth: false, isApiKeyAuth: false, ...overrides } as RouterDetail;
}

describe("AuthenticationMiddleware", () => {
  it("rejects a protected route without credentials", async () => {
    const { middleware } = createMiddleware();

    await expect(middleware.handle(route({ isBearerAuth: true }), request(), new ProxyRequest())).resolves.toBe(false);
  });

  it("verifies a JWT and forwards only the trusted user id", async () => {
    const { middleware, jwt, prisma } = createMiddleware();
    jwt.verifyAsync.mockResolvedValue({ sub: "user-42" });
    prisma.user.findUnique.mockResolvedValue({ id: "user-42", status: "ACTIVE" });
    const proxyRequest = new ProxyRequest();

    await expect(
      middleware.handle(route({ isBearerAuth: true }), request({ authorization: "Bearer valid-token" }), proxyRequest)
    ).resolves.toBe(true);
    expect(proxyRequest.getKebabHeaders()).toMatchObject({ "auth-user-id": "user-42" });
  });

  it("does not accept an application key for a bearer-only route", async () => {
    const { middleware, applicationKeys } = createMiddleware();

    await expect(
      middleware.handle(route({ isBearerAuth: true }), request({ "x-api-key": "pav_demo" }), new ProxyRequest())
    ).resolves.toBe(false);
    expect(applicationKeys.authenticate).not.toHaveBeenCalled();
  });

  it("allows an anonymous request when OpenAPI marks the route public", async () => {
    const { middleware } = createMiddleware();

    await expect(middleware.handle(route(), request(), new ProxyRequest())).resolves.toBe(true);
  });
});
