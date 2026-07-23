import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * Drives the sticky-footer divider on the onboarding steps: the CTA is pinned to
 * the bottom of the viewport, and its top border is shown only when the page can
 * actually scroll (so a short step has no divider). Scroll happens at the
 * page/document level here — there is no inner overflow container — so we measure
 * the document and watch the content region for height changes (async
 * suggestions, growing/shrinking lists).
 *
 * Bind `scrollTarget` to the screen's content region and toggle the `--divided`
 * class from `isScrollable`.
 */
export function useScrollableFooter(): {
  scrollTarget: Ref<HTMLElement | null>
  isScrollable: Ref<boolean>
} {
  const scrollTarget = ref<HTMLElement | null>(null)
  const isScrollable = ref(false)

  // Entrance animations (e.g. the welcome stagger) transiently transform content,
  // which inflates the document scrollHeight and would flag a non-scrolling page
  // as scrollable. Skip measuring while any subtree animation is running; the
  // `animationend` listener re-measures once the content settles at rest.
  function isAnimating(): boolean {
    const el = scrollTarget.value
    if (!el || typeof el.getAnimations !== 'function') return false
    return el.getAnimations({ subtree: true }).some((a) => a.playState === 'running')
  }

  function measure(): void {
    if (isAnimating()) return
    const el = document.scrollingElement ?? document.documentElement
    isScrollable.value = el.scrollHeight - el.clientHeight > 1
  }

  let resizeObserver: ResizeObserver | null = null
  let observed: HTMLElement | null = null

  onMounted(() => {
    measure()
    window.addEventListener('resize', measure)
    observed = scrollTarget.value
    if (observed) {
      resizeObserver = new ResizeObserver(measure)
      resizeObserver.observe(observed)
      observed.addEventListener('animationend', measure)
    }
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', measure)
    resizeObserver?.disconnect()
    observed?.removeEventListener('animationend', measure)
  })

  return { scrollTarget, isScrollable }
}
