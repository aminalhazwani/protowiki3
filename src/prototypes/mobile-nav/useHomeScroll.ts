import { nextTick } from 'vue'
import type { Router } from 'vue-router'

import { HOME_PATH } from './routes'

/*
 * PROTOWIKI+ (mobile-nav) Router: no `scrollBehavior`, so every page kept the
 * last one's scroll position. Here a new page (a tab bar tap included) starts
 * at the top, and back / forward returns to where the reader left that history
 * entry. A `#fragment` is the page's to handle.
 */

/** Last scroll position on each history entry (Vue Router's `history.state.position`). */
const byEntry = new Map<number, number>()

let installed = false
let traversing = false
/** When the page last scrolled itself, so the tab bar can tell that from the reader. */
let programmaticScrollAt = -Infinity

/** How long a restore waits for a page's content to grow tall enough. */
const RESTORE_TIMEOUT_MS = 2000

function inPrototype(path: string): boolean {
  return path === HOME_PATH || path.startsWith(`${HOME_PATH}/`)
}

function currentEntry(): number | null {
  const position = (window.history.state as { position?: unknown } | null)?.position
  return typeof position === 'number' ? position : null
}

/** True for a moment after the page scrolled itself (a restore), not the reader. */
export function isProgrammaticScroll(): boolean {
  return performance.now() - programmaticScrollAt < 150
}

function scrollToY(y: number): void {
  programmaticScrollAt = performance.now()
  window.scrollTo(0, y)
}

/**
 * Scroll to `y` once the page is tall enough (content loads after the route
 * changes); give up if the reader scrolls first.
 */
function restoreTo(y: number): void {
  if (y <= 0) {
    scrollToY(0)
    return
  }
  let cancelled = false
  const cancel = () => (cancelled = true)
  window.addEventListener('wheel', cancel, { once: true, passive: true })
  window.addEventListener('touchstart', cancel, { once: true, passive: true })
  const started = performance.now()

  const attempt = () => {
    if (cancelled) return
    const maxY = document.documentElement.scrollHeight - window.innerHeight
    const timedOut = performance.now() - started > RESTORE_TIMEOUT_MS
    if (maxY >= y || timedOut) {
      scrollToY(y)
      window.removeEventListener('wheel', cancel)
      window.removeEventListener('touchstart', cancel)
      return
    }
    requestAnimationFrame(attempt)
  }
  attempt()
}

/** Install once, from the prototype's chrome; only routes under `HOME_PATH` are touched. */
export function installHomeScroll(router: Router): void {
  if (installed) return
  installed = true

  window.addEventListener(
    'scroll',
    () => {
      if (!inPrototype(router.currentRoute.value.path)) return
      const entry = currentEntry()
      if (entry !== null) byEntry.set(entry, window.scrollY)
    },
    { passive: true },
  )
  window.addEventListener('popstate', () => (traversing = true))

  router.afterEach((to, from, failure) => {
    const wasTraversing = traversing
    traversing = false
    if (failure || !inPrototype(to.path)) {
      if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'auto'
      return
    }
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    // Same page, new query (the Home's URL sync): stay put.
    if (to.path === from.path) return

    let target: number | null = 0
    if (wasTraversing) target = byEntry.get(currentEntry() ?? -1) ?? 0
    else if (to.hash) target = null

    if (target !== null) void nextTick(() => restoreTo(target))
  })
}
