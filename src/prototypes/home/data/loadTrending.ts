import { homeArticleLocation } from '../routes'
import { fetchFeaturedFeed } from './fetchFeaturedFeed'
import { readDayCache, utcDayKey, writeDayCache } from './homeCache'
import type { HomeCardData } from './types'

const CACHE_SLOT = 'trending'
const MAX_TRENDING = 10

function formatViewCount(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`
  if (views >= 1000) return `${(views / 1000).toFixed(1)}k`
  return views.toLocaleString()
}

/** The most-read articles from today's featured feed (each entry is a full page summary). */
export async function loadTrending(signal: AbortSignal): Promise<HomeCardData[]> {
  const day = utcDayKey()
  const cached = readDayCache<HomeCardData[]>(CACHE_SLOT, day)
  if (cached) return cached

  const { mostread } = await fetchFeaturedFeed(day)
  signal.throwIfAborted()

  const cards: HomeCardData[] = [...(mostread?.articles ?? [])]
    .filter((article) => article.title && article.views != null)
    .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity))
    .slice(0, MAX_TRENDING)
    .map((article) => ({
      key: `trending:${article.title}`,
      title: article.normalizedtitle ?? article.title!.replace(/_/g, ' '),
      description: article.description,
      thumbnailUrl: article.thumbnail?.source,
      to: homeArticleLocation(article.title!),
      supportingText: `${formatViewCount(article.views!)} views today`,
    }))
  writeDayCache(CACHE_SLOT, day, cards)
  return cards
}
