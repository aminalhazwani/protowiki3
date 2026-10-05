import { computed, ref } from 'vue'

import { useConfig } from '@/composables/useConfig'

import { loadHomeConfig, patchHomeConfig } from './data/homeConfig'
import { normalizeTitle } from './routes'

// Module-level: one saved state for every card, header and module.
const savedAt = ref<Record<string, number>>(loadHomeConfig().savedAt)

/**
 * Saving pages. The list is the Mock user's **Saved pages** (ProtoWiki's
 * `readingList` for the active preset — so the Experienced editor starts with
 * some), newest first; the Home config only adds when each was saved.
 */
export function useHomeSaved() {
  const { currentUserPageLists, setCurrentUserPageList } = useConfig()

  const savedTitles = computed(() => currentUserPageLists.value.readingList)
  const savedKeys = computed(() => new Set(savedTitles.value.map(normalizeTitle)))

  function isSaved(title: string): boolean {
    return savedKeys.value.has(normalizeTitle(title))
  }

  /** Saves, or unsaves if already saved. Returns whether the page is now saved. */
  function toggleSaved(title: string): boolean {
    const key = normalizeTitle(title)
    if (!key) return false

    if (isSaved(key)) {
      setCurrentUserPageList(
        'readingList',
        savedTitles.value.filter((entry) => normalizeTitle(entry) !== key),
      )
      const rest = { ...savedAt.value }
      delete rest[key]
      savedAt.value = patchHomeConfig({ savedAt: rest }).savedAt
      return false
    }

    setCurrentUserPageList('readingList', [key, ...savedTitles.value])
    savedAt.value = patchHomeConfig({ savedAt: { ...savedAt.value, [key]: Date.now() } }).savedAt
    return true
  }

  /** When `title` was saved (ms), if saved in this prototype. */
  function savedTime(title: string): number | undefined {
    return savedAt.value[normalizeTitle(title)]
  }

  return { savedTitles, isSaved, toggleSaved, savedTime }
}
