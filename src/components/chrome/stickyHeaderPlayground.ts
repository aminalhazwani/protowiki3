import { ref, watch, type Ref } from 'vue'

import { readFlagParam, syncPlaygroundFlag } from './playgroundParams'

/**
 * Knobs for the desktop sticky header, offered alongside the Home button
 * controls in the main-menu playground. Both round-trip through the URL
 * (`?stickyHome=`, `?stickyLangCountOnly=`) so a configured bar can be shared as
 * a link.
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

/** What the bar looks like with a bare URL: stock Vector, no Home. */
const SHOW_HOME_DEFAULT = false
const LANGUAGES_COUNT_ONLY_DEFAULT = false

export function useStickyHeaderPlayground(): StickyHeaderPlayground {
  const showHome = ref(readFlagParam('stickyHome', SHOW_HOME_DEFAULT))
  const languagesCountOnly = ref(readFlagParam('stickyLangCountOnly', LANGUAGES_COUNT_ONLY_DEFAULT))

  watch(showHome, (value) => syncPlaygroundFlag('stickyHome', value, SHOW_HOME_DEFAULT))
  watch(languagesCountOnly, (value) =>
    syncPlaygroundFlag('stickyLangCountOnly', value, LANGUAGES_COUNT_ONLY_DEFAULT),
  )

  return { showHome, languagesCountOnly }
}
