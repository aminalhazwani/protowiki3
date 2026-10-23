import {
  cdxIconChartBar,
  cdxIconChartLine,
  cdxIconCheckAll,
  cdxIconEdit,
  cdxIconUserTalk,
} from '@wikimedia/codex-icons'

import { useConfig } from '@/composables/useConfig'

// The live stats are template-homepage's (Real user mode), shared rather than copied:
// the same fetcher and the same per-user cache.
import { fetchUserImpact } from '../../template-homepage/impact/data/fetchUserImpact'
import { getCachedImpact, setCachedImpact } from '../../template-homepage/impact/data/impactCache'
import type { ImpactData } from '../../template-homepage/impact/data/impactTypes'
import type { HomeCardData } from './types'

/** home2's Impact also counts reviewed edits — fictional, so not in template-homepage's type. */
type HomeImpact = ImpactData & { editsReviewed?: number | string }

/** The Experienced editor's numbers (home2's fixtures). */
const EXPERIENCED_IMPACT: HomeImpact = {
  viewCount: '628.7k',
  totalEdits: 30,
  thanksReceived: 2,
  longestStreak: '3 days',
  editsReviewed: 34,
}

/** A real account's stats are refetched once a day; the cache is template-homepage's. */
const LIVE_MAX_AGE_MS = 24 * 60 * 60_000

/** How `fetchUserImpact` marks a stat the public APIs can't give. */
function isMissing(value: unknown): boolean {
  return value === undefined || value === '' || value === '?' || value === '—'
}

/** Deterministic 0–1 generator, so an account always gets the same fictional numbers. */
function seededRandom(seed: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return (h >>> 0) / 4294967296
  }
}

function formatViews(total: number): string {
  if (total >= 1_000_000) return `${(total / 1_000_000).toFixed(1)}M`
  if (total >= 1000) return `${(total / 1000).toFixed(1)}k`
  return total.toLocaleString()
}

/**
 * Stats the live APIs can't provide (thanks, reviews; views or streak when
 * missing) get plausible fictional numbers scaled to the real edit count (home2).
 */
function withFictionalFallbacks(data: HomeImpact, username: string): HomeImpact {
  const random = seededRandom(username.toLowerCase())
  const edits = Math.max(data.totalEdits ?? 0, 1)
  const between = (min: number, max: number) => Math.round(min + random() * (max - min))
  const views = Math.round(edits * between(800, 4000) * (0.5 + random()))
  return {
    ...data,
    viewCount: isMissing(data.viewCount) ? formatViews(views) : data.viewCount,
    thanksReceived: isMissing(data.thanksReceived)
      ? Math.round(edits * (0.01 + random() * 0.04))
      : data.thanksReceived,
    editsReviewed: isMissing(data.editsReviewed)
      ? Math.round(edits * (0.05 + random() * 0.3))
      : data.editsReviewed,
    longestStreak: isMissing(data.longestStreak) ? `${between(2, 21)} days` : data.longestStreak,
  }
}

async function liveImpact(
  username: string,
  lang: string,
  signal: AbortSignal,
): Promise<ImpactData> {
  const cached = getCachedImpact(username, lang)
  if (cached && Date.now() - cached.fetchedAt < LIVE_MAX_AGE_MS) return cached.data
  const data = await fetchUserImpact(username, { signal, lang })
  setCachedImpact(username, data, lang)
  return data
}

function stat(
  key: string,
  value: unknown,
  label: string,
  icon: HomeCardData['icon'],
): HomeCardData {
  const title = isMissing(value)
    ? '–'
    : typeof value === 'number'
      ? value.toLocaleString()
      : String(value)
  return { key: `impact:${key}`, title, description: label, icon }
}

/** Whether the reader has impact to load — otherwise the module shows its empty state. */
export function hasImpact(): boolean {
  const { user, realUsername } = useConfig()
  return user.value === 'experienced' || (user.value === 'real' && !!realUsername.value.trim())
}

/**
 * The reader's impact as five stat cards: views on their articles across the
 * row, then edits, thanks, streak and reviews. Real user: their live numbers;
 * Experienced editor: fixtures. Anyone with no article edits gets none, which
 * the module shows as its empty state.
 */
export async function loadImpact(signal: AbortSignal): Promise<HomeCardData[]> {
  const { user, realUsername, realLang } = useConfig()

  if (!hasImpact()) return []
  let data: HomeImpact = EXPERIENCED_IMPACT
  if (user.value === 'real') {
    const live = await liveImpact(realUsername.value, realLang.value, signal)
    data = withFictionalFallbacks(live, realUsername.value)
  }
  if (!data.totalEdits) return []

  return [
    stat('views', `${data.viewCount} views`, "On articles you've edited", cdxIconChartLine),
    stat('edits', data.totalEdits, 'Total edits', cdxIconEdit),
    stat('thanks', data.thanksReceived, 'Thanks received', cdxIconUserTalk),
    stat('streak', data.longestStreak, 'Longest editing streak', cdxIconChartBar),
    stat('reviewed', data.editsReviewed, 'Edits reviewed', cdxIconCheckAll),
  ]
}
