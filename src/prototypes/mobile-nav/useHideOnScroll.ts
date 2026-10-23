import { onBeforeUnmount, onMounted, ref } from 'vue'

import { isProgrammaticScroll } from './useHomeScroll'

/** Scroll distance (px) in one direction before the bar reacts, so jitter doesn't flicker it. */
const THRESHOLD = 8

/** How close (px) to the end of the page counts as the end (rounding, subpixel scroll). */
const BOTTOM_ZONE = 2

/**
 * Hidden while the reader scrolls down, shown again as soon as they scroll up
 * (Chrome / Safari toolbar behaviour). Always shown near the top of the page,
 * and back again at its very end, where the footer leaves room for it.
 */
export function useHideOnScroll(topZone = 56) {
  const hidden = ref(false)
  let lastY = 0

  function onScroll(): void {
    const y = Math.max(0, window.scrollY)
    // A page restoring its scroll position isn't the reader scrolling.
    if (isProgrammaticScroll()) {
      lastY = y
      return
    }
    const atEnd = y + window.innerHeight >= document.documentElement.scrollHeight - BOTTOM_ZONE
    if (y <= topZone || atEnd) {
      hidden.value = false
      lastY = y
      return
    }
    const delta = y - lastY
    if (Math.abs(delta) < THRESHOLD) return
    hidden.value = delta > 0
    lastY = y
  }

  onMounted(() => {
    lastY = Math.max(0, window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
  })
  onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

  /** Bring the bar back (a new page, say). */
  function show(): void {
    hidden.value = false
    lastY = Math.max(0, window.scrollY)
  }

  return { hidden, show }
}
