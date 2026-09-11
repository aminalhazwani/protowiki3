import { backfillReadingListSavedAt, loadConfig } from '@/config'

import { getCachedSavedSummaries } from '../../musical-group/data/homeTabCache'
import { normalizeEnwikiTitle } from '../../musical-group/data/enwikiTitle'
import { getCachedItemThumbnail } from '../../musical-group/data/itemThumbnailCache'
import type { HomeSavedItem } from '../../musical-group/data/types'

/** Stable id for a reading-list entry (title-based, not Wikidata QID). */
export function readingListSavedPageId(title: string): string {
  return `reading:${normalizeEnwikiTitle(title).toLowerCase()}`
}

export function readingListKey(): string {
  const config = loadConfig()
  return (config.userPageLists[config.user]?.readingList ?? [])
    .map((title) => normalizeEnwikiTitle(title).toLowerCase())
    .join('|')
}

export function listReadingListTitles(): string[] {
  const config = loadConfig()
  return [...(config.userPageLists[config.user]?.readingList ?? [])]
}

export function listReadingListSavedAt(titles?: readonly string[]): number[] {
  const config = loadConfig()
  const lists = config.userPageLists[config.user]
  const readingList = titles ?? lists?.readingList ?? []
  return backfillReadingListSavedAt(readingList, lists?.readingListSavedAt ?? [])
}

export function isTitleInReadingList(title: string): boolean {
  const key = normalizeEnwikiTitle(title).toLowerCase()
  if (!key) return false
  return listReadingListTitles().some(
    (entry) => normalizeEnwikiTitle(entry).toLowerCase() === key,
  )
}

function mergeCachedSavedThumbnail(item: HomeSavedItem): HomeSavedItem {
  if (item.thumbnailUrl?.trim()) return item

  const url = getCachedItemThumbnail(item.id)
  return url ? { ...item, thumbnailUrl: url } : item
}

/** Synthetic saved items from reading-list titles — no API lookup. */
export function readingListToSavedItems(titles: string[]): HomeSavedItem[] {
  const savedAtTimes = listReadingListSavedAt(titles)

  return titles
    .map((title, index) => {
      const enwikiTitle = normalizeEnwikiTitle(title)
      if (!enwikiTitle) return null

      return mergeCachedSavedThumbnail({
        id: readingListSavedPageId(enwikiTitle),
        title: enwikiTitle,
        enwikiTitle,
        description: '',
        savedAt: savedAtTimes[index],
      })
    })
    .filter((item): item is HomeSavedItem => item !== null)
}

/** Synthetic items merged with cached REST summaries when available. */
export function resolveReadingListSavedItems(titles: string[]): HomeSavedItem[] {
  const synthetic = readingListToSavedItems(titles)
  const cached = getCachedSavedSummaries(readingListKey())
  if (!cached?.length) return synthetic

  const byId = new Map(cached.map((item) => [item.id, item]))
  return synthetic.map((item) => {
    const enriched = byId.get(item.id)
    if (!enriched) return item

    return mergeCachedSavedThumbnail({
      ...enriched,
      savedAt: item.savedAt,
    })
  })
}
