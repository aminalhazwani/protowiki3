import { normalizeLang, normalizeWikiUsername, wikiHostFromLang, wikimediaApiFetchHeaders } from '@/config'
import { fetchWikimedia } from '@/lib/fetchWikimedia'

/** One page of contributions: plenty of distinct articles for the modules' few seeds. */
const CONTRIBS_LIMIT = 500

/**
 * A user's recently edited articles, most recent first — one request, titles
 * only. The personal modules grow from these, so they're fetched ahead of
 * Impact's full contributions, pageviews and thumbnails (several seconds more).
 */
export async function fetchRecentEditedPages(
  rawUsername: string,
  lang: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const username = normalizeWikiUsername(rawUsername)
  if (!username) return []

  const params = new URLSearchParams({
    action: 'query',
    list: 'usercontribs',
    ucuser: username,
    ucnamespace: '0',
    ucprop: 'title',
    uclimit: String(CONTRIBS_LIMIT),
    format: 'json',
    formatversion: '2',
    origin: '*',
  })
  const host = wikiHostFromLang(normalizeLang(lang))
  const response = await fetchWikimedia(`https://${host}/w/api.php?${params}`, {
    signal,
    headers: wikimediaApiFetchHeaders('home-edited-pages'),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const json = (await response.json()) as { query?: { usercontribs?: { title: string }[] } }
  return [...new Set((json.query?.usercontribs ?? []).map((contrib) => contrib.title))]
}
