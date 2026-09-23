import { wikiHostFromLang, wikimediaApiFetchHeaders } from '@/config'

/**
 * Title suggestions from REST `search/title` — the endpoint the production
 * search bars use for prefix completion. It returns the short description and a
 * thumbnail with the title, so a result row needs no follow-up request (unlike
 * Action API `opensearch`, which carries no image).
 */
export interface TitleSearchResult {
  title: string
  description: string
  thumbnailSrc?: string
}

export interface TitleSearchOptions {
  signal?: AbortSignal
  lang?: string
  limit?: number
  clientTag?: string
}

/** REST thumbnails are protocol-relative today, but may arrive absolute. */
function normalizeThumbnailUrl(url: string | undefined): string | undefined {
  if (!url) return undefined
  return url.startsWith('//') ? `https:${url}` : url
}

export async function fetchTitleSearchResults(
  query: string,
  options: TitleSearchOptions = {},
): Promise<TitleSearchResult[]> {
  const trimmed = query.trim()
  if (!trimmed.length) return []

  const wikiHost = wikiHostFromLang(options.lang ?? 'en')
  const params = new URLSearchParams({
    q: trimmed,
    limit: String(options.limit ?? 6),
  })

  const response = await fetch(
    `https://${wikiHost}/w/rest.php/v1/search/title?${params.toString()}`,
    {
      signal: options.signal,
      headers: wikimediaApiFetchHeaders(options.clientTag ?? 'title-search'),
    },
  )

  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const data = (await response.json()) as {
    pages?: { title: string; description?: string; thumbnail?: { url?: string } | null }[]
  }

  return (data.pages ?? []).map((page) => ({
    title: page.title,
    description: page.description ?? '',
    thumbnailSrc: normalizeThumbnailUrl(page.thumbnail?.url),
  }))
}
