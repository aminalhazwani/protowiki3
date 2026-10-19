/**
 * Every Codex icon by its export name (from the `tab-bar` branch), for the tab
 * bar's icon picker. Names are stored rather than icon objects, so the config
 * stays JSON.
 */
import * as CodexIcons from '@wikimedia/codex-icons'
import type { Icon } from '@wikimedia/codex-icons'

export interface IconCatalogEntry {
  /** Export name, e.g. `cdxIconMapPin`. */
  name: string
  /** Readable label from the name ("Map pin"). */
  label: string
  icon: Icon
}

// The module also exports helpers, so index it through `unknown` and keep the `cdxIcon` keys.
const iconModule = CodexIcons as unknown as Record<string, unknown>

/** `cdxIconBookmarkList` → "Bookmark list". */
export function iconLabelFromName(name: string): string {
  const spaced = name
    .replace(/^cdxIcon/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase()
}

/** Every Codex icon, sorted by export name. */
export const ICON_CATALOG: IconCatalogEntry[] = Object.keys(iconModule)
  .filter((key) => key.startsWith('cdxIcon'))
  .sort()
  .map((name) => ({ name, label: iconLabelFromName(name), icon: iconModule[name] as Icon }))

export function resolveCodexIcon(name: string | null | undefined): Icon | undefined {
  if (!name) return undefined
  return iconModule[name] as Icon | undefined
}
