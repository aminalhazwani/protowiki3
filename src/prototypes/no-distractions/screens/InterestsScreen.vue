<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  CdxButton,
  CdxMultiselectLookup,
  CdxToggleSwitch,
  type ChipInputItem,
  type MenuItemData,
  type MenuItemValue,
} from '@wikimedia/codex'

import { useConfig } from '@/composables/useConfig'
import { normalizeTitleKey } from '@/lib/fetchMorelike'

import DialogShell from '../components/DialogShell.vue'
import InterestSuggestions from '../components/InterestSuggestions.vue'
import { useConfigureSettings } from '../data/useConfigureSettings'
import { useInterestSuggestions } from '../data/useInterestSuggestions'
import { fetchTitleSearchResults } from '../data/titleSearch'
import type { FlowState } from '../data/useFlowState'

const MAX_INTERESTS = 3

const props = defineProps<{ flow: FlowState }>()

const { user, realUsername, lang } = useConfig()
const configureSettings = useConfigureSettings()

const interests = computed(() => props.flow.interests.value)
// 3 is the cap shown in the heading; the seed counts toward it.
const maxInterestsReached = computed(() => interests.value.length >= MAX_INTERESTS)

const {
  suggestions,
  loading: suggestionsLoading,
  source: suggestionsSource,
} = useInterestSuggestions(
  () => props.flow.interests.value,
  () => lang.value,
  // Freeze suggestions at the cap: picking the final interest must not swap the
  // list for a fresh (disabled) set the reader can't act on.
  () => maxInterestsReached.value,
)

// Hide already-selected interests from the suggestion list. Matters most once
// the list is frozen at the cap: the interest the reader just picked would
// otherwise linger in the now-disabled list.
const visibleSuggestions = computed(() => {
  const selected = new Set(interests.value.map((t) => normalizeTitleKey(t)))
  return suggestions.value.filter((hit) => !selected.has(normalizeTitleKey(hit.title)))
})

// MultiselectLookup owns `inputChips` and `selected` through v-model, but
// `interests` (persisted in the URL, and also mutated by the suggestion buttons
// and the seed article) is the source of truth. These two watchers keep them in
// sync both ways; the equality guards stop the updates ping-ponging.
const inputChips = ref<ChipInputItem[]>([])
const selected = ref<MenuItemValue[]>([])

function sameSet(a: string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

// interests -> component (covers the seed and suggestion-button additions).
watch(
  interests,
  (list) => {
    if (!sameSet(selected.value.map(String), list)) selected.value = [...list]
    if (!sameSet(inputChips.value.map((c) => String(c.value)), list)) {
      inputChips.value = list.map((title) => ({ value: title, label: title }))
    }
  },
  { immediate: true },
)

// component -> interests. `selected` moves on both menu picks and chip removals,
// so it's the one canonical path back. Hold the cap by reverting an over-limit
// selection instead of writing it through.
watch(selected, (values) => {
  const titles = values.map(String)
  if (titles.length > MAX_INTERESTS) {
    selected.value = [...interests.value]
    inputChips.value = interests.value.map((title) => ({ value: title, label: title }))
    return
  }
  if (!sameSet(titles, interests.value)) props.flow.interests.value = titles
})

// Dropdown results for the current query. Codex menu items keep the thumbnail
// (the chips can't — CdxInputChip is icon-only), plus the article description.
const menuItems = ref<MenuItemData[]>([])
const menuConfig = { showThumbnail: true, boldLabel: true }

let abortController: AbortController | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// The seed article (title param) is pre-populated as interest #1. The button
// only turns progressive once the reader has picked an interest beyond it.
const goHomeActive = computed(
  () => interests.value.filter((t) => t !== props.flow.title.value).length >= 1,
)
// Captured once at mount, deliberately NOT reactive: an instance is created
// either as the onboarding step (returnTo empty) or as the configure dialog
// (returnTo set) and keeps that role for its whole life. Reading returnTo live
// would flip the root element from DialogShell back to the ob-page <section>
// during the leave transition — `finishInterests` clears returnTo on Done — which
// strands the outgoing view mid-transition and leaves a blank screen.
const configureMode = ref(props.flow.returnTo.value !== '')
const showEditingHistoryToggle = computed(() => configureMode.value && user.value === 'real')

async function finishInterests(): Promise<void> {
  const returnTo = props.flow.returnTo.value
  if (returnTo) {
    await props.flow.goTo(returnTo, { returnTo: '' })
  } else {
    await props.flow.goTo('home')
  }
}

async function fetchMenu(term: string): Promise<void> {
  abortController?.abort()
  const trimmed = term.trim()
  // Nothing to search, or already at the cap — offer no options to pick.
  if (!trimmed.length || maxInterestsReached.value) {
    menuItems.value = []
    return
  }

  abortController = new AbortController()
  try {
    const pages = await fetchTitleSearchResults(trimmed, {
      signal: abortController.signal,
      clientTag: 'no-distractions-interests',
    })
    const existing = new Set(interests.value.map((item) => item.toLowerCase()))
    menuItems.value = pages
      .filter((page) => !existing.has(page.title.toLowerCase()))
      .map((page) => ({
        value: page.title,
        label: page.title,
        description: page.description || undefined,
        thumbnail: page.thumbnailSrc ? { url: page.thumbnailSrc } : null,
      }))
  } catch (error) {
    if ((error as Error).name !== 'AbortError') menuItems.value = []
  }
}

// Debounced so search runs as the user types (the `input` event fires on every
// keystroke, including during IME composition).
function onSearchInput(value: string | number): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  const term = String(value)
  debounceTimer = setTimeout(() => void fetchMenu(term), 200)
}

// The suggestion buttons add through the same source of truth.
function addInterest(title: string): void {
  const trimmed = title.trim()
  if (!trimmed.length || maxInterestsReached.value) return
  if (interests.value.some((item) => item.toLowerCase() === trimmed.toLowerCase())) return
  props.flow.interests.value = [...interests.value, trimmed]
}

onBeforeUnmount(() => {
  abortController?.abort()
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <component
    :is="configureMode ? DialogShell : 'section'"
    :class="configureMode ? undefined : 'ob-page'"
    :title="configureMode ? 'Interests' : undefined"
    :overlay="configureMode ? false : undefined"
    @close="finishInterests"
    @done="finishInterests"
  >
    <h1 v-if="!configureMode" class="ob-title">What are 3 of your interests?</h1>

    <div :class="configureMode ? 'interests__configure-body' : 'ob-body'">
      <div class="interests__fields">
        <!-- Search input, results menu and the selected chips are all the one
             Codex lookup now. `separate-input` stacks the chips below the input
             (matching the old layout). Kept in sync with `interests` above. -->
        <CdxMultiselectLookup
          v-model:input-chips="inputChips"
          v-model:selected="selected"
          class="interests__lookup"
          :class="{ 'interests__lookup--capped': maxInterestsReached }"
          :menu-items="menuItems"
          :menu-config="menuConfig"
          separate-input
          placeholder="Search articles or topics"
          aria-label="Search articles or topics"
          @input="onSearchInput"
        >
          <template #no-results>No results found.</template>
        </CdxMultiselectLookup>

        <InterestSuggestions
          :suggestions="visibleSuggestions"
          :loading="suggestionsLoading"
          :source="suggestionsSource"
          :disabled="maxInterestsReached"
          @add="addInterest"
        />

        <div v-if="showEditingHistoryToggle" class="interests__switch-list">
          <div class="interests__switch-row">
            <CdxToggleSwitch v-model="configureSettings.editingHistory" align-switch>
              Show suggestions based on editing history
            </CdxToggleSwitch>
          </div>
          <p v-if="!realUsername.trim()" class="interests__switch-hint">
            Set a username in prototype settings.
          </p>
        </div>
      </div>

      <div v-if="!configureMode" class="ob-actions">
        <CdxButton
          :action="goHomeActive ? 'progressive' : 'default'"
          :weight="goHomeActive ? 'primary' : 'quiet'"
          @click="props.flow.goTo('home')"
        >
          Go to your Home
        </CdxButton>
      </div>
    </div>
  </component>
</template>

<style scoped>
.interests__configure-body {
  padding: var(--spacing-100, 16px);
}

.interests__fields {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75, 12px);
}

/* At the cap the input row goes inactive. With `separate-input` the chips sit
   in a separate sibling container, so greying and blocking pointer events on
   just the input wrapper leaves the chips fully interactive — a selection can
   still be removed. (Typing is already inert at the cap: the menu fetch returns
   nothing.) The `:not(--disabled)` mirrors Codex's own base-background selector
   so this override outranks it. */
.interests__lookup--capped
  :deep(.cdx-chip-input:not(.cdx-chip-input--disabled) .cdx-chip-input__separate-input) {
  pointer-events: none;
  background-color: var(--background-color-disabled-subtle, #eaecf0);
}

.interests__lookup--capped :deep(.cdx-chip-input__input) {
  background-color: transparent;
  color: var(--color-disabled, #a2a9b1);
}

.interests__switch-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50, 8px);
}

.interests__switch-row {
  display: flex;
  align-items: center;
  min-height: 2.75rem;
}

.interests__switch-hint {
  margin: 0;
  font-size: var(--font-size-small, 0.875rem);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-subtle, #54595d);
}
</style>
