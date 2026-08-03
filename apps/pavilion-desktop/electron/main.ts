import { app, BrowserWindow, shell, Menu } from 'electron'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { createStaticServer } from './static-server'

// Remote entry URL for the dev server (set by scripts/dev.mjs)
const DEV_SERVER_URL = process.env.DEV_SERVER_URL

// Whether we are running in packaged production mode
const isPackaged = !DEV_SERVER_URL

let mainWindow: BrowserWindow | null = null
let server: { port: number; close: () => void } | null = null

function createWindow(loadUrl: string): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      // Allow the renderer to use Node-ish APIs exposed via preload only
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow?.show())

  // Mirror renderer console into the terminal for debugging MF loading
  mainWindow.webContents.on('console-message', (_e, level, message) => {
    const tag = level >= 2 ? 'renderer:error' : 'renderer'
    console.log(`[${tag}]`, message)
  })
  mainWindow.webContents.on('did-fail-load', (_e, code, desc) =>
    console.log(`[desktop] did-fail-load ${code} ${desc}`))
  mainWindow.webContents.on('did-finish-load', () =>
    console.log('[desktop] did-finish-load'))

  // Open external links in the system browser, not inside the app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  mainWindow.loadURL(loadUrl)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

async function boot(): Promise<void> {
  // In packaged mode, serve the bundled renderer artifacts from a local HTTP
  // server. Module Federation needs a real origin (not file://) to load remote
  // manifests and ES modules reliably.
  if (isPackaged) {
    // Packaged: <resourcesPath>/renderer; unpackaged preview: dist/renderer
    const packagedDir = join(process.resourcesPath, 'renderer')
    const rendererDir = existsSync(packagedDir)
      ? packagedDir
      : join(__dirname, 'renderer')
    server = await createStaticServer(rendererDir)
  }

  const targetUrl = DEV_SERVER_URL
    ? DEV_SERVER_URL
    : `http://localhost:${server!.port}/`

  console.log(`[desktop] loading ${targetUrl}`)
  // No application menu for a cleaner desktop look — rely on keyboard shortcuts
  Menu.setApplicationMenu(null)
  createWindow(targetUrl)
}

app.whenReady().then(boot)

app.on('window-all-closed', () => {
  server?.close()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) boot()
})
