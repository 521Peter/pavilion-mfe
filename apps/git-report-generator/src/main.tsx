import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";

const appCode = import.meta.env.VITE_PAVILION_MFE_APP_CODE;

// 子应用单独启动
if (!window.__PAVILION_MFE_ENV__) {
  const root = document.getElementById("root");
  if (root) {
    root.classList.add(`pavilion-mfe-${appCode}`)
    createRoot(root).render(
      <StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StrictMode>,
    );
  }
}

export default {
  mount: async (ctx: any, el: HTMLElement) => {
    console.log("[PavilionMfe 微前端] mount", appCode);

    const root = createRoot(el);
    root.render(
      <StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StrictMode>,
    );
    return () => root.unmount();
  },
  unmount: async (_ctx: any, el: HTMLElement) => {
    console.log("[PavilionMfe 微前端] unmount", appCode);
    el.innerHTML = "";
  },
};
