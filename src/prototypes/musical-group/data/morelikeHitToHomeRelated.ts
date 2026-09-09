import { enwikiArticleUrl } from './enwikiTitle'
import type { MorelikeSuggestionHit } from './fetchMorelikeSuggestions'
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
