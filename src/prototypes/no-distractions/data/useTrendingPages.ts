import { computed, ref, type ComputedRef, type Ref } from 'vue'

import {
  displayArticleTitle,
  fetchWeeklyTopPageviews,
  FetchTopPageviewsError,
  formatWeeklyViews,
  pastCalendarDays,
  trendingCacheKey,
} from '@/lib/fetchTopPageviews'

export interface TrendingPage {
  title: string
  articleTitle: string
  viewsLabel: string
  thumbnailSrc?: string
}

export interface TrendingPagesState {
  pages: ComputedRef<TrendingPage[]>
  loading: Ref<boolean>
  error: Ref<string | null>
}

const LANG = 'en'
const STORAGE_KEY = 'protowiki:no-distractions:trending-pages:v3'

interface StoredTrendingCache {
  cacheKey: string
  pages: TrendingPage[]
  error: string | null
}

function readTrendingCache(cacheKey: string): StoredTrendingCache | null {
  if (typeof localStorage === 'undefined' || !cacheKey.length) return null

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredTrendingCache
    if (parsed.cacheKey !== cacheKey || !Array.isArray(parsed.pages)) return null
    if (parsed.error) return null
    return parsed
  } catch {
    return null
  }
}

function writeTrendingCache(
  cacheKey: string,
  cachedPages: TrendingPage[],
  cachedError: string | null,
): void {
  if (typeof localStorage === 'undefined' || !cacheKey.length) return
  if (cachedError) return

  try {
    const payload: StoredTrendingCache = { cacheKey, pages: cachedPages, error: cachedError }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Quota or privacy mode — ignore.
  }
}

let shared: TrendingPagesState | null = null
let scheduleTrendingFetch: (() => void) | null = null

function createState(): TrendingPagesState {
  const pages = ref<TrendingPage[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let loadedCacheKey = ''
  let inFlightCacheKey = ''
  let abortController: AbortController | null = null

  function currentCacheKey(): string {
    return trendingCacheKey(LANG, pastCalendarDays(7))
  }

  function hydrateFromStorage(cacheKey: string): boolean {
    const stored = readTrendingCache(cacheKey)
    if (!stored) return false

    pages.value = stored.pages
    error.value = stored.error
    loadedCacheKey = cacheKey
    loading.value = false
    return true
  }

  async function runFetch(fetchCacheKey: string): Promise<void> {
    if (inFlightCacheKey === fetchCacheKey) return
    inFlightCacheKey = fetchCacheKey

    abortController?.abort()
    abortController = new AbortController()
    const signal = abortController.signal

    loading.value = true
    error.value = null

    try {
      const { articles } = await fetchWeeklyTopPageviews({ lang: LANG, signal })
      if (signal.aborted) return
      if (fetchCacheKey !== currentCacheKey()) return

      const built: TrendingPage[] = articles.map((article) => ({
        title: displayArticleTitle(article.title),
        articleTitle: article.title,
        viewsLabel: formatWeeklyViews(article.views),
        thumbnailSrc: article.thumbnailSrc,
      }))

      pages.value = built
      error.value = null
      loadedCacheKey = fetchCacheKey
      writeTrendingCache(fetchCacheKey, built, null)
    } catch (fetchError) {
      if (fetchError instanceof FetchTopPageviewsError && fetchError.code === 'aborted') return
      if ((fetchError as Error).name === 'AbortError') return
      if (fetchCacheKey !== currentCacheKey()) return

      error.value =
        fetchError instanceof Error ? fetchError.message : 'Could not load trending pages.'
      pages.value = []
      loadedCacheKey = fetchCacheKey
    } finally {
      if (inFlightCacheKey === fetchCacheKey) {
        inFlightCacheKey = ''
      }
      if (!signal.aborted && fetchCacheKey === currentCacheKey()) {
        loading.value = false
      }
    }
  }

  function scheduleFetch(): void {
    const cacheKey = currentCacheKey()
    if (cacheKey === loadedCacheKey) return
    if (cacheKey.length && hydrateFromStorage(cacheKey)) return

    pages.value = []
    error.value = null
    loading.value = true
    void runFetch(cacheKey)
  }

  scheduleTrendingFetch = scheduleFetch

  return {
    pages: computed(() => pages.value),
    loading,
    error,
  }
}

/**
 * Most-viewed English Wikipedia articles over the past week (Wikifeeds most-read, aggregated).
 * Shared singleton; call once from the route shell to bind the fetch lifecycle.
 */
export function useTrendingPages(init = false): TrendingPagesState {
  if (!shared) shared = createState()
  if (init) scheduleTrendingFetch?.()
  return shared
}
