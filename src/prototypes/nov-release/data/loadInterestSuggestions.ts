/**
 * Articles to suggest on onboarding's interests step (home2): ones like the
 * reader's latest interest, or random ones while they have none.
 */
import { wikimediaApiFetchHeaders } from '@/config'
import { fetchWikimedia } from '@/lib/fetchWikimedia'

import { normalizeTitle } from '../routes'
import { EN_WIKI_HOST } from './fetchFeaturedFeed'
import { fetchMorelike, type MorelikeHit } from './fetchMorelike'

export interface InterestSuggestions {
  /** `related` grows from the latest interest; `random` is for a reader with none. */
  source: 'related' | 'random'
  hits: MorelikeHit[]
}

const SHOWN = 5
/** The morelike pool the blend draws from. */
const POOL = 24
/** Taken from each ordering (best match, most recently edited) in turn. */
const PER_ORDER = 3
/** Random articles must be at least this big (bytes), so they're real articles. */
const RANDOM_MIN_BYTES = 5000

/** Alternate `a` and `b`, skipping repeats and `exclude`, up to `limit`. */
function interleave(a: MorelikeHit[], b: MorelikeHit[], exclude: Set<string>, limit: number) {
  const seen = new Set(exclude)
  const out: MorelikeHit[] = []
  for (let i = 0; i < Math.max(a.length, b.length) && out.length < limit; i++) {
    for (const hit of [a[i], b[i]]) {
      const key = hit && normalizeTitle(hit.title)
      if (!hit || !key || seen.has(key) || out.length >= limit) continue
      seen.add(key)
      out.push(hit)
    }
  }
  return out
}

/** Most recently edited first; articles without a time go last. */
const editedAt = (hit: MorelikeHit) => Date.parse(hit.lastEdited ?? '') || 0
const byLastEdit = (hits: MorelikeHit[]) => [...hits].sort((a, b) => editedAt(b) - editedAt(a))

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
  if (!seed) return { source: 'random', hits: await fetchRandomArticles(SHOWN, signal) }

  const pool = await fetchMorelike(seed, POOL, signal, { lastEdited: true })
  const exclude = new Set(interests.map(normalizeTitle))
  const hits = interleave(
    pool.slice(0, PER_ORDER),
    byLastEdit(pool).slice(0, PER_ORDER),
    exclude,
    SHOWN,
  )
  return { source: 'related', hits }
}

interface RandomPage {
  title: string
  description?: string
  thumbnail?: { source?: string }
}

/** Random real articles (no redirects, `RANDOM_MIN_BYTES`+), ones with images first. */
async function fetchRandomArticles(limit: number, signal: AbortSignal): Promise<MorelikeHit[]> {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'random',
    grnnamespace: '0',
    grnfilterredir: 'nonredirects',
    grnminsize: String(RANDOM_MIN_BYTES),
    grnlimit: String(Math.max(limit * 4, 20)),
    prop: 'pageimages|description',
    piprop: 'thumbnail',
    pithumbsize: '200',
    format: 'json',
    formatversion: '2',
    origin: '*',
  })
  const response = await fetchWikimedia(`https://${EN_WIKI_HOST}/w/api.php?${params}`, {
    signal,
    headers: wikimediaApiFetchHeaders('home-random'),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = (await response.json()) as { query?: { pages?: RandomPage[] } }
  const hits = (data.query?.pages ?? []).map((page) => ({
    title: page.title,
    description: page.description,
    thumbnailUrl: page.thumbnail?.source,
  }))
  return [
    ...hits.filter((hit) => hit.thumbnailUrl),
    ...hits.filter((hit) => !hit.thumbnailUrl),
  ].slice(0, limit)
}
