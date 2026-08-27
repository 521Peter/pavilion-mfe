import { Request } from "express";
import type { OutgoingHttpHeaders } from "node:http";
import { ProxyServer } from "./proxy-server";

function createServer(): ProxyServer {
  // Pool 会针对该主机延迟创建；这些测试不会打开实际连接。
  return new ProxyServer({ host: "http://localhost:18080", pool: {} });
}

function makeRequest(overrides: Partial<Request> = {}): Request {
  return {
    method: "GET",
    headers: {},
    socket: { remoteAddress: "10.0.0.9" },
    ...overrides
  } as unknown as Request;
}

describe("ProxyServer.removeHopByHopHeader", () => {
  it("removes hop-by-hop headers case-insensitively", () => {
    const server = createServer();
    const headers = server.removeHopByHopHeader({
      Connection: "keep-alive",
      "transfer-encoding": "chunked",
      upgrade: "websocket",
      "proxy-authorization": "secret",
      "content-type": "application/json"
    });

    expect(headers.has("Connection")).toBe(false);
    expect(headers.has("transfer-encoding")).toBe(false);
    expect(headers.has("upgrade")).toBe(false);
    expect(headers.has("proxy-authorization")).toBe(false);
    expect(headers.get("content-type")).toBe("application/json");
  });

  it("preserves array header values", () => {
    const server = createServer();
    const headers = server.removeHopByHopHeader({ "set-cookie": ["a=1", "b=2"] });
    expect(headers.get("set-cookie")).toEqual(["a=1", "b=2"]);
  });

  it("skips undefined headers and serializes numeric outgoing headers", () => {
    const server = createServer();
    const outgoingHeaders: OutgoingHttpHeaders = { "x-undefined": undefined, "x-number": 3 };
    const headers = server.removeHopByHopHeader(outgoingHeaders);
    expect(headers.has("x-undefined")).toBe(false);
    expect(headers.get("x-number")).toBe("3");
  });
});

describe("ProxyServer.getRequestHeaders", () => {
  it("appends the socket address to an existing x-forwarded-for string", () => {
    const server = createServer();
    const headers = server.getRequestHeaders(makeRequest({ headers: { "x-forwarded-for": "1.1.1.1" } } as never));
    expect(headers.get("x-forwarded-for")).toBe("1.1.1.1, 10.0.0.9");
  });

  it("joins array x-forwarded-for values before appending", () => {
    const server = createServer();
    const headers = server.getRequestHeaders(
      makeRequest({ headers: { "x-forwarded-for": ["1.1.1.1", "2.2.2.2"] } } as never)
    );
    expect(headers.get("x-forwarded-for")).toBe("1.1.1.1, 2.2.2.2, 10.0.0.9");
  });

  it("sets x-forwarded-for from the socket when the header is absent", () => {
    const server = createServer();
    expect(server.getRequestHeaders(makeRequest()).get("x-forwarded-for")).toBe("10.0.0.9");
  });

  it.each(["DELETE", "OPTIONS"])("forces content-length: 0 for %s requests", method => {
    const server = createServer();
    expect(server.getRequestHeaders(makeRequest({ method })).get("content-length")).toBe("0");
  });

  it("does not force content-length when the client provided one", () => {
    const server = createServer();
    const headers = server.getRequestHeaders(
      makeRequest({ method: "DELETE", headers: { "content-length": "12" } } as never)
    );
    expect(headers.get("content-length")).toBe("12");
  });

  it("lets custom headers override incoming headers", () => {
    const server = createServer();
    const headers = server.getRequestHeaders(makeRequest({ headers: { "auth-user-id": "spoofed" } } as never), {
      "auth-user-id": "123"
    });
    expect(headers.get("auth-user-id")).toBe("123");
  });
});
