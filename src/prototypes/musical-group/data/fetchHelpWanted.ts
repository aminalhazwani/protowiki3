import { backgroundSignal } from '@/lib/fetchWikimedia'

import { bookmarksKey } from './cacheKeys'
import { normalizeEnwikiTitle } from './enwikiTitle'
import {
  fetchEditSuggestionForPage,
  fetchSavedSuggestionsUpToLimit,
} from './fetchEditSuggestion'
import { fetchMorelikeTitles, resolveRelatedSummary } from './fetchRelatedReading'
import {
  getCachedHelpWanted,
  isCachedHelpWantedComplete,
  setCachedHelpWanted,
} from './homeTabCache'
import type { HomeHelpWanted, HomeSavedItem } from './types'

const DEFAULT_HELP_WANTED_LIMIT = 2

/**
 * Shared across the repeated `fetchUnsavedSuggestion` calls of one run, which
 * would otherwise redo the same morelike searches and re-check the same titles
 * that already came back without a suggestion.
 */
interface UnsavedSearchContext {
  morelikeBySeed: Map<string, Promise<string[]>>
  /** Titles already tried, or taken by a concurrent search. */
  rejectedTitles: Set<string>
  /** Wikidata items taken by a concurrent search (two titles can share one). */
  claimedIds: Set<string>
}

/** Unsaved suggestions searched for at once; each is a long sequential chain. */
const UNSAVED_SEARCH_CONCURRENCY = 2

function newSearchContext(): UnsavedSearchContext {
  return { morelikeBySeed: new Map(), rejectedTitles: new Set(), claimedIds: new Set() }
}

async function fetchUnsavedSuggestion(
  items: HomeSavedItem[],
  signal?: AbortSignal,
  existing: HomeHelpWanted[] = [],
  context: UnsavedSearchContext = newSearchContext(),
): Promise<HomeHelpWanted | null> {
  const seeds = items.filter((item) => item.enwikiTitle)
  if (!seeds.length) return null

  const excludedTitles = new Set<string>()
  const excludedIds = new Set<string>()
  for (const item of items) {
    excludedIds.add(item.id)
    if (item.enwikiTitle) {
      excludedTitles.add(normalizeEnwikiTitle(item.enwikiTitle).toLowerCase())
    }
  }
  for (const suggestion of existing) {
    excludedIds.add(suggestion.itemId)
    if (suggestion.enwikiTitle) {
      excludedTitles.add(normalizeEnwikiTitle(suggestion.enwikiTitle).toLowerCase())
    }
  }

  const shuffledSeeds = [...seeds].sort(() => Math.random() - 0.5)

  for (const seed of shuffledSeeds) {
    const seedTitle = seed.enwikiTitle as string
    let titlesPromise = context.morelikeBySeed.get(seedTitle)
    if (!titlesPromise) {
      titlesPromise = fetchMorelikeTitles(seedTitle, signal, 8)
      context.morelikeBySeed.set(seedTitle, titlesPromise)
    }
    const titles = await titlesPromise

    for (const title of titles) {
      const titleKey = normalizeEnwikiTitle(title).toLowerCase()
      if (excludedTitles.has(titleKey) || context.rejectedTitles.has(titleKey)) continue
      // Claim it before awaiting, so a concurrent search skips it.
      context.rejectedTitles.add(titleKey)

      const summary = await resolveRelatedSummary(title, seed.title, signal)
      if (
        !summary?.itemId ||
        excludedIds.has(summary.itemId) ||
        context.claimedIds.has(summary.itemId)
      ) {
        continue
      }
      context.claimedIds.add(summary.itemId)

      excludedTitles.add(titleKey)
      excludedIds.add(summary.itemId)

      const suggestion = await fetchEditSuggestionForPage(
        {
          itemId: summary.itemId,
          title: summary.title,
          enwikiTitle: title,
          description: summary.description,
          thumbnailUrl: summary.thumbnailUrl,
        },
        seed.title,
        signal,
        'musical-group-help-wanted',
      )
      if (suggestion) return suggestion
    }
  }

  return null
}

/** Edit suggestions for saved pages and related articles. */
export async function fetchHelpWanted(
  seedItems: HomeSavedItem[],
  signal?: AbortSignal,
  limit = DEFAULT_HELP_WANTED_LIMIT,
  options?: {
    onEach?: (suggestion: HomeHelpWanted) => void
    dependencyKey?: string
    /** When false, skip direct edit suggestions on saved pages. Default true. */
    includeSavedSuggestions?: boolean
    /** Saved bookmark summaries for the direct-suggestion leg. Defaults to seedItems. */
    savedItems?: HomeSavedItem[]
    /** Suggestions past this many (the "Show more" ones) load at low queue priority. */
    foregroundCount?: number
  },
): Promise<HomeHelpWanted[]> {
  const dependencyKey = options?.dependencyKey ?? bookmarksKey()
  const cached = getCachedHelpWanted(dependencyKey)
  if (cached && (cached.length >= limit || isCachedHelpWantedComplete(dependencyKey))) {
    return cached.slice(0, limit)
  }

  const includeSaved = options?.includeSavedSuggestions !== false
  const savedForDirect = options?.savedItems ?? seedItems

  const suggestions: HomeHelpWanted[] = []
  const foregroundCount = options?.foregroundCount
  let demotedSignal: AbortSignal | undefined
  const nextSignal = (): AbortSignal | undefined => {
    if (foregroundCount === undefined || suggestions.length < foregroundCount) return signal
    demotedSignal ??= backgroundSignal(signal)
    return demotedSignal
  }

  function persistPreviewCache(): void {
    if (suggestions.length) {
      setCachedHelpWanted(dependencyKey, suggestions)
    }
  }

  if (includeSaved) {
    await fetchSavedSuggestionsUpToLimit(savedForDirect, limit, signal, {
      onEach: (suggestion) => {
        suggestions.push(suggestion)
        options?.onEach?.(suggestion)
        persistPreviewCache()
      },
      userAgentSuffix: 'musical-group-help-wanted',
    })
  }

  const searchContext = newSearchContext()
  let exhausted = false
  const searchUnsaved = async (): Promise<void> => {
    while (suggestions.length < limit && !exhausted) {
      const unsavedSuggestion = await fetchUnsavedSuggestion(
        seedItems,
        nextSignal(),
        suggestions,
        searchContext,
      )
      if (!unsavedSuggestion) {
        exhausted = !signal?.aborted
        return
      }
      if (suggestions.length >= limit) return
      suggestions.push(unsavedSuggestion)
      options?.onEach?.(unsavedSuggestion)
      persistPreviewCache()
    }
  }
  const workers = Math.min(UNSAVED_SEARCH_CONCURRENCY, Math.max(0, limit - suggestions.length))
  await Promise.all(Array.from({ length: workers }, searchUnsaved))

  if (suggestions.length) {
    setCachedHelpWanted(dependencyKey, suggestions, { complete: exhausted })
  }
  return suggestions
}
