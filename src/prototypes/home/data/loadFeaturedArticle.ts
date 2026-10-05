import { homeArticleLocation } from '../routes'
import { fetchFeaturedFeed } from './fetchFeaturedFeed'
import { readDayCache, utcDayKey, writeDayCache } from './homeCache'
import type { HomeCardData } from './types'

const CACHE_SLOT = 'featured-article'

/** Today's featured article (the Main Page's "From today's featured article"). */
export async function loadFeaturedArticle(signal: AbortSignal): Promise<HomeCardData[]> {
  const day = utcDayKey()
  const cached = readDayCache<HomeCardData[]>(CACHE_SLOT, day)
  if (cached) return cached

  const { tfa } = await fetchFeaturedFeed(day)
  signal.throwIfAborted()
  if (!tfa?.title) return []

  const cards: HomeCardData[] = [
    {
      key: `tfa:${tfa.title}`,
      title: tfa.normalizedtitle ?? tfa.title.replace(/_/g, ' '),
      description: tfa.description,
      thumbnailUrl: tfa.thumbnail?.source,
      to: homeArticleLocation(tfa.title),
      supportingText: 'Article of the day',
    },
  ]
  writeDayCache(CACHE_SLOT, day, cards)
  return cards
}
