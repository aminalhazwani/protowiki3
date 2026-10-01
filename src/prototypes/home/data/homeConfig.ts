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
  /** Whether the reader has a mentor; `null` follows the default (assigned, as on home2). */
  mentorAssigned: boolean | null
  /** The "We've assigned you…" notice was dismissed. */
  mentorNoticeDismissed: boolean
  /**
   * The reader's Home layout (module order + the ones switched on); `null`
   * follows the default. Ids are checked against the registry when it's read
   * (`resolveHomeLayout`), so modules added later still show up.
   */
  layout: { order: string[]; on: string[] } | null
  /** Articles the reader picked in Personalization, at most `MAX_INTERESTS`. */
  interests: string[]
  /** Which of the reader's activity shapes the personal modules (Personalization). */
  sources: HomeSources
}

export interface HomeSources {
  interests: boolean
  saved: boolean
  watchlist: boolean
  contributions: boolean
}

export const MAX_INTERESTS = 10

export const DEFAULT_HOME_CONFIG: HomeConfig = {
  username: null,
  savedAt: {},
  mentorAssigned: null,
  mentorNoticeDismissed: false,
  layout: null,
  interests: [],
  sources: { interests: true, saved: true, watchlist: true, contributions: true },
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

function normalizeIdList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  return value.filter((id): id is string => typeof id === 'string')
}

function normalizeLayout(value: unknown): HomeConfig['layout'] {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>
  const order = normalizeIdList(record.order)
  const on = normalizeIdList(record.on)
  return order && on ? { order, on } : null
}

function normalizeInterests(value: unknown): string[] {
  const titles = (normalizeIdList(value) ?? []).map((title) => title.trim()).filter(Boolean)
  return [...new Set(titles)].slice(0, MAX_INTERESTS)
}

/** Each switch falls back to its default (on) unless stored as a boolean. */
function normalizeSources(value: unknown): HomeSources {
  const record =
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
  const pick = (key: keyof HomeSources) =>
    typeof record[key] === 'boolean' ? (record[key] as boolean) : DEFAULT_HOME_CONFIG.sources[key]
  return {
    interests: pick('interests'),
    saved: pick('saved'),
    watchlist: pick('watchlist'),
    contributions: pick('contributions'),
  }
}

export function normalizeHomeConfig(input: unknown): HomeConfig {
  const record =
    typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}
  return {
    username: normalizeUsername(record.username),
    savedAt: normalizeSavedAt(record.savedAt),
    mentorAssigned: typeof record.mentorAssigned === 'boolean' ? record.mentorAssigned : null,
    mentorNoticeDismissed: record.mentorNoticeDismissed === true,
    layout: normalizeLayout(record.layout),
    interests: normalizeInterests(record.interests),
    sources: normalizeSources(record.sources),
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
