/**
 * The Home module registry — the single source of truth for what the Home shows
 * and how each module lays out and loads. Components read a spec; they never
 * branch on a module id. To change a module's layout, change its spec (or add a
 * `variant`), not a component.
 */

import type { Component } from 'vue'
import type { MenuButtonItemData } from '@wikimedia/codex'
import {
  cdxIconBookmark,
  cdxIconChart,
  cdxIconConfigure,
  cdxIconLevelOne,
  cdxIconLightbulb,
  cdxIconLink,
  cdxIconSpeechBubbles,
  cdxIconStar,
  cdxIconUserAvatar,
  type Icon,
} from '@wikimedia/codex-icons'

import { loadActiveDiscussions } from './data/loadActiveDiscussions'
import { loadDailyReads } from './data/loadDailyReads'
import { loadDidYouKnow } from './data/loadDidYouKnow'
import { loadFeaturedArticle } from './data/loadFeaturedArticle'
import { loadReviewChanges, RANDOM_CHANGE_COUNT } from './data/loadReviewChanges'
import { loadSaved } from './data/loadSaved'
import {
  BLANK_SUGGESTION_COUNT,
  loadSuggestedEdits,
  RANDOM_SUGGESTION_COUNT,
} from './data/loadSuggestedEdits'
import { loadTrending } from './data/loadTrending'
import type { HomeCardData } from './data/types'
import HomeImpact from './HomeImpact.vue'
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

/**
 * A module heading's "…" menu (`HomeModuleMenu`): its actions, then "About …"
 * as the menu's footer. The picks don't do anything yet.
 */
export interface HomeModuleMenuSpec {
  items: readonly MenuButtonItemData[]
  footer: MenuButtonItemData
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
  /** Its heading's "…" menu. */
  menu?: HomeModuleMenuSpec
  /**
   * A dismissible "Get articles that match your interests" notice above the
   * cards, while the reader has given the Home nothing to go on (`useHomeSeeds().blank`).
   */
  interestsNotice?: boolean
  /** Glyph beside each card's supporting text. */
  supportingIcon?: Icon
  /** Supporting text (and its icon) in progressive blue: it names a task to do. */
  supportingProgressive?: boolean
  /** Fetches the module's cards. Throws on failure; must respect `signal`. */
  load: (signal: AbortSignal) => Promise<HomeCardData[]>
  /** Shown instead of dropping the module when it loads no cards. */
  empty?: { title: string; text: readonly string[] }
  /** Reloads (in place, without skeletons) whenever this value changes. */
  reloadOn?: () => unknown
  /**
   * Shaped by Personalization (it grows from `useHomeSeeds`): it reloads in
   * place when Personalization changes.
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
  /** Its heading's "…" menu. */
  menu?: HomeModuleMenuSpec
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
    slots: 3,
    pageSize: 3,
    supportingIcon: cdxIconChart,
    saveable: true,
    load: loadTrending,
  },
  {
    // Hidden until the reader has a page to grow from — unless they skipped both
    // interests and the survey, when it shows three random Vital articles.
    id: 'daily-reads',
    title: 'Daily reads',
    variant: 'article',
    // Just its three cards: no "Show more" (so no module page) and no save button.
    slots: 3,
    menu: {
      items: [{ value: 'interests', label: 'Interests', icon: cdxIconConfigure }],
      footer: { value: 'about', label: 'About daily reads' },
    },
    supportingIcon: cdxIconLink,
    load: loadDailyReads,
    personalized: true,
    interestsNotice: true,
  },
  {
    id: 'suggested-edits',
    title: 'Suggested edits',
    variant: 'article',
    // Personal suggestions fill the grid; a stranger gets a single random one (home2),
    // or a few when they skipped both interests and the survey.
    slots: () => {
      const { personal, blank } = useHomeSeeds()
      if (personal.value) return 3
      return blank.value ? BLANK_SUGGESTION_COUNT : RANDOM_SUGGESTION_COUNT
    },
    pageSize: 3,
    moreLabel: 'Show more',
    menu: {
      items: [
        { value: 'interests', label: 'Interests', icon: cdxIconConfigure },
        { value: 'edit-types', label: 'Types of edits', icon: cdxIconLevelOne },
      ],
      footer: { value: 'about', label: 'About suggested edits' },
    },
    supportingIcon: cdxIconLightbulb,
    supportingProgressive: true,
    load: loadSuggestedEdits,
    personalized: true,
    interestsNotice: true,
  },
  {
    // The Homepage template's Impact module, under the Home's own heading.
    id: 'impact',
    title: 'Your impact',
    body: HomeImpact,
  },
  {
    id: 'mentor',
    layoutLabel: 'Your mentor',
    title: () =>
      useHomeMentor().isAssigned.value
        ? MENTOR_CONTENT.assigned.title
        : MENTOR_CONTENT.unassigned.title,
    body: HomeMentor,
    menu: {
      items: [{ value: 'opt-out', label: 'Opt out of mentorship' }],
      footer: { value: 'about', label: 'About mentors' },
    },
  },
  {
    // The latest edit to each of the reader's pages; one live edit for a stranger (home2).
    id: 'review-changes',
    title: 'Review changes',
    variant: 'change',
    slots: () => (useHomeSeeds().personal.value ? 3 : RANDOM_CHANGE_COUNT),
    pageSize: 3,
    moreLabel: 'Show more',
    menu: {
      items: [{ value: 'personalization', label: 'Personalization', icon: cdxIconConfigure }],
      footer: { value: 'about', label: 'About review changes' },
    },
    supportingIcon: cdxIconUserAvatar,
    load: loadReviewChanges,
    personalized: true,
  },
  {
    id: 'active-discussions',
    title: 'Active discussions',
    variant: 'text',
    slots: 3,
    pageSize: 3,
    moreLabel: 'Show more',
    supportingIcon: cdxIconSpeechBubbles,
    load: loadActiveDiscussions,
  },
  {
    id: 'did-you-know',
    title: 'Did you know',
    variant: 'hook',
    slots: 3,
    pageSize: 3,
    load: loadDidYouKnow,
  },
  {
    id: 'saved',
    title: 'Saved',
    layoutLabel: 'Saved pages',
    variant: 'article',
    slots: 3,
    pageSize: 3,
    moreLabel: 'Show more',
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
