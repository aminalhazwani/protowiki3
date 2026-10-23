import { computed } from 'vue'

import { useConfig } from '@/composables/useConfig'

import { normalizeTitle } from './routes'
import { useHomeOnboarding } from './useHomeOnboarding'
import { useHomePersonalization } from './useHomePersonalization'
import { useHomeRealUserPages } from './useHomeRealUserPages'

/**
 * Pages personal suggestions grow from: the reader's interests, then the Mock
 * user's saved pages, edited pages and watchlist (home2's sources), each only
 * while switched on in Personalization; deduplicated, in that order.
 * `personal`: there are seeds, or a real user's are still arriving (so the
 * modules hold a personal Home's skeletons, not a stranger's).
 */
export function useHomeSeeds() {
  const { currentUserPageLists } = useConfig()
  const { interests, sources } = useHomePersonalization()
  const { pending } = useHomeRealUserPages()

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

  const personal = computed(() => seeds.value.length > 0 || pending.value)

  /**
   * Nothing to go on: not personal, and no survey answer (a new account that
   * skipped both). Daily reads and Suggested edits then show a few random picks each.
   */
  const { survey } = useHomeOnboarding()
  const blank = computed(() => !personal.value && survey.value === null)

  return { seeds, personal, blank }
}
