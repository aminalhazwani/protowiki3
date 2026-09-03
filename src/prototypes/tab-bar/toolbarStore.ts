import { reactive } from 'vue'

import type { ArticleFeatureId } from './articleFeatures'
import type { CodexIconName } from './codexIconCatalog'

/** One editable global-toolbar row. Empty when **`icon`** is `null` or **`destination`** is `''`. */
export interface GlobalSlot {
  /** Stable key; travels with the row when reordered. */
  id: string
  icon: CodexIconName | null
  /** Page title in display form (“Main Page”, “Special:Watchlist”). */
  destination: string
}

/** One editable article-toolbar row. Empty when **`feature`** is `null`. */
export interface ArticleSlot {
  id: string
  feature: ArticleFeatureId | null
}

/** Home is implicit and always first; each list holds the four editable rows. */
export interface ToolbarState {
  global: GlobalSlot[]
  article: ArticleSlot[]
}

export function defaultToolbarState(): ToolbarState {
  return {
    global: [
      { id: 'g1', icon: 'cdxIconNewspaper', destination: 'Main Page' },
      { id: 'g2', icon: 'cdxIconBookmarkList', destination: 'Special:ReadingLists' },
      { id: 'g3', icon: 'cdxIconChartLine', destination: 'Special:Impact' },
      { id: 'g4', icon: 'cdxIconWatchlist', destination: 'Special:Watchlist' },
    ],
    article: [
      { id: 'a1', feature: 'languages' },
      { id: 'a2', feature: 'edit' },
      { id: 'a3', feature: 'talk' },
      { id: 'a4', feature: 'more' },
    ],
  }
}

export function cloneToolbarState(state: ToolbarState): ToolbarState {
  return {
    global: state.global.map((slot) => ({ ...slot })),
    article: state.article.map((slot) => ({ ...slot })),
  }
}

/** In-memory only — resets on reload by design. */
export const toolbarStore = reactive<ToolbarState>(defaultToolbarState())

export function applyToolbarState(next: ToolbarState): void {
  const copy = cloneToolbarState(next)
  toolbarStore.global.splice(0, toolbarStore.global.length, ...copy.global)
  toolbarStore.article.splice(0, toolbarStore.article.length, ...copy.article)
}

export function resetToolbarState(): void {
  applyToolbarState(defaultToolbarState())
}
