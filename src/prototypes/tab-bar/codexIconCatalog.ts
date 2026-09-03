import * as CodexIcons from '@wikimedia/codex-icons'
import type { Icon } from '@wikimedia/codex-icons'

/** Codex icon export key, e.g. `cdxIconChartLine`. Stored instead of the icon object so state is JSON-safe. */
export type CodexIconName = string

export interface IconCatalogEntry {
  name: CodexIconName
  /** Human label derived from the export key (“Chart line”). */
  label: string
  icon: Icon
}

// The module also exports helpers (`resolveIcon`, …), so index it through `unknown` and filter by prefix.
const iconModule = CodexIcons as unknown as Record<string, unknown>

export function iconLabelFromName(name: CodexIconName): string {
  const spaced = name
    .replace(/^cdxIcon/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase()
}

/** Every Codex icon, sorted by export key. */
export const ICON_CATALOG: IconCatalogEntry[] = Object.keys(iconModule)
  .filter((key) => key.startsWith('cdxIcon'))
  .sort()
  .map((name) => ({ name, label: iconLabelFromName(name), icon: iconModule[name] as Icon }))

export function resolveCodexIcon(name: CodexIconName | null | undefined): Icon | undefined {
  if (!name) return undefined
  const icon = iconModule[name]
  return icon === undefined ? undefined : (icon as Icon)
}
