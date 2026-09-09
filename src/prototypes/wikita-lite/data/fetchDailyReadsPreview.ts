import { normalizeEnwikiTitle } from '../../musical-group/data/enwikiTitle'
import { fetchMorelikeSuggestions } from '../../musical-group/data/fetchMorelikeSuggestions'
import { morelikeHitToHomeRelated } from '../../musical-group/data/morelikeHitToHomeRelated'
import type { HomeRelated } from '../../musical-group/data/types'

const HITS_PER_SEED = 3
const SEED_COUNT = 3

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

export interface FetchDailyReadsPreviewOptions {
  seedTitles: string[]
  onEach?: (item: HomeRelated) => void
  signal?: AbortSignal
}

/** Up to 3 serial per-seed morelike calls; dedupe globally; one card per seed. */
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

  const seen = new Set([...seedTitles, ...picked].map(normalizeTitleKey))
  const items: HomeRelated[] = []

  for (const seed of picked) {
    if (signal?.aborted) break

    const hits = await fetchMorelikeSuggestions(
      seed,
      HITS_PER_SEED,
      signal,
      'wikita-lite-daily-reads-morelike',
    )
    const hit = hits.find((candidate) => !seen.has(normalizeTitleKey(candidate.title)))
    if (!hit) continue

    seen.add(normalizeTitleKey(hit.title))
    const card = morelikeHitToHomeRelated(hit, seed)
    items.push(card)
    onEach?.(card)
  }

  return items
}
