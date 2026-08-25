import { StrictMode, useEffect, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StandaloneLogin } from "@/components/StandaloneLogin";
import { AUTH_REQUIRED_EVENT, getToken } from "@/api/token";

const appCode = import.meta.env.VITE_PAVILION_MFE_APP_CODE;
const standaloneWindow = window as Window & { __PAVILION_AI_CHAT_ROOT__?: Root };

function StandaloneApp() {
  const [authenticated, setAuthenticated] = useState(() => Boolean(getToken()));

  useEffect(() => {
    const requireAuth = () => setAuthenticated(false);
    window.addEventListener(AUTH_REQUIRED_EVENT, requireAuth);
    return () => window.removeEventListener(AUTH_REQUIRED_EVENT, requireAuth);
  }, []);

  return authenticated ? <App /> : <StandaloneLogin onSuccess={() => setAuthenticated(true)} />;
}

/** 挂载应用（独立运行与微前端挂载共用），返回清理函数 */
function renderApp(el: HTMLElement): () => void {
  const root = createRoot(el);
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
  return () => root.unmount();
}

// 子应用单独启动
if (!window.__PAVILION_MFE_ENV__) {
  const root = document.getElementById("root");
  if (root) {
    root.classList.add(`pavilion-mfe-${appCode}`);
    root.style.height = "100%";
    root.style.width = "100%";
    const standaloneRoot = standaloneWindow.__PAVILION_AI_CHAT_ROOT__ ?? createRoot(root);
    standaloneWindow.__PAVILION_AI_CHAT_ROOT__ = standaloneRoot;
    standaloneRoot.render(
      <StrictMode>
        <ErrorBoundary>
          <StandaloneApp />
        </ErrorBoundary>
      </StrictMode>
    );
  }
}

export default {
  mount: async (_ctx: unknown, el: HTMLElement) => {
    console.log("[PavilionMfe 微前端] mount", appCode);
    return renderApp(el);
  },
  unmount: async (_ctx: unknown, el: HTMLElement) => {
    console.log("[PavilionMfe 微前端] unmount", appCode);
    el.innerHTML = "";
  }
};
