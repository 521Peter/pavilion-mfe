import { Navigate, useLocation } from "react-router-dom";
import { isSubAppPath, normalizePath } from "../utils/path";

/**
 * catch-all：微前端子应用路由（/demo/*, /react/* 等）
 * 实际渲染由 #pavilion-mfe-container（在 MainLayout 中）处理，
 * 此路由仅用于让 React Router 匹配子应用路径，保持 location.pathname 正确更新。
 * 非子应用路径（如 /env/test）重定向到 404。
 */
export default function MFPage() {
  const location = useLocation();
  const path = normalizePath(location.pathname);
  if (!isSubAppPath(path)) {
    return <Navigate to="/404" replace />;
  }
  return null;
}
