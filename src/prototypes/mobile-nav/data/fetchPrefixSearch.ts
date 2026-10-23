import type { MenuItemData } from '@wikimedia/codex'
import { cdxIconArticle } from '@wikimedia/codex-icons'

import { wikimediaApiFetchHeaders, wikiHostFromLang } from '@/config'

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
 * Article suggestions for a tab's destination (from the `tab-bar` branch):
 * main namespace only. Special pages are virtual and never come back from
 * prefix search, so people type those by hand.
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
    headers: wikimediaApiFetchHeaders('home-tab-destination'),
  })
  if (!response.ok) return []
  const data = (await response.json()) as { query?: { pages?: PrefixSearchPage[] } }
  return [...(data.query?.pages ?? [])]
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
