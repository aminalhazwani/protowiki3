import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'

import { normalizeWikiUsername } from '@/config'
import {
  fetchEnrichedLatestRevisions,
  FetchRecentChangesError,
  resolveRecentChangePageTitles,
} from '@/lib/fetchRecentChanges'
import { formatEditSummaryForDisplay } from '@/lib/formatEditSummary'
import { normalizeTitleKey } from '@/lib/fetchMorelike'
import { formatRelativeTime, parseMediaWikiTimestamp } from '@/lib/mediaWikiTime'

export interface RecentChange {
  title: string
  description: string
  thumbnailSrc?: string
  editor: string
  relativeTime: string
  editSummary: string
}

export interface RecentChangesState {
  changes: Ref<RecentChange[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  count: ComputedRef<number>
}

export interface RecentChangesSeedState {
  interests: string[]
  isRealUser: boolean
  realUsername: string
  lang: string
  cacheKey: string
}

const STORAGE_KEY = 'protowiki:no-distractions:recent-changes:v3'

interface StoredRecentChangesCache {
  cacheKey: string
  changes: RecentChange[]
  error: string | null
}

function seedsKey(seeds: string[]): string {
  return seeds
    .map((seed) => seed.trim())
    .filter(Boolean)
    .map(normalizeTitleKey)
    .sort()
    .join('\u0000')
}

export function resolveRecentChangesCacheKey(
  interests: string[],
  isRealUser: boolean,
  realUsername: string,
): string {
  const seedKey = seedsKey(interests)
  if (!seedKey.length && !isRealUser) return ''

  const userKey = isRealUser && realUsername.trim()
    ? normalizeWikiUsername(realUsername).toLowerCase()
    : 'off'

  return `interests:${seedKey}|user:${userKey}|real:${isRealUser ? '1' : '0'}`
}

function readCache(cacheKey: string): StoredRecentChangesCache | null {
  if (typeof localStorage === 'undefined' || !cacheKey.length) return null

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredRecentChangesCache
    if (parsed.cacheKey !== cacheKey || !Array.isArray(parsed.changes)) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(
  cacheKey: string,
  changes: RecentChange[],
  cachedError: string | null,
): void {
  if (typeof localStorage === 'undefined' || !cacheKey.length) return

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ cacheKey, changes, error: cachedError }),
    )
  } catch {
    // Ignore quota / private-mode failures.
  }
}

function clearCache(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore.
  }
}

let shared: RecentChangesState | null = null
let bindSeeds: ((getter: () => RecentChangesSeedState) => void) | null = null

function createState(): RecentChangesState {
  const changes = ref<RecentChange[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const count = computed(() => changes.value.length)

  const seedStateGetterRef = ref<() => RecentChangesSeedState>(() => ({
    interests: [],
    isRealUser: false,
    realUsername: '',
    lang: 'en',
    cacheKey: '',
  }))
  let loadedCacheKey = ''
  let abortController: AbortController | null = null
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function hydrateFromStorage(cacheKey: string): boolean {
    const stored = readCache(cacheKey)
    if (!stored) return false

    changes.value = stored.changes
    error.value = stored.error
    loadedCacheKey = cacheKey
    loading.value = false
    return true
  }

  async function runFetch(fetchCacheKey: string): Promise<void> {
    abortController?.abort()

    const { interests, isRealUser, realUsername, lang } = seedStateGetterRef.value()

    abortController = new AbortController()
    const signal = abortController.signal
    loading.value = true
    error.value = null

    try {
      const titles = await resolveRecentChangePageTitles(interests, {
        isRealUser,
        realUsername,
        lang,
        signal,
      })

      if (signal.aborted) return
      if (fetchCacheKey !== seedStateGetterRef.value().cacheKey) return

      if (!titles.length) {
        changes.value = []
        loadedCacheKey = fetchCacheKey
        clearCache()
        return
      }

      const enriched = await fetchEnrichedLatestRevisions(titles, { lang, signal })
      if (signal.aborted) return
      if (fetchCacheKey !== seedStateGetterRef.value().cacheKey) return

      const sorted = [...enriched].sort(
        (a, b) =>
          parseMediaWikiTimestamp(b.timestamp).getTime() -
          parseMediaWikiTimestamp(a.timestamp).getTime(),
      )

      const mapped = sorted.map((item) => ({
        title: item.title,
        description: item.description,
        thumbnailSrc: item.thumbnailSrc,
        editor: item.editor,
        relativeTime: formatRelativeTime(item.timestamp),
        editSummary: formatEditSummaryForDisplay(item.comment),
      }))

      changes.value = mapped
      loadedCacheKey = fetchCacheKey
      writeCache(fetchCacheKey, mapped, null)
    } catch (fetchError) {
      if (fetchError instanceof FetchRecentChangesError && fetchError.code === 'aborted') {
        return
      }
      if ((fetchError as Error).name === 'AbortError') return
      if (fetchCacheKey !== seedStateGetterRef.value().cacheKey) return
      error.value =
        fetchError instanceof Error ? fetchError.message : 'Could not load recent changes.'
      changes.value = []
      loadedCacheKey = fetchCacheKey
    } finally {
      if (!signal.aborted && fetchCacheKey === seedStateGetterRef.value().cacheKey) {
        loading.value = false
      }
    }
  }

  function scheduleFetch(cacheKey: string): void {
    if (cacheKey === loadedCacheKey) return
    if (cacheKey.length && hydrateFromStorage(cacheKey)) return

    if (debounceTimer) clearTimeout(debounceTimer)
    changes.value = []
    error.value = null
    loading.value = cacheKey.length > 0

    debounceTimer = setTimeout(() => {
      const { cacheKey: currentKey } = seedStateGetterRef.value()
      if (currentKey !== cacheKey) return
      void runFetch(currentKey)
    }, 400)
  }

  watch(
    () => seedStateGetterRef.value().cacheKey,
    (cacheKey) => scheduleFetch(cacheKey),
  )

  bindSeeds = (getter: () => RecentChangesSeedState) => {
    seedStateGetterRef.value = getter
    const { cacheKey } = getter()
    if (cacheKey === loadedCacheKey) {
      loading.value = false
      return
    }
    if (cacheKey.length && hydrateFromStorage(cacheKey)) return
    scheduleFetch(cacheKey)
  }

  return { changes, loading, error, count }
}

export function useRecentChanges(
  seedState?: () => RecentChangesSeedState,
): RecentChangesState {
  if (!shared) shared = createState()
  if (seedState) bindSeeds?.(seedState)
  return shared
}
