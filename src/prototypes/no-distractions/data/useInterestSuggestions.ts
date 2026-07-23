import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

import {
  fetchMorelikeResultsBatched,
  fetchRandomPages,
  MorelikeFetchError,
  normalizeTitleKey,
  sortMorelikeHits,
  type MorelikeSearchHit,
} from '@/lib/fetchMorelike'
import { DEFAULT_MLT_CUSTOM } from '@/lib/morelikeMlt'

/** Size of the relevance-ordered pool fetched before blending. */
const POOL_LIMIT = 24
/** How many of each ordering (relevance / recent edit) to blend from. */
const TAKE_PER_ORDER = 3
/** Max suggestions surfaced to the user. */
const DISPLAY_LIMIT = 5
const DEBOUNCE_MS = 300

/** Which data source the current suggestions came from. */
export type InterestSuggestionsSource = 'morelike' | 'random'

export interface InterestSuggestionsState {
  suggestions: Ref<MorelikeSearchHit[]>
  loading: Ref<boolean>
  error: Ref<string>
  /** `'random'` when seeded from no interests (main-page start), else `'morelike'`. */
  source: Ref<InterestSuggestionsSource>
}

/**
 * Round-robin interleave two ordered hit lists, deduped by title, capped.
 * Produces `[a0, b0, a1, b1, …]` so both orderings are represented near the top.
 */
function blendHits(
  relevance: MorelikeSearchHit[],
  recent: MorelikeSearchHit[],
  excludeKeys: Set<string>,
  limit: number,
): MorelikeSearchHit[] {
  const merged: MorelikeSearchHit[] = []
  const seen = new Set<string>(excludeKeys)
  const max = Math.max(relevance.length, recent.length)

  for (let i = 0; i < max && merged.length < limit; i++) {
    for (const hit of [relevance[i], recent[i]]) {
      if (!hit || merged.length >= limit) continue
      const key = normalizeTitleKey(hit.title)
      if (seen.has(key)) continue
      seen.add(key)
      merged.push(hit)
    }
  }

  return merged
}

/**
 * Reactive morelike-based interest suggestions derived from the currently
 * selected interests. Blends a few highest-relevance hits with a few
 * most-recently-edited hits (recent-edit ordering biases toward higher-notability
 * pages) — see PR #9 tuning notes. Debounced + abortable; no caching (prototype).
 */
export function useInterestSuggestions(
  getInterests: () => string[],
  getLang: () => string,
  isFrozen: () => boolean = () => false,
): InterestSuggestionsState {
  const suggestions = ref<MorelikeSearchHit[]>([])
  const loading = ref(false)
  const error = ref('')
  const source = ref<InterestSuggestionsSource>('morelike')

  let abortController: AbortController | null = null
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  async function runFetch(interests: string[]): Promise<void> {
    abortController?.abort()

    const seeds = interests.map((title) => title.trim()).filter(Boolean)

    const controller = new AbortController()
    abortController = controller
    loading.value = true
    error.value = ''

    // No seed article (e.g. account creation from the main page): fall back to
    // random articles so the block isn't empty.
    if (!seeds.length) {
      source.value = 'random'
      try {
        suggestions.value = await fetchRandomPages({
          limit: DISPLAY_LIMIT,
          lang: getLang(),
          signal: controller.signal,
        })
      } catch (err) {
        const aborted =
          (err as Error).name === 'AbortError' ||
          (err instanceof MorelikeFetchError && err.code === 'aborted')
        if (aborted) return
        error.value = (err as Error).message || 'Could not load suggestions'
        suggestions.value = []
      } finally {
        if (abortController === controller) loading.value = false
      }
      return
    }

    source.value = 'morelike'

    try {
      const pool = await fetchMorelikeResultsBatched(seeds, {
        limit: POOL_LIMIT,
        maxCalls: 3,
        mltPreset: 'default',
        mltCustom: DEFAULT_MLT_CUSTOM,
        lang: getLang(),
        signal: controller.signal,
      })

      const relevance = pool.slice(0, TAKE_PER_ORDER)
      const recent = sortMorelikeHits(pool, 'lastEdit').slice(0, TAKE_PER_ORDER)
      const excludeKeys = new Set(seeds.map(normalizeTitleKey))

      suggestions.value = blendHits(relevance, recent, excludeKeys, DISPLAY_LIMIT)
    } catch (err) {
      const aborted =
        (err as Error).name === 'AbortError' ||
        (err instanceof MorelikeFetchError && err.code === 'aborted')
      if (aborted) return
      error.value = (err as Error).message || 'Could not load suggestions'
      suggestions.value = []
    } finally {
      if (abortController === controller) loading.value = false
    }
  }

  let hasFetched = false
  watch(
    getInterests,
    (interests) => {
      // Once the interest cap is reached, freeze the current suggestions: adding
      // the final interest must not swap the list for a new set the user can't
      // act on (the pills are disabled at the cap). Removing an interest drops
      // below the cap and refetches. The first run always fetches so a direct
      // load already at the cap isn't left with an empty section.
      if (hasFetched && isFrozen()) return
      hasFetched = true
      // Reflect the pending fetch synchronously (before the debounce) so the
      // section heading + progress bar are visible the instant the view mounts,
      // and the heading matches the source that runFetch will use.
      source.value = interests.some((title) => title.trim()) ? 'morelike' : 'random'
      loading.value = true
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => void runFetch(interests), DEBOUNCE_MS)
    },
    { immediate: true, deep: true },
  )

  onBeforeUnmount(() => {
    abortController?.abort()
    if (debounceTimer) clearTimeout(debounceTimer)
  })

  return { suggestions, loading, error, source }
}
