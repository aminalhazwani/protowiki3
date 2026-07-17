/**
 * Maps the Wikimedia Growth team's newcomer task types to the suggestion-card
 * presentation used on the home screen. Each task carries a detector that reads
 * the same per-page signals Growth's newcomer-task search keys on, surfaced via
 * `prop=cirrusdoc` (see `@/lib/fetchGrowthTaskSignals`): maintenance templates,
 * dated maintenance tracking categories, structured-task `recommendation.*`
 * weighted tags, and section headings.
 *
 * Task type catalogue: https://www.mediawiki.org/wiki/Help:Growth/Tools/Newcomer_Tasks
 *
 * Colours follow the Figma flow: sourcing/content tasks are amber, link/media/
 * text-fix tasks are green.
 */

import type { GrowthTaskSignals } from '@/lib/fetchGrowthTaskSignals'

export type TaskColor = 'green' | 'amber'

export type TaskDifficulty = 'easy' | 'medium' | 'hard'

export interface TaskDefinition {
  /** GrowthExperiments task-type id. */
  id: string
  /** Short heading shown on the card. */
  heading: string
  /** One-line call to action under the article title. */
  description: string
  color: TaskColor
  /** Relative effort, used to group the suggested-edits filter. */
  difficulty: TaskDifficulty
  /** Lower wins when several tasks apply to the same article. */
  priority: number
  /** True when this task type applies to a page with the given signals. */
  matches: (signals: GrowthTaskSignals) => boolean
}

/** Strip the `Template:` prefix and normalise for comparison. */
function normalizeTemplate(name: string): string {
  return name
    .replace(/^template:/i, '')
    .trim()
    .toLowerCase()
}

function templateMatches(signals: GrowthTaskSignals, pattern: RegExp): boolean {
  return signals.templates.some((name) => pattern.test(normalizeTemplate(name)))
}

function categoryMatches(signals: GrowthTaskSignals, pattern: RegExp): boolean {
  return signals.categories.some((name) => pattern.test(name.toLowerCase()))
}

function weightedTagMatches(signals: GrowthTaskSignals, pattern: RegExp): boolean {
  return signals.weightedTags.some((tag) => pattern.test(tag))
}

/**
 * Ordered by priority (first match wins). Detection prefers precise dated
 * maintenance categories and specific maintenance templates; never infer a need
 * from incidental templates (e.g. citation modules are not a "needs references"
 * signal).
 */
export const TASK_CATALOG: TaskDefinition[] = [
  {
    id: 'references',
    heading: 'Find references',
    description: 'Add sources to verify Wikipedia articles',
    color: 'amber',
    difficulty: 'medium',
    priority: 1,
    matches: (signals) =>
      categoryMatches(
        signals,
        /unsourced statements|needing additional references|articles lacking sources|all articles with unsourced/,
      ) ||
      templateMatches(
        signals,
        /^(unreferenced|more citations needed|refimprove|citation needed|unreferenced section|more citations needed section|one source)$/,
      ),
  },
  {
    id: 'copyedit',
    heading: 'Copyedit',
    description: 'Fix spelling, grammar, and tone.',
    color: 'green',
    difficulty: 'easy',
    priority: 2,
    matches: (signals) =>
      categoryMatches(signals, /needing copy edit|copy edit from/) ||
      templateMatches(signals, /^(copy edit|copyedit|cleanup|cleanup rewrite|tone)$/),
  },
  {
    id: 'update',
    heading: 'Update articles',
    description: 'Bring existing articles up-to-date',
    color: 'amber',
    difficulty: 'medium',
    priority: 3,
    matches: (signals) =>
      categoryMatches(signals, /in need of updating|potentially dated/) ||
      templateMatches(signals, /^(update|outdated|update section)$/),
  },
  {
    id: 'revise-tone',
    heading: 'Revise tone',
    description: 'Make articles more factual by removing promotional words',
    color: 'green',
    difficulty: 'easy',
    priority: 4,
    matches: (signals) =>
      categoryMatches(
        signals,
        /promotional tone|articles with peacock|articles needing style editing/,
      ) ||
      templateMatches(
        signals,
        /^(peacock|peacock term|advert|advertisement|promotional|fanpov|puffery)$/,
      ),
  },
  {
    id: 'expand',
    heading: 'Expand short articles',
    description: 'Make articles longer by finding and adding more information',
    color: 'amber',
    difficulty: 'hard',
    priority: 5,
    matches: (signals) =>
      categoryMatches(signals, /all stub articles|to be expanded|articles to be expanded/) ||
      templateMatches(signals, /-stub$|^stub$|^expand|^missing information$/),
  },
  {
    id: 'image-recommendation',
    heading: 'Add an image',
    description: 'Add an image to an unillustrated article.',
    color: 'green',
    difficulty: 'easy',
    priority: 6,
    matches: (signals) => weightedTagMatches(signals, /^recommendation\.image\/exists/),
  },
  {
    id: 'link-recommendation',
    heading: 'Add links between articles',
    description: 'Make words from one article link to another article.',
    color: 'green',
    difficulty: 'easy',
    priority: 7,
    matches: (signals) => weightedTagMatches(signals, /^recommendation\.link\/exists/),
  },
  {
    id: 'links',
    heading: 'Add links between articles',
    description: 'Make words from one article link to another article.',
    color: 'green',
    difficulty: 'easy',
    priority: 8,
    matches: (signals) =>
      categoryMatches(signals, /underlinked|dead-end pages/) ||
      templateMatches(signals, /^(underlinked|dead end)$/),
  },
  {
    id: 'section-image-recommendation',
    heading: 'Add an image to an article section',
    description: 'Add an image to a section of this article.',
    color: 'green',
    difficulty: 'easy',
    priority: 9,
    matches: (signals) =>
      weightedTagMatches(signals, /^recommendation\.(image_section|section_image|imagesection)/) &&
      signals.headings.length > 0,
  },
]

/**
 * Pick the highest-priority task type whose detector matches the page's
 * CirrusSearch signals, or null when none apply.
 */
export function resolveTaskForSignals(signals?: GrowthTaskSignals): TaskDefinition | null {
  if (!signals) return null
  return TASK_CATALOG.find((task) => task.matches(signals)) ?? null
}

export interface SuggestionFilterOption {
  /** Visible heading; also the stable key used to enable/disable the filter. */
  heading: string
  description: string
  difficulty: TaskDifficulty
}

/** Sort/group order for task difficulty: easy first, hard last. */
export const DIFFICULTY_RANK: Record<TaskDifficulty, number> = { easy: 0, medium: 1, hard: 2 }

/**
 * One entry per unique task heading, for the suggested-edits filter sheet.
 * When several catalog entries share a heading (e.g. the two link task types),
 * keep the easiest difficulty. Ordered easy → medium → hard, then by priority.
 */
export const SUGGESTION_FILTER_OPTIONS: SuggestionFilterOption[] = (() => {
  const byHeading = new Map<string, SuggestionFilterOption>()
  for (const task of TASK_CATALOG) {
    const existing = byHeading.get(task.heading)
    if (!existing) {
      byHeading.set(task.heading, {
        heading: task.heading,
        description: task.description,
        difficulty: task.difficulty,
      })
    } else if (DIFFICULTY_RANK[task.difficulty] < DIFFICULTY_RANK[existing.difficulty]) {
      existing.difficulty = task.difficulty
    }
  }
  return [...byHeading.values()].sort(
    (a, b) => DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty],
  )
})()
