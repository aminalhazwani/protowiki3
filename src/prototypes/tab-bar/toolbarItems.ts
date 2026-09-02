import {
  cdxIconBookmarkList,
  cdxIconChartLine,
  cdxIconEdit,
  cdxIconHome,
  cdxIconLanguage,
  cdxIconNewspaper,
  cdxIconSpeechBubbles,
  cdxIconVerticalEllipsis,
  cdxIconWatchlist,
} from '@wikimedia/codex-icons'
import type { Icon } from '@wikimedia/codex-icons'
import type { RouteLocationRaw } from 'vue-router'

/**
 * One button in the mobile toolbar.
 *
 * Shaped so a future “Customize Toolbars” dialog can reorder / remove items by
 * **`id`** and swap **`icon`** / **`to`** without touching the component.
 */
export interface ToolbarItem {
  /** Stable key (also used to derive the Home dot). */
  id: string
  icon: Icon
  /** Accessible name; fold counts in (“Edit, 5 suggestions”). */
  label: string
  /** Only Home navigates in this iteration. */
  to?: RouteLocationRaw
  /** Inline count rendered next to the icon (“38”). */
  text?: string
  /** Numbered progressive badge on the icon (“5”). */
  badge?: string
  /** Current destination — progressive icon + 2px top indicator. */
  selected?: boolean
  /** Always first and not removable (Home). */
  fixed?: boolean
}

export const HOME_PATH = '/tab-bar/home'

export const HOME_ITEM: ToolbarItem = {
  id: 'home',
  icon: cdxIconHome,
  label: 'Home',
  to: HOME_PATH,
  fixed: true,
}

/** Global toolbar — shown on the homepage. */
export const GLOBAL_TOOLBAR: ToolbarItem[] = [
  { ...HOME_ITEM, selected: true },
  { id: 'main-page', icon: cdxIconNewspaper, label: 'Main page' },
  { id: 'reading-lists', icon: cdxIconBookmarkList, label: 'Reading lists' },
  { id: 'impact', icon: cdxIconChartLine, label: 'Your impact' },
  { id: 'watchlist', icon: cdxIconWatchlist, label: 'Watchlist' },
]

/** Article toolbar — shown on article pages. */
export const ARTICLE_TOOLBAR: ToolbarItem[] = [
  HOME_ITEM,
  { id: 'languages', icon: cdxIconLanguage, label: 'Languages, 38', text: '38' },
  { id: 'edit', icon: cdxIconEdit, label: 'Edit, 5 suggestions', badge: '5' },
  { id: 'talk', icon: cdxIconSpeechBubbles, label: 'Talk, 12 topics', text: '12' },
  { id: 'more', icon: cdxIconVerticalEllipsis, label: 'More' },
]
