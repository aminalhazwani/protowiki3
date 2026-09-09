import { computed, type ComputedRef, type Ref, unref } from 'vue'

export interface FeedLoadingConfig {
  id: string
  loading: Ref<boolean> | ComputedRef<boolean>
  previewCount: Ref<number> | ComputedRef<number>
  /** When set, used for empty-slot selection instead of loading + zero preview. */
  emptyPending?: Ref<boolean> | ComputedRef<boolean>
  hasError?: Ref<boolean> | ComputedRef<boolean>
  /** When false, the module is omitted entirely. */
  enabled?: Ref<boolean> | ComputedRef<boolean>
}

function isEnabled(enabled: FeedLoadingConfig['enabled']): boolean {
  if (enabled === undefined) return true
  return Boolean(unref(enabled))
}

function isEmptySlot(feed: FeedLoadingConfig): boolean {
  if (!isEnabled(feed.enabled)) return false
  if (feed.emptyPending !== undefined) {
    return Boolean(unref(feed.emptyPending))
  }
  return Boolean(unref(feed.loading)) && unref(feed.previewCount) === 0
}

function isFeedLoading(feed: FeedLoadingConfig): boolean {
  return Boolean(unref(feed.loading))
}

function isEmptyPending(feed: FeedLoadingConfig): boolean {
  return feed.emptyPending !== undefined && Boolean(unref(feed.emptyPending))
}

export function useWikitaLiteTabLoading(feeds: FeedLoadingConfig[]) {
  const loadingSlot = computed((): string | null => {
    for (const feed of feeds) {
      if (isEmptySlot(feed)) return feed.id
    }
    return null
  })

  function showLoadingBar(feedId: string): boolean {
    const feed = feeds.find((entry) => entry.id === feedId)
    if (!feed || !isEnabled(feed.enabled) || !isFeedLoading(feed)) return false

    const previewCount = unref(feed.previewCount)
    const hasError = Boolean(unref(feed.hasError))
    if (previewCount > 0 || hasError) return true

    if (feed.emptyPending !== undefined) {
      return isEmptyPending(feed)
    }

    return loadingSlot.value === feedId
  }

  function showModule(feedId: string): boolean {
    const feed = feeds.find((entry) => entry.id === feedId)
    if (!feed || !isEnabled(feed.enabled)) return false

    const previewCount = unref(feed.previewCount)
    const hasError = Boolean(unref(feed.hasError))
    if (previewCount > 0 || hasError) return true
    if (feed.emptyPending !== undefined && isEmptyPending(feed)) return true
    return showLoadingBar(feedId)
  }

  return { loadingSlot, showLoadingBar, showModule }
}
