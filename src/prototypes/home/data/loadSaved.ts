import { homeArticleLocation } from '../routes'
import { useHomeSaved } from '../useHomeSaved'
import { fetchPageCards } from './fetchPageCards'
import { formatAgo } from './relativeTime'
import type { HomeCardData } from './types'

const MAX_SAVED = 24

function formatSavedLabel(savedAt: number | undefined): string | undefined {
  return savedAt ? `Saved ${formatAgo(savedAt)}` : undefined
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
