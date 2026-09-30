import { computed } from 'vue'

import { useConfig } from '@/composables/useConfig'

import { normalizeTitle } from './routes'

/**
 * Pages personal suggestions grow from: the Mock user's saved pages, edited
 * pages and watchlist (home2's defaults), deduplicated, in that order.
 * Interests join once onboarding collects them.
 */
export function useHomeSeeds() {
  const { currentUserPageLists } = useConfig()

  const seeds = computed(() => {
    const { readingList, editedPages, watchlist } = currentUserPageLists.value
    const seen = new Set<string>()
    return [...readingList, ...editedPages, ...watchlist].filter((title) => {
      const key = normalizeTitle(title)
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
  })

  return { seeds }
}
