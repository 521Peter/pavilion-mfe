import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Bot, CheckCircle2, CircleUserRound, RefreshCw, Send, ShieldCheck, Sparkles } from "lucide-react";
import { supportApi, type SupportSession } from "./api/support";
import { AUTH_REQUIRED_EVENT, getToken, isEmbedded } from "./api/token";
import Login from "./Login";

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
  meta?: string;
};

const welcomeMessage: Message = {
  id: "welcome",
  role: "assistant",
  content: "你好，我是小亭。订单、退款和账户问题都可以问我，我会先帮你完成基础分流。"
};

function CustomerService() {
  const [session, setSession] = useState<SupportSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadSession = async () => {
    setError("");
    try {
      setSession(await supportApi.getSession());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "客服服务暂时不可用");
    }
  };

  useEffect(() => {
    void loadSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (content: string) => {
    const text = content.trim();
    if (!text || loading) return;

    setDraft("");
    setError("");
    setLoading(true);
    setMessages(current => [...current, { id: `user-${Date.now()}`, role: "user", content: text }]);
    try {
      const reply = await supportApi.sendMessage(text);
      setMessages(current => [
        ...current,
        {
          id: reply.id,
          role: "assistant",
          content: reply.content,
          meta: `网关鉴权通过 · 用户 ${reply.gateway.forwardedUserId.slice(0, 8)}`
        }
      ]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "消息发送失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void send(draft);
  };

  return (
    <div className="customer-service-shell">
      <aside className="service-panel" aria-label="客服信息">
        <div className="brand-mark" aria-hidden="true">
          <Sparkles size={22} />
        </div>
        <div>
          <p className="eyebrow">Pavilion Support</p>
          <h1>AI 客服工作台</h1>
          <p className="panel-copy">通过统一网关安全连接独立业务服务。</p>
        </div>

        <section className="agent-card" aria-label="当前客服">
          <div className="agent-avatar">
            <Bot size={25} aria-hidden="true" />
          </div>
          <div>
            <strong>{session?.agent.name ?? "小亭"}</strong>
            <span>{session?.agent.title ?? "正在连接客服服务"}</span>
          </div>
          <span className="online-dot" aria-label="在线" />
        </section>

        <section className="security-card">
          <ShieldCheck size={20} aria-hidden="true" />
          <div>
            <strong>网关安全链路</strong>
            <span>{session ? "JWT 已校验，身份已透传" : "正在验证访问身份"}</span>
          </div>
        </section>

        <div className="panel-footnote">
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>请求仅通过 /api/customer-service 转发</span>
        </div>
      </aside>

      <main className="chat-workspace">
        <header className="chat-header">
          <div>
            <p className="header-kicker">在线会话</p>
            <h2>今天有什么可以帮你？</h2>
          </div>
          <div className="gateway-status" data-ready={Boolean(session)}>
            <span aria-hidden="true" />
            {session ? "Gateway connected" : "Connecting"}
          </div>
        </header>

        <section className="messages" aria-label="客服消息" aria-live="polite">
          <div className="conversation-date">本次会话</div>
          {messages.map(message => (
            <article key={message.id} className={`message-row ${message.role}`}>
              <div className="message-avatar" aria-hidden="true">
                {message.role === "assistant" ? <Bot size={19} /> : <CircleUserRound size={19} />}
              </div>
              <div>
                <div className="message-bubble">{message.content}</div>
                {message.meta ? (
                  <p className="message-meta">
                    <ShieldCheck size={13} />
                    {message.meta}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
          {loading ? (
            <div className="typing" role="status" aria-label="AI 客服正在回复">
              <span />
              <span />
              <span />
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </section>

        <footer className="composer-area">
          {error ? (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => void loadSession()}>
                <RefreshCw size={15} />
                重试
              </button>
            </div>
          ) : null}
          <div className="quick-questions" aria-label="快捷问题">
            {(session?.quickQuestions ?? ["查询订单进度", "申请退款", "修改账户信息"]).map(question => (
              <button key={question} type="button" onClick={() => void send(question)} disabled={loading}>
                {question}
              </button>
            ))}
          </div>
          <form className="composer" onSubmit={submit}>
            <label htmlFor="support-message" className="sr-only">
              输入你的问题
            </label>
            <textarea
              id="support-message"
              value={draft}
              onChange={event => setDraft(event.target.value)}
              onKeyDown={event => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder="输入你的问题，按 Enter 发送"
              maxLength={500}
              rows={1}
              disabled={loading || !session}
            />
            <button type="submit" disabled={loading || !draft.trim() || !session} aria-label="发送消息">
              <Send size={19} aria-hidden="true" />
            </button>
          </form>
          <p className="composer-hint">AI 回复仅用于网关功能演示，请勿提交敏感信息。</p>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  const embedded = isEmbedded();
  const [authenticated, setAuthenticated] = useState(() => Boolean(getToken()));

  useEffect(() => {
    const requireAuth = () => setAuthenticated(false);
    window.addEventListener(AUTH_REQUIRED_EVENT, requireAuth);
    return () => window.removeEventListener(AUTH_REQUIRED_EVENT, requireAuth);
  }, []);

  useEffect(() => {
    if (embedded && !authenticated) {
      window.location.href = "/login";
    }
  }, [authenticated, embedded]);

  if (!authenticated) {
    return embedded ? null : <Login onSuccess={() => setAuthenticated(true)} />;
  }

  return <CustomerService />;
}
