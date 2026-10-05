/**
 * The Home module registry — the single source of truth for what the Home shows
 * and how each module lays out and loads. Components read a spec; they never
 * branch on a module id. To change a module's layout, change its spec (or add a
 * `variant`), not a component.
 */

import type { Component } from 'vue'
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
import { hasImpact, loadImpact } from './data/loadImpact'
import { loadReviewChanges, RANDOM_CHANGE_COUNT } from './data/loadReviewChanges'
import { loadSaved } from './data/loadSaved'
import { loadSuggestedEdits, RANDOM_SUGGESTION_COUNT } from './data/loadSuggestedEdits'
import { loadTrending } from './data/loadTrending'
import type { HomeCardData } from './data/types'
import HomeMentor from './HomeMentor.vue'
import { MENTOR_CONTENT } from './data/mentorContent'
import { useHomeMentor } from './useHomeMentor'
import { useHomeSaved } from './useHomeSaved'
import { useHomeSeeds } from './useHomeSeeds'

export type HomeModuleId =
  | 'featured'
  | 'trending'
  | 'daily-reads'
  | 'suggested-edits'
  | 'impact'
  | 'review-changes'
  | 'active-discussions'
  | 'did-you-know'
  | 'saved'
  | 'mentor'

/**
 * Card layout for a module (see `HomeCard.vue`):
 * - `hero` — full-width image above the text.
 * - `article` — large thumbnail before the text (an article to read).
 * - `hook` — a sentence with its subject in bold, large thumbnail after it.
 * - `change` — an edit: status chips over the page title, no thumbnail.
 * - `text` — title, description and supporting line only (a discussion).
 * - `stat` — a number with its label and an icon, two to a row on every skin.
 */
export type HomeCardVariant = 'hero' | 'article' | 'hook' | 'change' | 'text' | 'stat'

/** One option in a module's filter strip; cards opt in with `HomeCardData.filterId`. */
export interface HomeModuleFilter {
  id: string
  label: string
}

export interface HomeModuleSpec {
  id: HomeModuleId
  title: string
  /** Its name in the "Home layout" list, when that isn't `title`. */
  layoutLabel?: string
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
  /** Shown instead of dropping the module when it loads no cards. */
  empty?: { title: string; text: readonly string[] }
  /** Reloads (in place, without skeletons) whenever this value changes. */
  reloadOn?: () => unknown
  /**
   * Shaped by Personalization (it grows from `useHomeSeeds`): its heading gets
   * a "Configure" menu, and it reloads in place when Personalization changes.
   */
  personalized?: boolean
}

/**
 * A module whose layout is its own (Mentor: a notice, a profile and actions),
 * not a list of cards. `HomeSectionFrame` gives it the shared heading.
 */
export interface HomeCustomModuleSpec {
  id: HomeModuleId
  /** A function when it depends on the module's state (read as it renders). */
  title: string | (() => string)
  /** Its name in the "Home layout" list, when that isn't `title` (or `title` varies). */
  layoutLabel?: string
  body: Component
}

export type HomeAnyModuleSpec = HomeModuleSpec | HomeCustomModuleSpec

export function isCustomModule(spec: HomeAnyModuleSpec): spec is HomeCustomModuleSpec {
  return 'body' in spec
}

/** Every module. Which ones the Home shows, and in what order, is its layout (`data/homeLayout.ts`). */
export const HOME_MODULES: readonly HomeAnyModuleSpec[] = [
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
    personalized: true,
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
    personalized: true,
  },
  {
    // Views across the row, then a 2 × 2 grid of stats (home2).
    id: 'impact',
    title: 'Your impact',
    variant: 'stat',
    // No skeletons when there's nothing to load: the empty state shows straight away.
    slots: () => (hasImpact() ? 5 : 0),
    load: loadImpact,
    empty: {
      title: '0 edits to articles so far.',
      text: [
        'Help extend free knowledge to the world by editing topics that matter most to you.',
        'Start with a few suggested edits, then see how many people are viewing your contributions here.',
      ],
    },
  },
  {
    id: 'mentor',
    layoutLabel: 'Your mentor',
    title: () =>
      useHomeMentor().isAssigned.value
        ? MENTOR_CONTENT.assigned.title
        : MENTOR_CONTENT.unassigned.title,
    body: HomeMentor,
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
    personalized: true,
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
    layoutLabel: 'Saved pages',
    variant: 'article',
    slots: 4,
    pageSize: 4,
    moreLabel: 'Show more saved',
    supportingIcon: cdxIconBookmark,
    load: loadSaved,
    reloadOn: () => useHomeSaved().savedTitles.value.join('|'),
  },
]

/** The module with this id, if any. */
export function findModule(id: string): HomeAnyModuleSpec | undefined {
  return HOME_MODULES.find((spec) => spec.id === id)
}

/** Modules that page through more cards (`pageSize`) get their own page, `/home/<id>`. */
export function hasModulePage(spec: HomeAnyModuleSpec): spec is HomeModuleSpec {
  return !isCustomModule(spec) && !!spec.pageSize
}

/** A module's current slot count (see `HomeModuleSpec.slots`). */
export function moduleSlots(spec: HomeModuleSpec): number {
  return typeof spec.slots === 'function' ? spec.slots() : spec.slots
}
