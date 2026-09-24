import { normalizeEnwikiTitle } from './enwikiTitle'
import type { PageSummary } from './pageSummary'
import type { SharedRequest } from './sharedRequest'
import { readVersionedStore, writeVersionedStore } from './wikitaCache'

const STORAGE_KEY = 'musical-group-page-summary-cache'
const CACHE_VERSION = 1
/** Newest entries kept in localStorage; older ones are dropped on write. */
const MAX_STORED_ENTRIES = 500
/** Summaries land in bursts; persist them together instead of one rewrite each. */
const WRITE_DELAY_MS = 200

interface CachedPageSummaryEntry {
  summary: PageSummary | null
  fetchedAt: number
}

const memoryCache = new Map<string, PageSummary | null>()
const inFlight = new Map<string, SharedRequest<PageSummary | null>>()
let pendingWrites: Record<string, PageSummary | null> = {}
let writeTimer: ReturnType<typeof setTimeout> | null = null

function flushPendingWrites(): void {
  if (writeTimer) {
    clearTimeout(writeTimer)
    writeTimer = null
  }
  const entries = pendingWrites
  pendingWrites = {}
  if (Object.keys(entries).length) persistPageSummaryBatch(entries)
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushPendingWrites)
}

function titleCacheKey(title: string): string {
  return normalizeEnwikiTitle(title).toLowerCase()
}

function isValidEntry(entry: unknown): entry is CachedPageSummaryEntry {
  if (typeof entry !== 'object' || entry === null) return false
  const record = entry as CachedPageSummaryEntry
  if (typeof record.fetchedAt !== 'number') return false
  if (record.summary !== null && typeof record.summary !== 'object') return false
  return true
}

function readEntries(): Record<string, CachedPageSummaryEntry> {
  return readVersionedStore(STORAGE_KEY, CACHE_VERSION, isValidEntry)
}

export function getCachedPageSummary(title: string): PageSummary | null | undefined {
  const key = titleCacheKey(title)
  if (memoryCache.has(key)) return memoryCache.get(key)

  const stored = readEntries()[key]
  if (!stored) return undefined

  memoryCache.set(key, stored.summary)
  return stored.summary
}

export function setCachedPageSummary(title: string, summary: PageSummary | null): void {
  const key = titleCacheKey(title)
  memoryCache.set(key, summary)
  pendingWrites[key] = summary
  writeTimer ??= setTimeout(flushPendingWrites, WRITE_DELAY_MS)
}

export function getPageSummaryInFlight(
  title: string,
): SharedRequest<PageSummary | null> | undefined {
  return inFlight.get(titleCacheKey(title))
}

export function setPageSummaryInFlight(
  title: string,
  request: SharedRequest<PageSummary | null>,
): void {
  const key = titleCacheKey(title)
  inFlight.set(key, request)
  const clear = () => {
    if (inFlight.get(key) === request) inFlight.delete(key)
  }
  request.promise.then(clear, clear)
}

export function clearPageSummaryCache(): void {
  if (writeTimer) clearTimeout(writeTimer)
  writeTimer = null
  pendingWrites = {}
  memoryCache.clear()
  inFlight.clear()
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore.
  }
}

/** Drop in-memory layer only (localStorage kept). Used rarely. */
export function clearPageSummaryMemoryCache(): void {
  memoryCache.clear()
  inFlight.clear()
}

export function persistPageSummaryBatch(entries: Record<string, PageSummary | null>): void {
  let store = readEntries()
  const now = Date.now()
  for (const [title, summary] of Object.entries(entries)) {
    const key = titleCacheKey(title)
    store[key] = { summary, fetchedAt: now }
    memoryCache.set(key, summary)
  }
  const keys = Object.keys(store)
  if (keys.length > MAX_STORED_ENTRIES) {
    const newest = keys
      .sort((a, b) => store[b].fetchedAt - store[a].fetchedAt)
      .slice(0, MAX_STORED_ENTRIES)
    store = Object.fromEntries(newest.map((key) => [key, store[key]]))
  }
  writeVersionedStore(STORAGE_KEY, CACHE_VERSION, store)
}
