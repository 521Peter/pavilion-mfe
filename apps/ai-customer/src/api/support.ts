import { request } from "./http";

export type SupportSession = {
  sessionId: string;
  userId: string;
  agent: { name: string; title: string; status: "online" };
  quickQuestions: string[];
};

export type SupportReply = {
  id: string;
  content: string;
  category: "order" | "refund" | "account" | "general";
  createdAt: string;
  gateway: { authenticated: true; forwardedUserId: string };
};

export const supportApi = {
  getSession: () => request<SupportSession>("/support/session"),
  sendMessage: (message: string) =>
    request<SupportReply>("/support/messages", {
      method: "POST",
      body: JSON.stringify({ message })
    })
};
