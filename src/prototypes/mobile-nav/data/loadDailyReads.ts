import { getVitalTitles } from '@/components/article/shared/vitalArticles'
import { mapWithConcurrency } from '@/lib/mapWithConcurrency'

import { homeArticleLocation, normalizeTitle } from '../routes'
import { useHomeSeeds } from '../useHomeSeeds'
import { fetchMorelike, type MorelikeHit } from './fetchMorelike'
import { fetchPageCards } from './fetchPageCards'
import { readDayCache, utcDayKey, writeDayCache } from './homeCache'
import type { HomeCardData } from './types'

const CACHE_SLOT = 'daily-reads'
/** Seeds used per load — enough variety without fanning out into many calls. */
const SEED_COUNT = 5
/** Three pages of four, so "Show more" has something to reveal. */
const CARD_COUNT = 12
const MORELIKE_CONCURRENCY = 2
/** Random Vital articles for a reader with no seeds and no survey answer. */
export const BLANK_READS_COUNT = 3

function pickRandom<T>(items: readonly T[], count: number): T[] {
  const pool = [...items]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}

/**
 * Wikipedia's Vital articles, picked at random, with their descriptions and
 * thumbnails in one call. No supporting text: they relate to none of the
 * reader's pages.
 */
async function loadRandomReads(signal: AbortSignal): Promise<HomeCardData[]> {
  const titles = pickRandom(await getVitalTitles('en'), BLANK_READS_COUNT)
  const pages = await fetchPageCards(titles, signal)
  return pages
    .filter((page) => page !== null)
    .map((page) => ({
      key: `daily:${page.title}`,
      title: page.title,
      pageTitle: page.title,
      description: page.description,
      thumbnailUrl: page.thumbnailUrl,
      to: homeArticleLocation(page.title),
    }))
}

/**
 * Articles like the reader's own pages ("Related to …"). Up to five random seeds,
 * one `morelike` call each, interleaved round-robin so the first row mixes seeds;
 * duplicates and the seeds themselves are dropped. A reader with no seeds and no
 * survey answer gets random reads instead. Cached per day and seed set, so the
 * Home doesn't reshuffle on every visit.
 */
export async function loadDailyReads(signal: AbortSignal): Promise<HomeCardData[]> {
  const { seeds, blank } = useHomeSeeds()
  const allSeeds = seeds.value
  if (!allSeeds.length) {
    if (!blank.value) return []
    // Random reads stay for the day too, so the cards don't change each visit.
    const cacheKey = `${utcDayKey()}|random`
    const cached = readDayCache<HomeCardData[]>(CACHE_SLOT, cacheKey)
    if (cached) return cached
    const cards = await loadRandomReads(signal)
    writeDayCache(CACHE_SLOT, cacheKey, cards)
    return cards
  }

  const cacheKey = `${utcDayKey()}|${allSeeds.map(normalizeTitle).sort().join('|')}`
  const cached = readDayCache<HomeCardData[]>(CACHE_SLOT, cacheKey)
  if (cached) return cached

  const picked = pickRandom(allSeeds, SEED_COUNT)
  // One spare hit per seed leaves headroom for cross-seed duplicates.
  const perSeed = Math.ceil(CARD_COUNT / picked.length) + 1
  const batches = await mapWithConcurrency(
    picked,
    MORELIKE_CONCURRENCY,
    (seed) => fetchMorelike(seed, perSeed, signal).catch((): MorelikeHit[] => []),
    signal,
  )

  const seen = new Set(allSeeds.map(normalizeTitle))
  const cards: HomeCardData[] = []
  for (let round = 0; cards.length < CARD_COUNT && round < perSeed; round++) {
    batches.forEach((hits, index) => {
      const hit = hits[round]
      if (!hit || cards.length >= CARD_COUNT || seen.has(normalizeTitle(hit.title))) return
      seen.add(normalizeTitle(hit.title))
      cards.push({
        key: `daily:${hit.title}`,
        title: hit.title,
        pageTitle: hit.title,
        description: hit.description,
        thumbnailUrl: hit.thumbnailUrl,
        to: homeArticleLocation(hit.title),
        supportingText: `Related to ${picked[index]}`,
      })
    })
  }

  writeDayCache(CACHE_SLOT, cacheKey, cards)
  return cards
}
