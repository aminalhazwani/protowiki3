import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

import { fetchPageSummary } from '../../../musical-group/data/pageSummary'
import { mapWithConcurrency } from '@/lib/mapWithConcurrency'

import { normalizeTitleKey } from './titleKey'

const DEBOUNCE_MS = 300

/**
 * Reactive map of `normalizeTitleKey(title)` → thumbnail URL for selected interests.
 */
export function useInterestThumbnails(getInterests: () => string[]): Ref<Map<string, string>> {
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
      const summaries = await mapWithConcurrency(
        titles,
        3,
        (title) => fetchPageSummary(title, controller.signal, 'wikita-lite-onboarding-interest-thumb'),
        controller.signal,
      )

      const map = new Map<string, string>()
      for (const summary of summaries) {
        if (!summary) continue
        const title = summary.normalizedtitle ?? summary.title
        const url = summary.thumbnail?.source
        if (title && url) map.set(normalizeTitleKey(title), url)
      }
      thumbnails.value = map
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
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
