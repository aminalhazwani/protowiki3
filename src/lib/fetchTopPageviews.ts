import { normalizeLang } from '@/config'

import { fetchFeaturedFeed } from './fetchFeaturedFeed'

export interface WeeklyTopArticle {
  title: string
  views: number
  thumbnailSrc?: string
}

export class FetchTopPageviewsError extends Error {
  constructor(
    message: string,
    public readonly code: 'aborted' | 'http' | 'empty',
  ) {
    super(message)
    this.name = 'FetchTopPageviewsError'
  }
}

const DEFAULT_DAYS = 7
const DEFAULT_LIMIT = 10

function padTwo(value: number): string {
  return String(value).padStart(2, '0')
}

function formatDayParts(date: Date): { year: string; month: string; day: string } {
  return {
    year: String(date.getFullYear()),
    month: padTwo(date.getMonth() + 1),
    day: padTwo(date.getDate()),
  }
}

/** Past calendar days, starting yesterday (offset 1). */
export function pastCalendarDays(count: number, startOffset = 1): Date[] {
  const dates: Date[] = []
  const anchor = new Date()
  anchor.setHours(0, 0, 0, 0)

  for (let offset = startOffset; offset < startOffset + count; offset++) {
    const date = new Date(anchor)
    date.setDate(date.getDate() - offset)
    dates.push(date)
  }

  return dates
}

export function trendingCacheKey(lang: string, days: Date[]): string {
  const normalized = normalizeLang(lang)
  if (!days.length) return `trending:${normalized}:empty`
  const sorted = [...days].sort((a, b) => a.getTime() - b.getTime())
  const first = formatDayParts(sorted[0])
  const last = formatDayParts(sorted[sorted.length - 1])
  return `trending:${normalized}:${first.year}-${first.month}-${first.day}_${last.year}-${last.month}-${last.day}`
}

export function isTrendingArticleTitle(title: string): boolean {
  const trimmed = title.trim()
  if (!trimmed.length) return false
  if (trimmed === 'Main_Page' || trimmed === '-') return false
  // Mainspace only — skip Special:, Wikipedia:, etc.
  return !trimmed.includes(':')
}

export interface FetchWeeklyTopPageviewsOptions {
  lang?: string
  days?: number
  limit?: number
  signal?: AbortSignal
}

/**
 * Aggregate most-read articles from Wikifeeds `feed/featured` over the past week.
 * Uses the same en.wikipedia.org host as the Featured module (browser-friendly).
 */
export async function fetchWeeklyTopPageviews(
  options: FetchWeeklyTopPageviewsOptions = {},
): Promise<{ articles: WeeklyTopArticle[]; windowDays: Date[] }> {
  const lang = normalizeLang(options.lang ?? 'en')
  const dayCount = options.days ?? DEFAULT_DAYS
  const limit = options.limit ?? DEFAULT_LIMIT
  const signal = options.signal

  const windowDays = pastCalendarDays(dayCount)
  const dailyFeeds = await Promise.all(
    windowDays.map((date) =>
      fetchFeaturedFeed({ date, lang, signal }).catch((error) => {
        if ((error as Error).name === 'AbortError') throw error
        return null
      }),
    ),
  )

  if (signal?.aborted) {
    throw new FetchTopPageviewsError('Request aborted.', 'aborted')
  }

  const viewsByTitle = new Map<string, { views: number; thumbnailSrc?: string }>()
  for (const feed of dailyFeeds) {
    for (const entry of feed?.mostread?.articles ?? []) {
      if (!isTrendingArticleTitle(entry.title)) continue
      const current = viewsByTitle.get(entry.title) ?? { views: 0 }
      viewsByTitle.set(entry.title, {
        views: current.views + entry.views,
        thumbnailSrc: current.thumbnailSrc ?? entry.thumbnail?.source,
      })
    }
  }

  const articles = [...viewsByTitle.entries()]
    .map(([title, { views, thumbnailSrc }]) => ({ title, views, thumbnailSrc }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit)

  if (!articles.length) {
    throw new FetchTopPageviewsError('No trending articles available for this week.', 'empty')
  }

  return { articles, windowDays }
}

export function formatWeeklyViews(views: number): string {
  if (views >= 1_000_000) {
    const millions = views / 1_000_000
    const rounded = millions >= 10 ? Math.round(millions) : Math.round(millions * 10) / 10
    return `${rounded}M views this week`
  }
  if (views >= 1_000) {
    return `${Math.round(views / 1_000)}K views this week`
  }
  return `${views.toLocaleString('en-US')} views this week`
}

export function displayArticleTitle(title: string): string {
  return title.replace(/_/g, ' ').trim()
}
