/** CirrusSearch `morelike:` — articles similar to a seed, with descriptions and thumbnails, in one call. */

import { wikimediaApiFetchHeaders } from '@/config'
import { fetchWikimedia } from '@/lib/fetchWikimedia'

import { normalizeTitle } from '../routes'
import { EN_WIKI_HOST } from './fetchFeaturedFeed'

export interface MorelikeHit {
  title: string
  description?: string
  thumbnailUrl?: string
}

interface GeneratorPage {
  title: string
  index?: number
  description?: string
  thumbnail?: { source?: string }
}

/** Up to `limit` articles like `seed` (never the seed itself), best match first. */
export async function fetchMorelike(
  seed: string,
  limit: number,
  signal?: AbortSignal,
): Promise<MorelikeHit[]> {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `morelike:${seed}`,
    gsrnamespace: '0',
    gsrlimit: String(limit + 1),
    prop: 'pageimages|description',
    piprop: 'thumbnail',
    // Large Codex card thumbnails are 96px — 2× for sharp screens.
    pithumbsize: '200',
    format: 'json',
    formatversion: '2',
    origin: '*',
  })
  const response = await fetchWikimedia(`https://${EN_WIKI_HOST}/w/api.php?${params}`, {
    signal,
    headers: wikimediaApiFetchHeaders('home-morelike'),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const data = (await response.json()) as { query?: { pages?: GeneratorPage[] } }
  const seedKey = normalizeTitle(seed)
  return [...(data.query?.pages ?? [])]
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .filter((page) => normalizeTitle(page.title) !== seedKey)
    .slice(0, limit)
    .map((page) => ({
      title: page.title,
      description: page.description,
      thumbnailUrl: page.thumbnail?.source,
    }))
}
