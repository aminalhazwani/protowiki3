/**
 * Maps Microtask Generator `potential_needs` strings (from
 * https://microtask-generator.toolforge.org/about.html) to the suggestion-card
 * presentation used on the home screen. Colours follow the Figma flow: sourcing
 * tasks are amber, structural/linking tasks are green.
 */

export type TaskColor = 'green' | 'amber'

export interface TaskDefinition {
  id: string
  /** Exact `need` string returned by the quality-check API. */
  need: string
  /** Short heading shown on the card. */
  heading: string
  /** One-line call to action under the article title. */
  description: string
  color: TaskColor
}

export const TASK_CATALOG: TaskDefinition[] = [
  {
    id: 'references',
    need: 'Add more references',
    heading: 'Add reference',
    description: 'Help explain where this information is coming from.',
    color: 'amber',
  },
  {
    id: 'wikilinks',
    need: 'Add more internal wikilinks',
    heading: 'Add links',
    description: 'Link key terms so readers can explore related topics.',
    color: 'green',
  },
  {
    id: 'headings',
    need: 'Improve article section headings',
    heading: 'Improve headings',
    description: 'Add or clarify headings so the article is easier to scan.',
    color: 'green',
  },
  {
    id: 'images',
    need: 'Add images or other media',
    heading: 'Add an image',
    description: 'Find a freely licensed image to illustrate this article.',
    color: 'green',
  },
  {
    id: 'infobox',
    need: 'Add an infobox',
    heading: 'Add an infobox',
    description: 'Summarise the key facts about this subject at a glance.',
    color: 'amber',
  },
  {
    id: 'categories',
    need: 'Add more relevant categories',
    heading: 'Add categories',
    description: 'Help this article show up in the right topic areas.',
    color: 'green',
  },
  {
    id: 'expand',
    need: 'Expand the content',
    heading: 'Expand the article',
    description: 'Add well-sourced detail to fill in the gaps.',
    color: 'amber',
  },
  {
    id: 'maintenance',
    need: 'Check maintenance message',
    heading: 'Fix a maintenance issue',
    description: 'Review the maintenance banner and resolve the flagged issue.',
    color: 'amber',
  },
]

const NEED_TO_TASK = new Map(TASK_CATALOG.map((task) => [task.need.toLowerCase(), task]))

/** Stable index from a title so a fallback task is consistent across reloads. */
function hashTitle(title: string): number {
  let hash = 0
  for (let index = 0; index < title.length; index += 1) {
    hash = (hash * 31 + title.charCodeAt(index)) >>> 0
  }
  return hash
}

export function pickTaskForTitle(title: string, need?: string | null): TaskDefinition {
  if (need) {
    const matched = NEED_TO_TASK.get(need.trim().toLowerCase())
    if (matched) return matched
  }
  return TASK_CATALOG[hashTitle(title) % TASK_CATALOG.length]
}
