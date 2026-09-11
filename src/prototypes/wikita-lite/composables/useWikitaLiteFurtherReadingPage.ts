import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import { useConfig } from '@/composables/useConfig'

import { dailyReadsPreviewCacheKey, helpWantedFeedsKey } from '../../musical-group/data/cacheKeys'
import { suggestionSeedItems } from '../../musical-group/data/getSuggestionSeeds'
import { getCachedRelatedFeed } from '../../musical-group/data/homeTabCache'
import {
  createRelatedFeedState,
  loadRelatedFeedBatch,
  persistRelatedFeedState,
  relatedFeedStateFromCache,
  type RelatedFeedRuntimeState,
} from '../../musical-group/loadRelatedFeedInitialBatch'
import type { HomeRelated, HomeSavedItem } from '../../musical-group/data/types'
import { getCachedDailyReadsPreview } from '../../musical-group/data/homeTabCache'
import { readingListToSavedItems } from '../data/readingListSavedPages'
import { useWikitaLiteSuggestionPreferencesSingleton } from './useWikitaLiteSuggestionPreferences'
import { useViewportInfiniteScroll } from './useViewportInfiniteScroll'

export function useWikitaLiteFurtherReadingPage() {
  const { currentUserPageLists } = useConfig()
  const { preferences, preferencesVersion, interestsVersion, listInterests } =
    useWikitaLiteSuggestionPreferencesSingleton()

  const savedItems = ref<HomeSavedItem[]>([])
  const relatedItems = ref<HomeRelated[]>([])
  const loading = ref(true)
  const loadingMore = ref(false)
  const hasMore = ref(true)
  const pageActive = ref(false)
  const loadSentinel = ref<HTMLElement | null>(null)

  let state: RelatedFeedRuntimeState | null = null
  let fetchAbort: AbortController | null = null
  let loadedForKey: string | null = null

  function dependencyKey(): string {
    void preferencesVersion.value
    void interestsVersion.value
    return helpWantedFeedsKey(savedItems.value, preferences.value, listInterests())
  }

  function seedItems(): HomeSavedItem[] {
    return suggestionSeedItems(savedItems.value, preferences.value, listInterests())
  }

  function applyState(runtime: RelatedFeedRuntimeState) {
    state = runtime
    relatedItems.value = runtime.items
    hasMore.value = runtime.hasMore
  }

  function restoreFromCache(key: string): boolean {
    const cached = getCachedRelatedFeed('home', key)
    if (cached) {
      applyState(relatedFeedStateFromCache(cached))
      loading.value = false
      return true
    }

    const preview = getCachedDailyReadsPreview(dailyReadsPreviewCacheKey())
    if (preview?.length) {
      relatedItems.value = preview
      loading.value = false
      return true
    }

    return false
  }

  async function loadMore() {
    if (!pageActive.value || loading.value || loadingMore.value || !hasMore.value) return

    fetchAbort?.abort()
    fetchAbort = new AbortController()
    const { signal } = fetchAbort

    const isInitial = relatedItems.value.length === 0
    if (isInitial) {
      loading.value = true
    } else {
      loadingMore.value = true
    }

    const key = dependencyKey()

    try {
      if (!state) {
        applyState(createRelatedFeedState(seedItems()))
      }

      await loadRelatedFeedBatch(state!, signal)
      relatedItems.value = state!.items
      hasMore.value = state!.hasMore
      persistRelatedFeedState('home', key, state!)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      hasMore.value = false
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  const relatedLoading = computed(
    () => loading.value && relatedItems.value.length === 0,
  )

  const relatedLoadingMore = computed(
    () => relatedItems.value.length > 0 && loadingMore.value,
  )

  const feedLoading = computed(() => loading.value || loadingMore.value)

  useViewportInfiniteScroll({
    sentinel: loadSentinel,
    active: pageActive,
    hasMore,
    loading: feedLoading,
    loadMore,
  })

  watch(
    () =>
      [
        dependencyKey(),
        pageActive.value,
        currentUserPageLists.value.readingList.join('|'),
      ] as const,
    ([key, isActive], oldValue) => {
      const prevKey = oldValue?.[0]

      if (key !== prevKey) {
        loadedForKey = null
        state = null
      }

      if (!isActive) {
        fetchAbort?.abort()
        fetchAbort = null
        loadingMore.value = false
        return
      }

      if (loadedForKey === key) return

      loadedForKey = key
      if (restoreFromCache(key)) return

      state = null
      relatedItems.value = []
      hasMore.value = true
      loading.value = true
      void loadMore()
    },
  )

  onMounted(() => {
    savedItems.value = readingListToSavedItems(currentUserPageLists.value.readingList)
    pageActive.value = true
  })

  onUnmounted(() => {
    fetchAbort?.abort()
  })

  return {
    relatedItems,
    relatedLoading,
    relatedLoadingMore,
    loadSentinel,
  }
}
