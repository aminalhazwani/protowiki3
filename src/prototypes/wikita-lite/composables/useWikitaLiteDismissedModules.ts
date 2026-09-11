import { computed, watch } from 'vue'

import { type WikitaLiteModuleId } from '../data/homeModuleIds'
import {
  nextLocalRestoreAt,
  pruneExpiredDismissals,
  type DismissedModules,
} from '../data/moduleDismissals'
import { moduleTitleFor } from '../routes'
import { useWikitaLitePinnedModulesSingleton } from './useWikitaLitePinnedModules'
import { useWikitaLiteUrlState } from './useWikitaLiteUrlState'

export interface DismissedModuleEntry {
  moduleId: WikitaLiteModuleId
  title: string
  restoreAt: number
}

let restoreTimer: ReturnType<typeof setTimeout> | null = null

function clearRestoreTimer(): void {
  if (restoreTimer !== null) {
    clearTimeout(restoreTimer)
    restoreTimer = null
  }
}

function nearestRestoreAt(state: DismissedModules, now = Date.now()): number | null {
  let nearest: number | null = null

  for (const restoreAt of Object.values(state)) {
    if (typeof restoreAt !== 'number' || restoreAt <= now) continue
    if (nearest === null || restoreAt < nearest) {
      nearest = restoreAt
    }
  }

  return nearest
}

function scheduleRestoreTimer(
  dismissed: DismissedModules,
  onExpire: (next: DismissedModules) => void,
): void {
  clearRestoreTimer()

  if (typeof window === 'undefined') return

  const nextAt = nearestRestoreAt(dismissed)
  if (nextAt === null) return

  const delay = Math.max(0, nextAt - Date.now())
  restoreTimer = setTimeout(() => {
    onExpire(pruneExpiredDismissals(dismissed))
  }, delay)
}

export function useWikitaLiteDismissedModules() {
  const { state, patchState } = useWikitaLiteUrlState()
  const { unpinFromAllTabs } = useWikitaLitePinnedModulesSingleton()

  const dismissedModules = computed(() => pruneExpiredDismissals(state.value.dismissed))

  watch(
    dismissedModules,
    (value) => {
      scheduleRestoreTimer(value, (next) => {
        void patchState({ dismissed: next })
      })
    },
    { immediate: true, deep: true },
  )

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return
      const pruned = pruneExpiredDismissals(state.value.dismissed)
      if (JSON.stringify(pruned) !== JSON.stringify(state.value.dismissed)) {
        void patchState({ dismissed: pruned })
      }
    })
  }

  function isDismissed(moduleId: WikitaLiteModuleId): boolean {
    const restoreAt = dismissedModules.value[moduleId]
    if (restoreAt === undefined) return false
    return Date.now() < restoreAt
  }

  function dismiss(moduleId: WikitaLiteModuleId): void {
    unpinFromAllTabs(moduleId)

    void patchState({
      dismissed: {
        ...dismissedModules.value,
        [moduleId]: nextLocalRestoreAt(),
      },
    })
  }

  function restore(moduleId: WikitaLiteModuleId): void {
    if (!(moduleId in dismissedModules.value)) return

    const { [moduleId]: _removed, ...rest } = dismissedModules.value
    void patchState({ dismissed: rest })
  }

  const dismissedEntries = computed((): DismissedModuleEntry[] => {
    const entries: DismissedModuleEntry[] = []
    const now = Date.now()

    for (const [moduleId, restoreAt] of Object.entries(dismissedModules.value)) {
      if (typeof restoreAt !== 'number' || now >= restoreAt) continue
      entries.push({
        moduleId: moduleId as WikitaLiteModuleId,
        title: moduleTitleFor('edit', moduleId as WikitaLiteModuleId),
        restoreAt,
      })
    }

    return entries.sort((a, b) => a.title.localeCompare(b.title))
  })

  return {
    dismissedModules,
    isDismissed,
    dismiss,
    restore,
    dismissedEntries,
  }
}

let singleton: ReturnType<typeof useWikitaLiteDismissedModules> | null = null

export function useWikitaLiteDismissedModulesSingleton() {
  if (!singleton) {
    singleton = useWikitaLiteDismissedModules()
  }
  return singleton
}
