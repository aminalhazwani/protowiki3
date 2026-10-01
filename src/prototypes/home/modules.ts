/**
 * The Home module registry — the single source of truth for what the Home shows
 * and how each module lays out and loads. Components read a spec; they never
 * branch on a module id. To change a module's layout, change its spec (or add a
 * `variant`), not a component.
 */

import {
  cdxIconBookmark,
  cdxIconChart,
  cdxIconLightbulb,
  cdxIconLink,
  cdxIconSpeechBubbles,
  cdxIconStar,
  cdxIconUserAvatar,
  type Icon,
} from '@wikimedia/codex-icons'

import { DISCUSSION_FILTERS, loadActiveDiscussions } from './data/loadActiveDiscussions'
import { loadDailyReads } from './data/loadDailyReads'
import { loadDidYouKnow } from './data/loadDidYouKnow'
import { loadFeaturedArticle } from './data/loadFeaturedArticle'
import { loadReviewChanges, RANDOM_CHANGE_COUNT } from './data/loadReviewChanges'
import { loadSaved } from './data/loadSaved'
import { loadSuggestedEdits, RANDOM_SUGGESTION_COUNT } from './data/loadSuggestedEdits'
import { loadTrending } from './data/loadTrending'
import type { HomeCardData } from './data/types'
import { useHomeSaved } from './useHomeSaved'
import { useHomeSeeds } from './useHomeSeeds'

export type HomeModuleId =
  | 'featured'
  | 'trending'
  | 'daily-reads'
  | 'suggested-edits'
  | 'review-changes'
  | 'active-discussions'
  | 'did-you-know'
  | 'saved'

/**
 * Card layout for a module (see `HomeCard.vue`):
 * - `hero` — full-width image above the text.
 * - `article` — large thumbnail before the text (an article to read).
 * - `hook` — a sentence with its subject in bold, large thumbnail after it.
 * - `change` — an edit: status chips over the page title, no thumbnail.
 * - `text` — title, description and supporting line only (a discussion).
 */
export type HomeCardVariant = 'hero' | 'article' | 'hook' | 'change' | 'text'

/** One option in a module's filter strip; cards opt in with `HomeCardData.filterId`. */
export interface HomeModuleFilter {
  id: string
  label: string
}

export interface HomeModuleSpec {
  id: HomeModuleId
  title: string
  variant: HomeCardVariant
  /**
   * Cards shown on the Home — also the number of skeletons held while loading.
   * A function when it depends on the reader (read as each load starts).
   */
  slots: number | (() => number)
  /** Cards each desktop "Show more" reveals in place; omit for no "Show more". */
  pageSize?: number
  /** "Show more" label, when it should name the module. */
  moreLabel?: string
  /** Cards get a save (bookmark) button. */
  saveable?: boolean
  /**
   * Filters shown above the cards, after "All", in this order. Only those some
   * card belongs to appear, and the strip only when at least two do.
   */
  filters?: readonly HomeModuleFilter[]
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
    id: 'suggested-edits',
    title: 'Suggested edits',
    variant: 'article',
    // Personal suggestions fill the grid; a stranger gets a single random one (home2).
    slots: () => (useHomeSeeds().seeds.value.length ? 4 : RANDOM_SUGGESTION_COUNT),
    pageSize: 4,
    moreLabel: 'Show more suggestions',
    supportingIcon: cdxIconLightbulb,
    load: loadSuggestedEdits,
  },
  {
    // The latest edit to each of the reader's pages; one live edit for a stranger (home2).
    id: 'review-changes',
    title: 'Review changes',
    variant: 'change',
    slots: () => (useHomeSeeds().seeds.value.length ? 4 : RANDOM_CHANGE_COUNT),
    pageSize: 4,
    moreLabel: 'Review more changes',
    supportingIcon: cdxIconUserAvatar,
    load: loadReviewChanges,
  },
  {
    id: 'active-discussions',
    title: 'Active discussions',
    variant: 'text',
    slots: 4,
    pageSize: 4,
    moreLabel: 'Show more active discussions',
    filters: DISCUSSION_FILTERS,
    supportingIcon: cdxIconSpeechBubbles,
    load: loadActiveDiscussions,
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

/** A module's current slot count (see `HomeModuleSpec.slots`). */
export function moduleSlots(spec: HomeModuleSpec): number {
  return typeof spec.slots === 'function' ? spec.slots() : spec.slots
}
