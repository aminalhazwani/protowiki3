import { loadConfig } from '@/config'

import { normalizeEnwikiTitle } from '../../musical-group/data/enwikiTitle'
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

export function isTitleInReadingList(title: string): boolean {
  const key = normalizeEnwikiTitle(title).toLowerCase()
  if (!key) return false
  return listReadingListTitles().some(
    (entry) => normalizeEnwikiTitle(entry).toLowerCase() === key,
  )
}

/** Synthetic saved items from reading-list titles — no API lookup. */
export function readingListToSavedItems(titles: string[]): HomeSavedItem[] {
  return titles
    .map((title, index) => {
      const enwikiTitle = normalizeEnwikiTitle(title)
      if (!enwikiTitle) return null

      return {
        id: readingListSavedPageId(enwikiTitle),
        title: enwikiTitle,
        enwikiTitle,
        description: '',
        savedAt: titles.length - index,
      }
    })
    .filter((item): item is HomeSavedItem => item !== null)
}
