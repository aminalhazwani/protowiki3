import { nextTick, onMounted, onUnmounted, watch, type Ref } from 'vue'

/** How far below the viewport the next page starts revealing. */
const LOOKAHEAD_PX = 400

function isNearViewport(element: HTMLElement | null): boolean {
  return !!element && element.getBoundingClientRect().top <= window.innerHeight + LOOKAHEAD_PX
}

/**
 * Infinite scroll for a module page: whenever `sentinel` (after the last card)
 * comes near the viewport, `reveal` the next page — repeatedly, until the
 * sentinel is out of reach again, so a tall screen fills up. `canReveal` is
 * false while a page is still decoding or when nothing is left.
 */
export function useRevealOnScroll(
  sentinel: Ref<HTMLElement | null>,
  canReveal: () => boolean,
  reveal: () => Promise<void>,
): void {
  let filling = false

  async function fill(): Promise<void> {
    if (filling) return
    filling = true
    try {
      while (canReveal() && isNearViewport(sentinel.value)) {
        await reveal()
        await nextTick()
      }
    } finally {
      filling = false
    }
  }

  let observer: IntersectionObserver | null = null

  onMounted(() => {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void fill()
      },
      { rootMargin: `0px 0px ${LOOKAHEAD_PX}px 0px` },
    )
    watch(
      sentinel,
      (element) => {
        observer?.disconnect()
        if (element) observer?.observe(element)
      },
      { immediate: true, flush: 'post' },
    )
  })

  // A page finishing (or the first load) may leave the sentinel in view without a new intersection.
  watch(canReveal, (can) => {
    if (can) void fill()
  })

  onUnmounted(() => observer?.disconnect())
}
