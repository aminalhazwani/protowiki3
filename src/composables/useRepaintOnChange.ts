import { nextTick, watch, type Ref } from 'vue'

/**
 * Forces the browser to paint content inserted into `el` whenever `source`
 * changes.
 *
 * The problem: some in-app WebViews (e.g. the Userlytics test browser) only
 * repaint on real user input events while a text field is focused, and drop the
 * paint for DOM that JavaScript inserts asynchronously. So search results
 * fetched as the user types are added to the DOM but never drawn — they appear
 * only after the *next* input event (typing another character, or dismissing
 * the keyboard), and then stay visible. Desktop Chrome never hits this.
 *
 * The fix: after Vue patches the DOM for a `source` change, force a repaint of
 * the target subtree with two nudges that between them cover both layout- and
 * compositor-level paint suppression:
 *   1. A synchronous `display` toggle with a forced reflow — re-lays-out and
 *      repaints the subtree in the current frame (no flicker: both writes land
 *      before the frame is presented).
 *   2. A one-frame `translateZ(0)` toggle — creates then drops a compositing
 *      layer, forcing WebViews that suppress paints at the compositor level to
 *      redraw.
 *
 * `el` must be a wrapper that does NOT contain the focused input, so toggling
 * its `display` can't blur the field and dismiss the keyboard.
 */
export function useRepaintOnChange(el: Ref<HTMLElement | null>, source: () => unknown): void {
  watch(source, () => {
    void nextTick(() => {
      const node = el.value
      if (!node) return

      // 1. Layout-level: hide, read layout (forces reflow), restore.
      const previousDisplay = node.style.display
      node.style.display = 'none'
      void node.offsetHeight
      node.style.display = previousDisplay

      // 2. Compositor-level: promote to its own layer for one frame, then drop
      //    it — forces WebViews that only repaint on input events to redraw.
      const previousTransform = node.style.transform
      node.style.transform = `${previousTransform} translateZ(0)`.trim()
      requestAnimationFrame(() => {
        const current = el.value
        if (current) current.style.transform = previousTransform
      })
    })
  })
}
