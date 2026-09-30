import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue'

import type { HomeCardData } from './data/types'
import type { HomeModuleSpec } from './modules'
import { preloadImages } from './preloadImages'

/**
 * Loads one module's cards: abortable, with loading / error state and a retry.
 *
 * No-jump reveal (after `lu/wikitab`): `reserved` card slots are held at once
 * (as skeletons), and `ready` rises to meet them only after those cards'
 * images have decoded (capped), so cards never swap in with an empty image.
 */
export function useHomeModule(spec: HomeModuleSpec) {
  const items = shallowRef<HomeCardData[]>([])
  const loading = ref(true)
  const error = ref(false)
  /** Slots on screen — cards or skeletons. */
  const reserved = ref(spec.slots)
  /** Slots whose card is ready to show; the rest are skeletons. */
  const ready = ref(0)

  const hasMore = computed(() => !loading.value && items.value.length > reserved.value)

  let controller: AbortController | null = null

  async function load(): Promise<void> {
    controller?.abort()
    controller = new AbortController()
    const { signal } = controller

    loading.value = true
    error.value = false
    reserved.value = spec.slots
    ready.value = 0
    try {
      const cards = await spec.load(signal)
      if (signal.aborted) return
      const shown = Math.min(spec.slots, cards.length)
      await preloadImages(cards.slice(0, shown).map((card) => card.thumbnailUrl))
      if (signal.aborted) return
      items.value = cards
      reserved.value = shown
      ready.value = shown
    } catch (err) {
      if (signal.aborted) return
      console.warn(`[Home] ${spec.id} failed to load`, err)
      error.value = true
    } finally {
      if (!signal.aborted) loading.value = false
    }
  }

  /** Reveal the next `pageSize` cards in place. Ignored while a page is still decoding. */
  async function revealMore(): Promise<void> {
    if (!spec.pageSize || !hasMore.value || ready.value < reserved.value) return
    const from = reserved.value
    const to = Math.min(items.value.length, from + spec.pageSize)
    reserved.value = to
    await preloadImages(items.value.slice(from, to).map((card) => card.thumbnailUrl))
    ready.value = to
  }

  onMounted(load)
  onUnmounted(() => controller?.abort())

  return { items, loading, error, reserved, ready, hasMore, reload: load, revealMore }
}
