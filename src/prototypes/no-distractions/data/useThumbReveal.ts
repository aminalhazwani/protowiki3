import { onScopeDispose, ref } from 'vue'

import { normalizeTitleKey } from '@/lib/fetchMorelike'

/** Per-pill offset within a burst (spec: 30–50ms). */
const THUMB_STAGGER_MS = 40
/** Loads within this window count as one burst and stagger together. */
const THUMB_BURST_WINDOW_MS = 220

/**
 * Drives the avatar reveal shared by the interest chips and the suggestion
 * chips: tracks which thumbnails have actually decoded (via each <img>'s real
 * `load` event, not the moment the URL appears) and assigns each a small
 * entrance delay so a burst of images that decode together cascade in rather
 * than popping at once.
 *
 * Keys are `normalizeTitleKey(title)` to match the thumbnail data maps.
 */
export function useThumbReveal() {
  const loaded = ref(new Set<string>())
  const delays = ref(new Map<string, number>())

  let burstIndex = 0
  let burstResetTimer: ReturnType<typeof setTimeout> | null = null

  function onLoad(title: string): void {
    const key = normalizeTitleKey(title)
    if (loaded.value.has(key)) return
    delays.value.set(key, burstIndex * THUMB_STAGGER_MS)
    burstIndex += 1
    if (burstResetTimer) clearTimeout(burstResetTimer)
    burstResetTimer = setTimeout(() => {
      burstIndex = 0
    }, THUMB_BURST_WINDOW_MS)
    loaded.value.add(key)
  }

  function isLoaded(title: string): boolean {
    return loaded.value.has(normalizeTitleKey(title))
  }

  function style(title: string): Record<string, string> | undefined {
    const delay = delays.value.get(normalizeTitleKey(title))
    return delay ? { '--thumb-delay': `${delay}ms` } : undefined
  }

  /** Prune reveal state to `titles`, dropping entries no longer present. */
  function keep(titles: string[]): void {
    const keys = new Set(titles.map((title) => normalizeTitleKey(title)))
    for (const key of [...loaded.value]) {
      if (!keys.has(key)) {
        loaded.value.delete(key)
        delays.value.delete(key)
      }
    }
  }

  onScopeDispose(() => {
    if (burstResetTimer) clearTimeout(burstResetTimer)
  })

  return { onLoad, isLoaded, style, keep }
}
