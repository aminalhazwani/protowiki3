import { homeArticleLocation } from '../routes'
import { useHomeSaved } from '../useHomeSaved'
import { fetchPageCards } from './fetchPageCards'
import type { HomeCardData } from './types'

const MAX_SAVED = 24

function formatSavedLabel(savedAt: number | undefined): string | undefined {
  if (!savedAt) return undefined
  const minutes = Math.floor((Date.now() - savedAt) / 60_000)
  if (minutes < 1) return 'Saved just now'
  if (minutes < 60) return `Saved ${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Saved ${hours}h ago`
  return `Saved ${Math.floor(hours / 24)}d ago`
}

/** The reader's saved pages, newest first, with their summaries. Not day-cached: it's live. */
export async function loadSaved(signal: AbortSignal): Promise<HomeCardData[]> {
  const { savedTitles, savedTime } = useHomeSaved()
  const titles = savedTitles.value.slice(0, MAX_SAVED)

  // A failed lookup still leaves titled cards.
  const info = await fetchPageCards(titles, signal).catch(() => [])

  return titles.map((title, index) => ({
    key: `saved:${title}`,
    title: info[index]?.title ?? title,
    pageTitle: title,
    description: info[index]?.description,
    thumbnailUrl: info[index]?.thumbnailUrl,
    to: homeArticleLocation(title),
    supportingText: formatSavedLabel(savedTime(title)),
  }))
}
