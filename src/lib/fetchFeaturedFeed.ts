import { normalizeLang, wikiHostFromLang, wikimediaApiFetchHeaders } from '@/config'

export interface FeaturedFeedPage {
  type?: string
  title: string
  pageid?: number
  description?: string
  thumbnail?: {
    source: string
    width?: number
    height?: number
  }
}

export interface FeaturedFeedTfa {
  type?: string
  title: string
  pageid?: number
  extract?: string
  thumbnail?: {
    source: string
    width?: number
    height?: number
  }
  description?: string
}

export interface FeaturedFeedDykItem {
  text: string
  html?: string
  pages?: FeaturedFeedPage[]
}

export interface FeaturedFeedOnThisDayItem {
  text: string
  year?: number
  pages?: FeaturedFeedPage[]
}

export interface FeaturedFeedMostReadArticle {
  title: string
  views: number
  rank?: number
  thumbnail?: {
    source: string
    width?: number
    height?: number
  }
}

export interface FeaturedFeedMostRead {
  date?: string
  articles?: FeaturedFeedMostReadArticle[]
}

export interface FeaturedFeedResponse {
  tfa?: FeaturedFeedTfa
  dyk?: FeaturedFeedDykItem[]
  onthisday?: FeaturedFeedOnThisDayItem[]
  mostread?: FeaturedFeedMostRead
}

export interface FeaturedFeedDateParts {
  yyyy: string
  mm: string
  dd: string
}

export class FetchFeaturedFeedError extends Error {
  constructor(
    message: string,
    public readonly code: 'aborted' | 'http',
  ) {
    super(message)
    this.name = 'FetchFeaturedFeedError'
  }
}

function padTwo(value: number): string {
  return String(value).padStart(2, '0')
}

/** Format a date for the Wikifeeds `feed/featured/{yyyy}/{mm}/{dd}` path. */
export function formatFeaturedFeedDate(date: Date): FeaturedFeedDateParts {
  return {
    yyyy: String(date.getFullYear()),
    mm: padTwo(date.getMonth() + 1),
    dd: padTwo(date.getDate()),
  }
}

export function featuredFeedCacheKey(lang: string, date: Date): string {
  const { yyyy, mm, dd } = formatFeaturedFeedDate(date)
  return `featured:${normalizeLang(lang)}:${yyyy}-${mm}-${dd}`
}

function buildFeaturedFeedUrl(lang: string, date: Date): string {
  const wikiHost = wikiHostFromLang(lang)
  const { yyyy, mm, dd } = formatFeaturedFeedDate(date)
  return `https://${wikiHost}/api/rest_v1/feed/featured/${yyyy}/${mm}/${dd}`
}

export interface FetchFeaturedFeedOptions {
  date?: Date
  lang?: string
  signal?: AbortSignal
}

export async function fetchFeaturedFeed(
  options: FetchFeaturedFeedOptions = {},
): Promise<FeaturedFeedResponse> {
  const lang = normalizeLang(options.lang ?? 'en')
  const date = options.date ?? new Date()
  const signal = options.signal

  const url = buildFeaturedFeedUrl(lang, date)

  let response: Response
  try {
    response = await fetch(url, {
      headers: wikimediaApiFetchHeaders('featured-feed'),
      signal,
    })
  } catch (fetchError) {
    if ((fetchError as Error).name === 'AbortError') {
      throw new FetchFeaturedFeedError('Request aborted.', 'aborted')
    }
    throw fetchError
  }

  if (!response.ok) {
    throw new FetchFeaturedFeedError(
      `Featured feed request failed (${response.status}).`,
      'http',
    )
  }

  return (await response.json()) as FeaturedFeedResponse
}

export interface OnThisDayBirthsResponse {
  births?: FeaturedFeedOnThisDayItem[]
}

export interface FetchOnThisDayOptions {
  date?: Date
  lang?: string
  signal?: AbortSignal
}

export async function fetchOnThisDayBirths(
  options: FetchOnThisDayOptions = {},
): Promise<FeaturedFeedOnThisDayItem[]> {
  const lang = normalizeLang(options.lang ?? 'en')
  const wikiHost = wikiHostFromLang(lang)
  const { mm, dd } = formatFeaturedFeedDate(options.date ?? new Date())
  const url = `https://${wikiHost}/api/rest_v1/feed/onthisday/births/${mm}/${dd}`
  const signal = options.signal

  let response: Response
  try {
    response = await fetch(url, {
      headers: wikimediaApiFetchHeaders('onthisday-births'),
      signal,
    })
  } catch (fetchError) {
    if ((fetchError as Error).name === 'AbortError') {
      throw new FetchFeaturedFeedError('Request aborted.', 'aborted')
    }
    throw fetchError
  }

  if (!response.ok) {
    throw new FetchFeaturedFeedError(
      `On this day births request failed (${response.status}).`,
      'http',
    )
  }

  const payload = (await response.json()) as OnThisDayBirthsResponse
  return payload.births ?? []
}

export interface PageSummaryResponse {
  title?: string
  description?: string
  extract?: string
  thumbnail?: {
    source: string
    width?: number
    height?: number
  }
}

export async function fetchPageSummary(
  title: string,
  options: { lang?: string; signal?: AbortSignal } = {},
): Promise<PageSummaryResponse> {
  const lang = normalizeLang(options.lang ?? 'en')
  const wikiHost = wikiHostFromLang(lang)
  const slug = encodeURIComponent(title.replace(/ /g, '_'))
  const url = `https://${wikiHost}/api/rest_v1/page/summary/${slug}`

  let response: Response
  try {
    response = await fetch(url, {
      headers: wikimediaApiFetchHeaders('page-summary'),
      signal: options.signal,
    })
  } catch (fetchError) {
    if ((fetchError as Error).name === 'AbortError') {
      throw new FetchFeaturedFeedError('Request aborted.', 'aborted')
    }
    throw fetchError
  }

  if (!response.ok) {
    throw new FetchFeaturedFeedError(
      `Page summary request failed (${response.status}).`,
      'http',
    )
  }

  return (await response.json()) as PageSummaryResponse
}

const WIKI_LINK_TITLE_RE =
  /<a[^>]*rel="mw:WikiLink"[^>]*title="([^"]+)"[^>]*>/i
const BOLD_WIKI_LINK_TITLE_RE =
  /<b[^>]*>\s*<a[^>]*rel="mw:WikiLink"[^>]*title="([^"]+)"[^>]*>/i

function wikiTitleFromDisplayTitle(displayTitle: string): string {
  return displayTitle.trim().replace(/ /g, '_')
}

/** Primary linked article for a DYK hook (`pages[0]` or first bold wiki link in `html`). */
export function primaryDykPageTitle(item: FeaturedFeedDykItem): string | undefined {
  const fromPages = item.pages?.[0]?.title?.trim()
  if (fromPages) return fromPages

  const html = item.html?.trim()
  if (!html) return undefined

  const boldMatch = html.match(BOLD_WIKI_LINK_TITLE_RE)
  if (boldMatch?.[1]) return wikiTitleFromDisplayTitle(boldMatch[1])

  const linkMatch = html.match(WIKI_LINK_TITLE_RE)
  if (linkMatch?.[1]) return wikiTitleFromDisplayTitle(linkMatch[1])

  return undefined
}
