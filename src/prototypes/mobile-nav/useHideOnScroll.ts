import { onBeforeUnmount, onMounted, ref } from 'vue'

/** Scroll distance (px) in one direction before the bar reacts, so jitter doesn't flicker it. */
const THRESHOLD = 8

/**
 * Hidden while the reader scrolls down, shown again as soon as they scroll up
 * (Chrome / Safari toolbar behaviour). Always shown near the top of the page.
 */
export function useHideOnScroll(topZone = 56) {
  const hidden = ref(false)
  let lastY = 0

  function onScroll(): void {
    const y = Math.max(0, window.scrollY)
    if (y <= topZone) {
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
