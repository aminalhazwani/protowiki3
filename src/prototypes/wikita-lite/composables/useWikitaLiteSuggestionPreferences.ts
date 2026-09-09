import { computed, ref, watch } from 'vue'

import { normalizeInterestTitles } from '../../musical-group/data/interests'
import type { SuggestionPreferences } from '../../musical-group/data/suggestionPreferences'
import { useWikitaLiteUrlState } from './useWikitaLiteUrlState'

const preferencesVersion = ref(0)
const interestsVersion = ref(0)
let prefsInitialized = false

export function useWikitaLiteSuggestionPreferences() {
  const { state, patchState } = useWikitaLiteUrlState()

  const preferences = computed({
    get: (): SuggestionPreferences => ({ ...state.value.suggestionPreferences }),
    set: (value: SuggestionPreferences) => {
      void patchState({ suggestionPreferences: { ...value } })
    },
  })

  watch(
    () => state.value.suggestionPreferences,
    () => {
      if (!prefsInitialized) {
        prefsInitialized = true
        return
      }
      preferencesVersion.value += 1
    },
    { deep: true },
  )

  watch(
    () => state.value.interests,
    () => {
      interestsVersion.value += 1
    },
    { deep: true },
  )

  function commitInterests(titles: string[]): void {
    void patchState({ interests: normalizeInterestTitles(titles) })
  }

  function listInterests(): string[] {
    return [...state.value.interests]
  }

  return {
    preferences,
    preferencesVersion,
    interestsVersion,
    commitInterests,
    listInterests,
  }
}

let singleton: ReturnType<typeof useWikitaLiteSuggestionPreferences> | null = null

export function useWikitaLiteSuggestionPreferencesSingleton() {
  if (!singleton) {
    singleton = useWikitaLiteSuggestionPreferences()
  }
  return singleton
}
