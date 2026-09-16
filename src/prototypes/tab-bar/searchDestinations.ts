import type { MenuItemData } from '@wikimedia/codex'
import { cdxIconArticle } from '@wikimedia/codex-icons'

import { wikiHostFromLang, wikimediaApiFetchHeaders } from '@/config'

const SPECIAL_PREFIX = 'Special:'

/** “Special:ReadingLists” → “Reading lists”; article titles stay verbatim. */
export function labelFromDestination(destination: string): string {
  const title = destination.replace(/_/g, ' ').trim()
  if (!title.startsWith(SPECIAL_PREFIX)) return title
  const spaced = title.slice(SPECIAL_PREFIX.length).replace(/([a-z])([A-Z])/g, '$1 $2')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase()
}

export interface PrefixSearchResult {
  title: string
  description?: string
}

interface PrefixSearchPage {
  title: string
  index?: number
  description?: string
}

/**
 * Live article suggestions from `${lang}.wikipedia.org` (main namespace only).
 * Special pages are virtual and never come back from prefix search — people
 * type those destinations by hand.
 */
export async function fetchPrefixSearch(
  query: string,
  options: { lang: string; signal?: AbortSignal; limit?: number },
): Promise<PrefixSearchResult[]> {
  const trimmed = query.trim()
  if (!trimmed) return []
  const params = new URLSearchParams({
    action: 'query',
    generator: 'prefixsearch',
    gpssearch: trimmed,
    gpslimit: String(options.limit ?? 8),
    gpsnamespace: '0',
    prop: 'description',
    format: 'json',
    formatversion: '2',
    origin: '*',
  })
  const response = await fetch(`https://${wikiHostFromLang(options.lang)}/w/api.php?${params}`, {
    signal: options.signal,
    headers: wikimediaApiFetchHeaders('toolbar-destination-lookup'),
  })
  if (!response.ok) return []
  const data = (await response.json()) as { query?: { pages?: PrefixSearchPage[] } }
  const pages = data.query?.pages ?? []
  return [...pages]
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((page) => ({ title: page.title, description: page.description }))
}

export function toDestinationMenuItems(results: PrefixSearchResult[]): MenuItemData[] {
  return results.map((result) => ({
    value: result.title,
    label: result.title,
    description: result.description,
    icon: cdxIconArticle,
  }))
}
