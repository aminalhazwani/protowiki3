import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'

import {
  featuredFeedCacheKey,
  fetchFeaturedFeed,
  fetchOnThisDayBirths,
  fetchPageSummary,
  FetchFeaturedFeedError,
  primaryDykPageTitle,
  type FeaturedFeedOnThisDayItem,
  type FeaturedFeedPage,
  type FeaturedFeedResponse,
  type PageSummaryResponse,
} from '@/lib/fetchFeaturedFeed'

export type FeaturedSectionId = 'tfa' | 'dyk' | 'otd'

export interface FeaturedFeedItem {
  /** Display title; may be empty for DYK hooks. */
  title: string
  body: string
  /** Underscore wiki title for navigation, when tappable. */
  articleTitle?: string
  thumbnailSrc?: string
  description?: string
}

export interface FeaturedSection {
  id: FeaturedSectionId
  label: string
  items: FeaturedFeedItem[]
}

export interface FeaturedFeedState {
  sections: ComputedRef<FeaturedSection[]>
  loading: Ref<boolean>
  error: Ref<string | null>
}

const SECTION_LABELS: Record<FeaturedSectionId, string> = {
  tfa: '',
  dyk: 'Did you know',
  otd: 'Born on this day',
}

const LANG = 'en'
const DYK_LIMIT = 3
const BIRTHS_LIMIT = 3
const STORAGE_KEY = 'protowiki:no-distractions:featured-feed:v6'

interface StoredFeaturedCache {
  cacheKey: string
  sections: FeaturedSection[]
  error: string | null
}

function displayTitle(raw: string): string {
  return raw.replace(/_/g, ' ').trim()
}

function sanitizeCachedSections(sections: FeaturedSection[]): FeaturedSection[] {
  return sections.map((section) =>
    section.id === 'tfa' ? { ...section, label: '' } : section,
  )
}

function readFeaturedCache(cacheKey: string): StoredFeaturedCache | null {
  if (typeof localStorage === 'undefined' || !cacheKey.length) return null

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredFeaturedCache
    if (parsed.cacheKey !== cacheKey || !Array.isArray(parsed.sections)) return null
    return { ...parsed, sections: sanitizeCachedSections(parsed.sections) }
  } catch {
    return null
  }
}

function writeFeaturedCache(
  cacheKey: string,
  cachedSections: FeaturedSection[],
  cachedError: string | null,
): void {
  if (typeof localStorage === 'undefined' || !cacheKey.length) return

  try {
    const payload: StoredFeaturedCache = { cacheKey, sections: cachedSections, error: cachedError }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Quota or privacy mode — ignore.
  }
}

function pageThumbnailSrc(page?: FeaturedFeedPage): string | undefined {
  return page?.thumbnail?.source
}

function mapBirthItem(item: FeaturedFeedOnThisDayItem): FeaturedFeedItem {
  const primaryPage = item.pages?.[0]
  const articleTitle = primaryPage?.title
  const personName = articleTitle ? displayTitle(articleTitle) : ''
  const body = item.year
    ? `Born ${item.year}: ${item.text.trim()}`
    : item.text.trim()

  return {
    title: personName,
    body,
    articleTitle,
    thumbnailSrc: pageThumbnailSrc(primaryPage),
    description: primaryPage?.description,
  }
}

function buildSections(
  feed: FeaturedFeedResponse,
  summariesByTitle: Map<string, PageSummaryResponse>,
  births: FeaturedFeedOnThisDayItem[],
): FeaturedSection[] {
  const sections: FeaturedSection[] = []

  if (feed.tfa?.title) {
    const tfaSummary = summariesByTitle.get(feed.tfa.title)
    sections.push({
      id: 'tfa',
      label: SECTION_LABELS.tfa,
      items: [
        {
          title: displayTitle(feed.tfa.title),
          body: feed.tfa.extract?.trim() || '',
          articleTitle: feed.tfa.title,
          thumbnailSrc: tfaSummary?.thumbnail?.source ?? feed.tfa.thumbnail?.source,
          description: tfaSummary?.description ?? feed.tfa.description,
        },
      ],
    })
  }

  const dykItems = (feed.dyk ?? [])
    .filter((item) => item.text?.trim())
    .slice(0, DYK_LIMIT)
    .map((item) => {
      const articleTitle = primaryDykPageTitle(item)
      const summary = articleTitle ? summariesByTitle.get(articleTitle) : undefined
      return {
        title: '',
        body: item.text.trim(),
        articleTitle,
        thumbnailSrc: summary?.thumbnail?.source,
      }
    })

  if (dykItems.length) {
    sections.push({
      id: 'dyk',
      label: SECTION_LABELS.dyk,
      items: dykItems,
    })
  }

  const birthItems = births
    .filter((item) => item.text?.trim())
    .slice(0, BIRTHS_LIMIT)
    .map((item) => mapBirthItem(item))

  if (birthItems.length) {
    sections.push({
      id: 'otd',
      label: SECTION_LABELS.otd,
      items: birthItems,
    })
  }

  return sections
}

async function fetchSummariesForTitles(
  titles: string[],
  signal: AbortSignal,
): Promise<Map<string, PageSummaryResponse>> {
  const unique = [...new Set(titles.map((title) => title.trim()).filter(Boolean))]
  const summaries = await Promise.all(
    unique.map(async (title) => {
      try {
        const summary = await fetchPageSummary(title, { lang: LANG, signal })
        return [title, summary] as const
      } catch {
        return [title, {}] as const
      }
    }),
  )

  return new Map(summaries)
}

let shared: FeaturedFeedState | null = null
let bindInit: (() => void) | null = null

function createState(): FeaturedFeedState {
  const sections = ref<FeaturedSection[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let loadedCacheKey = ''
  let abortController: AbortController | null = null

  function currentCacheKey(): string {
    return featuredFeedCacheKey(LANG, new Date())
  }

  function hydrateFromStorage(cacheKey: string): boolean {
    const stored = readFeaturedCache(cacheKey)
    if (!stored) return false

    sections.value = stored.sections
    error.value = stored.error
    loadedCacheKey = cacheKey
    loading.value = false
    return true
  }

  async function runFetch(fetchCacheKey: string): Promise<void> {
    abortController?.abort()
    abortController = new AbortController()
    const signal = abortController.signal

    loading.value = true
    error.value = null

    try {
      const [feed, births] = await Promise.all([
        fetchFeaturedFeed({ lang: LANG, signal }),
        fetchOnThisDayBirths({ lang: LANG, signal }),
      ])
      if (signal.aborted) return
      if (fetchCacheKey !== currentCacheKey()) return

      const dykTitles = (feed.dyk ?? [])
        .filter((item) => item.text?.trim())
        .slice(0, DYK_LIMIT)
        .flatMap((item) => {
          const title = primaryDykPageTitle(item)
          return title ? [title] : []
        })

      const summaryTitles = [
        ...new Set([
          ...(feed.tfa?.title ? [feed.tfa.title] : []),
          ...dykTitles,
        ]),
      ]
      const summariesByTitle = summaryTitles.length
        ? await fetchSummariesForTitles(summaryTitles, signal)
        : new Map<string, PageSummaryResponse>()

      if (signal.aborted) return
      if (fetchCacheKey !== currentCacheKey()) return

      const built = buildSections(feed, summariesByTitle, births)
      sections.value = built
      error.value = null
      loadedCacheKey = fetchCacheKey
      writeFeaturedCache(fetchCacheKey, built, null)
    } catch (fetchError) {
      if (fetchError instanceof FetchFeaturedFeedError && fetchError.code === 'aborted') return
      if ((fetchError as Error).name === 'AbortError') return
      if (fetchCacheKey !== currentCacheKey()) return

      error.value =
        fetchError instanceof Error ? fetchError.message : 'Could not load featured content.'
      sections.value = []
      loadedCacheKey = fetchCacheKey
      writeFeaturedCache(fetchCacheKey, [], error.value)
    } finally {
      if (!signal.aborted && fetchCacheKey === currentCacheKey()) {
        loading.value = false
      }
    }
  }

  function scheduleFetch(): void {
    const cacheKey = currentCacheKey()
    if (cacheKey === loadedCacheKey) return
    if (cacheKey.length && hydrateFromStorage(cacheKey)) return

    sections.value = []
    error.value = null
    loading.value = true
    void runFetch(cacheKey)
  }

  watch(
    () => currentCacheKey(),
    () => scheduleFetch(),
    { immediate: true },
  )

  bindInit = scheduleFetch

  return {
    sections: computed(() => sections.value),
    loading,
    error,
  }
}

/**
 * Today's English Wikipedia curated feed (TFA, DYK, born on this day).
 * Shared singleton; call once from the route shell to bind the fetch lifecycle.
 */
export function useFeaturedFeed(init = false): FeaturedFeedState {
  if (!shared) shared = createState()
  if (init) bindInit?.()
  return shared
}
