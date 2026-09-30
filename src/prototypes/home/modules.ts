/**
 * The Home module registry — the single source of truth for what the Home shows
 * and how each module lays out and loads. Components read a spec; they never
 * branch on a module id. To change a module's layout, change its spec (or add a
 * `variant`), not a component.
 */

import { cdxIconChart, cdxIconStar, type Icon } from '@wikimedia/codex-icons'

import { loadDidYouKnow } from './data/loadDidYouKnow'
import { loadFeaturedArticle } from './data/loadFeaturedArticle'
import { loadTrending } from './data/loadTrending'
import type { HomeCardData } from './data/types'

export type HomeModuleId = 'featured' | 'trending' | 'did-you-know'

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
  /** Glyph beside each card's supporting text. */
  supportingIcon?: Icon
  /** Fetches the module's cards. Throws on failure; must respect `signal`. */
  load: (signal: AbortSignal) => Promise<HomeCardData[]>
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
    load: loadTrending,
  },
  {
    id: 'did-you-know',
    title: 'Did you know',
    variant: 'hook',
    slots: 4,
    pageSize: 4,
    load: loadDidYouKnow,
  },
]
