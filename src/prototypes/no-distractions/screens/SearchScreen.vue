<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { CdxButton, CdxIcon, CdxTextInput } from '@wikimedia/codex'
import { cdxIconArrowPrevious } from '@wikimedia/codex-icons'

import TitleSearchResults from '../components/TitleSearchResults.vue'
import { fetchTitleSearchResults, type TitleSearchResult } from '../data/titleSearch'
import type { FlowState } from '../data/useFlowState'

const props = defineProps<{ flow: FlowState }>()

const router = useRouter()

const query = ref('')
const results = ref<TitleSearchResult[]>([])
const loading = ref(false)
const root = ref<HTMLElement | null>(null)

let abortController: AbortController | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

async function fetchSuggestions(term: string): Promise<void> {
  abortController?.abort()
  const trimmed = term.trim()
  if (!trimmed.length) {
    results.value = []
    loading.value = false
    return
  }

  abortController = new AbortController()
  loading.value = true

  try {
    results.value = await fetchTitleSearchResults(trimmed, {
      signal: abortController.signal,
      clientTag: 'no-distractions-search',
    })
  } catch (error) {
    if ((error as Error).name !== 'AbortError') results.value = []
  } finally {
    loading.value = false
  }
}

watch(query, (term) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => void fetchSuggestions(term), 200)
})

function read(title: string): void {
  const trimmed = title.trim()
  if (!trimmed.length) return
  props.flow.goTo('read', { title: trimmed })
}

function goBack(): void {
  // Return to wherever search was opened from (home, an article, …). Opening
  // search pushed a history entry, so stepping back lands on that screen rather
  // than always the main page. Fall back to the main page for a direct deep-link.
  const back = window.history.state?.back
  if (typeof back === 'string' && back.includes('/no-distractions')) {
    router.back()
    return
  }
  props.flow.goTo('read')
}

onMounted(() => {
  // Focus the field so the keyboard is ready the moment search opens.
  root.value?.querySelector('input')?.focus()
})

onBeforeUnmount(() => {
  abortController?.abort()
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<template>
  <div ref="root" class="nd-search">
    <div class="nd-search__bar">
      <CdxButton
        class="nd-search__back"
        weight="quiet"
        size="large"
        aria-label="Go back"
        @click="goBack"
      >
        <CdxIcon :icon="cdxIconArrowPrevious" />
      </CdxButton>

      <form class="nd-search__field" @submit.prevent="read(query)">
        <CdxTextInput
          v-model="query"
          class="nd-search__input"
          input-type="search"
          placeholder="Search Wikipedia"
          aria-label="Search Wikipedia"
          clearable
        />
      </form>
    </div>

    <div class="nd-search__results">
      <TitleSearchResults
        v-if="results.length"
        layout="detached"
        :results="results"
        @select="read"
      />
    </div>
  </div>
</template>

<style scoped>
.nd-search {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-height: 100vh;
  background-color: var(--background-color-base);
}

.nd-search__bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-50, 8px);
  padding: var(--spacing-50, 8px) var(--spacing-50, 8px) var(--spacing-50, 8px)
    var(--spacing-25, 4px);
  background-color: var(--background-color-interactive, #eaecf0);
  box-shadow: inset 0 -1px 3px 0 rgba(0, 0, 0, 0.08);
}

.nd-search__back {
  flex-shrink: 0;
  width: var(--size-icon-large, 40px);
  min-width: var(--size-icon-large, 40px);
  height: var(--size-icon-large, 40px);
  color: var(--color-subtle, #54595d);
}

.nd-search__field {
  flex: 1;
  min-width: 0;
}

.nd-search__input {
  width: 100%;
}

.nd-search__results {
  flex: 1;
  overflow-y: auto;
}

/* Full-screen list: drop the dropdown card border so rows sit flush in the page. */
.nd-search__results :deep(.title-search-results) {
  margin: 0;
  border: none;
  border-radius: 0;
}
</style>
