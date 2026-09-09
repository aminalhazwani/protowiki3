import { computed, type ComputedRef } from 'vue'

import { type WikitaLiteModuleId } from '../data/homeModuleIds'
import type { TabPinnedModules } from '../data/modulePins'
import { DEFAULT_WIKITA_LITE_VIEW, WIKITA_LITE_VIEWS, type WikitaLiteView } from '../routes'
import { useWikitaLiteUrlState } from './useWikitaLiteUrlState'
import { useWikitaLiteView } from './useWikitaLiteView'

export function useWikitaLitePinnedModules() {
  const { state, patchState } = useWikitaLiteUrlState()
  const { activeView, isHome } = useWikitaLiteView()

  const pinnedByTab = computed((): TabPinnedModules => ({
    edit: [...state.value.pinned.edit],
    read: [...state.value.pinned.read],
    contribute: [...state.value.pinned.contribute],
  }))

  function pinView(): WikitaLiteView {
    return isHome.value ? activeView.value : DEFAULT_WIKITA_LITE_VIEW
  }

  function isPinned(moduleId: WikitaLiteModuleId): boolean {
    return pinnedByTab.value[pinView()].includes(moduleId)
  }

  function isPinnedToHome(moduleId: WikitaLiteModuleId): boolean {
    return pinnedByTab.value.edit.includes(moduleId)
  }

  function togglePin(moduleId: WikitaLiteModuleId): void {
    const view = pinView()
    const current = pinnedByTab.value[view]

    if (current.includes(moduleId)) {
      void patchState({
        pinned: {
          ...pinnedByTab.value,
          [view]: current.filter((id) => id !== moduleId),
        },
      })
      return
    }

    void patchState({
      pinned: {
        ...pinnedByTab.value,
        [view]: [moduleId, ...current],
      },
    })
  }

  function pinnedIdsForView(view: WikitaLiteView): ComputedRef<WikitaLiteModuleId[]> {
    return computed(() => pinnedByTab.value[view])
  }

  function unpinFromAllTabs(moduleId: WikitaLiteModuleId): void {
    const updated: TabPinnedModules = { ...pinnedByTab.value }

    for (const tabView of WIKITA_LITE_VIEWS) {
      if (updated[tabView].includes(moduleId)) {
        updated[tabView] = updated[tabView].filter((id) => id !== moduleId)
      }
    }

    void patchState({ pinned: updated })
  }

  return {
    pinnedByTab,
    isPinned,
    isPinnedToHome,
    togglePin,
    pinnedIdsForView,
    unpinFromAllTabs,
  }
}

let singleton: ReturnType<typeof useWikitaLitePinnedModules> | null = null

export function useWikitaLitePinnedModulesSingleton() {
  if (!singleton) {
    singleton = useWikitaLitePinnedModules()
  }
  return singleton
}
