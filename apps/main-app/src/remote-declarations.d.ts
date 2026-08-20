declare module "git-report-generator/main" {
  import type { SubAppLifecycle } from "@pavilion-mfe/router";
  const lifecycle: SubAppLifecycle;
  export default lifecycle;
}

declare module "ai-chat/main" {
  import type { SubAppLifecycle } from "@pavilion-mfe/router";
  const lifecycle: SubAppLifecycle;
  export default lifecycle;
}

declare module "ai-customer/main" {
  import type { SubAppLifecycle } from "@pavilion-mfe/router";
  const lifecycle: SubAppLifecycle;
  export default lifecycle;
}
