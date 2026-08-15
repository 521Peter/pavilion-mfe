import { createPathMatcher } from "@pavilion-mfe/router";
import mfeConfig from "../../mfe.json";

// 部署前缀（GitHub Pages 场景如 /pavilion-mfe，本地开发为 ''）
// Vite 构建时 base 配置会自动注入为 import.meta.env.BASE_URL
export const deployBasePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

/** 去掉部署前缀，统一为应用内路径（如 /demo/list） */
export function normalizePath(rawPath: string): string {
  if (deployBasePath && rawPath.startsWith(deployBasePath)) {
    return rawPath.slice(deployBasePath.length) || "/";
  }
  return rawPath;
}

/** 当前路径是否属于微前端子应用（/demo/*, /react/*, /vue2/* 等） */
export function isSubAppPath(path: string): boolean {
  return mfeConfig.apps.some(app => createPathMatcher(app.routes)(path));
}
