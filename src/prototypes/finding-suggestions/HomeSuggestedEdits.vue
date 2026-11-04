<script setup lang="ts">
/**
 * The Suggested edits module's body: articles with something to improve, each
 * labelled with its task. Grows from the Mock user's pages (`useHomeSeeds`); a
 * reader with none gets random suggestions. On the Home it shows three cards
 * and a "Show more"; as a `feed` (its own page) every suggestion, as divider rows.
 * Until the reader's interests or types of edits find some (`useFindingSuggestions`),
 * it says none were found, with a way to change each.
 */
import { computed, ref, watch } from 'vue'
import { CdxButton } from '@wikimedia/codex'
import { cdxIconLightbulb } from '@wikimedia/codex-icons'

import { VISUAL_EDITOR_TEMPLATE_PATH } from '@/composables/webTemplatePaths'

import HomeArticleCards from './HomeArticleCards.vue'
import HomeShowMore from './HomeShowMore.vue'
import { loadSuggestedEdits } from './loadSuggestedEdits'
import { useFindingSuggestions } from './useFindingSuggestions'
import { useHomeSeeds } from './useHomeSeeds'
import { useModuleLoad } from './useModuleLoad'

const props = defineProps<{
  /** The module's own page: every suggestion, as a feed. */
  feed?: boolean
}>()

/** Cards shown at first, and revealed by each "Show more". */
const PAGE_SIZE = 3

const { seeds } = useHomeSeeds()
const { hasSuggestions, dialog } = useFindingSuggestions()

const seedsKey = () => seeds.value.join('\n')
const {
  items: edits,
  loading,
  error,
  reload,
} = useModuleLoad(seedsKey, (signal) => loadSuggestedEdits(seeds.value, signal))

const shown = ref(PAGE_SIZE)
// New pages to grow from start back at the first cards.
watch(seedsKey, () => {
  shown.value = PAGE_SIZE
})

const visible = computed(() => (props.feed ? edits.value : edits.value.slice(0, shown.value)))
const hasMore = computed(() => shown.value < edits.value.length)
const expanded = computed(() => shown.value > PAGE_SIZE)

const root = ref<HTMLElement | null>(null)

/** Fold back, and bring the module into view if the reader had scrolled past it. */
function collapse(): void {
  shown.value = PAGE_SIZE
  const el = root.value
  if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' })
}
</script>

<template>
  <div ref="root" class="home-suggested-edits">
    <div v-if="!hasSuggestions" class="home-suggested-edits__none">
      <p class="home-suggested-edits__none-title">No suggested edits found.</p>
      <p>
        Try selecting other
        <a href="#" @click.prevent="dialog = 'interests'">interests</a>
        and
        <a href="#" @click.prevent="dialog = 'edit-types'">types of edits</a>,
        or check back later.
      </p>
    </div>

    <div v-else-if="error" class="home-suggested-edits__error">
      <p>Couldn't load this section.</p>
      <CdxButton weight="quiet" @click="reload">Try again</CdxButton>
    </div>

    <p v-else-if="!loading && !edits.length" class="home-suggested-edits__empty">
      Nothing here right now.
    </p>

    <template v-else>
      <HomeArticleCards
        :cards="visible"
        :to="VISUAL_EDITOR_TEMPLATE_PATH"
        :loading="loading"
        :skeletons="PAGE_SIZE"
        :supporting-icon="cdxIconLightbulb"
        progressive
        :feed="feed"
      />

      <HomeShowMore
        v-if="!feed"
        module="suggested-edits"
        :has-more="hasMore"
        :expanded="expanded"
        :disabled="loading"
        @more="shown += PAGE_SIZE"
        @collapse="collapse"
      />
    </template>
  </div>
</template>

<style scoped>
.home-suggested-edits__error,
.home-suggested-edits__empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-50);
  margin: 0;
  color: var(--color-subtle);
}

.home-suggested-edits__error p {
  margin: 0;
}

.home-suggested-edits__none p {
  margin: 0;
  color: var(--color-subtle);
}

.home-suggested-edits__none-title {
  font-weight: var(--font-weight-bold);
}

.home-suggested-edits__none a {
  font-weight: var(--font-weight-bold);
}
</style>
