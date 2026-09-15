import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

/**
 * `true` once `target` has scrolled off the top of the viewport, `false` again
 * once any part of it is back in view. Used by the desktop sticky header to
 * decide when to slide in.
 *
 * An `IntersectionObserver` rather than a scroll listener: no per-frame work on
 * the main thread, and the browser owns the threshold maths. `target` may be a
 * computed — the observer follows it, so the article heading can take over from
 * the site header as the trigger the moment an article registers one.
 */
export function useScrolledPast(target: Ref<HTMLElement | null>): Ref<boolean> {
  const past = ref(false)
  let observer: IntersectionObserver | null = null

  function disconnect() {
    observer?.disconnect()
    observer = null
  }

  watch(
    target,
    (el) => {
      disconnect()
      if (!el || typeof IntersectionObserver === 'undefined') {
        past.value = false
        return
      }

      observer = new IntersectionObserver(([entry]) => {
        // `isIntersecting` alone would also fire for a target *below* the fold
        // — on first paint, before anything has scrolled. Require that it left
        // upwards.
        past.value = !entry.isIntersecting && entry.boundingClientRect.top < 0
      })
      observer.observe(el)
    },
    { immediate: true },
  )

  onBeforeUnmount(disconnect)

  return past
}
