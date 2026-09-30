/**
 * Wikipedia's daily featured feed (REST `feed/featured/{yyyy}/{mm}/{dd}`): today's
 * featured article, Did you know, In the news, most read and more. Several Home
 * modules read from it, so the request is shared: one per UTC day per session.
 */

import { wikimediaApiFetchHeaders } from '@/config'
import { fetchWikimedia } from '@/lib/fetchWikimedia'

export const EN_WIKI_HOST = 'en.wikipedia.org'

export interface FeedPageSummary {
  title?: string
  normalizedtitle?: string
  description?: string
  thumbnail?: { source?: string; width?: number; height?: number }
}

export interface FeaturedFeedResponse {
  tfa?: FeedPageSummary
  dyk?: { html?: string; text?: string }[]
  mostread?: { date?: string; articles?: (FeedPageSummary & { views?: number; rank?: number })[] }
}

/** In-flight or settled request per day. Dropped on failure so the next call retries. */
const payloadByDay = new Map<string, Promise<FeaturedFeedResponse>>()

function feedUrl(day: string): string {
  const [year, month, date] = day.split('-')
  return `https://${EN_WIKI_HOST}/api/rest_v1/feed/featured/${year}/${month}/${date}`
}

/**
 * Fetches the feed for `day` (`YYYY-MM-DD`, UTC). Not tied to one caller's
 * signal — other modules may be waiting on the same promise — so callers check
 * their own signal after awaiting.
 */
export function fetchFeaturedFeed(day: string): Promise<FeaturedFeedResponse> {
  let payload = payloadByDay.get(day)
  if (!payload) {
    payload = fetchWikimedia(feedUrl(day), {
      headers: { Accept: 'application/json', ...wikimediaApiFetchHeaders('home-featured-feed') },
    }).then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json() as Promise<FeaturedFeedResponse>
    })
    payload.catch(() => payloadByDay.delete(day))
    payloadByDay.set(day, payload)
  }
  return payload
}
