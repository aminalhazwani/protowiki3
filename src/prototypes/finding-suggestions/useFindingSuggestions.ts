import { computed, ref } from 'vue'

import { useConfig } from '@/composables/useConfig'

import { DEFAULT_EDIT_TYPES, HARDER_EDIT_TYPES, type EditTypeId } from './editTypeOptions'
import { titleKey } from './useHomeSeeds'

export type FindingDialog = 'interests' | 'edit-types'

export const MAX_INTERESTS = 10

/** The scripted count once suggestions are found (the mockup's). */
export const FOUND_COUNT = 23

// Module-level: the Home, its module page and the dialogs share one scenario.
// In memory only, so a reload starts the scenario over.
const started = ref(false)
const setupOpen = ref(false)
const interests = ref<string[]>([])
const editTypes = ref<EditTypeId[]>([...DEFAULT_EDIT_TYPES])
/** The interests picked in account setup: with only these, nothing is found. */
const setupInterests = ref<Set<string>>(new Set())
const dialog = ref<FindingDialog | null>(null)
/** Which "anytime from this menu" popover points at the Suggested edits menu. */
const popover = ref<FindingDialog | null>(null)

/**
 * The scripted rule (the mockup's): the starting easy types and the interests
 * from account setup find nothing; a medium or hard type, or an interest added
 * after setup, finds suggestions. While setup is open, every interest is a
 * setup interest, so the Home behind it stays empty.
 */
export function findsSuggestions(types: readonly EditTypeId[], titles: readonly string[]): boolean {
  return (
    types.some((id) => HARDER_EDIT_TYPES.has(id)) ||
    (!setupOpen.value && titles.some((title) => !setupInterests.value.has(titleKey(title))))
  )
}

/**
 * The "Finding suggested edits" scenario: account setup's interests step, then
 * a Home whose Suggested edits stay empty until the reader's interests or types
 * of edits find some.
 */
export function useFindingSuggestions() {
  const { user } = useConfig()

  const hasSuggestions = computed(() => findsSuggestions(editTypes.value, interests.value))

  /** Scenario 1: a new account, right after account creation, on setup's last step. */
  function startFromAccountSetup(): void {
    user.value = 'new'
    interests.value = []
    editTypes.value = [...DEFAULT_EDIT_TYPES]
    setupInterests.value = new Set()
    dialog.value = null
    popover.value = null
    setupOpen.value = true
    started.value = true
  }

  /** The first visit starts scenario 1. */
  function ensureStarted(): void {
    if (!started.value) startFromAccountSetup()
  }

  /** "Go to your Home": whatever was picked, the Home starts out empty. */
  function finishSetup(): void {
    setupInterests.value = new Set(interests.value.map(titleKey))
    setupOpen.value = false
  }

  function setInterests(titles: string[]): void {
    interests.value = titles.slice(0, MAX_INTERESTS)
  }

  /**
   * A dialog's Done. From an empty Home to one with suggestions, the popover
   * shows where that dialog lives.
   */
  function apply(
    from: FindingDialog,
    next: { interests?: string[]; editTypes?: EditTypeId[] },
    { teach = true } = {},
  ): void {
    const wasEmpty = !hasSuggestions.value
    if (next.interests) setInterests(next.interests)
    if (next.editTypes) editTypes.value = [...next.editTypes]
    popover.value = teach && wasEmpty && hasSuggestions.value ? from : null
  }

  /** A module's "…" pick: Interests and Types of edits open their dialogs. */
  function onMenuSelect(value: string | number): void {
    if (value === 'interests') dialog.value = 'interests'
    else if (value === 'edit-types') dialog.value = 'edit-types'
    else return
    popover.value = null
  }

  return {
    setupOpen,
    interests,
    editTypes,
    dialog,
    popover,
    hasSuggestions,
    startFromAccountSetup,
    ensureStarted,
    finishSetup,
    setInterests,
    apply,
    onMenuSelect,
  }
}
