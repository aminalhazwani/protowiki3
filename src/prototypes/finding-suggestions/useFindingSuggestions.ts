import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useConfig } from '@/composables/useConfig'

import { DEFAULT_EDIT_TYPES, HARDER_EDIT_TYPES, type EditTypeId } from './editTypeOptions'
import { SUGGESTED_EDITS_MENU } from './homeModuleMenus'
import { titleKey } from './useHomeSeeds'

export type FindingDialog = 'interests' | 'edit-types'

export const MAX_INTERESTS = 10

/** The scripted count once suggestions are found (the mockup's). */
export const FOUND_COUNT = 23

/**
 * The prototype's scenarios, each with the types of edits that find
 * suggestions in it (the scripted rule; see `findsSuggestions`).
 */
export const SCENARIOS = {
  /** 1: right after account creation, on account setup's last step. */
  'account-setup': {
    label: 'From Account Setup',
    findingTypes: HARDER_EDIT_TYPES,
  },
  /** 2: a Home with suggested edits, until "Add links" is switched off. */
  home: {
    label: 'From the Home',
    findingTypes: new Set<EditTypeId>([...HARDER_EDIT_TYPES, 'links']),
  },
} satisfies Record<string, { label: string; findingTypes: ReadonlySet<EditTypeId> }>

export type Scenario = keyof typeof SCENARIOS

export function isScenario(value: unknown): value is Scenario {
  return typeof value === 'string' && value in SCENARIOS
}

/** Scenario 2's reader already follows one interest. */
const HOME_INTERESTS = ['Impressionism']

// Module-level: the Home, its module page and the dialogs share one scenario.
// In memory only, so a reload starts the scenario over.
const scenario = ref<Scenario | null>(null)
const setupOpen = ref(false)
const interests = ref<string[]>([])
const editTypes = ref<EditTypeId[]>([...DEFAULT_EDIT_TYPES])
/** The interests the scenario starts from (setup's picks, or the Home's): alone, they find nothing. */
const startingInterests = ref<Set<string>>(new Set())
const dialog = ref<FindingDialog | null>(null)
/** Which "anytime from this menu" popover points at the Suggested edits menu. */
const popover = ref<FindingDialog | null>(null)

/**
 * The scripted rule (the mockups'): a scenario's finding types, or an
 * interest added after it starts, find suggestions — in scenario 1 a medium
 * or hard type, in scenario 2 also "Add links". While setup is open, every
 * interest is a setup interest, so the Home behind it stays empty.
 */
export function findsSuggestions(types: readonly EditTypeId[], titles: readonly string[]): boolean {
  const findingTypes = SCENARIOS[scenario.value ?? 'account-setup'].findingTypes
  return (
    types.some((id) => findingTypes.has(id)) ||
    (!setupOpen.value && titles.some((title) => !startingInterests.value.has(titleKey(title))))
  )
}

/**
 * The "Finding suggested edits" scenarios: a Home whose Suggested edits come
 * and go with the reader's interests and types of edits.
 */
export function useFindingSuggestions() {
  const { user } = useConfig()

  const hasSuggestions = computed(() => findsSuggestions(editTypes.value, interests.value))

  /** Suggested edits' "…" menu, with how many of each are selected (the mockup's). */
  const suggestedEditsMenu = computed(() => ({
    ...SUGGESTED_EDITS_MENU,
    items: SUGGESTED_EDITS_MENU.items.map((item) => ({
      ...item,
      description: `${item.value === 'interests' ? interests.value.length : editTypes.value.length} selected`,
    })),
  }))

  /** Start a scenario over, as a new account. */
  function start(next: Scenario): void {
    user.value = 'new'
    scenario.value = next
    interests.value = next === 'home' ? [...HOME_INTERESTS] : []
    editTypes.value = [...DEFAULT_EDIT_TYPES]
    startingInterests.value = new Set(interests.value.map(titleKey))
    dialog.value = null
    popover.value = null
    setupOpen.value = next === 'account-setup'
  }

  /** The first visit starts `initial` (`?scenario=`), or scenario 1. */
  function ensureStarted(initial?: unknown): void {
    if (!scenario.value) start(isScenario(initial) ? initial : 'account-setup')
  }

  /** "Go to your Home": whatever was picked, the Home starts out empty. */
  function finishSetup(): void {
    startingInterests.value = new Set(interests.value.map(titleKey))
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
    scenario,
    setupOpen,
    interests,
    editTypes,
    dialog,
    popover,
    hasSuggestions,
    suggestedEditsMenu,
    start,
    ensureStarted,
    finishSetup,
    setInterests,
    apply,
    onMenuSelect,
  }
}

/**
 * A page's half of the `?scenario=` link: the first visit starts the linked
 * scenario (or scenario 1), and the URL then follows whichever is running —
 * from the ☰ menu, or after in-prototype links drop it — so the address bar
 * is always a direct link to it.
 */
export function useScenarioUrl(): void {
  const route = useRoute()
  const router = useRouter()
  const { ensureStarted } = useFindingSuggestions()

  ensureStarted(route.query.scenario)

  watch(
    [scenario, () => route.query.scenario],
    ([current, linked]) => {
      if (!current || linked === current) return
      void router.replace({ query: { ...route.query, scenario: current } })
    },
    { immediate: true },
  )
}
