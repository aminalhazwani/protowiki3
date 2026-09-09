import { enwikiArticleUrl } from './enwikiTitle'
import type { MorelikeSuggestionHit } from './fetchMorelikeSuggestions'
import { fetchPageSummary } from './pageSummary'
import type { HomeRelated } from './types'
import { normalizeQid } from './wikidataApi'

export function morelikeHitToHomeRelated(
  hit: MorelikeSuggestionHit,
  relatedToTitle: string,
): HomeRelated {
  const itemId = normalizeQid(hit.wikibaseItem) ?? undefined

  return {
    title: hit.title,
    description: hit.description,
    thumbnailUrl: hit.thumbnail?.url,
    articleUrl: enwikiArticleUrl(hit.title),
    itemId,
    relatedToTitle,
  }
}

/** Map a morelike hit to a Daily reads card, falling back to REST summary for thumbnails. */
export async function resolveMorelikeHitToHomeRelated(
  hit: MorelikeSuggestionHit,
  relatedToTitle: string,
  signal?: AbortSignal,
): Promise<HomeRelated> {
  const card = morelikeHitToHomeRelated(hit, relatedToTitle)
  if (card.thumbnailUrl?.trim()) return card

  const summary = await fetchPageSummary(hit.title, signal, 'wikita-lite-daily-reads-summary')
  const thumbnailUrl = summary?.thumbnail?.source
  return thumbnailUrl ? { ...card, thumbnailUrl } : card
}
