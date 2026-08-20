import { Injectable } from "@nestjs/common";

export type SupportReply = {
  id: string;
  content: string;
  category: "order" | "refund" | "account" | "general";
  createdAt: string;
};

@Injectable()
export class SupportService {
  getSession(userId: string) {
    return {
      sessionId: `support-${userId}`,
      userId,
      agent: {
        name: "小亭",
        title: "Pavilion AI 客服",
        status: "online" as const
      },
      quickQuestions: ["查询订单进度", "申请退款", "修改账户信息"]
    };
  }

  reply(message: string): SupportReply {
    const normalized = message.trim();
    const { category, content } = this.resolveAnswer(normalized);
    return {
      id: `reply-${Date.now()}`,
      content,
      category,
      createdAt: new Date().toISOString()
    };
  }

  private resolveAnswer(message: string): Pick<SupportReply, "category" | "content"> {
    if (/订单|物流|发货|快递/.test(message)) {
      return {
        category: "order",
        content: "我已为你进入订单查询流程。请提供订单号，我会继续核对发货和物流进度。"
      };
    }
    if (/退款|退货|取消/.test(message)) {
      return {
        category: "refund",
        content: "可以帮你处理退款。请告诉我订单号和退款原因，我会为你检查是否满足退款条件。"
      };
    }
    if (/账户|账号|密码|手机/.test(message)) {
      return {
        category: "account",
        content: "账户问题涉及个人信息安全。请说明需要修改的项目，我会引导你完成身份验证。"
      };
    }
    return {
      category: "general",
      content: `我收到你的问题：“${message}”。当前演示服务会完成鉴权、转发和身份透传；你也可以试试询问订单、退款或账户问题。`
    };
  }
}
