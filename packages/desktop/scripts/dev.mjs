// Compiles the Electron main/preload TS with esbuild, waits for the Vite dev
// server (the main-app on :6019) to be reachable, then launches Electron with
// DEV_SERVER_URL pointing at it. The MF sub-apps are served by their own Vite
// dev servers (6010/6020/6030/6040) and resolved at runtime.
import { build } from 'esbuild'
import { spawn } from 'node:child_process'
import waitOn from 'wait-on'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const appDir = resolve(__dirname, '..')

const devUrl = process.env.DEV_SERVER_URL || 'http://localhost:6019'

function run(bin, args, opts = {}) {
  return new Promise((resolveP, rejectP) => {
    const child = spawn(bin, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts })
    child.on('close', (code) => (code === 0 ? resolveP() : rejectP(new Error(`${bin} exited ${code}`))))
  })
}

// bundle + minify Electron main/preload into CommonJS (Electron's main process)
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

try {
  console.log('[desktop] bundling electron main process...')
  await bundleMain()

  console.log(`[desktop] waiting for dev server at ${devUrl} ...`)
  await waitOn({ resources: [devUrl], timeout: 120000, validateStatus })

  console.log('[desktop] launching electron...')
  const electronBin = resolve(appDir, 'node_modules/.bin/electron')
  await run(electronBin, ['.'], {
    cwd: appDir,
    env: { ...process.env, DEV_SERVER_URL: devUrl },
  })
} catch (err) {
  console.error('[desktop] dev failed:', err)
  process.exit(1)
}

function validateStatus(status) {
  // Vite dev server returns 200 for the root
  return status === 200
}
