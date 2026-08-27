import { createPathMatcher } from "@pavilion-mfe/router";
import mfeConfig from "../../mfe.json";

/** 当前路径是否属于微前端子应用 */
export function isSubAppPath(path: string): boolean {
  return mfeConfig.apps.some(app => createPathMatcher(app.routes)(path));
}
