import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

import { useConfig } from '@/composables/useConfig'

import { hasSuggestionSeeds, suggestionSeedItems } from '../../musical-group/data/getSuggestionSeeds'
import { getCachedSavedSummaries } from '../../musical-group/data/homeTabCache'
import type { HomeRecentChange, HomeSavedItem } from '../../musical-group/data/types'
import { fetchReadingListSummaries } from '../data/fetchReadingListSummaries'
import { readingListKey, readingListToSavedItems } from '../data/readingListSavedPages'
import {
  loadNextRandomRecentChange,
  restoreRandomRecentChangesFeed,
  type RandomRecentChangesFeed,
} from '../../musical-group/data/fetchRandomRecentChanges'
import { useWikitaLiteSuggestionPreferencesSingleton } from './useWikitaLiteSuggestionPreferences'
import {
  isSentinelNearViewport,
  useViewportInfiniteScroll,
} from './useViewportInfiniteScroll'

function usePersonalizedRecentActivityPage() {
  const { currentUserPageLists } = useConfig()
  const { preferences, preferencesVersion, interestsVersion, listInterests } =
    useWikitaLiteSuggestionPreferencesSingleton()

  const enrichedSavedItems = ref<HomeSavedItem[]>([])
  const savedItems = ref<HomeSavedItem[]>([])
  const savedItemsLoading = ref(false)

  function sourceReadingListItems(): HomeSavedItem[] {
    return readingListToSavedItems(currentUserPageLists.value.readingList)
  }

  function syncSeedItems(): void {
    const sourceItems = enrichedSavedItems.value.length
      ? enrichedSavedItems.value
      : sourceReadingListItems()
    savedItems.value = suggestionSeedItems(sourceItems, preferences.value, listInterests())
  }

  watch(
    () =>
      [
        preferencesVersion.value,
        interestsVersion.value,
        currentUserPageLists.value.readingList.join('|'),
        currentUserPageLists.value.watchlist.join('|'),
        currentUserPageLists.value.editedPages.join('|'),
      ] as const,
    () => {
      syncSeedItems()
    },
  )

  onMounted(async () => {
    const titles = currentUserPageLists.value.readingList
    if (!titles.length) {
      syncSeedItems()
      return
    }

    savedItemsLoading.value = true
    try {
      enrichedSavedItems.value = await fetchReadingListSummaries(titles)
    } catch {
      enrichedSavedItems.value = sourceReadingListItems()
    } finally {
      syncSeedItems()
      savedItemsLoading.value = false
    }
  })

  return {
    mode: 'personalized' as const,
    savedItems,
    savedItemsLoading,
    recentChanges: ref<HomeRecentChange[]>([]),
    recentChangesLoading: computed(() => false),
    recentChangesLoadingMore: computed(() => false),
    loadSentinel: ref<HTMLElement | null>(null),
  }
}

function useRandomRecentActivityPage() {
  const pageActive = ref(true)
  const loadSentinel = ref<HTMLElement | null>(null)
  const recentChanges = ref<HomeRecentChange[]>([])
  const loading = ref(true)
  const loadingMore = ref(false)
  const hasMore = ref(true)

  let feed: RandomRecentChangesFeed | null = null
  let abort: AbortController | null = null
  let fillingViewport = false

  function syncFromFeed(): void {
    if (!feed) {
      recentChanges.value = []
      hasMore.value = false
      return
    }
    recentChanges.value = [...feed.items]
    hasMore.value = !feed.exhausted
  }

  function initializeFeed(): void {
    abort?.abort()
    abort = new AbortController()
    feed = restoreRandomRecentChangesFeed()
    syncFromFeed()
    if (recentChanges.value.length) {
      loading.value = false
    }
  }

  async function loadNext(): Promise<boolean> {
    if (!feed || !hasMore.value || loading.value || loadingMore.value) return false

    const isInitial = recentChanges.value.length === 0
    if (isInitial) {
      loading.value = true
    } else {
      loadingMore.value = true
    }

    try {
      const change = await loadNextRandomRecentChange(feed, abort?.signal)
      syncFromFeed()
      return Boolean(change)
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

  const recentChangesLoading = computed(
    () => feedLoading.value && recentChanges.value.length === 0,
  )

  const recentChangesLoadingMore = computed(
    () => recentChanges.value.length > 0 && feedLoading.value,
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
    mode: 'random' as const,
    savedItems: ref<HomeSavedItem[]>([]),
    savedItemsLoading: ref(false),
    recentChanges,
    recentChangesLoading,
    recentChangesLoadingMore,
    loadSentinel,
  }
}

export function useWikitaLiteRecentActivityPage() {
  const { currentUserPageLists } = useConfig()
  const { preferences, listInterests } = useWikitaLiteSuggestionPreferencesSingleton()
  const readingListTitles = currentUserPageLists.value.readingList
  const dependencyKey = readingListKey()
  const cachedSummaries = getCachedSavedSummaries(dependencyKey)
  const savedItems = readingListTitles.length
    ? cachedSummaries ?? readingListToSavedItems(readingListTitles)
    : []

  if (hasSuggestionSeeds(savedItems, preferences.value, listInterests())) {
    return usePersonalizedRecentActivityPage()
  }

  return useRandomRecentActivityPage()
}
