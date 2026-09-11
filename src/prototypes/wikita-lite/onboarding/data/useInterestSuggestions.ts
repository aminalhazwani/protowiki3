import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

import {
  fetchMorelikeSuggestions,
  fetchRandomSuggestions,
  sortByLastEdit,
} from './fetchMorelikeSuggestions'
import { normalizeTitleKey } from './titleKey'

const POOL_LIMIT = 24
const TAKE_PER_ORDER = 3
const DISPLAY_LIMIT = 5
const DEBOUNCE_MS = 300

export type InterestSuggestionsSource = 'morelike' | 'random'

export interface InterestSuggestionHit {
  title: string
  description: string
  thumbnail?: { url: string; width?: number; height?: number } | null
}

export interface InterestSuggestionsState {
  suggestions: Ref<InterestSuggestionHit[]>
  loading: Ref<boolean>
  error: Ref<string>
  source: Ref<InterestSuggestionsSource>
}

function blendHits(
  relevance: InterestSuggestionHit[],
  recent: InterestSuggestionHit[],
  excludeKeys: Set<string>,
  limit: number,
): InterestSuggestionHit[] {
  const merged: InterestSuggestionHit[] = []
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

export function useInterestSuggestions(
  getInterests: () => string[],
): InterestSuggestionsState {
  const suggestions = ref<InterestSuggestionHit[]>([])
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

    if (!seeds.length) {
      source.value = 'random'
      try {
        suggestions.value = await fetchRandomSuggestions(DISPLAY_LIMIT, controller.signal)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        error.value = (err as Error).message || 'Could not load suggestions'
        suggestions.value = []
      } finally {
        if (abortController === controller) loading.value = false
      }
      return
    }

    source.value = 'morelike'

    try {
      const seed = seeds[seeds.length - 1]
      const pool = await fetchMorelikeSuggestions(seed, POOL_LIMIT, controller.signal)
      const excludeKeys = new Set(seeds.map(normalizeTitleKey))

      const relevance = pool.slice(0, TAKE_PER_ORDER)
      const recent = sortByLastEdit(pool).slice(0, TAKE_PER_ORDER)

      suggestions.value = blendHits(relevance, recent, excludeKeys, DISPLAY_LIMIT)
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      error.value = (err as Error).message || 'Could not load suggestions'
      suggestions.value = []
    } finally {
      if (abortController === controller) loading.value = false
    }
  }

  watch(
    getInterests,
    (interests) => {
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
