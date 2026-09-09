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

export function isWikitaLiteUrlModeActive(): boolean {
  return wikitaLiteUrlModeActive
}
