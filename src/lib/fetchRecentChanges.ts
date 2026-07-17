import { normalizeWikiUsername, wikiHostFromLang, wikimediaApiFetchHeaders } from '@/config'

import { fetchPagesMetadata } from './fetchMorelike'
import { fetchUserEditedPageTitles } from './fetchUserEditedPageTitles'

const TITLES_PER_BATCH = 50
const REAL_USER_EDIT_LIMIT = 3

export class FetchRecentChangesError extends Error {
  constructor(
    message: string,
    public readonly code: 'aborted' | 'http',
  ) {
    super(message)
    this.name = 'FetchRecentChangesError'
  }
}

export interface LatestPageRevision {
  title: string
  editor: string
  timestamp: string
  comment: string
}

export interface FetchLatestRevisionsOptions {
  signal?: AbortSignal
  lang?: string
}

export interface ResolveRecentChangeTitlesOptions {
  isRealUser: boolean
  realUsername: string
  signal?: AbortSignal
  lang?: string
}

function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new FetchRecentChangesError('Request aborted', 'aborted')
  }
}

function normalizeTitleKey(title: string): string {
  return title.trim().replace(/_/g, ' ').toLowerCase()
}

function dedupeTitles(titles: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []

  for (const raw of titles) {
    const title = raw.trim()
    if (!title.length) continue
    const key = normalizeTitleKey(title)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(title)
  }

  return out
}

interface RevisionPage {
  title?: string
  missing?: boolean
  revisions?: Array<{
    timestamp?: string
    user?: string
    comment?: string
  }>
}

interface RevisionsResponse {
  error?: { code?: string; info?: string }
  query?: { pages?: RevisionPage[] }
}

/**
 * Latest revision per title (any editor). Batches titles to respect API limits.
 */
export async function fetchLatestRevisionsForTitles(
  titles: string[],
  options: FetchLatestRevisionsOptions = {},
): Promise<LatestPageRevision[]> {
  assertNotAborted(options.signal)

  const uniqueTitles = dedupeTitles(titles)
  if (!uniqueTitles.length) return []

  const lang = options.lang ?? 'en'
  const wikiHost = wikiHostFromLang(lang)
  const headers = wikimediaApiFetchHeaders('recent-changes')
  const results: LatestPageRevision[] = []

  for (let offset = 0; offset < uniqueTitles.length; offset += TITLES_PER_BATCH) {
    assertNotAborted(options.signal)

    const batch = uniqueTitles.slice(offset, offset + TITLES_PER_BATCH)
    const params = new URLSearchParams({
      action: 'query',
      titles: batch.join('|'),
      prop: 'revisions',
      // rvlimit is only valid for single-page queries; multi-title requests
      // return one revision per page by default.
      rvprop: 'timestamp|user|comment',
      format: 'json',
      formatversion: '2',
      origin: '*',
    })

    const response = await fetch(`https://${wikiHost}/w/api.php?${params.toString()}`, {
      signal: options.signal,
      headers,
    })

    if (!response.ok) {
      throw new FetchRecentChangesError(`HTTP ${response.status}`, 'http')
    }

    const data = (await response.json()) as RevisionsResponse
    if (data.error) {
      throw new FetchRecentChangesError(
        data.error.info ?? data.error.code ?? 'Revision fetch failed',
        'http',
      )
    }

    for (const page of data.query?.pages ?? []) {
      if (page.missing || !page.title) continue
      const revision = page.revisions?.[0]
      if (!revision?.timestamp) continue

      results.push({
        title: page.title,
        editor: revision.user?.trim() || 'Unknown editor',
        timestamp: revision.timestamp,
        comment: revision.comment?.trim() || 'No edit summary',
      })
    }
  }

  return results
}

/**
 * Interest pages plus (for Real user) up to 3 recently edited article titles.
 */
export async function resolveRecentChangePageTitles(
  interests: string[],
  options: ResolveRecentChangeTitlesOptions,
): Promise<string[]> {
  const titles = dedupeTitles(interests)

  if (!options.isRealUser || !options.realUsername.trim()) {
    return titles
  }

  try {
    const edited = await fetchUserEditedPageTitles(options.realUsername, {
      limit: REAL_USER_EDIT_LIMIT,
      lang: options.lang,
      signal: options.signal,
    })
    return dedupeTitles([...titles, ...edited])
  } catch {
    return titles
  }
}

export interface EnrichedLatestRevision extends LatestPageRevision {
  description: string
  thumbnailSrc?: string
}

/**
 * Latest revisions enriched with page descriptions and thumbnails.
 */
export async function fetchEnrichedLatestRevisions(
  titles: string[],
  options: FetchLatestRevisionsOptions = {},
): Promise<EnrichedLatestRevision[]> {
  const [revisions, metadata] = await Promise.all([
    fetchLatestRevisionsForTitles(titles, options),
    fetchPagesMetadata(titles, options).catch(() => []),
  ])

  const metadataByKey = new Map(
    metadata.map((hit) => [normalizeTitleKey(hit.title), hit]),
  )

  return revisions.map((revision) => {
    const meta = metadataByKey.get(normalizeTitleKey(revision.title))
    return {
      ...revision,
      description: meta?.description?.trim() || 'No description available.',
      thumbnailSrc: meta?.thumbnail?.url,
    }
  })
}
