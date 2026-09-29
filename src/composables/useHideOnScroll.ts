import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

/**
 * Scroll distance, in px, before a change of direction counts. Small enough that
 * a deliberate flick up brings the element straight back; large enough that a
 * trackpad's jitter or a finger resting on the screen doesn't make it flicker.
 */
const DIRECTION_THRESHOLD = 16

/**
 * `true` while the reader is scrolling down, `false` again once they scroll
 * back up (or reach the top) — the “get out of the way while I read, come back
 * when I look for you” behaviour of mobile toolbars and floating buttons.
 *
 * Distances are measured from the last turning point rather than per event, so
 * a slow scroll hides the element as surely as a fast one. One passive listener,
 * coalesced to a frame; `enabled` switching off detaches it and shows the
 * element again.
 */
export function useHideOnScroll(enabled: Ref<boolean>): Ref<boolean> {
  const hidden = ref(false)
  let anchor = 0
  let frame = 0

  function update() {
    frame = 0
    const y = window.scrollY

    // At (or bounced past) the top there's nothing to read behind it.
    if (y <= 0) {
      hidden.value = false
      anchor = 0
      return
    }

    // Follow the scroll while it keeps going the way it already went, so a
    // reversal is measured from where it turned.
    if (hidden.value ? y > anchor : y < anchor) {
      anchor = y
      return
    }

    if (Math.abs(y - anchor) < DIRECTION_THRESHOLD) return
    hidden.value = y > anchor
    anchor = y
  }

  function onScroll() {
    if (!frame) frame = requestAnimationFrame(update)
  }

  function detach() {
    window.removeEventListener('scroll', onScroll)
    if (frame) cancelAnimationFrame(frame)
    frame = 0
  }

  function sync(on: boolean) {
    detach()
    hidden.value = false
    if (!on) return
    anchor = window.scrollY
    window.addEventListener('scroll', onScroll, { passive: true })
  }

  onMounted(() => {
    watch(enabled, sync, { immediate: true })
  })

  onBeforeUnmount(detach)

  return hidden
}
