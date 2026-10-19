/**
 * Title, short description and thumbnail for many articles in one Action API
 * call (up to 50) — instead of one REST summary request per card, which on a
 * cold Home queued dozens of requests behind the shared rate limit.
 */

import { wikimediaApiFetchHeaders } from '@/config'
import { fetchWikimedia } from '@/lib/fetchWikimedia'

import { normalizeTitle } from '../routes'
import { EN_WIKI_HOST } from './fetchFeaturedFeed'

export interface PageCardInfo {
  /** Canonical title (after normalisation and redirects). */
  title: string
  description?: string
  thumbnailUrl?: string
}

const MAX_TITLES = 50

/** Session cache by requested title; `null` = no such page. */
const infoByTitle = new Map<string, PageCardInfo | null>()

interface ApiResponse {
  query?: {
    normalized?: { from: string; to: string }[]
    redirects?: { from: string; to: string }[]
    pages?: {
      title: string
      missing?: boolean
      description?: string
      thumbnail?: { source?: string }
    }[]
  }
}

async function fetchBatch(titles: string[], signal?: AbortSignal): Promise<void> {
  const params = new URLSearchParams({
    action: 'query',
    titles: titles.join('|'),
    redirects: '1',
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
    headers: wikimediaApiFetchHeaders('home-page-cards'),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const { query } = (await response.json()) as ApiResponse
  const pages = new Map((query?.pages ?? []).map((page) => [page.title, page]))
  const renamed = new Map(
    [...(query?.normalized ?? []), ...(query?.redirects ?? [])].map((entry) => [
      entry.from,
      entry.to,
    ]),
  )

  for (const requested of titles) {
    // Follow normalisation, then any redirect.
    let title = requested
    for (let hops = 0; renamed.has(title) && hops < 3; hops++) title = renamed.get(title)!
    const page = pages.get(title)
    infoByTitle.set(
      normalizeTitle(requested),
      page && !page.missing
        ? { title: page.title, description: page.description, thumbnailUrl: page.thumbnail?.source }
        : null,
    )
  }
}

/** Card info for each title (`null` for missing pages), fetching only what isn't cached yet. */
export async function fetchPageCards(
  titles: string[],
  signal?: AbortSignal,
): Promise<(PageCardInfo | null)[]> {
  const unfetched = [...new Set(titles)].filter((title) => !infoByTitle.has(normalizeTitle(title)))
  for (let i = 0; i < unfetched.length; i += MAX_TITLES) {
    await fetchBatch(unfetched.slice(i, i + MAX_TITLES), signal)
  }
  return titles.map((title) => infoByTitle.get(normalizeTitle(title)) ?? null)
}
