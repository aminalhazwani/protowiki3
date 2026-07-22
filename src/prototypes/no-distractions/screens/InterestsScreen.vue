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

// `interestThumbnails` tells us a topic *has* an image (the metadata URL
// resolved); it does not tell us the <img> has actually decoded. Track that
// separately so the reveal fires on the real `load` event rather than the
// moment the URL appears — otherwise the chip would animate around an empty
// circle. Keyed by `normalizeTitleKey` to match the thumbnail map.
const loadedThumbs = ref(new Set<string>())
// Per-title entrance delay so a burst of images that decode close together
// stagger in (~40ms apart) instead of popping simultaneously.
const thumbDelays = ref(new Map<string, number>())

const THUMB_STAGGER_MS = 40 // per-pill offset within a burst (spec: 30–50ms)
const THUMB_BURST_WINDOW_MS = 220 // loads within this window count as one burst
let burstIndex = 0
let burstResetTimer: ReturnType<typeof setTimeout> | null = null

function onThumbLoad(title: string): void {
  const key = normalizeTitleKey(title)
  if (loadedThumbs.value.has(key)) return
  thumbDelays.value.set(key, burstIndex * THUMB_STAGGER_MS)
  burstIndex += 1
  if (burstResetTimer) clearTimeout(burstResetTimer)
  burstResetTimer = setTimeout(() => {
    burstIndex = 0
  }, THUMB_BURST_WINDOW_MS)
  loadedThumbs.value.add(key)
}

function isThumbLoaded(title: string): boolean {
  return loadedThumbs.value.has(normalizeTitleKey(title))
}

function thumbStyle(title: string): Record<string, string> | undefined {
  const delay = thumbDelays.value.get(normalizeTitleKey(title))
  return delay ? { '--thumb-delay': `${delay}ms` } : undefined
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

// Drop reveal state for topics that are no longer selected, so a topic that is
// removed and re-added animates in again rather than appearing pre-expanded.
watch(interests, (list) => {
  const keys = new Set(list.map((item) => normalizeTitleKey(item)))
  for (const key of [...loadedThumbs.value]) {
    if (!keys.has(key)) {
      loadedThumbs.value.delete(key)
      thumbDelays.value.delete(key)
    }
  }
})

onBeforeUnmount(() => {
  abortController?.abort()
  if (debounceTimer) clearTimeout(debounceTimer)
  if (burstResetTimer) clearTimeout(burstResetTimer)
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
              <span
                v-if="thumbFor(title)"
                class="interests__chip-thumb"
                :class="{ 'interests__chip-thumb--loaded': isThumbLoaded(title) }"
                :style="thumbStyle(title)"
              >
                <img :src="thumbFor(title)" alt="" @load="onThumbLoad(title)" />
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
  /* Collapsed until the image loads (see spec: text-only, no reserved avatar
     space). Width is the ONLY layout-affecting property that animates, and it's
     isolated to this 2rem slot; the negative margin cancels the flex gap while
     collapsed, so the empty slot doesn't nudge the label. */
  width: 0;
  height: 2rem;
  margin-left: calc(-1 * var(--spacing-50, 8px));
  border-radius: var(--border-radius-circle, 50%);
  overflow: hidden;
  transition: width var(--ob-duration-thumb-in, 180ms) var(--ob-ease-out-strong, ease-out);
  transition-delay: var(--thumb-delay, 0ms);
  will-change: width;
}

.interests__chip-thumb--loaded {
  width: 2rem;
}

.interests__chip-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* Scale + fade in on the compositor. Only transform/opacity animate here, so
     the reveal stays off the layout path and doesn't jank. */
  transform: scale(0);
  transform-origin: center;
  opacity: 0;
  transition:
    transform var(--ob-duration-thumb-in, 180ms) var(--ob-ease-out-strong, ease-out),
    opacity var(--ob-duration-thumb-in, 180ms) var(--ob-ease-out-strong, ease-out);
  transition-delay: var(--thumb-delay, 0ms);
  will-change: transform, opacity;
}

.interests__chip-thumb--loaded img {
  transform: scale(1);
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  /* Keep a plain opacity fade only: the width snaps (no label slide) and the
     image doesn't scale. */
  .interests__chip-thumb {
    transition: none;
  }

  .interests__chip-thumb img {
    transform: none;
    transition: opacity var(--ob-duration-thumb-in, 180ms) var(--ob-ease-out-strong, ease-out);
  }
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
