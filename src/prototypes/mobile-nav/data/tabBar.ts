/**
 * The mobile tab bar's editable tabs (after the `tab-bar` branch's global
 * toolbar). Home is implicit and always first; these are the four after it.
 */

/** One editable tab. Empty when `icon` is `null` or `destination` is `''`. */
export interface HomeTabSlot {
  /** Stable key; travels with the row when it's reordered. */
  id: string
  /** A Codex icon export name (`cdxIconMapPin`), so the config stays JSON. */
  icon: string | null
  /** Page title in display form ("Special:Nearby", "Main Page"). */
  destination: string
}

export const DEFAULT_TAB_BAR: readonly HomeTabSlot[] = [
  { id: 't1', icon: 'cdxIconMapPin', destination: 'Special:Nearby' },
  { id: 't2', icon: 'cdxIconDie', destination: 'Special:Random' },
  { id: 't3', icon: 'cdxIconBookmarkList', destination: 'Special:ReadingLists' },
  { id: 't4', icon: 'cdxIconSearch', destination: 'Special:Search' },
]

/** Stored tabs, or `null` (the default set) when they don't read as a list of tabs. */
export function normalizeTabBar(value: unknown): HomeTabSlot[] | null {
  if (!Array.isArray(value)) return null
  const slots = value.flatMap((entry): HomeTabSlot[] => {
    if (typeof entry !== 'object' || entry === null) return []
    const record = entry as Record<string, unknown>
    if (typeof record.id !== 'string') return []
    return [
      {
        id: record.id,
        icon: typeof record.icon === 'string' ? record.icon : null,
        destination: typeof record.destination === 'string' ? record.destination : '',
      },
    ]
  })
  return slots.length ? slots : null
}
