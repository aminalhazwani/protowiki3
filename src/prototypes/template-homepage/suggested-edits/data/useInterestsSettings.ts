import { ref, watch, type Ref } from 'vue'

import {
  ACCOUNT_CREATION_PAGE,
  DEFAULT_INTERESTS_SETTINGS,
  MAX_INTEREST_CHIPS,
  chipKey,
  getCatalogTopicById,
  getCatalogTopicsForCategory,
  slugifyInterestsLabel,
  type InterestsChipEntry,
  type InterestsChipKind,
  type InterestsPersonalization,
  type InterestsSettings,
} from './interestsFixtures'

const STORAGE_KEY_V2 = 'protowiki-template-homepage-interests-v2'
const STORAGE_KEY_V1 = 'protowiki-template-homepage-interests-v1'

export type InterestsSuggestionKind = 'page' | 'topic' | 'category'

export interface ParsedInterestsSuggestion {
  kind: InterestsSuggestionKind
  pageTitle?: string
  topicId?: string
  categoryId?: string
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

function isChipEntry(value: unknown): value is InterestsChipEntry {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as InterestsChipEntry).id === 'string' &&
    typeof (value as InterestsChipEntry).label === 'string' &&
    isBoolean((value as InterestsChipEntry).selected) &&
    ((value as InterestsChipEntry).kind === 'page' || (value as InterestsChipEntry).kind === 'topic')
  )
}

function isPersonalization(value: unknown): value is InterestsPersonalization {
  return (
    typeof value === 'object' &&
    value !== null &&
    isBoolean((value as InterestsPersonalization).editingHistory) &&
    isBoolean((value as InterestsPersonalization).watchlist)
  )
}

function labelsMatch(a: string, b: string): boolean {
  return a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0
}

function ensurePinnedAccountPage(chips: InterestsChipEntry[]): InterestsChipEntry[] {
  const pinnedIndex = chips.findIndex((chip) => chip.kind === 'page' && (chip.pinned || chip.id === 'wikipedia'))
  const pinned: InterestsChipEntry =
    pinnedIndex >= 0
      ? {
          ...chips[pinnedIndex],
          kind: 'page',
          pinned: true,
          label: chips[pinnedIndex].label || ACCOUNT_CREATION_PAGE,
        }
      : {
          id: 'wikipedia',
          label: ACCOUNT_CREATION_PAGE,
          selected: true,
          kind: 'page',
          pinned: true,
        }

  const rest = chips.filter((_, index) => index !== pinnedIndex)
  return [pinned, ...rest]
}

export function pruneInterestChips(chips: InterestsChipEntry[]): InterestsChipEntry[] {
  let pruned = ensurePinnedAccountPage(chips)

  while (pruned.length > MAX_INTEREST_CHIPS) {
    let removed = false
    for (let index = pruned.length - 1; index >= 0; index -= 1) {
      const chip = pruned[index]
      if (chip.kind !== 'topic') continue
      if (chip.selected) continue
      pruned.splice(index, 1)
      removed = true
      break
    }
    if (!removed) break
  }

  return pruned
}

function insertIndexForNewChip(chips: InterestsChipEntry[]): number {
  const pinnedIndex = chips.findIndex((chip) => chip.pinned)
  return pinnedIndex >= 0 ? pinnedIndex + 1 : 0
}

function moveChipToTop(chips: InterestsChipEntry[], key: string): InterestsChipEntry[] {
  const index = chips.findIndex((chip) => chipKey(chip.kind, chip.id) === key)
  if (index < 0) return chips

  const [chip] = chips.splice(index, 1)
  const insertAt = chip.pinned ? 0 : insertIndexForNewChip(chips)
  chips.splice(insertAt, 0, chip)
  return chips
}

function mergeChips(stored: unknown): InterestsChipEntry[] {
  if (!Array.isArray(stored)) return [...DEFAULT_INTERESTS_SETTINGS.chips]

  const validStored = stored.filter(isChipEntry)
  if (validStored.length === 0) return [...DEFAULT_INTERESTS_SETTINGS.chips]

  const defaultKeys = new Set(DEFAULT_INTERESTS_SETTINGS.chips.map((chip) => chipKey(chip.kind, chip.id)))
  const mergedDefaults = DEFAULT_INTERESTS_SETTINGS.chips.map((defaultChip) => {
    const storedChip = validStored.find(
      (chip) => chip.kind === defaultChip.kind && chip.id === defaultChip.id,
    )
    return storedChip
      ? {
          ...defaultChip,
          ...storedChip,
          kind: defaultChip.kind,
          pinned: defaultChip.pinned ?? storedChip.pinned,
        }
      : defaultChip
  })

  const customChips = validStored.filter((chip) => !defaultKeys.has(chipKey(chip.kind, chip.id)))
  return pruneInterestChips([...mergedDefaults, ...customChips])
}

function chipsFromLegacyV2(raw: Record<string, unknown>): InterestsChipEntry[] {
  const chips: InterestsChipEntry[] = []

  const pages = raw.pages
  if (Array.isArray(pages)) {
    for (const page of pages) {
      if (typeof page !== 'object' || page === null) continue
      const id = (page as { id?: string }).id
      const label = (page as { label?: string }).label
      const selected = (page as { selected?: boolean }).selected
      const pinned = (page as { pinned?: boolean }).pinned
      if (!id || !label || !isBoolean(selected)) continue
      chips.push({ id, label, selected, kind: 'page', pinned })
    }
  }

  const topicChips = raw.topicChips
  if (Array.isArray(topicChips)) {
    for (const topic of topicChips) {
      if (typeof topic !== 'object' || topic === null) continue
      const id = (topic as { id?: string }).id
      const label = (topic as { label?: string }).label
      const selected = (topic as { selected?: boolean }).selected
      const categoryId = (topic as { categoryId?: string }).categoryId
      if (!id || !label || !isBoolean(selected) || !categoryId) continue
      chips.push({ id, label, selected, kind: 'topic', categoryId })
    }
  }

  return chips.length ? mergeChips(chips) : [...DEFAULT_INTERESTS_SETTINGS.chips]
}

export function normalizeInterestsSettings(raw: unknown): InterestsSettings {
  const defaults = DEFAULT_INTERESTS_SETTINGS

  if (typeof raw !== 'object' || raw === null) {
    return structuredClone(defaults)
  }

  const candidate = raw as Record<string, unknown> & Partial<InterestsSettings>

  const chips = Array.isArray(candidate.chips)
    ? mergeChips(candidate.chips)
    : chipsFromLegacyV2(candidate)

  return {
    personalization: isPersonalization(candidate.personalization)
      ? candidate.personalization
      : { ...defaults.personalization },
    chips,
  }
}

function clearStoredKey(key: string): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(key)
  } catch {
    // Private mode or blocked storage — ignore.
  }
}

function migrateV1ToV2(): InterestsSettings | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY_V1)
    if (!stored) return null

    const parsed = JSON.parse(stored) as Record<string, unknown>
    const chips = [...DEFAULT_INTERESTS_SETTINGS.chips]
    const chipsByKey = new Map(chips.map((chip) => [chipKey(chip.kind, chip.id), chip]))

    const pages = parsed.pages
    if (Array.isArray(pages)) {
      for (const page of pages) {
        if (typeof page !== 'object' || page === null) continue
        const id = (page as { id?: string }).id
        const label = (page as { label?: string }).label
        const selected = (page as { selected?: boolean }).selected
        const pinned = (page as { pinned?: boolean }).pinned
        if (!id || !label || !isBoolean(selected)) continue

        const key = chipKey('page', id)
        const existing = chipsByKey.get(key)
        if (existing) {
          existing.selected = selected
          continue
        }

        const chip: InterestsChipEntry = { id, label, selected, kind: 'page', pinned }
        chips.push(chip)
        chipsByKey.set(key, chip)
      }
    }

    const topicCategories = parsed.topicCategories
    if (Array.isArray(topicCategories)) {
      for (const category of topicCategories) {
        if (typeof category !== 'object' || category === null) continue
        const categoryId = (category as { id?: string }).id
        const topics = (category as { topics?: unknown[] }).topics
        if (!categoryId || !Array.isArray(topics)) continue

        for (const topic of topics) {
          if (typeof topic !== 'object' || topic === null) continue
          const topicId = (topic as { id?: string }).id
          const label = (topic as { label?: string }).label
          const selected = (topic as { selected?: boolean }).selected
          if (!topicId || !label || !selected) continue

          const fullId = `${categoryId}:${topicId}`
          const key = chipKey('topic', fullId)
          const existing = chipsByKey.get(key)
          if (existing) {
            existing.selected = true
            continue
          }

          const catalogEntry = getCatalogTopicById(fullId)
          const chip: InterestsChipEntry = {
            id: fullId,
            label: catalogEntry?.label ?? label,
            selected: true,
            kind: 'topic',
            categoryId,
          }
          chips.push(chip)
          chipsByKey.set(key, chip)
        }
      }
    }

    clearStoredKey(STORAGE_KEY_V1)
    return normalizeInterestsSettings({
      personalization: parsed.personalization,
      chips,
    })
  } catch {
    clearStoredKey(STORAGE_KEY_V1)
    return null
  }
}

export function loadInterestsSettings(): InterestsSettings {
  if (typeof window === 'undefined') {
    return structuredClone(DEFAULT_INTERESTS_SETTINGS)
  }

  try {
    const migrated = migrateV1ToV2()
    if (migrated) {
      saveInterestsSettings(migrated)
      return migrated
    }

    const stored = window.localStorage.getItem(STORAGE_KEY_V2)
    if (!stored) return structuredClone(DEFAULT_INTERESTS_SETTINGS)

    const parsed = JSON.parse(stored)
    const normalized = normalizeInterestsSettings(parsed)

    if (JSON.stringify(normalized) !== JSON.stringify(parsed)) {
      saveInterestsSettings(normalized)
    }

    return normalized
  } catch {
    clearStoredKey(STORAGE_KEY_V2)
    return structuredClone(DEFAULT_INTERESTS_SETTINGS)
  }
}

export function saveInterestsSettings(settings: InterestsSettings): void {
  if (typeof window === 'undefined') return

  const normalized = normalizeInterestsSettings({
    ...settings,
    chips: pruneInterestChips(settings.chips),
  })

  try {
    window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(normalized))
  } catch {
    // Quota or private-mode failures — ignore.
  }
}

export function encodeInterestsSuggestion(
  kind: InterestsSuggestionKind,
  payload: { pageTitle?: string; topicId?: string; categoryId?: string },
): string {
  if (kind === 'page' && payload.pageTitle) {
    return `page:${encodeURIComponent(payload.pageTitle)}`
  }
  if (kind === 'topic' && payload.topicId) {
    return `topic:${payload.topicId}`
  }
  if (kind === 'category' && payload.categoryId) {
    return `category:${payload.categoryId}`
  }
  return ''
}

export function parseInterestsSuggestion(value: string | number | null): ParsedInterestsSuggestion | null {
  if (value === null || value === undefined) return null
  const raw = String(value)

  if (raw.startsWith('page:')) {
    const pageTitle = decodeURIComponent(raw.slice('page:'.length))
    return pageTitle.length ? { kind: 'page', pageTitle } : null
  }

  if (raw.startsWith('topic:')) {
    const topicId = raw.slice('topic:'.length)
    return topicId.length ? { kind: 'topic', topicId } : null
  }

  if (raw.startsWith('category:')) {
    const categoryId = raw.slice('category:'.length)
    return categoryId.length ? { kind: 'category', categoryId } : null
  }

  return null
}

function upsertChip(
  settings: InterestsSettings,
  chip: InterestsChipEntry,
  selected = true,
): void {
  const key = chipKey(chip.kind, chip.id)
  const existing = settings.chips.find((entry) => chipKey(entry.kind, entry.id) === key)

  if (existing) {
    existing.selected = selected
    settings.chips = pruneInterestChips(moveChipToTop(settings.chips, key))
    return
  }

  const insertAt = chip.pinned ? 0 : insertIndexForNewChip(settings.chips)
  settings.chips.splice(insertAt, 0, { ...chip, selected })
  settings.chips = pruneInterestChips(settings.chips)
}

export function addInterestsPage(settings: InterestsSettings, label: string): void {
  const trimmed = label.trim()
  if (!trimmed.length) return

  const existing = settings.chips.find(
    (chip) => chip.kind === 'page' && labelsMatch(chip.label, trimmed),
  )
  if (existing) {
    upsertChip(settings, existing, true)
    return
  }

  const id = slugifyInterestsLabel(trimmed)
  if (!id.length) return

  upsertChip(settings, { id, label: trimmed, selected: true, kind: 'page' }, true)
}

export function addInterestsTopic(settings: InterestsSettings, topicId: string, selected = true): void {
  const catalogEntry = getCatalogTopicById(topicId)
  if (!catalogEntry) return

  upsertChip(
    settings,
    {
      id: catalogEntry.id,
      label: catalogEntry.label,
      selected,
      kind: 'topic',
      categoryId: catalogEntry.categoryId,
    },
    selected,
  )
}

export function addInterestsCategory(settings: InterestsSettings, categoryId: string): void {
  const topics = getCatalogTopicsForCategory(categoryId)
  for (let index = topics.length - 1; index >= 0; index -= 1) {
    const catalogEntry = topics[index]
    upsertChip(
      settings,
      {
        id: catalogEntry.id,
        label: catalogEntry.label,
        selected: true,
        kind: 'topic',
        categoryId: catalogEntry.categoryId,
      },
      true,
    )
  }
}

export function applyInterestsSuggestion(
  settings: InterestsSettings,
  value: string | number | null,
): void {
  const parsed = parseInterestsSuggestion(value)
  if (!parsed) return

  if (parsed.kind === 'page' && parsed.pageTitle) {
    addInterestsPage(settings, parsed.pageTitle)
    return
  }

  if (parsed.kind === 'topic' && parsed.topicId) {
    addInterestsTopic(settings, parsed.topicId, true)
    return
  }

  if (parsed.kind === 'category' && parsed.categoryId) {
    addInterestsCategory(settings, parsed.categoryId)
  }
}

export function useInterestsSettings(): Ref<InterestsSettings> {
  const settings = ref<InterestsSettings>(loadInterestsSettings())

  watch(
    settings,
    (value) => {
      saveInterestsSettings(value)
    },
    { deep: true },
  )

  return settings
}
