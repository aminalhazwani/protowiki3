import { wikimediaApiFetchHeaders } from '@/config'
import { fetchWikimedia } from '@/lib/fetchWikimedia'
import { mapWithConcurrency } from '@/lib/mapWithConcurrency'

import { EN_WIKI_HOST } from './fetchFeaturedFeed'
import { readDayCache, utcDayKey, writeDayCache } from './homeCache'
import { formatAgo } from './relativeTime'
import type { HomeCardData } from './types'

interface Noticeboard {
  page: string
  /** Filter label. */
  label: string
}

/** enwiki's noticeboards for the Personal dashboard (`wgPersonalDashboardActiveDiscussionsPages`, T420785). */
const NOTICEBOARDS: readonly Noticeboard[] = [
  { page: 'Wikipedia:Help desk', label: 'Help desk' },
  { page: 'Wikipedia:Village pump (miscellaneous)', label: 'Miscellaneous' },
  { page: 'Wikipedia:Village pump (technical)', label: 'Technical' },
  { page: 'Wikipedia:Village pump (idea lab)', label: 'Idea lab' },
  { page: 'Wikipedia:Village pump (policy)', label: 'Policy' },
  { page: 'Wikipedia:Village pump (proposals)', label: 'Proposals' },
]

/** One filter per noticeboard, in this order (see `HomeModuleSpec.filters`). */
export const DISCUSSION_FILTERS = NOTICEBOARDS.map(({ page, label }) => ({ id: page, label }))

const MAX_DISCUSSIONS = 20
/** Newest threads kept from every board, so each filter has something to show. */
const PER_BOARD_MIN = 2
const CONCURRENCY = 2
const CACHE_SLOT = 'active-discussions'
/** Discussions move within the hour, so the day's list is refetched after one. */
const CACHE_MAX_AGE_MS = 60 * 60_000

interface Thread {
  id: string
  title: string
  board: string
  comments: number
  latestReply: string
}

interface ApiThread {
  id: string
  headingLevel?: number | null
  html?: string
  commentCount?: number
  authorCount?: number
  latestReplyTimestamp?: string | null
}

/** A board's live threads: top-level sections where more than one person has spoken. */
async function fetchThreads(board: string, signal: AbortSignal): Promise<Thread[]> {
  const search = new URLSearchParams({
    action: 'discussiontoolspageinfo',
    page: board,
    prop: 'threaditemshtml',
    threaditemsflags: 'noreplies|excludesignatures|activity',
    format: 'json',
    formatversion: '2',
    origin: '*',
  })
  const response = await fetchWikimedia(`https://${EN_WIKI_HOST}/w/api.php?${search}`, {
    signal,
    headers: wikimediaApiFetchHeaders('home-active-discussions'),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = (await response.json()) as {
    discussiontoolspageinfo?: { threaditemshtml?: ApiThread[] }
  }

  return (data.discussiontoolspageinfo?.threaditemshtml ?? []).flatMap((item) => {
    // Subsections (h3…) repeat their parent's activity, so only whole threads count.
    if (item.headingLevel !== 2 || (item.authorCount ?? 0) < 2 || !item.latestReplyTimestamp) {
      return []
    }
    const title = new DOMParser().parseFromString(item.html ?? '', 'text/html').body.textContent
    if (!title?.trim()) return []
    return [
      {
        id: item.id,
        title: title.trim(),
        board,
        comments: item.commentCount ?? 0,
        latestReply: item.latestReplyTimestamp,
      },
    ]
  })
}

const byLatestReply = (a: Thread, b: Thread) => b.latestReply.localeCompare(a.latestReply)

/** The most recently active threads, with each board's newest few guaranteed a place. */
function mergeThreads(boards: Thread[][]): Thread[] {
  const sorted = boards.map((threads) => [...threads].sort(byLatestReply))
  const guaranteed = sorted.flatMap((threads) => threads.slice(0, PER_BOARD_MIN))
  const rest = sorted.flatMap((threads) => threads.slice(PER_BOARD_MIN)).sort(byLatestReply)
  return [...guaranteed, ...rest.slice(0, Math.max(0, MAX_DISCUSSIONS - guaranteed.length))].sort(
    byLatestReply,
  )
}

function toCard(thread: Thread): HomeCardData {
  const comments = `${thread.comments} ${thread.comments === 1 ? 'comment' : 'comments'}`
  const url = `https://${EN_WIKI_HOST}/wiki/${encodeURI(thread.board.replace(/ /g, '_'))}`
  return {
    key: `discussion:${thread.id}`,
    title: thread.title,
    description: thread.board.replace(/^Wikipedia:/, ''),
    href: `${url}#${encodeURIComponent(thread.id)}`,
    supportingText: `${comments} · ${formatAgo(Date.parse(thread.latestReply))}`,
    filterId: thread.board,
  }
}

/**
 * Busy threads on Wikipedia's community noticeboards (the help desk and the
 * village pumps), most recent reply first. One board failing only shortens the
 * list; all of them failing is an error.
 */
export async function loadActiveDiscussions(signal: AbortSignal): Promise<HomeCardData[]> {
  const day = utcDayKey()
  // Threads are cached rather than cards, so "3h ago" is worked out fresh each load.
  const cached = readDayCache<Thread[]>(CACHE_SLOT, day, CACHE_MAX_AGE_MS)
  if (cached) return cached.map(toCard)

  const results = await mapWithConcurrency(
    NOTICEBOARDS.map((board) => board.page),
    CONCURRENCY,
    (board) =>
      fetchThreads(board, signal).catch((err: unknown) => {
        if (signal.aborted) throw err
        return null
      }),
    signal,
  )
  if (results.every((threads) => threads === null)) {
    throw new Error("Couldn't reach any noticeboard")
  }

  const threads = mergeThreads(results.map((board) => board ?? []))
  writeDayCache(CACHE_SLOT, day, threads)
  return threads.map(toCard)
}
