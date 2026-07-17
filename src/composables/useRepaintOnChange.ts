import { nextTick, watch, type Ref } from 'vue'

/**
 * Forces the browser to paint content inserted into `el` whenever `source`
 * changes.
 *
 * The problem: some in-app WebViews (e.g. the Userlytics test browser) skip
 * painting DOM that is added *while the soft keyboard is open*. Search results
 * fetched as the user types are inserted but never drawn — they only appear
 * after a layout-invalidating event such as dismissing the keyboard, and then
 * stay visible even if the keyboard reopens. Desktop Chrome (no soft keyboard)
 * never hits this.
 *
 * The fix: after Vue patches the DOM for a `source` change, nudge the target so
 * the WebView is forced to relayout + repaint its subtree. Toggling `display`
 * with a forced reflow in between guarantees the freshly-inserted rows are
 * painted immediately, without a visible flicker (both writes happen inside one
 * frame, so only the final state is presented).
 */
export function useRepaintOnChange(el: Ref<HTMLElement | null>, source: () => unknown): void {
  watch(source, () => {
    void nextTick(() => {
      requestAnimationFrame(() => {
        const node = el.value
        if (!node) return
        const previous = node.style.display
        node.style.display = 'none'
        // Reading layout forces a synchronous reflow between the two writes.
        void node.offsetHeight
        node.style.display = previous
      })
    })
  })
}
