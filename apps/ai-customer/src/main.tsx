import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const appCode = import.meta.env.VITE_PAVILION_MFE_APP_CODE;

function renderApp(element: HTMLElement): () => void {
  const root = createRoot(element);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  return () => root.unmount();
}

if (!window.__PAVILION_MFE_ENV__) {
  const root = document.getElementById("root");
  if (root) {
    root.classList.add(`pavilion-mfe-${appCode}`);
    root.style.height = "100%";
    renderApp(root);
  }
}

export default {
  mount: async (_context: unknown, element: HTMLElement) => renderApp(element),
  unmount: async (_context: unknown, element: HTMLElement) => {
    element.innerHTML = "";
  }
};
