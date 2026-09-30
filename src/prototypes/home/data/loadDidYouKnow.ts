import { homeArticleLocation, normalizeTitle } from '../routes'
import { fetchFeaturedFeed } from './fetchFeaturedFeed'
import { fetchPageCards } from './fetchPageCards'
import { readDayCache, utcDayKey, writeDayCache } from './homeCache'
import type { HomeCardData } from './types'

const CACHE_SLOT = 'did-you-know'
const MAX_HOOKS = 12

interface DykHook {
  text: string
  /** The hook's first bold link — the article it's about. */
  pageTitle: string
  /** That link's text, shown bold in the hook. */
  emphasis: string
}

/** Parses a feed hook's HTML for its first bold link (`<b><a href=".../wiki/X">`). */
function parseHook(item: { html?: string; text?: string }): DykHook | null {
  const text = item.text?.trim()
  if (!text || !item.html) return null

  const doc = new DOMParser().parseFromString(item.html, 'text/html')
  const link = doc.querySelector<HTMLAnchorElement>('b a[href]')
  const match = link?.getAttribute('href')?.match(/\/wiki\/([^?#]+)/)
  if (!link || !match) return null

  return {
    text,
    pageTitle: normalizeTitle(match[1]),
    emphasis: (link.textContent ?? '').replace(/\s+/g, ' ').trim(),
  }
}

/** Today's "Did you know …" hooks, each with its bold article's thumbnail. */
export async function loadDidYouKnow(signal: AbortSignal): Promise<HomeCardData[]> {
  const day = utcDayKey()
  const cached = readDayCache<HomeCardData[]>(CACHE_SLOT, day)
  if (cached) return cached

  const { dyk } = await fetchFeaturedFeed(day)
  signal.throwIfAborted()

  const hooks = (dyk ?? [])
    .slice(0, MAX_HOOKS)
    .map(parseHook)
    .filter((hook): hook is DykHook => hook !== null)

  // Thumbnails are a nicety: if the lookup fails, the hooks still work.
  const info = await fetchPageCards(
    hooks.map((hook) => hook.pageTitle),
    signal,
  ).catch(() => [])

  const cards: HomeCardData[] = hooks.map((hook, index) => ({
    key: `dyk:${hook.pageTitle}`,
    title: hook.text,
    titleEmphasis: hook.emphasis,
    thumbnailUrl: info[index]?.thumbnailUrl,
    to: homeArticleLocation(hook.pageTitle),
  }))
  writeDayCache(CACHE_SLOT, day, cards)
  return cards
}
