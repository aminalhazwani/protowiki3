/**
 * Edit lookups on the Action API for Review changes: pages' latest revisions,
 * the live recent-changes stream, a revision's diff, and editors' edit counts.
 * Each is one call (batched where the API allows).
 */

import { wikimediaApiFetchHeaders } from '@/config'
import { fetchWikimedia } from '@/lib/fetchWikimedia'

import { EN_WIKI_HOST } from './fetchFeaturedFeed'
import { MAX_TITLES_PER_QUERY } from './fetchEditTasks'

export interface Revision {
  title: string
  revid: number
  /** 0 for a page's first revision. */
  parentid: number
  user: string
  /** Signed in with a real account (not an IP, not a temporary `~` account). */
  registered: boolean
  timestamp: string
  comment: string
  parsedComment: string
  /** A later edit reverted this one (`mw-reverted` tag). */
  reverted: boolean
}

/** What a diff adds and removes, as wikitext. */
export interface RevisionDiff {
  /** Whole changed lines — the before/after context a tone check reads. */
  addedLines: string
  removedLines: string
  /** Only the changed words where MediaWiki marks them inline, else whole lines. */
  added: string
  removed: string
}

interface ApiRevision {
  revid: number
  parentid?: number
  user?: string
  userid?: number
  anon?: boolean
  temp?: boolean
  timestamp?: string
  comment?: string
  parsedcomment?: string
  tags?: string[]
}

const REVISION_PROPS = 'ids|timestamp|user|userid|comment|parsedcomment|tags'

async function action<T>(params: Record<string, string>, signal?: AbortSignal): Promise<T> {
  const search = new URLSearchParams({ ...params, format: 'json', formatversion: '2', origin: '*' })
  const response = await fetchWikimedia(`https://${EN_WIKI_HOST}/w/api.php?${search}`, {
    signal,
    headers: wikimediaApiFetchHeaders('home-review-changes'),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return (await response.json()) as T
}

function toRevision(title: string, row: ApiRevision): Revision {
  return {
    title,
    revid: row.revid,
    parentid: row.parentid ?? 0,
    user: row.user ?? '',
    registered: !row.anon && !row.temp && (row.userid ?? 0) > 0,
    timestamp: row.timestamp ?? '',
    comment: row.comment ?? '',
    parsedComment: row.parsedcomment ?? '',
    reverted: (row.tags ?? []).includes('mw-reverted'),
  }
}

/** The latest revision of each page (redirects followed), in one call. */
export async function fetchLatestRevisions(
  titles: string[],
  signal?: AbortSignal,
): Promise<Revision[]> {
  if (!titles.length) return []
  const data = await action<{
    query?: { pages?: { title: string; missing?: boolean; revisions?: ApiRevision[] }[] }
  }>(
    {
      action: 'query',
      prop: 'revisions',
      titles: titles.slice(0, MAX_TITLES_PER_QUERY).join('|'),
      redirects: '1',
      rvprop: REVISION_PROPS,
    },
    signal,
  )
  return (data.query?.pages ?? [])
    .filter((page) => !page.missing && page.revisions?.[0])
    .map((page) => toRevision(page.title, page.revisions![0]))
}

/** The newest human edits to articles anywhere on the wiki. */
export async function fetchRecentEdits(limit: number, signal?: AbortSignal): Promise<Revision[]> {
  const data = await action<{
    query?: { recentchanges?: (ApiRevision & { title: string; old_revid?: number })[] }
  }>(
    {
      action: 'query',
      list: 'recentchanges',
      rcnamespace: '0',
      rctype: 'edit',
      rcshow: '!bot',
      rcprop: `title|${REVISION_PROPS}`,
      rclimit: String(limit),
    },
    signal,
  )
  return (data.query?.recentchanges ?? []).map((row) =>
    toRevision(row.title, { ...row, parentid: row.old_revid }),
  )
}

function joinText(cells: Iterable<Element>): string {
  return Array.from(cells, (cell) => cell.textContent?.trim() ?? '')
    .filter(Boolean)
    .join('\n')
}

/** Changed words of each line: its inline `<ins>`/`<del>` marks, or the whole line if unmarked. */
function changedText(lines: Iterable<Element>, mark: 'ins' | 'del'): string {
  return joinText(
    Array.from(lines).flatMap((line) => {
      const marks = line.querySelectorAll(`${mark}.diffchange`)
      return marks.length ? Array.from(marks) : [line]
    }),
  )
}

/** What the edit from `fromRev` to `toRev` changed. */
export async function fetchDiff(
  fromRev: number,
  toRev: number,
  signal?: AbortSignal,
): Promise<RevisionDiff> {
  const data = await action<{ compare?: { body?: string } }>(
    { action: 'compare', fromrev: String(fromRev), torev: String(toRev), prop: 'diff' },
    signal,
  )
  const doc = new DOMParser().parseFromString(
    `<table>${data.compare?.body ?? ''}</table>`,
    'text/html',
  )
  const addedLines = doc.querySelectorAll('.diff-addedline')
  const removedLines = doc.querySelectorAll('.diff-deletedline')
  return {
    addedLines: joinText(addedLines),
    removedLines: joinText(removedLines),
    added: changedText(addedLines, 'ins'),
    removed: changedText(removedLines, 'del'),
  }
}

/** Edit counts by username, in one call; unknown accounts are left out. */
export async function fetchEditCounts(
  users: string[],
  signal?: AbortSignal,
): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (!users.length) return counts
  const data = await action<{
    query?: { users?: { name: string; missing?: boolean; editcount?: number }[] }
  }>(
    {
      action: 'query',
      list: 'users',
      ususers: users.slice(0, MAX_TITLES_PER_QUERY).join('|'),
      usprop: 'editcount',
    },
    signal,
  )
  for (const user of data.query?.users ?? []) {
    if (!user.missing && typeof user.editcount === 'number') counts.set(user.name, user.editcount)
  }
  return counts
}

/** The edit on Wikipedia, as a diff against the revision before it. */
export function diffUrl(revision: Revision): string {
  const params = new URLSearchParams({ diff: 'prev', oldid: String(revision.revid) })
  return `https://${EN_WIKI_HOST}/w/index.php?${params}`
}
