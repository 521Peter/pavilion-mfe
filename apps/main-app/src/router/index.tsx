import { createBrowserRouter, Navigate } from "react-router-dom";
import { Skeleton } from "@heroui/react";
import MainLayout from "../layout/MainLayout";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Forbidden from "../pages/Forbidden";
import NotFound from "../pages/NotFound";
import ServerError from "../pages/ServerError";
import MFPage from "./MFPage";
import LlmProviders from "../pages/LlmProviders";
import McpServers from "../pages/McpServers";
import Skills from "../pages/Skills";
import Usage from "../pages/Usage";
import { useProfile } from "../hooks/useProfile";
import { getToken } from "../api/http";

/** 主应用自有路由 → 标题（用于 Tab / 菜单标题查找） */
export const routeMeta: Record<string, string> = {
  "/": "首页",
  "/llm-providers": "Provider 管理",
  "/mcp-servers": "MCP 管理",
  "/skills": "Skill 管理",
  "/usage": "用量统计",
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

/** 页面级展示门控；统计数据安全仍由后端 ADMIN 角色兜底。 */
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const profileResource = useProfile();

  if (profileResource.status === "loading") {
    return (
      <main className="flex h-full items-center justify-center p-5">
        <Skeleton className="h-10 w-40 rounded" />
      </main>
    );
  }

  if (profileResource.status === "error") {
    return (
      <main role="alert" className="h-full p-5">
        <p className="m-0 text-sm text-danger">{profileResource.message}</p>
      </main>
    );
  }

  if (!profileResource.profile.roles.includes("ADMIN")) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
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
      {
        path: "/usage",
        element: (
          <RequireAdmin>
            <Usage />
          </RequireAdmin>
        )
      },
      { path: "/403", element: <Forbidden /> },
      { path: "/404", element: <NotFound /> },
      { path: "/500", element: <ServerError /> },
      { path: "*", element: <MFPage /> }
    ]
  }
]);
