import { SupportService } from "../src/support/support.service";

describe("SupportService", () => {
  const service = new SupportService();

  it("returns an order-specific answer", () => {
    expect(service.reply("请帮我查询订单物流").category).toBe("order");
  });

  it("binds a support session to the forwarded user", () => {
    expect(service.getSession("user-42")).toMatchObject({
      sessionId: "support-user-42",
      userId: "user-42"
    });
  });
});
