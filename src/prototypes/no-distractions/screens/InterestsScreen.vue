<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
import { useThumbReveal } from '../data/useThumbReveal'
import { fetchTitleSearchResults, type TitleSearchResult } from '../data/titleSearch'
import type { FlowState } from '../data/useFlowState'

const props = defineProps<{ flow: FlowState }>()

const { user, realUsername, lang } = useConfig()
const configureSettings = useConfigureSettings()

const interests = computed(() => props.flow.interests.value)
// 3 is the cap shown in the heading; the seed counts toward it.
const maxInterestsReached = computed(() => interests.value.length >= 3)

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

const interestThumbnails = useInterestThumbnails(
  () => props.flow.interests.value,
  () => lang.value,
)

function thumbFor(title: string): string | undefined {
  return interestThumbnails.value.get(normalizeTitleKey(title))
}

// `interestThumbnails` tells us a topic *has* an image (the metadata URL
// resolved); it does not tell us the <img> has actually decoded. The shared
// reveal composable tracks the real `load` event and the per-pill stagger so
// the avatar animates in rather than popping around an empty circle.
const thumbReveal = useThumbReveal()

const search = ref('')
const results = ref<TitleSearchResult[]>([])

// Sticky footer border: only shown when the page can actually scroll, so a
// short screen (few suggestions) has no divider. Scroll happens at the page
// level here (no inner overflow container), so we measure the document.
const bodyEl = ref<HTMLElement | null>(null)
const isScrollable = ref(false)

function measure(): void {
  const el = document.scrollingElement ?? document.documentElement
  isScrollable.value = el.scrollHeight - el.clientHeight > 1
}

let resizeObserver: ResizeObserver | null = null

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
watch(interests, (list) => thumbReveal.keep(list))

onMounted(() => {
  measure()
  window.addEventListener('resize', measure)
  // The suggestions list loads async and the chip list grows/shrinks, so
  // recompute whenever the content height changes rather than only on mount.
  if (bodyEl.value) {
    resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(bodyEl.value)
  }
})

onBeforeUnmount(() => {
  abortController?.abort()
  if (debounceTimer) clearTimeout(debounceTimer)
  window.removeEventListener('resize', measure)
  resizeObserver?.disconnect()
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

    <div
      :ref="(el) => { if (!configureMode) bodyEl = el as HTMLElement | null }"
      :class="configureMode ? 'interests__configure-body' : 'ob-body'"
    >
      <div class="interests__fields">
        <div class="interests__search">
          <CdxSearchInput
            v-model="search"
            :disabled="maxInterestsReached"
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
                :class="{ 'interests__chip-thumb--loaded': thumbReveal.isLoaded(title) }"
                :style="thumbReveal.style(title)"
              >
                <img :src="thumbFor(title)" alt="" @load="thumbReveal.onLoad(title)" />
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

      <div
        v-if="!configureMode"
        class="ob-actions ob-actions--footer"
        :class="{ 'ob-actions--divided': isScrollable }"
      >
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

/* Sticky CTA: pins to the viewport bottom (page-level scroll) so a long
   suggestions list scrolls behind the button instead of pushing it off-screen.
   Breaks out of .ob-body's 16px padding for a full-bleed background/border,
   then re-pads internally so the button keeps its side gaps. `margin-top: auto`
   (inherited from .ob-actions) still bottom-aligns it when content is short. */
.ob-actions--footer {
  position: sticky;
  bottom: 0;
  z-index: 10;
  box-sizing: border-box;
  /* Full-bleed breakout of .ob-body's 16px padding. An explicit widened width is
     required: as a stretched flex item the footer otherwise ignores the negative
     inline margins for sizing (they'd only shift it left, not widen it). */
  width: calc(100% + 2 * var(--spacing-100, 16px));
  /* margin-top:auto (from the shared .ob-actions) bottom-aligns the button when
     content is short; sticky pins it once the list overflows. */
  margin-top: auto;
  margin-inline: calc(-1 * var(--spacing-100, 16px));
  margin-bottom: calc(-1 * var(--spacing-100, 16px));
  padding: var(--spacing-100, 16px);
  /* Transparent in the resting state so toggling the divider never shifts layout. */
  border-top: var(--border-width-base, 1px) solid transparent;
  background-color: var(--background-color-base);
}

/* Only when the page can scroll — content is passing behind the button. */
.ob-actions--divided {
  border-top-color: var(--border-color-muted, #c8ccd1);
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
}

/* One-shot entrance on load (keyframes defined in onboarding-motion.css so the
   reveal plays even when the image is cached — see that file). Static `width`
   is the resting value the animation lands on; `both` holds the collapsed
   `from` state through the stagger delay. */
.interests__chip-thumb--loaded {
  width: 2rem;
  animation: ob-thumb-slot-in var(--ob-duration-thumb-in, 180ms) var(--ob-ease-out-strong, ease-out) both;
  animation-delay: var(--thumb-delay, 0ms);
  will-change: width;
}

.interests__chip-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform-origin: center;
  /* Resting state before load: collapsed/invisible so the entrance has
     somewhere to animate from. */
  opacity: 0;
  transform: scale(0);
}

/* Scale + fade in on the compositor (transform/opacity only, off the layout
   path). Static values are the resting state after the animation ends. */
.interests__chip-thumb--loaded img {
  opacity: 1;
  transform: scale(1);
  animation: ob-thumb-img-in var(--ob-duration-thumb-in, 180ms) var(--ob-ease-out-strong, ease-out) both;
  animation-delay: var(--thumb-delay, 0ms);
  will-change: transform, opacity;
}

@media (prefers-reduced-motion: reduce) {
  /* Keep a plain opacity fade only: the width snaps (no label slide) and the
     image doesn't scale. */
  .interests__chip-thumb--loaded {
    animation: none;
  }

  .interests__chip-thumb img {
    transform: none;
  }

  .interests__chip-thumb--loaded img {
    transform: none;
    animation: ob-thumb-img-fade var(--ob-duration-thumb-in, 180ms) var(--ob-ease-out-strong, ease-out) both;
    animation-delay: var(--thumb-delay, 0ms);
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
