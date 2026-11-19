/**
 * Articles to suggest on account setup's interests step (home2): ones like the
 * reader's latest interest, or random ones while they have none.
 */
import { wikimediaApiFetchHeaders } from '@/config'

import { titleKey } from './useHomeSeeds'

export interface InterestSuggestion {
  title: string
  description?: string
  thumbnailUrl?: string
  /** When the article was last edited (ISO). */
  lastEdited?: string
}

export interface InterestSuggestions {
  /** `related` grows from the latest interest; `random` is for a reader with none. */
  source: 'related' | 'random'
  hits: InterestSuggestion[]
}

const HOST = 'en.wikipedia.org'
const SHOWN = 5
/** The morelike pool the blend draws from. */
const POOL = 24
/** Taken from each ordering (best match, most recently edited) in turn. */
const PER_ORDER = 3
/** Random articles must be at least this big (bytes), so they're real articles. */
const RANDOM_MIN_BYTES = 5000

interface ApiPage {
  title: string
  index?: number
  description?: string
  thumbnail?: { source?: string }
  revisions?: { timestamp?: string }[]
}

async function queryPages(
  params: Record<string, string>,
  purpose: string,
  signal: AbortSignal,
): Promise<ApiPage[]> {
  const search = new URLSearchParams({
    action: 'query',
    prop: 'pageimages|description',
    piprop: 'thumbnail',
    // Large Codex card thumbnails are 96px — 2× for sharp screens.
    pithumbsize: '200',
    format: 'json',
    formatversion: '2',
    origin: '*',
    ...params,
  })
  const response = await fetch(`https://${HOST}/w/api.php?${search}`, {
    signal,
    headers: wikimediaApiFetchHeaders(purpose),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = (await response.json()) as { query?: { pages?: ApiPage[] } }
  return data.query?.pages ?? []
}

const toHit = (page: ApiPage): InterestSuggestion => ({
  title: page.title,
  description: page.description,
  thumbnailUrl: page.thumbnail?.source,
  lastEdited: page.revisions?.[0]?.timestamp,
})

/** CirrusSearch `morelike:` — articles like `seed` (never the seed itself), best match first. */
async function fetchMorelike(seed: string, signal: AbortSignal): Promise<InterestSuggestion[]> {
  const pages = await queryPages(
    {
      generator: 'search',
      gsrsearch: `morelike:${seed}`,
      gsrnamespace: '0',
      gsrlimit: String(POOL + 1),
      prop: 'pageimages|description|revisions',
      rvprop: 'timestamp',
    },
    'finding-suggestions-morelike',
    signal,
  )
  const seedKey = titleKey(seed)
  return [...pages]
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .filter((page) => titleKey(page.title) !== seedKey)
    .slice(0, POOL)
    .map(toHit)
}

/** Random real articles (no redirects, `RANDOM_MIN_BYTES`+), ones with images first. */
async function fetchRandomArticles(signal: AbortSignal): Promise<InterestSuggestion[]> {
  const pages = await queryPages(
    {
      generator: 'random',
      grnnamespace: '0',
      grnfilterredir: 'nonredirects',
      grnminsize: String(RANDOM_MIN_BYTES),
      grnlimit: '20',
    },
    'finding-suggestions-random',
    signal,
  )
  const hits = pages.map(toHit)
  return [
    ...hits.filter((hit) => hit.thumbnailUrl),
    ...hits.filter((hit) => !hit.thumbnailUrl),
  ].slice(0, SHOWN)
}

/** Alternate `a` and `b`, skipping repeats and `exclude`, up to `limit`. */
function interleave(
  a: InterestSuggestion[],
  b: InterestSuggestion[],
  exclude: Set<string>,
  limit: number,
) {
  const seen = new Set(exclude)
  const out: InterestSuggestion[] = []
  for (let i = 0; i < Math.max(a.length, b.length) && out.length < limit; i++) {
    for (const hit of [a[i], b[i]]) {
      const key = hit && titleKey(hit.title)
      if (!hit || !key || seen.has(key) || out.length >= limit) continue
      seen.add(key)
      out.push(hit)
    }
  }
  return out
}

/** Most recently edited first; articles without a time go last. */
const editedAt = (hit: InterestSuggestion) => Date.parse(hit.lastEdited ?? '') || 0
const byLastEdit = (hits: InterestSuggestion[]) =>
  [...hits].sort((a, b) => editedAt(b) - editedAt(a))

/**
 * `related`: the latest interest's morelike pool, blending its best matches
 * with its most recently edited (home2), so the list mixes the obvious with
 * the active. Interests themselves never appear.
 */
export async function loadInterestSuggestions(
  interests: readonly string[],
  signal: AbortSignal,
): Promise<InterestSuggestions> {
  const seed = interests.at(-1)
  if (!seed) return { source: 'random', hits: await fetchRandomArticles(signal) }

  const pool = await fetchMorelike(seed, signal)
  const exclude = new Set(interests.map(titleKey))
  const hits = interleave(
    pool.slice(0, PER_ORDER),
    byLastEdit(pool).slice(0, PER_ORDER),
    exclude,
    SHOWN,
  )
  return { source: 'related', hits }
}
