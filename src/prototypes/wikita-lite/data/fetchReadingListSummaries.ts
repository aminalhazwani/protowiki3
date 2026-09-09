import { mapWithConcurrency } from '@/lib/mapWithConcurrency'

import { normalizeEnwikiTitle } from '../../musical-group/data/enwikiTitle'

import { fetchPageSummary } from '../../musical-group/data/pageSummary'
import {
  getCachedSavedSummaries,
  setCachedSavedSummaries,
} from '../../musical-group/data/homeTabCache'
import type { HomeSavedItem } from '../../musical-group/data/types'
import {
  listReadingListSavedAt,
  readingListKey,
  readingListSavedPageId,
} from './readingListSavedPages'

const READING_LIST_SUMMARY_PURPOSE = 'wikita-lite-reading-list-summary'
const READING_LIST_REFILL_PURPOSE = 'wikita-lite-reading-list-summary-refill'

function savedItemNeedsRefill(item: HomeSavedItem): boolean {
  return !item.thumbnailUrl?.trim() || !item.description?.trim()
}

/** Backfill thumbnails/descriptions missing from cached saved summaries via REST page summary. */
export async function refillMissingSavedSummaries(
  items: HomeSavedItem[],
  signal?: AbortSignal,
): Promise<HomeSavedItem[]> {
  let changed = false
  const refilled = await Promise.all(
    items.map(async (item) => {
      if (!savedItemNeedsRefill(item)) return item

      const title = item.enwikiTitle?.trim() || item.title
      const summary = await fetchPageSummary(title, signal, READING_LIST_REFILL_PURPOSE)
      const thumbnailUrl = item.thumbnailUrl?.trim() || summary?.thumbnail?.source
      const description = item.description?.trim() || summary?.description?.trim() || ''
      const resolvedTitle = summary?.title?.trim() || item.title

      if (
        thumbnailUrl === item.thumbnailUrl &&
        description === item.description &&
        resolvedTitle === item.title
      ) {
        return item
      }

      changed = true
      return {
        ...item,
        title: resolvedTitle,
        description,
        thumbnailUrl,
      }
    }),
  )

  return changed ? refilled : items
}

async function resolveReadingListItem(
  title: string,
  savedAt: number,
  signal?: AbortSignal,
): Promise<HomeSavedItem | null> {
  const enwikiTitle = normalizeEnwikiTitle(title)
  if (!enwikiTitle) return null

  const summary = await fetchPageSummary(enwikiTitle, signal, READING_LIST_SUMMARY_PURPOSE)

  return {
    id: readingListSavedPageId(enwikiTitle),
    title: summary?.title?.trim() || enwikiTitle,
    enwikiTitle,
    description: summary?.description?.trim() ?? '',
    thumbnailUrl: summary?.thumbnail?.source,
    savedAt,
  }
}

/** Resolve each reading-list title to display + lookup metadata (cache-first). */
export async function fetchReadingListSummaries(
  titles: string[],
  signal?: AbortSignal,
): Promise<HomeSavedItem[]> {
  const dependencyKey = readingListKey()
  const savedAtTimes = listReadingListSavedAt(titles)
  const cached = getCachedSavedSummaries(dependencyKey)

  if (cached?.length) {
    let items = cached.map((item, index) => ({
      ...item,
      savedAt: savedAtTimes[index] ?? item.savedAt,
    }))

    if (items.some(savedItemNeedsRefill)) {
      items = await refillMissingSavedSummaries(items, signal)
      setCachedSavedSummaries(dependencyKey, items)
    }

    return items
  }

  const resolved = await mapWithConcurrency(
    titles.map((title, index) => ({ title, savedAt: savedAtTimes[index] })),
    3,
    ({ title, savedAt }) => resolveReadingListItem(title, savedAt, signal),
    signal,
  )

  let items = resolved.filter((item): item is HomeSavedItem => item !== null)
  items = await refillMissingSavedSummaries(items, signal)
  setCachedSavedSummaries(dependencyKey, items)
  return items
}
