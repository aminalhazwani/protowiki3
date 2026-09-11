import { normalizeEnwikiTitle } from '../../musical-group/data/enwikiTitle'
import {
  fetchMorelikeSuggestions,
  type MorelikeSuggestionHit,
} from '../../musical-group/data/fetchMorelikeSuggestions'
import { resolveMorelikeHitToHomeRelated } from '../../musical-group/data/morelikeHitToHomeRelated'
import { fetchPageSummary } from '../../musical-group/data/pageSummary'
import type { HomeRelated } from '../../musical-group/data/types'

const HITS_PER_SEED = 3
const SEED_COUNT = 3
const PREVIEW_CARD_COUNT = 3
const DAILY_READS_SUMMARY_PURPOSE = 'wikita-lite-daily-reads-summary'

function normalizeTitleKey(title: string): string {
  return normalizeEnwikiTitle(title).toLowerCase()
}

function pickRandomUnique<T>(items: T[], count: number): T[] {
  const pool = [...items]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}

function distributeCardQuota(seedCount: number, total: number): number[] {
  const base = Math.floor(total / seedCount)
  const extra = total % seedCount
  return Array.from({ length: seedCount }, (_, i) => base + (i < extra ? 1 : 0))
}

interface SeedFetchBatch {
  seed: string
  hits: MorelikeSuggestionHit[]
  nextIndex: number
}

export interface FetchDailyReadsPreviewOptions {
  seedTitles: string[]
  onEach?: (item: HomeRelated) => void
  signal?: AbortSignal
}

/** Backfill thumbnails missing from Action API pageimages via REST page summary. */
export async function refillMissingDailyReadsThumbnails(
  items: HomeRelated[],
  signal?: AbortSignal,
): Promise<HomeRelated[]> {
  let changed = false
  const refilled = await Promise.all(
    items.map(async (item) => {
      if (item.thumbnailUrl?.trim()) return item

      const summary = await fetchPageSummary(item.title, signal, DAILY_READS_SUMMARY_PURPOSE)
      const thumbnailUrl = summary?.thumbnail?.source
      if (!thumbnailUrl) return item

      changed = true
      return { ...item, thumbnailUrl }
    }),
  )

  return changed ? refilled : items
}

async function appendUniqueHit(
  hit: MorelikeSuggestionHit,
  seed: string,
  seen: Set<string>,
  items: HomeRelated[],
  onEach: FetchDailyReadsPreviewOptions['onEach'],
  signal?: AbortSignal,
): Promise<boolean> {
  const key = normalizeTitleKey(hit.title)
  if (seen.has(key)) return false

  seen.add(key)
  const card = await resolveMorelikeHitToHomeRelated(hit, seed, signal)
  items.push(card)
  onEach?.(card)
  return true
}

/** Up to 3 serial per-seed morelike calls; dedupe globally; up to 3 cards total. */
export async function fetchDailyReadsPreview({
  seedTitles,
  onEach,
  signal,
}: FetchDailyReadsPreviewOptions): Promise<HomeRelated[]> {
  const picked = pickRandomUnique(
    seedTitles.filter((title) => title.trim()),
    Math.min(SEED_COUNT, seedTitles.length),
  )
  if (!picked.length) return []

  const quotas = distributeCardQuota(picked.length, PREVIEW_CARD_COUNT)
  const seen = new Set([...seedTitles, ...picked].map(normalizeTitleKey))
  const items: HomeRelated[] = []
  const batches: SeedFetchBatch[] = []

  for (let i = 0; i < picked.length; i++) {
    if (signal?.aborted || items.length >= PREVIEW_CARD_COUNT) break

    const seed = picked[i]
    const quota = quotas[i]
    const hits = await fetchMorelikeSuggestions(
      seed,
      Math.max(HITS_PER_SEED, quota + 1),
      signal,
      'wikita-lite-daily-reads-morelike',
    )

    const batch: SeedFetchBatch = { seed, hits, nextIndex: 0 }
    batches.push(batch)

    let added = 0
    for (let j = 0; j < hits.length; j++) {
      if (added >= quota || items.length >= PREVIEW_CARD_COUNT) break
      batch.nextIndex = j + 1
      const appended = await appendUniqueHit(hits[j], seed, seen, items, onEach, signal)
      if (appended) added++
    }
  }

  while (items.length < PREVIEW_CARD_COUNT) {
    let progress = false
    for (const batch of batches) {
      if (items.length >= PREVIEW_CARD_COUNT) break
      while (batch.nextIndex < batch.hits.length) {
        const hit = batch.hits[batch.nextIndex]
        batch.nextIndex++
        const appended = await appendUniqueHit(
          hit,
          batch.seed,
          seen,
          items,
          onEach,
          signal,
        )
        if (appended) {
          progress = true
          break
        }
      }
    }
    if (!progress) break
  }

  return items
}
