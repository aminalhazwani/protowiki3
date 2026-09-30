import { onMounted, onUnmounted, ref, shallowRef } from 'vue'

import type { HomeCardData } from './data/types'
import type { HomeModuleSpec } from './modules'
import { preloadImages } from './preloadImages'

/**
 * Loads one module's cards: abortable, with loading / error state and a retry.
 * Stays loading until the shown cards' images have decoded (capped), so cards
 * never swap in with an empty image.
 */
export function useHomeModule(spec: HomeModuleSpec) {
  const items = shallowRef<HomeCardData[]>([])
  const loading = ref(true)
  const error = ref(false)

  let controller: AbortController | null = null

  async function load(): Promise<void> {
    controller?.abort()
    controller = new AbortController()
    const { signal } = controller

    loading.value = true
    error.value = false
    try {
      const cards = await spec.load(signal)
      if (signal.aborted) return
      await preloadImages(cards.slice(0, spec.slots).map((card) => card.thumbnailUrl))
      if (signal.aborted) return
      items.value = cards
    } catch (err) {
      if (signal.aborted) return
      console.warn(`[Home] ${spec.id} failed to load`, err)
      error.value = true
    } finally {
      if (!signal.aborted) loading.value = false
    }
  }

  onMounted(load)
  onUnmounted(() => controller?.abort())

  return { items, loading, error, reload: load }
}
