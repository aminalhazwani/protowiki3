import { normalizeEnwikiTitle } from '../../musical-group/data/enwikiTitle'
import {
  fetchMorelikeSuggestions,
  type MorelikeSuggestionHit,
} from '../../musical-group/data/fetchMorelikeSuggestions'
import { resolveMorelikeHitToHomeRelated } from '../../musical-group/data/morelikeHitToHomeRelated'
import { fetchPageSummary } from '../../musical-group/data/pageSummary'
import type { HomeRelated } from '../../musical-group/data/types'

/** Most seeds used per preview — enough to cover a full onboarding interest
 *  list without fanning out into too many morelike calls. */
const SEED_COUNT = 5
/** Cards the Daily reads home preview aims for — three pages of four, so
 *  "Show more" has something to reveal. Exported so the cache check in
 *  `useMusicalGroupHome` can tell a full preview from a short one. */
export const DAILY_READS_PREVIEW_CARD_COUNT = 12
const PREVIEW_CARD_COUNT = DAILY_READS_PREVIEW_CARD_COUNT
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

/** Append the batch's next hit that isn't a duplicate. Returns false once the
 *  batch has nothing new left to offer. */
async function appendNextFromBatch(
  batch: SeedFetchBatch,
  seen: Set<string>,
  items: HomeRelated[],
  onEach: FetchDailyReadsPreviewOptions['onEach'],
  signal?: AbortSignal,
): Promise<boolean> {
  while (batch.nextIndex < batch.hits.length) {
    const hit = batch.hits[batch.nextIndex]
    batch.nextIndex++
    if (await appendUniqueHit(hit, batch.seed, seen, items, onEach, signal)) return true
  }
  return false
}

/** Up to `SEED_COUNT` serial per-seed morelike calls; dedupe globally; up to
 *  `DAILY_READS_PREVIEW_CARD_COUNT` cards total, interleaved round-robin across
 *  seeds so the first page of the preview mixes interests instead of showing
 *  one seed's whole block. Each seed's first card streams as soon as its fetch
 *  lands; later rounds fill in once every seed has been fetched. */
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

  // One extra hit per seed leaves headroom for cross-seed duplicates.
  const hitsPerSeed = Math.ceil(PREVIEW_CARD_COUNT / picked.length) + 1
  const seen = new Set([...seedTitles, ...picked].map(normalizeTitleKey))
  const items: HomeRelated[] = []
  const batches: SeedFetchBatch[] = []

  for (const seed of picked) {
    if (signal?.aborted || items.length >= PREVIEW_CARD_COUNT) break

    const hits = await fetchMorelikeSuggestions(
      seed,
      hitsPerSeed,
      signal,
      'wikita-lite-daily-reads-morelike',
    )
    const batch: SeedFetchBatch = { seed, hits, nextIndex: 0 }
    batches.push(batch)
    await appendNextFromBatch(batch, seen, items, onEach, signal)
  }

  while (items.length < PREVIEW_CARD_COUNT && !signal?.aborted) {
    let progress = false
    for (const batch of batches) {
      if (items.length >= PREVIEW_CARD_COUNT) break
      if (await appendNextFromBatch(batch, seen, items, onEach, signal)) progress = true
    }
    if (!progress) break
  }

  return items
}
