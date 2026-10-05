import { mapWithConcurrency } from '@/lib/mapWithConcurrency'

import { homeArticleLocation, normalizeTitle } from '../routes'
import { useHomeSeeds } from '../useHomeSeeds'
import { LINK_RECOMMENDATION_LABEL, taskTypeForTemplates } from './editTaskTypes'
import {
  fetchLinkRecommendations,
  fetchRandomTaskPages,
  fetchTaskPages,
  fetchTemplateTasksAbout,
  type TaskPage,
} from './fetchEditTasks'
import { readDayCache, utcDayKey, writeDayCache } from './homeCache'
import type { HomeCardData } from './types'

const CACHE_SLOT = 'suggested-edits'
/** Three pages of four when personalised; a single card for a stranger (home2). */
export const PERSONAL_SUGGESTION_COUNT = 12
export const RANDOM_SUGGESTION_COUNT = 1
const RELATED_SEED_COUNT = 5
const RELATED_PER_SEED = 4
const LINK_RECOMMENDATION_SEEDS = 3
const LINK_RECOMMENDATIONS_PER_SEED = 3
const RANDOM_POOL = 10
const CONCURRENCY = 2

interface Task {
  page: TaskPage
  label: string
}

/** First task label for a page, from its maintenance templates. */
function templateTask(page: TaskPage): Task | null {
  const type = taskTypeForTemplates(page.templates)
  return type ? { page, label: type.label } : null
}

/** Round-robin, so the first candidates mix seeds instead of emptying one. */
function interleave<T>(lists: T[][]): T[] {
  const out: T[] = []
  for (let i = 0; lists.some((list) => i < list.length); i++) {
    for (const list of lists) if (i < list.length) out.push(list[i])
  }
  return out
}

/**
 * Growth's newcomer-task signals, around the reader's pages: their own pages'
 * maintenance templates (one call), articles about them carrying a task template
 * (one search per seed), and articles linking to them with an "Add a link"
 * recommendation. Mixed round-robin, own pages first.
 */
async function personalTasks(seeds: string[], signal: AbortSignal): Promise<Task[]> {
  const [own, related, linkRecommendations] = await Promise.all([
    fetchTaskPages(seeds, signal),
    mapWithConcurrency(
      seeds.slice(0, RELATED_SEED_COUNT),
      CONCURRENCY,
      (seed) => fetchTemplateTasksAbout(seed, RELATED_PER_SEED, signal).catch((): TaskPage[] => []),
      signal,
    ),
    mapWithConcurrency(
      seeds.slice(0, LINK_RECOMMENDATION_SEEDS),
      CONCURRENCY,
      (seed) =>
        fetchLinkRecommendations(seed, LINK_RECOMMENDATIONS_PER_SEED, signal).catch(
          (): TaskPage[] => [],
        ),
      signal,
    ),
  ])

  const ownTasks = own.map(templateTask).filter((task): task is Task => task !== null)
  const relatedTasks = related.map((pages) =>
    pages.map(templateTask).filter((task): task is Task => task !== null),
  )
  const linkTasks = linkRecommendations.map((pages) =>
    pages.map((page) => ({ page, label: LINK_RECOMMENDATION_LABEL })),
  )
  // Own pages first — they're what the reader already cares about — then a mix.
  return [...ownTasks, ...interleave([...relatedTasks, ...linkTasks])]
}

/** Articles with something to improve, each labelled with its task ("Find a reference"…). */
export async function loadSuggestedEdits(signal: AbortSignal): Promise<HomeCardData[]> {
  const { seeds } = useHomeSeeds()
  const personal = seeds.value.length > 0
  const limit = personal ? PERSONAL_SUGGESTION_COUNT : RANDOM_SUGGESTION_COUNT

  // Random suggestions stay for the day too, so the one card doesn't change each visit.
  const cacheKey = `${utcDayKey()}|${personal ? seeds.value.map(normalizeTitle).sort().join('|') : 'random'}`
  const cached = readDayCache<HomeCardData[]>(CACHE_SLOT, cacheKey)
  if (cached) return cached

  const tasks = personal
    ? await personalTasks(seeds.value, signal)
    : (await fetchRandomTaskPages(RANDOM_POOL, signal))
        .map(templateTask)
        .filter((task): task is Task => task !== null)

  const seen = new Set<string>()
  const cards: HomeCardData[] = []
  for (const { page, label } of tasks) {
    const key = normalizeTitle(page.title)
    if (seen.has(key) || cards.length >= limit) continue
    seen.add(key)
    cards.push({
      key: `edit:${page.title}`,
      title: page.title,
      pageTitle: page.title,
      description: page.description,
      thumbnailUrl: page.thumbnailUrl,
      to: homeArticleLocation(page.title),
      supportingText: label,
    })
  }

  writeDayCache(CACHE_SLOT, cacheKey, cards)
  return cards
}
