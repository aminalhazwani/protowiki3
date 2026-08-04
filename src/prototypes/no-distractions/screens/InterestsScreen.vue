<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  CdxField,
  CdxMessage,
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

// Selection is unlimited, but only the first N interests seed the suggested-edits
// pool (applied where the pool is bound, in the prototype's index.vue) — and
// reaching N is what confirms the Home is personalized. The seed article counts.
const POOL_INTEREST_LIMIT = 10

const props = defineProps<{ flow: FlowState }>()

const { user, realUsername, lang } = useConfig()
const configureSettings = useConfigureSettings()

const interests = computed(() => props.flow.interests.value)
const hasInterests = computed(() => interests.value.length > 0)

// Latched, not reactive to the current count: once the reader has reached the
// limit the reassurance stays put. Removing a chip afterwards shouldn't yank it
// away — they can keep adding, and everything past the limit is simply ignored
// by the pool. `immediate` covers a direct load that already sits at the limit.
const poolLimitReached = ref(false)
watch(
  () => interests.value.length,
  (count) => {
    if (count >= POOL_INTEREST_LIMIT) poolLimitReached.value = true
  },
  { immediate: true },
)

const {
  suggestions,
  loading: suggestionsLoading,
  source: suggestionsSource,
} = useInterestSuggestions(
  () => props.flow.interests.value,
  () => lang.value,
)

// Hide already-selected interests from the suggestion list, so the interest the
// reader just picked doesn't linger in the refreshed list.
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
// so it's the one canonical path back.
watch(selected, (values) => {
  const titles = values.map(String)
  if (!sameSet(titles, interests.value)) props.flow.interests.value = titles
})

// Dropdown results for the current query. Codex menu items keep the thumbnail
// (the chips can't — CdxInputChip is icon-only), plus the article description.
const menuItems = ref<MenuItemData[]>([])
const menuConfig = { showThumbnail: true, boldLabel: true }

let abortController: AbortController | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

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
  if (!trimmed.length) {
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
  if (!trimmed.length) return
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
        <div class="interests__lookup-group">
          <!-- The lookup is a Codex field, so the success confirmation below
               inherits the field's message rhythm. The label is hidden: the step
               heading (or the dialog title in configure mode) already names it.
               `messages` stays empty — the confirmation is rendered below so it
               can animate; `status` only carries the field's success state. -->
          <CdxField
            hide-label
            :status="poolLimitReached ? 'success' : 'default'"
            :messages="{}"
          >
            <template #label>Your interests</template>

            <!-- Search input, results menu and the selected chips are all the one
                 Codex lookup now. `separate-input` stacks the chips below the input
                 (matching the old layout). Kept in sync with `interests` above. -->
            <CdxMultiselectLookup
              v-model:input-chips="inputChips"
              v-model:selected="selected"
              class="interests__lookup"
              :menu-items="menuItems"
              :menu-config="menuConfig"
              :separate-input="hasInterests"
              placeholder="Search articles or topics"
              aria-label="Search articles or topics"
              @input="onSearchInput"
            >
              <template #no-results>No results found.</template>
            </CdxMultiselectLookup>
          </CdxField>

          <!-- Confirmation once enough interests exist to personalize Home.
               Picking more stays allowed; they just don't change the pool.
               Same two-part motion as the account form's username check: the
               area's max-height opens so the suggestions below slide down
               instead of jumping, and the message slides into that space. -->
          <div class="interests__message-area" :class="{ active: poolLimitReached }">
            <Transition name="interests-message">
              <div v-show="poolLimitReached" class="interests__message">
                <CdxMessage type="success" inline>
                  All set! Your Home is personalized and ready.
                </CdxMessage>
              </div>
            </Transition>
          </div>
        </div>

        <InterestSuggestions
          :suggestions="visibleSuggestions"
          :loading="suggestionsLoading"
          :source="suggestionsSource"
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
  gap: var(--spacing-150, 24px);
}

/* The field and its confirmation are one unit, so they're grouped inside the
   24px rhythm of `interests__fields` and spaced by the message's own
   `margin-top` below (matching Codex's own field validation message). */
.interests__lookup-group > * {
  margin: 0;
}

/* Codex renders the field's help-text wrapper unconditionally, and with no help
   text it still contributes a line box under the input. Drop it so the gap below
   the field is ours alone. */
.interests__lookup-group :deep(.cdx-field__help-text:empty) {
  display: none;
}

/* Message spacing mirrors `.cdx-field__validation-message` (4px) so the
   confirmation sits exactly where a Codex field message would. */
.interests__message {
  margin-top: var(--spacing-25, 4px);
}

/* The height animation that keeps the suggestions below from jumping: collapsed
   to 0 and opened to a height that fits the message wrapping to up to three
   lines. Timings match the account form's username-check area (see
   CreateAccountForm.vue) rather than the `--ob-*` step tokens, whose strong
   ease-out front-loads the open so much that the content below snaps. */
.interests__message-area {
  display: grid;
  overflow: hidden;
  max-height: 0;
  transition: max-height 200ms ease-out;
}

.interests__message-area.active {
  max-height: calc(var(--spacing-25, 4px) + var(--line-height-medium, 1.625rem) * 3);
}

/* Enter only: the confirmation is latched, so it never leaves once shown. Same
   slide-out-from-behind-the-field as the account form's validation messages. */
.interests-message-enter-active {
  transition:
    opacity 400ms ease-out,
    transform 200ms ease-out;
}

.interests-message-enter-from {
  opacity: 0;
  transform: translateY(-100%);
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
