import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'

import {
  fetchMorelikeResultsBatched,
  MorelikeFetchError,
  normalizeTitleKey,
} from '@/lib/fetchMorelike'
import { fetchMicrotaskQuality, pickPrimaryNeed } from '@/lib/fetchMicrotaskQuality'
import { DEFAULT_MLT_CUSTOM } from '@/lib/morelikeMlt'

import { pickTaskForTitle, type TaskColor } from './microtaskCatalog'

export interface Suggestion {
  title: string
  description: string
  thumbnailSrc?: string
  taskHeading: string
  taskDescription: string
  taskColor: TaskColor
}

export interface SuggestionsState {
  suggestions: Ref<Suggestion[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  count: ComputedRef<number>
}

export interface SuggestionSeedState {
  seeds: string[]
  /** Stable identity for cache hits — refetch only when this changes. */
  cacheKey: string
}

const RESULT_LIMIT = 20
const LANG = 'en'

let shared: SuggestionsState | null = null
let bindSeeds: ((getter: () => SuggestionSeedState) => void) | null = null

/** Stable key for comparing interest seed sets (order-insensitive). */
function seedsKey(seeds: string[]): string {
  return seeds
    .map((seed) => seed.trim())
    .filter(Boolean)
    .map(normalizeTitleKey)
    .sort()
    .join('\u0000')
}

/** Dedupe seeds for fetch while preserving picker order. */
function orderedSeeds(seeds: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of seeds) {
    const title = raw.trim()
    if (!title.length) continue
    const key = normalizeTitleKey(title)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(title)
  }
  return out
}

/**
 * Cache identity for suggestion fetches. When interests come from the URL param,
 * only the interest set matters. When they are implicit (seeded from the picked
 * article), include the title so a title change invalidates the cache.
 */
export function resolveSuggestionSeedState(
  interests: string[],
  title: string,
  hasExplicitInterests: boolean,
): SuggestionSeedState {
  const seeds = interests
  const seedKey = seedsKey(seeds)
  if (!seedKey.length) {
    return { seeds: [], cacheKey: '' }
  }
  const cacheKey = hasExplicitInterests
    ? `interests:${seedKey}`
    : `title:${normalizeTitleKey(title)}:${seedKey}`
  return { seeds, cacheKey }
}

function createState(): SuggestionsState {
  const suggestions = ref<Suggestion[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const count = computed(() => suggestions.value.length)

  const seedStateGetterRef = ref<() => SuggestionSeedState>(() => ({
    seeds: [],
    cacheKey: '',
  }))
  let loadedCacheKey = ''
  let abortController: AbortController | null = null
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  async function assignTasks(
    hits: { title: string; description: string; thumbnail?: { url: string } }[],
    signal: AbortSignal,
  ): Promise<Suggestion[]> {
    let needByTitle = new Map<string, string | null>()
    try {
      const quality = await fetchMicrotaskQuality(
        hits.map((hit) => hit.title),
        { lang: LANG, signal },
      )
      needByTitle = new Map(
        quality.map((result) => [normalizeTitleKey(result.title), pickPrimaryNeed(result)]),
      )
    } catch {
      // Microtask Generator can be slow/unavailable — fall back to per-title tasks.
    }

    return hits.map((hit) => {
      const need = needByTitle.get(normalizeTitleKey(hit.title)) ?? null
      const task = pickTaskForTitle(hit.title, need)
      return {
        title: hit.title,
        description: hit.description || 'No description available.',
        thumbnailSrc: hit.thumbnail?.url,
        taskHeading: task.heading,
        taskDescription: task.description,
        taskColor: task.color,
      }
    })
  }

  async function runFetch(seeds: string[], fetchCacheKey: string): Promise<void> {
    abortController?.abort()

    if (!seeds.length) {
      suggestions.value = []
      error.value = null
      loadedCacheKey = ''
      loading.value = false
      return
    }

    abortController = new AbortController()
    const signal = abortController.signal
    loading.value = true
    error.value = null

    try {
      const hits = await fetchMorelikeResultsBatched(orderedSeeds(seeds), {
        limit: RESULT_LIMIT,
        mltPreset: 'default',
        mltCustom: DEFAULT_MLT_CUSTOM,
        lang: LANG,
        signal,
        maxCalls: 3,
      })

      const assigned = await assignTasks(hits, signal)
      if (signal.aborted) return
      // Drop stale responses when interests/title changed mid-flight.
      if (fetchCacheKey !== seedStateGetterRef.value().cacheKey) return
      suggestions.value = assigned
      loadedCacheKey = fetchCacheKey
    } catch (fetchError) {
      if (fetchError instanceof MorelikeFetchError && fetchError.code === 'aborted') return
      if ((fetchError as Error).name === 'AbortError') return
      if (fetchCacheKey !== seedStateGetterRef.value().cacheKey) return
      error.value =
        fetchError instanceof Error ? fetchError.message : 'Could not load suggestions.'
      suggestions.value = []
      loadedCacheKey = fetchCacheKey
    } finally {
      if (!signal.aborted && fetchCacheKey === seedStateGetterRef.value().cacheKey) {
        loading.value = false
      }
    }
  }

  function scheduleFetch(cacheKey: string): void {
    if (cacheKey === loadedCacheKey) return

    if (debounceTimer) clearTimeout(debounceTimer)
    suggestions.value = []
    error.value = null
    loading.value = cacheKey.length > 0

    debounceTimer = setTimeout(() => {
      const { seeds, cacheKey: currentKey } = seedStateGetterRef.value()
      if (currentKey !== cacheKey) return
      void runFetch(seeds, currentKey)
    }, 400)
  }

  watch(
    () => seedStateGetterRef.value().cacheKey,
    (cacheKey) => scheduleFetch(cacheKey),
  )

  bindSeeds = (getter: () => SuggestionSeedState) => {
    seedStateGetterRef.value = getter
    const { cacheKey } = getter()
    if (cacheKey === loadedCacheKey) {
      loading.value = false
      return
    }
    scheduleFetch(cacheKey)
  }

  return { suggestions, loading, error, count }
}

/**
 * Suggested edits seeded by morelike (similar articles) + the microtask
 * generator (which edit each article needs). Shared singleton so the home and
 * all-suggestions screens reuse one fetch when the cache key is unchanged.
 *
 * Pass a seed-state getter once from the route shell; child screens call
 * `useSuggestions()` with no args to read the shared cache.
 */
export function useSuggestions(
  seedState?: () => SuggestionSeedState,
): SuggestionsState {
  if (!shared) shared = createState()
  if (seedState) bindSeeds?.(seedState)
  return shared
}
