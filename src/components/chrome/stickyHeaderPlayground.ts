import type { Ref } from 'vue'

import { presetFlagKnob, presetKnobs } from './playgroundPresets'

/**
 * Knobs for the desktop sticky header, offered alongside the Home button
 * controls in the main-menu playground. Both round-trip through the URL
 * (`?stickyHome=`, `?stickyLangCountOnly=`) so a configured bar can be shared as
 * a link, starting from the active playground preset.
 *
 * `VectorChromeHeader` owns the state and passes it to `VectorStickyHeader` as
 * props — the bar is its child, so there's no need for shared module state the
 * way the two skins need it for Home.
 */
export interface StickyHeaderPlayground {
  /** Render a Home button at the head of the sticky bar's tool cluster. */
  showHome: Ref<boolean>
  /** Reduce the interlanguage control's label to the bare count: “445”, not “445 languages”. */
  languagesCountOnly: Ref<boolean>
}

/** A preset's starting point for the bar. */
export interface StickyHeaderDefaults {
  showHome: boolean
  languagesCountOnly: boolean
}

export function useStickyHeaderPlayground(): StickyHeaderPlayground {
  return {
    showHome: presetFlagKnob('stickyHome', () => presetKnobs().sticky.showHome),
    languagesCountOnly: presetFlagKnob(
      'stickyLangCountOnly',
      () => presetKnobs().sticky.languagesCountOnly,
    ),
  }
}
