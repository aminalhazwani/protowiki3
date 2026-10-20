import { onScopeDispose, ref, watch } from 'vue'

import { useConfig } from '@/composables/useConfig'
import { normalizeLang } from '@/config'

import { getCachedImpact } from '../template-homepage/impact/data/impactCache'
import { fetchRecentEditedPages } from './data/fetchRecentEditedPages'

// Module-level: the dashboard fetches, the personal modules and Impact wait on it.
const pending = ref(false)

/**
 * Whether a real user's edited pages are still on their way. Until they land,
 * the personal modules hold their skeletons rather than load from pages that
 * aren't the reader's (none yet, or the previous real user's), and Impact
 * holds its own, longer fetch so the pages come first.
 */
export function useHomeRealUserPages() {
  return { pending }
}

/**
 * Keeps the **Real user** preset's edited pages (what the personal modules grow
 * from) on the current username: from Impact's cache when it has them, else one
 * quick contributions request. Runs on the Home (`HomeDashboard`), whether or
 * not Impact is shown.
 */
export function useRealUserPagesSync(): void {
  const { user, realUsername, realLang, setCurrentUserPageList } = useConfig()
  let controller: AbortController | null = null

  watch(
    [user, realUsername, realLang],
    async ([activeUser, name, lang]) => {
      controller?.abort()
      controller = null
      if (activeUser !== 'real') {
        pending.value = false
        return
      }

      const cached = getCachedImpact(name, normalizeLang(lang))?.data.editedPageTitles
      if (cached?.length) {
        setCurrentUserPageList('editedPages', [...cached])
        pending.value = false
        return
      }

      const own = new AbortController()
      controller = own
      pending.value = true
      try {
        setCurrentUserPageList('editedPages', await fetchRecentEditedPages(name, lang, own.signal))
      } catch (err) {
        if (own.signal.aborted) return
        console.warn('[Home] real user edited pages failed to load', err)
      }
      if (controller === own) pending.value = false
    },
    { immediate: true },
  )

  onScopeDispose(() => {
    controller?.abort()
    pending.value = false
  })
}
