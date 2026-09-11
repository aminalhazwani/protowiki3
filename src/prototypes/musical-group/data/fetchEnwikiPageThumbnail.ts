import { wikimediaApiFetchHeaders } from '@/config'
import { fetchWikimedia } from '@/lib/fetchWikimedia'

import { normalizeEnwikiTitle, wikiActionUrl } from './enwikiTitle'
import { fetchPageSummary } from './pageSummary'

const PAGEIMAGE_THUMB_SIZE = '160'

export interface EnwikiPageMetadata {
  title?: string
  description?: string
  thumbnailUrl?: string
}

export interface FetchEnwikiPageMetadataOptions {
  signal?: AbortSignal
  purpose?: string
  /** Retry the network when the only cached summary value is a prior failure (`null`). */
  bypassFailureCache?: boolean
}

async function fetchPageImageThumbnail(
  title: string,
  signal?: AbortSignal,
  purpose = 'enwiki-pageimage',
): Promise<string | undefined> {
  const url = wikiActionUrl({
    action: 'query',
    titles: title,
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: PAGEIMAGE_THUMB_SIZE,
    redirects: '1',
  })

  try {
    const response = await fetchWikimedia(url, {
      signal,
      headers: wikimediaApiFetchHeaders(purpose),
    })
    if (!response.ok) return undefined

    const json = (await response.json()) as {
      query?: { pages?: Record<string, { thumbnail?: { source?: string } }> }
    }
    const pages = json.query?.pages ?? {}
    for (const page of Object.values(pages)) {
      if (page.thumbnail?.source) return page.thumbnail.source
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
  }

  return undefined
}

/** REST `/page/summary` first; Action API `pageimages` when summary has no thumbnail. */
export async function fetchEnwikiPageMetadata(
  title: string,
  options: FetchEnwikiPageMetadataOptions = {},
): Promise<EnwikiPageMetadata> {
  const enwikiTitle = normalizeEnwikiTitle(title)
  if (!enwikiTitle) return {}

  const purpose = options.purpose ?? 'enwiki-page-metadata'
  const summary = await fetchPageSummary(enwikiTitle, options.signal, purpose, {
    bypassFailureCache: options.bypassFailureCache,
  })

  const resolvedTitle = summary?.title?.trim() || enwikiTitle
  const description = summary?.description?.trim() || undefined
  let thumbnailUrl = summary?.thumbnail?.source

  if (!thumbnailUrl?.trim()) {
    thumbnailUrl = await fetchPageImageThumbnail(enwikiTitle, options.signal, `${purpose}-pageimage`)
  }

  return {
    title: resolvedTitle,
    description,
    thumbnailUrl,
  }
}
