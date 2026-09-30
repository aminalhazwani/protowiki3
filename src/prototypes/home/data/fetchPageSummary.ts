/** REST `page/summary/{title}` — title, short description and thumbnail for one article. */

import { wikimediaApiFetchHeaders } from '@/config'
import { fetchWikimedia } from '@/lib/fetchWikimedia'

import { EN_WIKI_HOST, type FeedPageSummary } from './fetchFeaturedFeed'

/** Shared across modules for the session; failures are dropped so they retry. */
const summaries = new Map<string, Promise<FeedPageSummary | null>>()

/** Resolves `null` for a missing page; throws on network / server errors. */
export function fetchPageSummary(
  title: string,
  signal?: AbortSignal,
): Promise<FeedPageSummary | null> {
  const key = title.replace(/ /g, '_')
  let summary = summaries.get(key)
  if (!summary) {
    const url = `https://${EN_WIKI_HOST}/api/rest_v1/page/summary/${encodeURIComponent(key)}`
    summary = fetchWikimedia(url, {
      signal,
      headers: { Accept: 'application/json', ...wikimediaApiFetchHeaders('home-page-summary') },
    }).then((response) => {
      if (response.status === 404) return null
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json() as Promise<FeedPageSummary>
    })
    summary.catch(() => summaries.delete(key))
    summaries.set(key, summary)
  }
  return summary
}
