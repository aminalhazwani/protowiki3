import { computed, ref, watch } from 'vue'

import { normalizeInterestTitles } from '../../musical-group/data/interests'
import type { SuggestionPreferences } from '../../musical-group/data/suggestionPreferences'
import { useWikitaLiteUrlState } from './useWikitaLiteUrlState'

const preferencesVersion = ref(0)
const interestsVersion = ref(0)
let prefsInitialized = false

function preferencesFingerprint(prefs: SuggestionPreferences): string {
  return `s${prefs.useSavedPages ? 1 : 0}e${prefs.useEditingHistory ? 1 : 0}w${prefs.useWatchlist ? 1 : 0}i${prefs.useInterests ? 1 : 0}`
}

function interestsFingerprint(titles: string[]): string {
  return normalizeInterestTitles(titles).join('|')
}

export function useWikitaLiteSuggestionPreferences() {
  const { state, patchState } = useWikitaLiteUrlState()

  const preferences = computed({
    get: (): SuggestionPreferences => ({ ...state.value.suggestionPreferences }),
    set: (value: SuggestionPreferences) => {
      void patchState({ suggestionPreferences: { ...value } })
    },
  })

  let lastPreferencesFingerprint = preferencesFingerprint(state.value.suggestionPreferences)
  let lastInterestsFingerprint = interestsFingerprint(state.value.interests)

  watch(
    () => state.value.suggestionPreferences,
    (prefs) => {
      const fingerprint = preferencesFingerprint(prefs)
      if (!prefsInitialized) {
        prefsInitialized = true
        lastPreferencesFingerprint = fingerprint
        return
      }
      if (fingerprint === lastPreferencesFingerprint) return
      lastPreferencesFingerprint = fingerprint
      preferencesVersion.value += 1
    },
    { deep: true },
  )

  watch(
    () => state.value.interests,
    (interests) => {
      const fingerprint = interestsFingerprint(interests)
      if (fingerprint === lastInterestsFingerprint) return
      lastInterestsFingerprint = fingerprint
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
