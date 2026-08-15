import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Test from "../pages/Test";
import Env from "../pages/Env";
import Forbidden from "../pages/Forbidden";
import NotFound from "../pages/NotFound";
import ServerError from "../pages/ServerError";
import MFPage from "./MFPage";
import LlmProviders from "../pages/LlmProviders";
import McpServers from "../pages/McpServers";
import Skills from "../pages/Skills";
import { deployBasePath } from "../utils/path";
import { getToken } from "../api/http";

/** 主应用自有路由 → 标题（用于 Tab / 菜单标题查找） */
export const routeMeta: Record<string, string> = {
  "/": "首页",
  "/llm-providers": "Provider 管理",
  "/mcp-servers": "MCP 管理",
  "/skills": "Skill 管理",
  "/test": "测试页",
  "/env": "环境信息",
  "/403": "403",
  "/404": "404",
  "/500": "500"
};

/** 是否主应用自有路由（非微前端子应用路由） */
export function isMainAppRoutePath(path: string): boolean {
  return path in routeMeta;
}

/** 鉴权守卫：无 token 时跳转登录页 */
function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// Vite 的 base 配置自动注入为 import.meta.env.BASE_URL
// 本地开发时为 "/"，GitHub Pages �署时为 "/<repo>/"
export const router = createBrowserRouter(
  [
    {
      path: "/login",
      element: <Login />
    },
    {
      element: (
        <RequireAuth>
          <MainLayout />
        </RequireAuth>
      ),
      children: [
        { path: "/", element: <Home /> },
        { path: "/llm-providers", element: <LlmProviders /> },
        { path: "/mcp-servers", element: <McpServers /> },
        { path: "/skills", element: <Skills /> },
        { path: "/test", element: <Test /> },
        { path: "/env", element: <Env /> },
        { path: "/403", element: <Forbidden /> },
        { path: "/404", element: <NotFound /> },
        { path: "/500", element: <ServerError /> },
        { path: "*", element: <MFPage /> }
      ]
    }
  ],
  { basename: deployBasePath }
);
