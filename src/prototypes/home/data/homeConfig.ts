/**
 * The Home prototype's own state: one versioned localStorage blob, grown one
 * field at a time. Each field has a normalizer, so anything stored by an older
 * build (or edited by hand) loads as a valid config.
 *
 * Adding a field: add it to `HomeConfig`, give it a default in
 * `DEFAULT_HOME_CONFIG`, and normalize it in `normalizeHomeConfig`. Bump the key
 * only for breaking changes.
 */

export const HOME_CONFIG_STORAGE_KEY = 'protowiki-home-config-v1'

export interface HomeConfig {
  /**
   * Name of the account made in the prototype. Shown in place of the **New user**
   * preset's name; `null` keeps the preset's own. Whether anyone is signed in at
   * all is the ProtoWiki **Mock user** preset (`?user=`), not this.
   */
  username: string | null
  /**
   * When each page was saved (ms), by title. The saved list itself is the Mock
   * user's **Saved pages** (`readingList`); this only adds the times.
   */
  savedAt: Record<string, number>
}

export const DEFAULT_HOME_CONFIG: HomeConfig = {
  username: null,
  savedAt: {},
}

/** MediaWiki's limit on username length. */
const MAX_USERNAME_LENGTH = 85

/** Trimmed, single-spaced, first letter upper-cased (as MediaWiki does); `null` if empty. */
export function normalizeUsername(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const name = value.replace(/_/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_USERNAME_LENGTH)
  if (!name) return null
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function normalizeSavedAt(value: unknown): Record<string, number> {
  if (typeof value !== 'object' || value === null) return {}
  const entries = Object.entries(value as Record<string, unknown>).filter(
    (entry): entry is [string, number] => Number.isFinite(entry[1]) && (entry[1] as number) > 0,
  )
  return Object.fromEntries(entries)
}

export function normalizeHomeConfig(input: unknown): HomeConfig {
  const record =
    typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
  return {
    username: normalizeUsername(record.username),
    savedAt: normalizeSavedAt(record.savedAt),
  }
}

export function loadHomeConfig(): HomeConfig {
  try {
    const raw = window.localStorage.getItem(HOME_CONFIG_STORAGE_KEY)
    return normalizeHomeConfig(raw ? JSON.parse(raw) : null)
  } catch {
    // Unavailable storage or corrupt JSON — start from defaults.
    return normalizeHomeConfig(null)
  }
}

/** Merge `partial` into the stored config. Returns the new config (kept in memory even if storage fails). */
export function patchHomeConfig(partial: Partial<HomeConfig>): HomeConfig {
  const next = normalizeHomeConfig({ ...loadHomeConfig(), ...partial })
  try {
    window.localStorage.setItem(HOME_CONFIG_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Quota or private mode — the in-memory state still works for this visit.
  }
  return next
}

/** Forget everything the Home prototype stored. */
export function resetHomeConfig(): HomeConfig {
  try {
    window.localStorage.removeItem(HOME_CONFIG_STORAGE_KEY)
  } catch {
    // Ignore — defaults are returned either way.
  }
  return normalizeHomeConfig(null)
}
