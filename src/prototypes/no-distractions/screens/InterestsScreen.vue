<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { CdxButton, CdxIcon, CdxSearchInput, CdxToggleSwitch } from '@wikimedia/codex'
import { cdxIconSubtract } from '@wikimedia/codex-icons'

import { useConfig } from '@/composables/useConfig'
import { normalizeTitleKey } from '@/lib/fetchMorelike'

import DialogShell from '../components/DialogShell.vue'
import InterestSuggestions from '../components/InterestSuggestions.vue'
import TitleSearchResults from '../components/TitleSearchResults.vue'
import { useConfigureSettings } from '../data/useConfigureSettings'
import { useInterestSuggestions } from '../data/useInterestSuggestions'
import { useInterestThumbnails } from '../data/useInterestThumbnails'
import { fetchTitleSearchResults, type TitleSearchResult } from '../data/titleSearch'
import type { FlowState } from '../data/useFlowState'

const props = defineProps<{ flow: FlowState }>()

const { user, realUsername, lang } = useConfig()
const configureSettings = useConfigureSettings()

const {
  suggestions,
  loading: suggestionsLoading,
  source: suggestionsSource,
} = useInterestSuggestions(
  () => props.flow.interests.value,
  () => lang.value,
)

const interestThumbnails = useInterestThumbnails(
  () => props.flow.interests.value,
  () => lang.value,
)

function thumbFor(title: string): string | undefined {
  return interestThumbnails.value.get(normalizeTitleKey(title))
}

const search = ref('')
const results = ref<TitleSearchResult[]>([])

let abortController: AbortController | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const interests = computed(() => props.flow.interests.value)
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

async function fetchSuggestions(term: string): Promise<void> {
  abortController?.abort()
  const trimmed = term.trim()
  if (!trimmed.length) {
    results.value = []
    return
  }

  abortController = new AbortController()
  try {
    const pages = await fetchTitleSearchResults(trimmed, {
      signal: abortController.signal,
      clientTag: 'no-distractions-interests',
    })
    const existing = new Set(interests.value.map((item) => item.toLowerCase()))
    results.value = pages.filter((page) => !existing.has(page.title.toLowerCase()))
  } catch (error) {
    if ((error as Error).name !== 'AbortError') results.value = []
  }
}

watch(search, (term) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => void fetchSuggestions(term), 200)
})

// Codex's `v-model` (like Vue's) does not update during IME composition, so on
// predictive mobile keyboards `search` wouldn't change until the word is
// committed (space/punctuation). Read the raw input value on every keystroke so
// search runs as the user types. See emitted `input` event on CdxSearchInput.
function onInput(event: Event): void {
  search.value = (event.target as HTMLInputElement).value
}

function addInterest(title: string): void {
  const trimmed = title.trim()
  if (!trimmed.length) return
  if (interests.value.some((item) => item.toLowerCase() === trimmed.toLowerCase())) return
  props.flow.interests.value = [...interests.value, trimmed]
  search.value = ''
  results.value = []
}

function removeInterest(title: string): void {
  props.flow.interests.value = interests.value.filter((item) => item !== title)
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
        <div class="interests__search">
          <CdxSearchInput
            v-model="search"
            class="interests__input"
            :class="{ 'interests__input--with-results': results.length > 0 }"
            placeholder="Search articles or topics"
            aria-label="Search articles or topics"
            @input="onInput"
            @submit="addInterest(search)"
          />

          <TitleSearchResults
            v-if="results.length"
            layout="attached"
            :results="results"
            @select="addInterest"
          />
        </div>

        <ul class="interests__chips">
          <li v-for="title in interests" :key="title">
            <span class="interests__chip">
              <span v-if="thumbFor(title)" class="interests__chip-thumb">
                <img :src="thumbFor(title)" alt="" />
              </span>
              <span class="interests__chip-label">{{ title }}</span>
              <button
                type="button"
                class="interests__chip-remove"
                :aria-label="`Remove ${title}`"
                @click="removeInterest(title)"
              >
                <CdxIcon :icon="cdxIconSubtract" />
              </button>
            </span>
          </li>
        </ul>

        <InterestSuggestions
          :suggestions="suggestions"
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

      <div v-if="!configureMode" class="ob-actions">
        <CdxButton action="progressive" weight="primary" @click="props.flow.goTo('home')">
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

.interests__search {
  position: relative;
}

.interests__search :deep(.cdx-text-input__input) {
  min-height: 2rem;
}

.interests__input--with-results :deep(.cdx-text-input),
.interests__input--with-results :deep(.cdx-text-input__input) {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.interests__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-50, 8px);
  margin: 0;
  padding: 0;
  list-style: none;
}

.interests__chips li {
  margin-block: 0;
  max-width: 100%;
}

.interests__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-50, 8px);
  max-width: 100%;
  min-height: 2.75rem;
  padding: var(--spacing-25, 4px) var(--spacing-50, 8px) var(--spacing-25, 4px) 14px;
  border: var(--border-width-base, 1px) solid var(--border-color-subtle, #c8ccd1);
  border-radius: var(--border-radius-pill, 9999px);
  background-color: var(--background-color-interactive-subtle, #f8f9fa);
}

.interests__chip-thumb {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  margin-left: calc(-1 * var(--spacing-50, 8px));
  border-radius: var(--border-radius-circle, 50%);
  overflow: hidden;
}

.interests__chip-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.interests__chip-label {
  min-width: 0;
  overflow: hidden;
  font-size: var(--font-size-medium, 1rem);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-base);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.interests__chip-remove {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-base, #404244);
  cursor: pointer;
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
