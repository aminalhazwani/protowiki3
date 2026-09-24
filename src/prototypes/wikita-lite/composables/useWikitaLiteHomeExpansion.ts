import { computed, ref } from 'vue'

import { globalSkin } from '@/theme'

import type { ConfigurableHomeModuleId } from '../data/homeLayout'

/** Cards a home module reveals per "Show more" press — one more grid row pair. */
export const WIKITA_LITE_HOME_EXPAND_STEP = 4

/**
 * Vector home reveals the next page of a module's cards in place rather than
 * sending the reader to the module's own page, so each module carries a count
 * of how much extra it has been asked for. Minerva keeps the drill-down: a
 * phone column grows unreadably long, and the subpage is the better surface.
 *
 * The count is keyed by module, not by tab, so a module that appears on two
 * tabs stays expanded across both.
 */
export function useWikitaLiteHomeExpansion(step = WIKITA_LITE_HOME_EXPAND_STEP) {
  const revealed = ref<Partial<Record<ConfigurableHomeModuleId, number>>>({})

  const canExpandInPlace = computed(() => globalSkin.value === 'desktop')

  /** A module's display limit: its preview, plus whatever has been revealed. */
  function limitFor(moduleId: ConfigurableHomeModuleId, previewLimit: number): number {
    if (!canExpandInPlace.value) return previewLimit
    return previewLimit + (revealed.value[moduleId] ?? 0)
  }

  function expand(moduleId: ConfigurableHomeModuleId): void {
    revealed.value = {
      ...revealed.value,
      [moduleId]: (revealed.value[moduleId] ?? 0) + step,
    }
  }

  return { canExpandInPlace, limitFor, expand }
}
