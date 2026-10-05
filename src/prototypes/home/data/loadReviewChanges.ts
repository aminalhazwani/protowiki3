import {
  cdxIconAlert,
  cdxIconEditUndo,
  cdxIconInfo,
  cdxIconReference,
  cdxIconUserAdd,
} from '@wikimedia/codex-icons'

import { mapWithConcurrency } from '@/lib/mapWithConcurrency'

import { useHomeSeeds } from '../useHomeSeeds'
import { formatEditSummary } from './editSummary'
import {
  diffUrl,
  fetchDiff,
  fetchEditCounts,
  fetchLatestRevisions,
  fetchRecentEdits,
  type Revision,
  type RevisionDiff,
} from './fetchRevisions'
import { readDayCache, utcDayKey, writeDayCache } from './homeCache'
import { predictRevertRisk, predictToneIssues } from './liftWing'
import { formatAgo } from './relativeTime'
import type { HomeCardChip, HomeCardData } from './types'

/** Three pages of four when personalised; a single change for a stranger (home2). */
export const PERSONAL_CHANGE_COUNT = 12
export const RANDOM_CHANGE_COUNT = 1
/** Recent edits scored for a stranger; the first one worth a look wins. */
const RANDOM_POOL = 4
const CONCURRENCY = 2

// Thresholds from home2.
const TONE_THRESHOLD = 0.8
const REVERT_RISK_THRESHOLD = 0.7
/** Edit Check's "add a reference" rule: this much new prose with no citation. */
const UNSOURCED_MIN_CHARS = 50
/** Visible characters changed that make an edit a major change. */
const MAJOR_CHANGE_MIN_CHARS = 500

/** At most one flag per edit, in priority order. */
type ReviewFlag = 'needs-reference' | 'tone' | 'revert-risk' | 'first-edit'

/** What review found in one revision — fixed per revid, so cached for the day. */
interface ReviewSignals {
  flag: ReviewFlag | null
  major: boolean
  /** The diff couldn't be read, so this is a guess: shown, but not cached. */
  partial?: boolean
}

const SIGNALS_CACHE_SLOT = 'review-signals'

const FLAG_CHIPS: Record<ReviewFlag, HomeCardChip> = {
  'needs-reference': { label: 'Needs a reference check', status: 'notice', icon: cdxIconReference },
  tone: { label: 'Tone issue', status: 'warning', icon: cdxIconAlert },
  'revert-risk': { label: 'High revert risk', status: 'warning', icon: cdxIconAlert },
  'first-edit': { label: "User's first edit", status: 'success', icon: cdxIconUserAdd },
}

/** Rough visible length of wikitext: link targets, quote marks and tags stripped. */
function visibleLength(wikitext: string): number {
  return wikitext
    .replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, '$1')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/''+/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim().length
}

function needsReference(diff: RevisionDiff): boolean {
  const added = diff.added.trim()
  if (visibleLength(added) - visibleLength(diff.removed) < UNSOURCED_MIN_CHARS) return false
  if (/<ref[\s>]/i.test(added)) return false
  return !/^\[\[(Category|File|Image):[^\]]+\]\]$/i.test(added)
}

/**
 * Review signals for each revision (after home2's review feed): its diff, the
 * revert-risk model, one batched tone check and one batched edit-count lookup.
 * Every signal is optional — a failed lookup just means no flag.
 */
async function reviewRevisions(
  revisions: Revision[],
  signal: AbortSignal,
): Promise<ReviewSignals[]> {
  const firstEditors = [...new Set(revisions.filter((r) => r.registered).map((r) => r.user))]
  const [diffs, risks, editCounts] = await Promise.all([
    mapWithConcurrency(
      revisions,
      CONCURRENCY,
      (r) => (r.parentid ? fetchDiff(r.parentid, r.revid, signal).catch(() => null) : null),
      signal,
    ),
    mapWithConcurrency(revisions, 4, (r) => predictRevertRisk(r.revid, signal), signal),
    fetchEditCounts(firstEditors, signal).catch(() => new Map<string, number>()),
  ])

  const toneIndexes = revisions.flatMap((_, i) => (diffs[i]?.addedLines.trim() ? [i] : []))
  const toneScores = await predictToneIssues(
    toneIndexes.map((i) => ({
      title: revisions[i].title,
      before: diffs[i]!.removedLines || diffs[i]!.addedLines,
      after: diffs[i]!.addedLines,
    })),
    signal,
  )
  const tone = new Map(toneIndexes.map((revIndex, i) => [revIndex, toneScores[i]]))

  return revisions.map((revision, i) => {
    const diff = diffs[i]
    const major = diff
      ? visibleLength(diff.added) + visibleLength(diff.removed) >= MAJOR_CHANGE_MIN_CHARS
      : false
    let flag: ReviewFlag | null = null
    if (diff && needsReference(diff)) flag = 'needs-reference'
    else if ((tone.get(i) ?? 0) >= TONE_THRESHOLD) flag = 'tone'
    else if ((risks[i] ?? 0) >= REVERT_RISK_THRESHOLD) flag = 'revert-risk'
    else if (revision.registered && editCounts.get(revision.user) === 1) flag = 'first-edit'
    return { flag, major, partial: !diff && revision.parentid > 0 }
  })
}

/** Signals for each revision, scoring only those not already scored today. */
async function signalsFor(revisions: Revision[], signal: AbortSignal): Promise<ReviewSignals[]> {
  const day = utcDayKey()
  const cached = readDayCache<Record<string, ReviewSignals>>(SIGNALS_CACHE_SLOT, day) ?? {}
  const fresh = revisions.filter((r) => !cached[r.revid])
  const scored = await reviewRevisions(fresh, signal)
  const scoredByRevid = new Map(fresh.map((r, i) => [r.revid, scored[i]]))
  const complete = fresh.filter((r) => !scoredByRevid.get(r.revid)!.partial)
  if (complete.length) {
    for (const r of complete) cached[r.revid] = scoredByRevid.get(r.revid)!
    writeDayCache(SIGNALS_CACHE_SLOT, day, cached)
  }
  return revisions.map((r) => cached[r.revid] ?? scoredByRevid.get(r.revid)!)
}

/** Chips in home2's order: reverted, revert risk, major change, then any other flag. */
function chipsFor(revision: Revision, { flag, major }: ReviewSignals): HomeCardChip[] {
  const chips: HomeCardChip[] = []
  if (revision.reverted) chips.push({ label: 'Reverted', status: 'notice', icon: cdxIconEditUndo })
  // Already reverted: the risk has played out.
  if (flag === 'revert-risk' && !revision.reverted) chips.push(FLAG_CHIPS[flag])
  if (major) chips.push({ label: 'Major change', status: 'notice', icon: cdxIconInfo })
  if (flag && flag !== 'revert-risk') chips.push(FLAG_CHIPS[flag])
  return chips
}

function toCard(revision: Revision, signals: ReviewSignals): HomeCardData {
  return {
    key: `change:${revision.revid}`,
    title: revision.title,
    pageTitle: revision.title,
    description: formatEditSummary(revision.parsedComment, revision.comment),
    href: diffUrl(revision),
    supportingText: revision.user || 'Anonymous',
    supportingTime: formatAgo(Date.parse(revision.timestamp)),
    chips: chipsFor(revision, signals),
  }
}

/**
 * The latest edit to each of the reader's pages, newest first, flagged for
 * review ("High revert risk", "User's first edit"…). A reader with no pages
 * gets one live edit from anywhere on the wiki instead, preferring a flagged one.
 * The list itself is never cached: edits happen all day.
 */
export async function loadReviewChanges(signal: AbortSignal): Promise<HomeCardData[]> {
  const { seeds } = useHomeSeeds()

  if (!seeds.value.length) {
    const pool = await fetchRecentEdits(RANDOM_POOL, signal)
    const signals = await signalsFor(pool, signal)
    const pick = Math.max(
      0,
      signals.findIndex((s) => s.flag || s.major),
    )
    return pool.length ? [toCard(pool[pick], signals[pick])] : []
  }

  const revisions = (await fetchLatestRevisions(seeds.value, signal))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, PERSONAL_CHANGE_COUNT)
  const signals = await signalsFor(revisions, signal)
  return revisions.map((revision, i) => toCard(revision, signals[i]))
}
