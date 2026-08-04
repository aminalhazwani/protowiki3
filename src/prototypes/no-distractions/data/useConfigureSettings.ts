import { ref, watch, type Ref } from 'vue'

const STORAGE_KEY = 'protowiki:no-distractions:configure-settings'

export interface ConfigureSettings {
  editingHistory: boolean
}

export const DEFAULT_CONFIGURE_SETTINGS: ConfigureSettings = {
  editingHistory: true,
}

function normalizeSettings(raw: unknown): ConfigureSettings {
  if (typeof raw !== 'object' || raw === null) {
    return { ...DEFAULT_CONFIGURE_SETTINGS }
  }

  const record = raw as Record<string, unknown>
  return {
    editingHistory:
      typeof record.editingHistory === 'boolean'
        ? record.editingHistory
        : DEFAULT_CONFIGURE_SETTINGS.editingHistory,
  }
}

export function loadConfigureSettings(): ConfigureSettings {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_CONFIGURE_SETTINGS }
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return { ...DEFAULT_CONFIGURE_SETTINGS }
    return normalizeSettings(JSON.parse(stored))
  } catch {
    return { ...DEFAULT_CONFIGURE_SETTINGS }
  }
}

export function saveConfigureSettings(settings: ConfigureSettings): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeSettings(settings)))
  } catch {
    // Quota or private-mode failures — ignore.
  }
}

let sharedConfigureSettings: Ref<ConfigureSettings> | null = null

export function useConfigureSettings(): Ref<ConfigureSettings> {
  if (!sharedConfigureSettings) {
    sharedConfigureSettings = ref(loadConfigureSettings())

    watch(
      sharedConfigureSettings,
      (value) => {
        saveConfigureSettings(value)
      },
      { deep: true },
    )
  }

  return sharedConfigureSettings
}
