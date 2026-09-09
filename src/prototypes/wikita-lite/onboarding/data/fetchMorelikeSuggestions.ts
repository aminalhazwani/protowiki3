import { normalizeLang, wikiHostFromLang, wikimediaApiFetchHeaders } from '@/config'

import { normalizeTitleKey } from './titleKey'
import type { InterestSuggestionHit } from './useInterestSuggestions'

interface GeneratorPage {
  title: string
  index?: number
  description?: string
  thumbnail?: { source: string; width: number; height: number }
  revisions?: { timestamp?: string }[]
}

interface GeneratorResponse {
  query?: { pages?: GeneratorPage[] }
}

function mapPage(page: GeneratorPage): InterestSuggestionHit & { timestamp: string } {
  return {
    title: page.title,
    description: page.description?.trim() ?? '',
    thumbnail: page.thumbnail
      ? { url: page.thumbnail.source, width: page.thumbnail.width, height: page.thumbnail.height }
      : null,
    timestamp: page.revisions?.[0]?.timestamp ?? '',
  }
}

async function fetchGeneratorPages(
  params: URLSearchParams,
  signal?: AbortSignal,
): Promise<GeneratorPage[]> {
  const lang = normalizeLang('en')
  const wikiHost = wikiHostFromLang(lang)
  const response = await fetch(`https://${wikiHost}/w/api.php?${params.toString()}`, {
    signal,
    headers: wikimediaApiFetchHeaders('wikita-lite-onboarding-morelike'),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const data = (await response.json()) as GeneratorResponse
  const pages = data.query?.pages ?? []
  return [...pages].sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
}

/** One Action API round-trip: morelike search + descriptions + thumbnails (+ revision time). */
export async function fetchMorelikeSuggestions(
  seedTitle: string,
  limit: number,
  signal?: AbortSignal,
): Promise<(InterestSuggestionHit & { timestamp: string })[]> {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `morelike:${seedTitle.trim()}`,
    gsrnamespace: '0',
    gsrlimit: String(limit),
    prop: 'pageimages|description|revisions',
    piprop: 'thumbnail',
    pithumbsize: '160',
    rvprop: 'timestamp',
    rvslots: 'main',
    format: 'json',
    formatversion: '2',
    origin: '*',
  })

  const seedKey = normalizeTitleKey(seedTitle)
  return (await fetchGeneratorPages(params, signal))
    .filter((page) => !seedKey || normalizeTitleKey(page.title) !== seedKey)
    .map(mapPage)
}

/** Random mainspace articles when there is no seed interest yet. */
export async function fetchRandomSuggestions(
  limit: number,
  signal?: AbortSignal,
): Promise<InterestSuggestionHit[]> {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'random',
    grnnamespace: '0',
    grnlimit: String(Math.max(limit * 2, limit)),
    prop: 'pageimages|description',
    piprop: 'thumbnail',
    pithumbsize: '160',
    format: 'json',
    formatversion: '2',
    origin: '*',
  })

  const hits = (await fetchGeneratorPages(params, signal)).map(mapPage)
  const withThumb = hits.filter((hit) => hit.thumbnail?.url)
  const withoutThumb = hits.filter((hit) => !hit.thumbnail?.url)
  return [...withThumb, ...withoutThumb].slice(0, limit)
}

export function sortByLastEdit(
  hits: (InterestSuggestionHit & { timestamp: string })[],
): (InterestSuggestionHit & { timestamp: string })[] {
  return [...hits].sort((a, b) => {
    const aTime = a.timestamp ? Date.parse(a.timestamp) : Number.NaN
    const bTime = b.timestamp ? Date.parse(b.timestamp) : Number.NaN
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0
    if (Number.isNaN(aTime)) return 1
    if (Number.isNaN(bTime)) return -1
    return bTime - aTime
  })
}
