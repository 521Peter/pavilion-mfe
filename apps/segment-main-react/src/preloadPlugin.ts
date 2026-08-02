/**
 * PavilionMfe runtime preload plugin for Module Federation.
 *
 * ① beforeInit: dynamically register all sub-apps as MF remotes
 *    (no need to statically declare them in vite.config.ts)
 *
 * ② preload: immediately load the current sub-app, then preload
 *    other sub-apps after a 1s delay
 */
import mfeConfig from '../mfe.json'
import { loadRemote, preloadRemote } from '@module-federation/runtime'

interface MfeApp {
  appCode: string
  name: string
  cdn?: string
  routes: string[]
  devPort?: number
  keepAlive?: boolean
}

// ─── Inline logger (reads same global config as @pavilion-mfe/sandbox) ───
// Avoids importing @pavilion-mfe/* packages at MF runtime init time.
const ST_PX = 'color:#42b883;font-weight:bold'
const ST_MOD = 'color:#00b4d8;font-weight:bold'
const ST_EVT = 'color:#e8a838;font-weight:bold'
const ST_DIM = 'color:#999'

function preloadLog(event: string, detail: Record<string, unknown> = {}): void {
  const g = globalThis as Record<string, any>
  const config = g.__PAVILION_MFE_LOG__
  if (config?.enabled === false) return
  if (config?.modules?.preload === false) return
  const pairs = Object.entries(detail)
    .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
    .join('  ')
  if (pairs) {
    console.log('%c[PavilionMfe]%c preload%c %s%c %s', ST_PX, ST_MOD, ST_EVT, event, ST_DIM, pairs)
  } else {
    console.log('%c[PavilionMfe]%c preload%c %s', ST_PX, ST_MOD, ST_EVT, event)
  }
}

/**
 * Match a sub-app by URL path.
 * Uses the same trailing-slash normalization as createRouter.
 */
function matchAppByPath(apps: MfeApp[], path: string): MfeApp | null {
  for (const app of apps) {
    if (
      app.routes.some((route) =>
        path.replace(/\/?$/, '/').startsWith(route.replace(/\/?$/, '/'))
      )
    ) {
      return app
    }
  }
  return null
}

/**
 * Preload strategy:
 * - Current sub-app: loadRemote immediately (user is waiting)
 * - Other sub-apps: preloadRemote after 1s delay (idle prefetch)
 */
function preload(apps: MfeApp[]): void {
  const currentApp = matchAppByPath(apps, location.pathname)

  const otherApps = apps.filter(
    (app) => app.appCode !== currentApp?.appCode
  )

  // ① Immediately load the current sub-app
  if (currentApp) {
    loadRemote(`${currentApp.appCode}/main`)
      .then(() => {
        preloadLog('preload-current', { appCode: currentApp.appCode, status: 'done' })
      })
      .catch((err) => {
        preloadLog('preload-current', { appCode: currentApp.appCode, status: 'failed' })
        console.error(`[PavilionMfe] Preload failed for ${currentApp.appCode}:`, err)
      })
  }

  // ② Delay-preload other sub-apps
  setTimeout(() => {
    preloadRemote(
      otherApps.map((app) => ({
        nameOrAlias: app.appCode,
        exposes: ['main'],
      }))
    )
      .then(() => {
        preloadLog('preload-others', { apps: otherApps.map(a => a.appCode).join(', '), status: 'done' })
      })
      .catch((err) => {
        preloadLog('preload-others', { status: 'failed' })
        console.error('[PavilionMfe] Preload of other sub-apps failed:', err)
      })
  }, 1000)
}

export default function () {
  return {
    name: 'pavilion-mfe-preload',

    /**
     * Register all sub-apps as MF remotes at runtime.
     * Sub-app config comes from mfe.json (build-time).
     */
    beforeInit(args: any) {
      const apps = mfeConfig.apps as MfeApp[]
      const globalCdn = (import.meta.env.VITE_PAVILION_MFE_CDN || '') as string
      args.options.remotes.push(
        ...apps.map((app) => {
          const appCdn = app.cdn || globalCdn
          const base = appCdn ? `${appCdn}` : ''
          return {
            name: app.appCode,
            entry: `${base}/mfe/${app.appCode}/mf-manifest-main.json`,
            type: 'module' as const,
          }
        })
      )
      preloadLog('register', {
        remotes: apps.length,
        apps: apps.map(a => a.appCode).join(', '),
      })
      // Kick off preloading after MF runtime initializes
      Promise.resolve().then(() => preload(apps))
      return args
    },
  }
}
