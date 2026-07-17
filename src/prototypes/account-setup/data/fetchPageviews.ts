/**
 * Total article pageviews over the last ~60 days via the Wikimedia REST
 * pageviews API. Returns `null` on any failure (no data, network error,
 * aborted) so callers can simply omit the "visits" line.
 *
 * Endpoint:
 * https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/{project}/all-access/all-agents/{article}/daily/{start}/{end}
 */

const PAGEVIEWS_API =
  'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article'

/** Pageviews data lags ~1 day, so window ends yesterday. */
const DAY_LAG = 1
const WINDOW_DAYS = 60

function yyyymmdd(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

interface PageviewsResponse {
  items?: { views?: number }[]
}

export async function fetchPageviewsLast60Days(
  title: string,
  options: { lang?: string; signal?: AbortSignal } = {},
): Promise<number | null> {
  const trimmed = title.trim()
  if (!trimmed) return null

  const lang = options.lang?.trim() || 'en'
  const project = `${lang}.wikipedia.org`
  const article = encodeURIComponent(trimmed.replace(/ /g, '_'))

  const end = new Date()
  end.setUTCDate(end.getUTCDate() - DAY_LAG)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - (WINDOW_DAYS - 1))

  const url =
    `${PAGEVIEWS_API}/${project}/all-access/all-agents/${article}/daily/` +
    `${yyyymmdd(start)}/${yyyymmdd(end)}`

  try {
    const response = await fetch(url, { signal: options.signal })
    if (!response.ok) return null
    const data = (await response.json()) as PageviewsResponse
    if (!Array.isArray(data.items)) return null
    return data.items.reduce((sum, item) => sum + (item.views ?? 0), 0)
  } catch {
    return null
  }
}
