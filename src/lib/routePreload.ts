/**
 * Centralized route prefetching. Each entry triggers the same dynamic import()
 * used by React.lazy in App.tsx, so when the user actually navigates the chunk
 * is already in the browser cache and the route renders instantly.
 *
 * Call `preloadRoute(path)` on hover/touchstart/focus on navigation links,
 * and `preloadCriticalRoutes()` on idle after first paint.
 */

type Loader = () => Promise<unknown>;

// Map route paths (or path prefixes) to their lazy loaders.
// Keep in sync with the lazy() declarations in App.tsx.
const loaders: Record<string, Loader> = {
  '/': () => import('@/pages/Index'),
  '/oversikt': () => import('@/pages/Overview'),
  '/profil': () => import('@/pages/Profile'),
  '/installningar': () => import('@/pages/Settings'),
  '/mediciner': () => import('@/pages/Medications'),
  '/diagnoser': () => import('@/pages/Diagnoses'),
  '/kannetecken': () => import('@/pages/Characteristics'),
  '/notiser': () => import('@/pages/Notifications'),
  '/forum': () => import('@/pages/Community'),
  '/fraga': () => import('@/pages/AskToddy'),
  '/rapporter': () => import('@/pages/Reports'),
  '/anhorig': () => import('@/pages/RelativeDashboard'),
  '/anhorig-rapporter': () => import('@/pages/RelativeReports'),
  '/foljer': () => import('@/pages/Following'),
  '/lakare': () => import('@/pages/DoctorHome'),
  '/mina-patienter': () => import('@/pages/DoctorDashboard'),
  '/mina-lakare': () => import('@/pages/ManageConnections'),
  '/auth': () => import('@/pages/Auth'),
  '/logga-in': () => import('@/pages/Login'),
  '/skapa-konto': () => import('@/pages/Signup'),
};

const started = new Set<string>();

export function preloadRoute(path: string) {
  if (!path) return;
  // Match exact, then longest-prefix (handles e.g. /forum/123 -> /forum)
  let key = loaders[path] ? path : '';
  if (!key) {
    for (const k of Object.keys(loaders)) {
      if (path.startsWith(k) && k.length > key.length) key = k;
    }
  }
  if (!key || started.has(key)) return;
  started.add(key);
  // Fire and forget; ignore failures so a slow chunk doesn't break navigation.
  loaders[key]().catch(() => started.delete(key));
}

/** Preload the routes most users hit right after login. */
export function preloadCriticalRoutes() {
  ['/', '/oversikt', '/profil', '/installningar', '/notiser', '/forum'].forEach(preloadRoute);
}
