import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'

import { useConfig } from '@/composables/useConfig'

import { fetchReadingListSummaries } from '../data/fetchReadingListSummaries'
import { readingListToSavedItems } from '../data/readingListSavedPages'
import {
  loadNextRandomEditSuggestion,
  restoreRandomEditSuggestionsFeed,
  type RandomEditSuggestionsFeed,
} from '../../musical-group/data/fetchRandomEditSuggestions'
import type { HomeHelpWanted, HomeSavedItem } from '../../musical-group/data/types'
import { useContributeSuggestionsFeed } from '../../musical-group/useContributeSuggestionsFeed'
import { useWikitaLiteModuleSuggestionPreferencesSingleton } from './useWikitaLiteModuleSuggestionPreferences'
import {
  isSentinelNearViewport,
  useViewportInfiniteScroll,
} from './useViewportInfiniteScroll'

function usePersonalizedHelpWantedPage(
  initialSavedItems: HomeSavedItem[],
  readingListTitles?: string[],
) {
  const savedItems = ref<HomeSavedItem[]>(initialSavedItems)
  const pageActive = ref(true)
  const loadSentinel = ref<HTMLElement | null>(null)
  let fillingViewport = false

  const {
    savedSuggestions,
    savedLoading,
    relatedSuggestions,
    relatedLoading,
    relatedHasMore,
    loadMoreRelated,
  } = useContributeSuggestionsFeed(savedItems, pageActive)

  const feedLoading = computed(() => savedLoading.value || relatedLoading.value)

  const helpWanted = computed(() => [
    ...savedSuggestions.value,
    ...relatedSuggestions.value,
  ])

  const helpWantedLoading = computed(
    () => feedLoading.value && helpWanted.value.length === 0,
  )

  const helpWantedLoadingMore = computed(
    () => helpWanted.value.length > 0 && feedLoading.value,
  )

  async function fillViewport(): Promise<void> {
    if (fillingViewport) return
    fillingViewport = true
    try {
      while (
        pageActive.value &&
        relatedHasMore.value &&
        !relatedLoading.value &&
        !savedLoading.value
      ) {
        const countBefore = helpWanted.value.length
        await loadMoreRelated()
        await nextTick()
        if (helpWanted.value.length === countBefore) break
        if (!isSentinelNearViewport(loadSentinel.value)) break
      }
    } finally {
      fillingViewport = false
    }
  }

  useViewportInfiniteScroll({
    sentinel: loadSentinel,
    active: pageActive,
    hasMore: relatedHasMore,
    loading: relatedLoading,
    loadMore: loadMoreRelated,
  })

  onMounted(async () => {
    await nextTick()
    void fillViewport()

    if (!readingListTitles?.length) return

    try {
      const enriched = await fetchReadingListSummaries(readingListTitles)
      if (enriched.length) {
        savedItems.value = enriched
      }
    } catch {
      // Keep synthetic items on failure.
    }
  })

  return {
    helpWanted,
    helpWantedLoading,
    helpWantedLoadingMore,
    loadSentinel,
  }
}

function useRandomHelpWantedPage() {
  const pageActive = ref(true)
  const loadSentinel = ref<HTMLElement | null>(null)
  const helpWanted = ref<HomeHelpWanted[]>([])
  const loading = ref(true)
  const loadingMore = ref(false)
  const hasMore = ref(true)

  let feed: RandomEditSuggestionsFeed | null = null
  let abort: AbortController | null = null
  let fillingViewport = false

  function syncFromFeed(): void {
    if (!feed) {
      helpWanted.value = []
      hasMore.value = false
      return
    }
    helpWanted.value = [...feed.items]
    hasMore.value = !feed.exhausted
  }

  function initializeFeed(): void {
    abort?.abort()
    abort = new AbortController()
    feed = restoreRandomEditSuggestionsFeed()
    syncFromFeed()
    if (helpWanted.value.length) {
      loading.value = false
    }
  }

  async function loadNext(): Promise<boolean> {
    if (!feed || !hasMore.value || loadingMore.value) return false

    const isInitial = helpWanted.value.length === 0
    if (isInitial) {
      loading.value = true
    } else {
      loadingMore.value = true
    }

    try {
      const suggestion = await loadNextRandomEditSuggestion(feed, abort?.signal)
      syncFromFeed()
      return Boolean(suggestion)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return false
      hasMore.value = false
      return false
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  async function fillViewport(): Promise<void> {
    if (fillingViewport) return
    fillingViewport = true
    try {
      while (pageActive.value && hasMore.value && !loadingMore.value) {
        const added = await loadNext()
        if (!added) break
        await nextTick()
        if (!isSentinelNearViewport(loadSentinel.value)) break
      }
    } finally {
      fillingViewport = false
    }
  }

  const feedLoading = computed(() => loading.value || loadingMore.value)

  const helpWantedLoading = computed(
    () => feedLoading.value && helpWanted.value.length === 0,
  )

  const helpWantedLoadingMore = computed(
    () => helpWanted.value.length > 0 && feedLoading.value,
  )

  useViewportInfiniteScroll({
    sentinel: loadSentinel,
    active: pageActive,
    hasMore,
    loading: feedLoading,
    loadMore: loadNext,
  })

  onMounted(async () => {
    initializeFeed()
    await fillViewport()
  })

  onUnmounted(() => {
    abort?.abort()
  })

  return {
    helpWanted,
    helpWantedLoading,
    helpWantedLoadingMore,
    loadSentinel,
  }
}

export function useWikitaLiteHelpWantedPage() {
  const { currentUserPageLists } = useConfig()
  const { hasModuleSuggestionSeeds } = useWikitaLiteModuleSuggestionPreferencesSingleton()
  const readingListTitles = currentUserPageLists.value.readingList

  if (readingListTitles.length) {
    return usePersonalizedHelpWantedPage(
      readingListToSavedItems(readingListTitles),
      readingListTitles,
    )
  }

  if (hasModuleSuggestionSeeds('suggestedEdits', [])) {
    return usePersonalizedHelpWantedPage([])
  }

  return useRandomHelpWantedPage()
}
