/**
 * The Home module registry — the single source of truth for what the Home shows
 * and how each module lays out and loads. Components read a spec; they never
 * branch on a module id. To change a module's layout, change its spec (or add a
 * `variant`), not a component.
 */

import { cdxIconStar, type Icon } from '@wikimedia/codex-icons'

import { loadFeaturedArticle } from './data/loadFeaturedArticle'
import type { HomeCardData } from './data/types'

export type HomeModuleId = 'featured'

/**
 * Card layout for a module (see `HomeCard.vue`):
 * - `hero` — full-width image above the text (Codex `thumbnail-position="block-start"`).
 */
export type HomeCardVariant = 'hero'

export interface HomeModuleSpec {
  id: HomeModuleId
  title: string
  variant: HomeCardVariant
  /** Cards shown on the Home — also the number of skeletons held while loading. */
  slots: number
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
]
