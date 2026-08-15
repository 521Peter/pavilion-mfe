export const TAB_EVENTS = {
  ROUTE_BEFORE: "pavilion-mfe:tab:route-before",
  ROUTE_AFTER: "pavilion-mfe:tab:route-after"
} as const;

export interface TabRouteDetail {
  matched: string[];
  componentName?: string;
  name?: string;
  href: string;
  fullPath: string;
  path: string;
  query: Record<string, string>;
  params: Record<string, string>;
  meta: Record<string, unknown>;
}
