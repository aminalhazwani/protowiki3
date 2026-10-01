import { computed } from 'vue'

import { useConfig } from '@/composables/useConfig'

import { normalizeTitle } from './routes'
import { useHomePersonalization } from './useHomePersonalization'

/**
 * Pages personal suggestions grow from: the reader's interests, then the Mock
 * user's saved pages, edited pages and watchlist (home2's sources), each only
 * while switched on in Personalization; deduplicated, in that order.
 */
export function useHomeSeeds() {
  const { currentUserPageLists } = useConfig()
  const { interests, sources } = useHomePersonalization()

  const seeds = computed(() => {
    const { readingList, editedPages, watchlist } = currentUserPageLists.value
    const on = sources.value
    const seen = new Set<string>()
    return [
      ...(on.interests ? interests.value : []),
      ...(on.saved ? readingList : []),
      ...(on.contributions ? editedPages : []),
      ...(on.watchlist ? watchlist : []),
    ].filter((title) => {
      const key = normalizeTitle(title)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
  })

  return { seeds }
}
