import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

import {
  fetchPagesMetadata,
  MorelikeFetchError,
  normalizeTitleKey,
} from '@/lib/fetchMorelike'

const DEBOUNCE_MS = 300

/**
 * Reactive map of `normalizeTitleKey(title)` → thumbnail URL for the currently
 * selected interests, so the selected pills can show article images. Only titles
 * that actually have a page image appear in the map. Debounced + abortable.
 */
export function useInterestThumbnails(
  getInterests: () => string[],
  getLang: () => string,
): Ref<Map<string, string>> {
  const thumbnails = ref<Map<string, string>>(new Map())

  let abortController: AbortController | null = null
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  async function runFetch(interests: string[]): Promise<void> {
    abortController?.abort()

    const titles = interests.map((title) => title.trim()).filter(Boolean)
    if (!titles.length) {
      thumbnails.value = new Map()
      return
    }

    const controller = new AbortController()
    abortController = controller

    try {
      const hits = await fetchPagesMetadata(titles, {
        lang: getLang(),
        signal: controller.signal,
      })

      const map = new Map<string, string>()
      for (const hit of hits) {
        if (hit.thumbnail?.url) map.set(normalizeTitleKey(hit.title), hit.thumbnail.url)
      }
      thumbnails.value = map
    } catch (err) {
      const aborted =
        (err as Error).name === 'AbortError' ||
        (err instanceof MorelikeFetchError && err.code === 'aborted')
      if (aborted) return
      thumbnails.value = new Map()
    }
  }

  watch(
    getInterests,
    (interests) => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => void runFetch(interests), DEBOUNCE_MS)
    },
    { immediate: true, deep: true },
  )

  onBeforeUnmount(() => {
    abortController?.abort()
    if (debounceTimer) clearTimeout(debounceTimer)
  })

  return thumbnails
}
