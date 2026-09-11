import { computed, ref, watch } from 'vue'

import { hasSuggestionSeeds } from '../../musical-group/data/getSuggestionSeeds'
import { normalizeInterestTitles } from '../../musical-group/data/interests'
import type { SuggestionPreferences } from '../../musical-group/data/suggestionPreferences'
import type { HomeSavedItem } from '../../musical-group/data/types'
import {
  DEFAULT_MODULE_SUGGESTION_CONFIG,
  type ModuleSuggestionConfig,
} from '../data/moduleSuggestionPreferences'
import type { WikitaLiteModuleId } from '../data/homeModuleIds'
import { useWikitaLiteSuggestionPreferencesSingleton } from './useWikitaLiteSuggestionPreferences'
import { useWikitaLiteUrlState } from './useWikitaLiteUrlState'

const modulePreferencesVersion = ref(0)
let configsInitialized = false

export function useWikitaLiteModuleSuggestionPreferences() {
  const { state, patchState } = useWikitaLiteUrlState()
  const { preferences: globalPreferences, listInterests: listGlobalInterests } =
    useWikitaLiteSuggestionPreferencesSingleton()

  const helpWantedOverrides = computed(() => state.value.helpWantedOverrides)

  watch(
    helpWantedOverrides,
    () => {
      if (!configsInitialized) {
        configsInitialized = true
        return
      }
      modulePreferencesVersion.value += 1
    },
    { deep: true },
  )

  function getModuleConfig(moduleId: WikitaLiteModuleId): ModuleSuggestionConfig {
    if (moduleId !== 'suggestedEdits') {
      return {
        ...DEFAULT_MODULE_SUGGESTION_CONFIG,
        preferences: { ...globalPreferences.value },
        interests: [],
      }
    }

    const overrides = helpWantedOverrides.value
    return {
      useDefaultSettings: overrides.useDefaultSettings,
      preferences: { ...overrides.preferences },
      interests: [...overrides.interests],
    }
  }

  function setModuleConfig(moduleId: WikitaLiteModuleId, config: ModuleSuggestionConfig): void {
    if (moduleId !== 'suggestedEdits') return

    void patchState({
      helpWantedOverrides: {
        useDefaultSettings: config.useDefaultSettings,
        preferences: { ...config.preferences },
        interests: [...config.interests],
      },
    })
  }

  function listModuleInterests(moduleId: WikitaLiteModuleId): string[] {
    return [...getModuleConfig(moduleId).interests]
  }

  function commitModuleInterests(moduleId: WikitaLiteModuleId, titles: string[]): void {
    const config = getModuleConfig(moduleId)
    setModuleConfig(moduleId, {
      ...config,
      interests: normalizeInterestTitles(titles),
    })
  }

  function effectiveSuggestionPreferences(moduleId: WikitaLiteModuleId): SuggestionPreferences {
    const config = getModuleConfig(moduleId)
    if (config.useDefaultSettings) {
      return { ...globalPreferences.value }
    }
    return { ...config.preferences }
  }

  function effectiveModuleInterests(moduleId: WikitaLiteModuleId): string[] {
    const config = getModuleConfig(moduleId)
    if (config.useDefaultSettings) {
      return listGlobalInterests()
    }
    return listModuleInterests(moduleId)
  }

  function hasModuleSuggestionSeeds(
    moduleId: WikitaLiteModuleId,
    savedItems: HomeSavedItem[],
  ): boolean {
    return hasSuggestionSeeds(
      savedItems,
      effectiveSuggestionPreferences(moduleId),
      effectiveModuleInterests(moduleId),
    )
  }

  function seedModuleOverridesFromGlobal(moduleId: WikitaLiteModuleId): void {
    const config = getModuleConfig(moduleId)
    if (!config.useDefaultSettings) return
    setModuleConfig(moduleId, {
      useDefaultSettings: false,
      preferences: { ...globalPreferences.value },
      interests: [...listGlobalInterests()],
    })
  }

  return {
    moduleConfigs: computed(() => ({
      suggestedEdits: getModuleConfig('suggestedEdits'),
    })),
    modulePreferencesVersion,
    getModuleConfig,
    setModuleConfig,
    listModuleInterests,
    commitModuleInterests,
    effectiveSuggestionPreferences,
    effectiveModuleInterests,
    hasModuleSuggestionSeeds,
    seedModuleOverridesFromGlobal,
  }
}

let singleton: ReturnType<typeof useWikitaLiteModuleSuggestionPreferences> | null = null

export function useWikitaLiteModuleSuggestionPreferencesSingleton() {
  if (!singleton) {
    singleton = useWikitaLiteModuleSuggestionPreferences()
  }
  return singleton
}

export { DEFAULT_MODULE_SUGGESTION_CONFIG }
