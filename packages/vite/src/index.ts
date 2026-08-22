import type { PluginOption } from "vite";
import { federation as mfFederation } from "@module-federation/vite";
import type { ModuleFederationOptions } from "@module-federation/vite";
import topAwait from "vite-plugin-top-level-await";
import type { PavilionMfePluginOptions } from "./config-types.js";
import { resolveRemotes } from "./remote-resolver.js";
import { wsDiscoveryPlugin } from "./ws-discovery.js";
import { cssScopePlugin } from "./css-scope.js";

export { resolveRemotes, wsDiscoveryPlugin, cssScopePlugin };
export type * from "./config-types.js";

export function PavilionMfe(options: PavilionMfePluginOptions): PluginOption[] {
  const plugins: PluginOption[] = [];

  // ─── 0. 解析环境配置 ───
  const env = options.env ?? process.env.VITE_PAVILION_MFE_ENV ?? "develop";
  const cdn = options.cdn ?? "";

  // ─── 0b. 将环境变量注入 import.meta.env ───
  plugins.push({
    name: "pavilion-mfe:env-inject",
    config: config => {
      const define = config.define ?? (config.define = {});
      (define as Record<string, string>)["import.meta.env.VITE_PAVILION_MFE_ENV"] = JSON.stringify(env);
    }
  } as PluginOption);

  // ─── 1. 构建配置：基础 URL + 优化 ───
  plugins.push({
    name: "pavilion-mfe:build-config",
    apply: "build",
    config: config => {
      if (options.role === "sub-app" || options.role === "runtime") {
        config.base = `${cdn}/mfe/${options.name ?? "unknown"}/`;
      }

      // MF 共享分块（如 Element Plus 约 950kB、Ant Design 约 1.5MB）
      // 是仅加载一次的共享包，提高限制以避免无意义的警告。
      const build = config.build ?? (config.build = {});
      if (!build.chunkSizeWarningLimit) {
        build.chunkSizeWarningLimit = 1500;
      }
      // 生产环境禁用 sourcemap 以减小产物体积
      if (build.sourcemap === undefined) {
        build.sourcemap = false;
      }
      // 启用 CSS 代码拆分，支持按路由加载样式
      if (build.cssCodeSplit === undefined) {
        build.cssCodeSplit = true;
      }
      // 将分块/资源产物组织到 static/{js,css,ext} 目录
      const rollup = build.rollupOptions ?? (build.rollupOptions = {});
      const output = rollup.output ?? (rollup.output = {});
      if (typeof output === "object" && !Array.isArray(output)) {
        if (!output.chunkFileNames) output.chunkFileNames = "static/js/[name]-[hash].js";
        if (!output.entryFileNames) output.entryFileNames = "static/js/[name]-[hash].js";
        if (!output.assetFileNames) output.assetFileNames = "static/[ext]/[name]-[hash].[ext]";
      }

      // 生产环境移除 debugger 语句
      const esbuild = config.esbuild ?? (config.esbuild = {});
      if (typeof esbuild === "object") {
        const drop = esbuild.drop ?? (esbuild.drop = []);
        if (!drop.includes("debugger")) drop.push("debugger");
      }

      // 主应用：不使用 public 目录（所有内容均通过 MF 远程模块提供）
      if (options.role === "main-app") {
        config.publicDir = false;
      }
    }
  } as PluginOption);

  // ─── 1a. 开发配置：子应用绝对基础 URL ───
  // 开发模式下，子应用代码运行在主应用页面内。类似 "/src/assets/hero.png" 的资源路径
  // 会解析到主应用来源，而非子应用开发服务器。设置 server.origin 可确保 Vite
  // 生成始终指向子应用的绝对资源 URL，不受代码所在宿主页影响。
  if ((options.role === "sub-app" || options.role === "runtime") && options.port) {
    plugins.push({
      name: "pavilion-mfe:dev-base",
      apply: "serve",
      config: config => {
        const server = config.server ?? (config.server = {});
        if (!server.origin) {
          server.origin = `http://localhost:${options.port}`;
        }
      }
    } as PluginOption);
  }

  // ─── 1b. 将 vite/module-runner 标记为外部依赖 ───
  // @module-federation/vite 会为 SSR（Vite 8+）动态导入它，但 Vite 5.x 中不存在。
  // 运行时导入已由 try/catch 包裹，因此只需阻止 Rollup 在构建时解析它。
  // enforce: 'pre' 确保此插件在 Vite 内置解析器之前运行。
  plugins.push({
    name: "pavilion-mfe:external",
    enforce: "pre",
    apply: "build",
    resolveId(id) {
      if (id === "vite/module-runner") {
        return { id, external: true };
      }
    }
  } as PluginOption);

  // ─── 1b. 顶层 await（仅构建时） ───
  // 使用顶层 await 语法的 MF 共享模块需要此配置。
  // 仅在构建模式注入，避免干扰开发环境 ESM。
  plugins.push({
    name: "pavilion-mfe:top-await",
    apply: "build",
    config: () => ({
      plugins: [topAwait()]
    })
  } as PluginOption);

  // ─── 1c. 开发服务器代理 ───
  if (options.proxy) {
    plugins.push({
      name: "pavilion-mfe:proxy",
      apply: "serve",
      config: config => {
        const server = config.server ?? (config.server = {});
        server.proxy = { ...server.proxy, ...options.proxy };
      }
    } as PluginOption);
  }

  // ─── 2. 模块联邦 ───
  const mfOptions: ModuleFederationOptions = {
    name: options.name ?? "pavilion-mfe-app"
  };

  if (options.pavilionMfeRemotes && Object.keys(options.pavilionMfeRemotes).length > 0) {
    const resolved = resolveRemotes(options.pavilionMfeRemotes, { cdn });
    mfOptions.remotes = { ...resolved, ...options.remotes };
  } else if (options.remotes && Object.keys(options.remotes).length > 0) {
    mfOptions.remotes = options.remotes;
  }

  if (options.exposes) mfOptions.exposes = options.exposes;
  if (options.shared) mfOptions.shared = options.shared as ModuleFederationOptions["shared"];
  if (options.shareStrategy) mfOptions.shareStrategy = options.shareStrategy;
  if (options.runtimePlugins) mfOptions.runtimePlugins = options.runtimePlugins;
  if (options.dts !== undefined) (mfOptions as any).dts = options.dts;

  // 清单放在根层级（不设置 filePath），确保相对路径正确解析
  if (options.manifest !== false) {
    mfOptions.manifest =
      typeof options.manifest === "object"
        ? (options.manifest as ModuleFederationOptions["manifest"])
        : { fileName: "mf-manifest-main.json" };
  }

  plugins.push(mfFederation(mfOptions));

  // ─── 3. CSS 作用域（仅子应用构建） ───
  if (options.role === "sub-app" || options.role === "runtime") {
    const scopePrefix = `pavilion-mfe-${options.name ?? "unknown"}`;

    plugins.push({
      name: "pavilion-mfe:css-scope",
      enforce: "post",
      config: config => {
        const cssConfig = (config.css = config.css ?? {});
        const postcss = ((cssConfig as Record<string, unknown>).postcss =
          (cssConfig as Record<string, unknown>).postcss ?? {});

        const scopePlugin = cssScopePlugin({
          prefix: scopePrefix,
          exclude: options.cssExclude
        });

        const existingPlugins = (postcss as { plugins?: unknown[] }).plugins ?? [];
        (postcss as { plugins: unknown[] }).plugins = [...existingPlugins, scopePlugin];
      }
    } as PluginOption);
  }

  // ─── 4. 开发时 WS 端口发现 ───
  if (options.openDevServe && options.role === "sub-app" && options.port) {
    plugins.push(wsDiscoveryPlugin({ port: options.port, name: options.name }));
  }

  return plugins;
}
