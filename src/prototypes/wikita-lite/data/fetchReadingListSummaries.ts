import { mapWithConcurrency } from '@/lib/mapWithConcurrency'

import { fetchEnwikiPageMetadata } from '../../musical-group/data/fetchEnwikiPageThumbnail'
import { setCachedItemThumbnail } from '../../musical-group/data/itemThumbnailCache'
import { normalizeEnwikiTitle } from '../../musical-group/data/enwikiTitle'
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

function cacheSavedItemThumbnail(item: HomeSavedItem): void {
  const url = item.thumbnailUrl?.trim()
  if (!url) return
  setCachedItemThumbnail(item.id, url)
}

/** Backfill thumbnails/descriptions missing from cached saved summaries. */
export async function refillMissingSavedSummaries(
  items: HomeSavedItem[],
  signal?: AbortSignal,
): Promise<HomeSavedItem[]> {
  let changed = false
  const refilled = await Promise.all(
    items.map(async (item) => {
      if (!savedItemNeedsRefill(item)) return item

      const title = item.enwikiTitle?.trim() || item.title
      const metadata = await fetchEnwikiPageMetadata(title, {
        signal,
        purpose: READING_LIST_REFILL_PURPOSE,
        bypassFailureCache: !item.thumbnailUrl?.trim() || !item.description?.trim(),
      })
      const thumbnailUrl = item.thumbnailUrl?.trim() || metadata.thumbnailUrl
      const description = item.description?.trim() || metadata.description?.trim() || ''
      const resolvedTitle = metadata.title?.trim() || item.title

      if (
        thumbnailUrl === item.thumbnailUrl &&
        description === item.description &&
        resolvedTitle === item.title
      ) {
        return item
      }

      changed = true
      const updated = {
        ...item,
        title: resolvedTitle,
        description,
        thumbnailUrl,
      }
      cacheSavedItemThumbnail(updated)
      return updated
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

  const metadata = await fetchEnwikiPageMetadata(enwikiTitle, {
    signal,
    purpose: READING_LIST_SUMMARY_PURPOSE,
  })

  const item: HomeSavedItem = {
    id: readingListSavedPageId(enwikiTitle),
    title: metadata.title?.trim() || enwikiTitle,
    enwikiTitle,
    description: metadata.description?.trim() ?? '',
    thumbnailUrl: metadata.thumbnailUrl,
    savedAt,
  }
  cacheSavedItemThumbnail(item)
  return item
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
