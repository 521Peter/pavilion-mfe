import type { PluginOption } from 'vite'
import { federation as mfFederation } from '@module-federation/vite'
import type { ModuleFederationOptions } from '@module-federation/vite'
import topAwait from 'vite-plugin-top-level-await'
import type { PavilionMfePluginOptions } from './config-types.js'
import { resolveRemotes } from './remote-resolver.js'
import { wsDiscoveryPlugin } from './ws-discovery.js'
import { cssScopePlugin } from './css-scope.js'

export { resolveRemotes, wsDiscoveryPlugin, cssScopePlugin }
export type * from './config-types.js'

export function PavilionMfe(options: PavilionMfePluginOptions): PluginOption[] {
  const plugins: PluginOption[] = []

  // ─── 0. Resolve environment config ───
  const env = options.env ?? process.env.VITE_PAVILION_MFE_ENV ?? 'develop'
  const cdn = options.cdn ?? ''

  // ─── 0b. Inject env vars into import.meta.env ───
  plugins.push({
    name: 'pavilion-mfe:env-inject',
    config: (config) => {
      const define = config.define ?? (config.define = {})
      ;(define as Record<string, string>)['import.meta.env.VITE_PAVILION_MFE_ENV'] = JSON.stringify(env)
    },
  } as PluginOption)

  // ─── 1. Build config: base URL + optimizations ───
  plugins.push({
    name: 'pavilion-mfe:build-config',
    apply: 'build',
    config: (config) => {
      if (options.role === 'sub-app' || options.role === 'runtime') {
        config.base = `${cdn}/mfe/${options.name ?? 'unknown'}/`
      }

      // MF shared chunks (e.g. Element Plus ~950kB, Ant Design ~1.5MB)
      // are single-load shared bundles — raise the limit to avoid noise.
      const build = config.build ?? (config.build = {})
      if (!build.chunkSizeWarningLimit) {
        build.chunkSizeWarningLimit = 1500
      }
      // Disable sourcemaps in production for smaller bundles
      if (build.sourcemap === undefined) {
        build.sourcemap = false
      }
      // Enable CSS code splitting for per-route styles
      if (build.cssCodeSplit === undefined) {
        build.cssCodeSplit = true
      }
      // Organize chunk/asset output into static/{js,css,ext} dirs
      const rollup = build.rollupOptions ?? (build.rollupOptions = {})
      const output = rollup.output ?? (rollup.output = {})
      if (typeof output === 'object' && !Array.isArray(output)) {
        if (!output.chunkFileNames) output.chunkFileNames = 'static/js/[name]-[hash].js'
        if (!output.entryFileNames) output.entryFileNames = 'static/js/[name]-[hash].js'
        if (!output.assetFileNames) output.assetFileNames = 'static/[ext]/[name]-[hash].[ext]'
      }

      // Drop debugger statements in production
      const esbuild = config.esbuild ?? (config.esbuild = {})
      if (typeof esbuild === 'object') {
        const drop = esbuild.drop ?? (esbuild.drop = [])
        if (!drop.includes('debugger')) drop.push('debugger')
      }

      // Main app: no public dir (everything is served via MF remotes)
      if (options.role === 'main-app') {
        config.publicDir = false
      }
    },
  } as PluginOption)

 // ─── 1a. Dev config: absolute base URL for sub-apps ───
 // In dev mode, sub-app code runs inside the main app's page. Asset paths
 // like "/src/assets/hero.png" would resolve to the main app's origin
 // instead of the sub-app's dev server. Setting server.origin ensures
 // Vite generates absolute asset URLs that always point to the sub-app,
 // regardless of which host page the code runs in.
if ((options.role === 'sub-app' || options.role === 'runtime') && options.port) {
  plugins.push({
    name: 'pavilion-mfe:dev-base',
    apply: 'serve',
    config: (config) => {
      const server = config.server ?? (config.server = {})
      if (!server.origin) {
        server.origin = `http://localhost:${options.port}`
      }
    },
  } as PluginOption)
}

  // ─── 1b. Mark vite/module-runner as external ───
  // @module-federation/vite dynamically imports it for SSR (Vite 8+),
  // but it doesn't exist in Vite 5.x. The import is wrapped in try/catch
  // at runtime, so we just need Rollup to not resolve it at build time.
  // enforce: 'pre' ensures this runs BEFORE Vite's built-in resolver.
  plugins.push({
    name: 'pavilion-mfe:external',
    enforce: 'pre',
    apply: 'build',
    resolveId(id) {
      if (id === 'vite/module-runner') {
        return { id, external: true }
      }
    },
  } as PluginOption)

  // ─── 1b. Top-level await (build only) ───
  // Required for MF shared modules that use top-level await syntax.
  // Injected only in build mode to avoid interfering with dev ESM.
  plugins.push({
    name: 'pavilion-mfe:top-await',
    apply: 'build',
    config: () => ({
      plugins: [topAwait()],
    }),
  } as PluginOption)

  // ─── 1c. Dev server proxy ───
  if (options.proxy) {
    plugins.push({
      name: 'pavilion-mfe:proxy',
      apply: 'serve',
      config: (config) => {
        const server = config.server ?? (config.server = {})
        server.proxy = { ...server.proxy, ...options.proxy }
      },
    } as PluginOption)
  }

  // ─── 2. Module Federation ───
  const mfOptions: ModuleFederationOptions = {
    name: options.name ?? 'pavilion-mfe-app',
  }

  if (options.pavilionMfeRemotes && Object.keys(options.pavilionMfeRemotes).length > 0) {
    const resolved = resolveRemotes(options.pavilionMfeRemotes, { cdn })
    mfOptions.remotes = { ...resolved, ...options.remotes }
  } else if (options.remotes && Object.keys(options.remotes).length > 0) {
    mfOptions.remotes = options.remotes
  }

  if (options.exposes) mfOptions.exposes = options.exposes
  if (options.shared) mfOptions.shared = options.shared as ModuleFederationOptions['shared']
  if (options.shareStrategy) mfOptions.shareStrategy = options.shareStrategy
  if (options.runtimePlugins) mfOptions.runtimePlugins = options.runtimePlugins
  if (options.dts !== undefined) (mfOptions as any).dts = options.dts

  // Manifest at root level (no filePath) so relative paths resolve correctly
  if (options.manifest !== false) {
    mfOptions.manifest = typeof options.manifest === 'object'
      ? options.manifest as ModuleFederationOptions['manifest']
      : { fileName: 'mf-manifest-main.json' }
  }

  plugins.push(mfFederation(mfOptions))

  // ─── 3. CSS Scope (sub-app builds only) ───
  if (options.role === 'sub-app' || options.role === 'runtime') {
    const scopePrefix = `pavilion-mfe-${options.name ?? 'unknown'}`

    plugins.push({
      name: 'pavilion-mfe:css-scope',
      enforce: 'post',
      config: (config) => {
        const cssConfig = config.css = config.css ?? {}
        const postcss = (cssConfig as Record<string, unknown>).postcss = 
          (cssConfig as Record<string, unknown>).postcss ?? {}

        const scopePlugin = cssScopePlugin({
          prefix: scopePrefix,
          exclude: options.cssExclude,
        })

        const existingPlugins = ((postcss as { plugins?: unknown[] }).plugins ?? [])
        ;(postcss as { plugins: unknown[] }).plugins = [...existingPlugins, scopePlugin]
      },
    } as PluginOption)
  }

  // ─── 4. Dev-time WS port discovery ───
  if (options.openDevServe && options.role === 'sub-app' && options.port) {
    plugins.push(
      wsDiscoveryPlugin({ port: options.port, name: options.name })
    )
  }

  return plugins
}
