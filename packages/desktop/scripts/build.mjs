// 1. Bundles the Electron main/preload TS into dist/
// 2. Aggregates the already-built Vite outputs of every segment into a single
//    `dist/renderer/` directory so the packaged local static server can
//    serve them under one origin. Run the Vite builds first (see root
//    package.json `build:desktop`).
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { cp, rm, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const appDir = resolve(__dirname, '..')
const monorepoRoot = resolve(appDir, '../..')

// appCode -> monorepo app directory name
const segments = [
  { dir: 'main-app', isMain: true },
  { dir: 'segment-demo', code: 'demo-app' },
  { dir: 'segment-react', code: 'react-app' },
  { dir: 'segment-vue2', code: 'vue2-app' },
  { dir: 'git-report-generator', code: 'git-report-generator' },
]

function bundleMain() {
  return Promise.all([
    build({
      entryPoints: [resolve(appDir, 'electron/main.ts')],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      outfile: resolve(appDir, 'dist/main.js'),
    external: ['electron'],
  }),
  build({
    entryPoints: [resolve(appDir, 'electron/preload.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
      outfile: resolve(appDir, 'dist/preload.js'),
    external: ['electron'],
    }),
  ])
}

async function aggregate() {
  const rendererDir = resolve(appDir, 'dist/renderer')
  await rm(rendererDir, { recursive: true, force: true })
  await mkdir(rendererDir, { recursive: true })

  for (const seg of segments) {
    const segDist = resolve(monorepoRoot, 'apps', seg.dir, 'dist')
    if (!existsSync(join(segDist, 'index.html'))) {
      throw new Error(`[desktop] ${seg.dir}/dist not found. Run the Vite builds first (pnpm build:desktop).`)
    }
    if (seg.isMain) {
      // Main app at the origin root
      await cp(segDist, rendererDir, { recursive: true })
      console.log(`[desktop] copied ${seg.dir} -> renderer/ (main app)`)
    } else {
      // Sub-app under /mfe/<appCode>/ matching its publicPath
      const dest = join(rendererDir, 'mfe', seg.code)
      await mkdir(dest, { recursive: true })
      await cp(segDist, dest, { recursive: true })
      console.log(`[desktop] copied ${seg.dir} -> renderer/mfe/${seg.code}/`)
    }
  }
  console.log(`[desktop] aggregated renderer to ${rendererDir}`)
}

try {
  console.log('[desktop] bundling electron main process...')
  await bundleMain()
  console.log('[desktop] aggregating Vite build outputs...')
  await aggregate()
  console.log('[desktop] build complete')
} catch (err) {
  console.error('[desktop] build failed:', err)
  process.exit(1)
}
