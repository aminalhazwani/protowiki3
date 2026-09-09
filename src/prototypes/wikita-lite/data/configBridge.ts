let suppressConfigSave = false
let wikitaLiteUrlModeActive = false

export function setWikitaLiteConfigSaveSuppressed(suppressed: boolean): void {
  suppressConfigSave = suppressed
}

export function setWikitaLiteUrlModeActive(active: boolean): void {
  wikitaLiteUrlModeActive = active
}

export function isWikitaLiteConfigSaveSuppressed(): boolean {
  return wikitaLiteUrlModeActive || suppressConfigSave
}

/** Blocks config→URL sync during URL→config hydration (prevents feedback loops). */
export function isWikitaLiteConfigHydrationSuppressed(): boolean {
  return suppressConfigSave
}

export function isWikitaLiteUrlModeActive(): boolean {
  return wikitaLiteUrlModeActive
}
