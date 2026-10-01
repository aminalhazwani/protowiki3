import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'

import type { HomeCardData } from './data/types'
import { moduleSlots, type HomeModuleSpec } from './modules'
import { preloadImages } from './preloadImages'
import { useHomePersonalization } from './useHomePersonalization'

/**
 * Loads one module's cards: abortable, with loading / error state and a retry.
 *
 * No-jump reveal (after `lu/wikitab`): `reserved` card slots are held at once
 * (as skeletons), and `ready` rises to meet them only after those cards'
 * images have decoded (capped), so cards never swap in with an empty image.
 *
 * With `spec.filters`, `filter` narrows `visible` to one filter's cards; the
 * slot counts always refer to `visible`.
 */
export function useHomeModule(spec: HomeModuleSpec) {
  const items = shallowRef<HomeCardData[]>([])
  const loading = ref(true)
  const error = ref(false)
  /** The selected filter's id; `null` is "All". */
  const filter = ref<string | null>(null)
  /** Slots on screen — cards or skeletons. */
  const reserved = ref(moduleSlots(spec))
  /** Slots whose card is ready to show; the rest are skeletons. */
  const ready = ref(0)

  function filtered(cards: HomeCardData[]): HomeCardData[] {
    return filter.value ? cards.filter((card) => card.filterId === filter.value) : cards
  }

  /** The cards the current filter shows, in order. */
  const visible = computed(() => filtered(items.value))

  const hasMore = computed(() => !loading.value && visible.value.length > reserved.value)

  let controller: AbortController | null = null

  /**
   * `inPlace` refreshes what's already shown (e.g. Saved after a save) without
   * falling back to skeletons, keeping any extra cards "Show more" revealed.
   */
  async function load({ inPlace = false } = {}): Promise<void> {
    controller?.abort()
    controller = new AbortController()
    const { signal } = controller

    const slots = moduleSlots(spec)
    const refreshing = inPlace && items.value.length > 0
    loading.value = !refreshing
    error.value = false
    if (!refreshing) {
      filter.value = null
      reserved.value = slots
      ready.value = 0
    }
    try {
      const cards = await spec.load(signal)
      if (signal.aborted) return
      const shown = Math.min(
        refreshing ? Math.max(reserved.value, slots) : slots,
        filtered(cards).length,
      )
      await preloadImages(filtered(cards).slice(0, shown).map((card) => card.thumbnailUrl))
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
    const to = Math.min(visible.value.length, from + spec.pageSize)
    reserved.value = to
    await preloadImages(visible.value.slice(from, to).map((card) => card.thumbnailUrl))
    ready.value = to
  }

  /** Show one filter's cards (or all, for `null`), from the first page again. */
  async function setFilter(id: string | null): Promise<void> {
    if (filter.value === id) return
    filter.value = id
    const shown = Math.min(moduleSlots(spec), visible.value.length)
    reserved.value = shown
    ready.value = 0
    await preloadImages(visible.value.slice(0, shown).map((card) => card.thumbnailUrl))
    if (filter.value === id) ready.value = shown
  }

  onMounted(() => load())
  onUnmounted(() => controller?.abort())
  if (spec.reloadOn) watch(spec.reloadOn, () => load({ inPlace: true }))
  if (spec.personalized) {
    const { version } = useHomePersonalization()
    watch(version, () => load({ inPlace: true }))
  }

  return {
    items,
    visible,
    filter,
    loading,
    error,
    reserved,
    ready,
    hasMore,
    reload: () => load(),
    revealMore,
    setFilter,
  }
}
