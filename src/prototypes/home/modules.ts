/**
 * The Home module registry — the single source of truth for what the Home shows
 * and how each module lays out and loads. Components read a spec; they never
 * branch on a module id. To change a module's layout, change its spec (or add a
 * `variant`), not a component.
 */

import {
  cdxIconBookmark,
  cdxIconChart,
  cdxIconLink,
  cdxIconStar,
  type Icon,
} from '@wikimedia/codex-icons'

import { loadDailyReads } from './data/loadDailyReads'
import { loadDidYouKnow } from './data/loadDidYouKnow'
import { loadFeaturedArticle } from './data/loadFeaturedArticle'
import { loadSaved } from './data/loadSaved'
import { loadTrending } from './data/loadTrending'
import type { HomeCardData } from './data/types'
import { useHomeSaved } from './useHomeSaved'

export type HomeModuleId = 'featured' | 'trending' | 'daily-reads' | 'did-you-know' | 'saved'

/**
 * Card layout for a module (see `HomeCard.vue`):
 * - `hero` — full-width image above the text.
 * - `article` — large thumbnail before the text (an article to read).
 * - `hook` — a sentence with its subject in bold, large thumbnail after it.
 */
export type HomeCardVariant = 'hero' | 'article' | 'hook'

export interface HomeModuleSpec {
  id: HomeModuleId
  title: string
  variant: HomeCardVariant
  /** Cards shown on the Home — also the number of skeletons held while loading. */
  slots: number
  /** Cards each desktop "Show more" reveals in place; omit for no "Show more". */
  pageSize?: number
  /** "Show more" label, when it should name the module. */
  moreLabel?: string
  /** Cards get a save (bookmark) button. */
  saveable?: boolean
  /** Glyph beside each card's supporting text. */
  supportingIcon?: Icon
  /** Fetches the module's cards. Throws on failure; must respect `signal`. */
  load: (signal: AbortSignal) => Promise<HomeCardData[]>
  /** Reloads (in place, without skeletons) whenever this value changes. */
  reloadOn?: () => unknown
}

/** In Home order. */
export const HOME_MODULES: readonly HomeModuleSpec[] = [
  {
    id: 'featured',
    title: 'Featured',
    variant: 'hero',
    slots: 1,
    supportingIcon: cdxIconStar,
    load: loadFeaturedArticle,
  },
  {
    id: 'trending',
    title: 'Trending',
    variant: 'article',
    slots: 4,
    pageSize: 4,
    supportingIcon: cdxIconChart,
    saveable: true,
    load: loadTrending,
  },
  {
    // Hidden until the reader has saved, edited or watched a page to grow from.
    id: 'daily-reads',
    title: 'Daily reads',
    variant: 'article',
    slots: 4,
    pageSize: 4,
    supportingIcon: cdxIconLink,
    saveable: true,
    load: loadDailyReads,
  },
  {
    id: 'did-you-know',
    title: 'Did you know',
    variant: 'hook',
    slots: 4,
    pageSize: 4,
    load: loadDidYouKnow,
  },
  {
    id: 'saved',
    title: 'Saved',
    variant: 'article',
    slots: 4,
    pageSize: 4,
    moreLabel: 'Show more saved',
    supportingIcon: cdxIconBookmark,
    load: loadSaved,
    reloadOn: () => useHomeSaved().savedTitles.value.join('|'),
  },
]
