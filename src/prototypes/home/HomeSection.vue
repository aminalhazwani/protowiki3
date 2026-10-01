<script setup lang="ts">
/**
 * One Home module, rendered generically from its registry spec: heading, then
 * its cards (skeletons while loading or revealing), or an error with a retry. A
 * module that loads with nothing to show drops out of the Home.
 *
 * `standalone` is the module's own page: no heading (the page bar has it), and
 * cards reveal as the reader scrolls instead of through "Show more".
 */
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { CdxButton } from '@wikimedia/codex'

import { useSkin } from '@/composables/useSkin'

import HomeCard from './HomeCard.vue'
import HomeFilterChips from './HomeFilterChips.vue'
import HomeSectionFrame from './HomeSectionFrame.vue'
import { hasModulePage, type HomeModuleSpec } from './modules'
import { homeModuleLocation } from './routes'
import { useHomeModule } from './useHomeModule'
import { useRevealOnScroll } from './useRevealOnScroll'

const props = defineProps<{ spec: HomeModuleSpec; standalone?: boolean }>()

const {
  items,
  visible,
  filter,
  loading,
  error,
  reserved,
  ready,
  hasMore,
  reload,
  revealMore,
  setFilter,
} = useHomeModule(props.spec)

const skin = useSkin()

/** Every reserved slot: its card once ready, a skeleton until then. */
const slots = computed(() =>
  Array.from({ length: reserved.value }, (_, index) => ({
    card: index < ready.value ? visible.value[index] : undefined,
    key: visible.value[index]?.key ?? `slot-${index}`,
  })),
)

/** The spec's filters some card belongs to; a strip needs at least two besides "All". */
const filters = computed(() => {
  const present = new Set(items.value.map((card) => card.filterId))
  const shown = props.spec.filters?.filter((option) => present.has(option.id)) ?? []
  return shown.length >= 2 ? shown : []
})

const isEmpty = computed(() => !loading.value && !error.value && items.value.length === 0)

/** Nothing to show and no empty state: the module drops out of the Home (its own page says so). */
const hidden = computed(() => isEmpty.value && !props.spec.empty && !props.standalone)

/*
 * "Show more": Vector reveals the next cards in place; Minerva links to the
 * module's own page, since a phone column would grow unreadably long (home2).
 */
const more = computed(() => {
  if (props.standalone || !hasModulePage(props.spec) || !hasMore.value) return null
  return skin.value === 'desktop' ? 'reveal' : 'page'
})

const sentinel = ref<HTMLElement | null>(null)
if (props.standalone) {
  useRevealOnScroll(sentinel, () => hasMore.value && ready.value === reserved.value, revealMore)
}
</script>

<template>
  <HomeSectionFrame v-if="!hidden" :id="spec.id" :title="standalone ? undefined : spec.title">
    <div v-if="error" class="home-section__error">
      <p>Couldn't load this section.</p>
      <CdxButton weight="quiet" @click="reload">Try again</CdxButton>
    </div>

    <div v-else-if="isEmpty && spec.empty" class="home-section__empty">
      <p class="home-section__empty-title">{{ spec.empty.title }}</p>
      <p v-for="line in spec.empty.text" :key="line">{{ line }}</p>
    </div>

    <p v-else-if="isEmpty" class="home-section__empty">Nothing here right now.</p>

    <template v-else>
      <HomeFilterChips
        v-if="filters.length"
        :class="{ 'home-section__filters--page': standalone }"
        :model-value="filter"
        :filters="filters"
        :label="`${spec.title} filters`"
        @update:model-value="setFilter"
      />

      <div
        class="home-section__cards"
        :class="[
          `home-section__cards--${spec.variant}`,
          { 'home-section__cards--list': standalone },
        ]"
        :aria-busy="ready < reserved"
      >
        <HomeCard
          v-for="slot in slots"
          :key="slot.key"
          :variant="spec.variant"
          :card="slot.card"
          :loading="!slot.card"
          :supporting-icon="spec.supportingIcon"
          :saveable="spec.saveable"
          :divider="standalone"
        />
      </div>

      <CdxButton
        v-if="more === 'reveal'"
        class="home-section__more"
        :disabled="ready < reserved"
        @click="revealMore"
      >
        {{ spec.moreLabel ?? 'Show more' }}
      </CdxButton>

      <!-- A link that looks like a button: it goes somewhere (Codex's CSS-only button). -->
      <RouterLink
        v-else-if="more === 'page'"
        class="home-section__more home-section__more--page cdx-button cdx-button--fake-button cdx-button--fake-button--enabled"
        :to="homeModuleLocation(spec.id)"
      >
        {{ spec.moreLabel ?? 'Show more' }}
      </RouterLink>

      <div v-if="standalone" ref="sentinel" aria-hidden="true" />
    </template>
  </HomeSectionFrame>
</template>

<style scoped>
.home-section__error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-50);
  color: var(--color-subtle);
}

.home-section__error p {
  margin: 0;
}

.home-section__cards {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
}

/* Desktop: the 2-column card matrix every module shares. */
[data-skin='desktop'] .home-section__cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  gap: var(--spacing-100);
}

/*
 * On a module page the strip sticks under the bar (home2): 4px from it, 8px
 * above its own hairline, full width over the scrolling list. `top` is the
 * bar's height (see HomeSubpageHeader).
 */
.home-section__filters--page {
  position: sticky;
  top: calc(var(--spacing-300) + env(safe-area-inset-top, 0px));
  z-index: 1;
  padding-block: var(--spacing-25) var(--spacing-50);
  background-color: var(--background-color-base);
  box-shadow: 0 1px 0 var(--border-color-base);
}

/*
 * A module page is one long list on every skin (home2): cards become Codex
 * divider rows — no outline, a rule between them.
 */
.home-section__cards--list,
[data-skin='desktop'] .home-section__cards--list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/*
 * CODEX+ CdxCard: `separation="divider"` rules only between adjacent cards, and
 * ours sit in a wrapper (for the save button), so the rule goes between those.
 */
.home-section__cards--list > * + * {
  border-top: var(--border-width-base) var(--border-style-base) var(--border-color-base);
}

/* Skeletons keep the rows' rhythm: a divider row is its card's padding either side. */
.home-section__cards--list > .home-card-skeleton {
  margin-block: var(--spacing-75);
}

/* Stats pair up on every skin, under a first stat that spans the row (Impact's views). */
.home-section__cards--stat {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.home-section__cards--stat > :first-child {
  grid-column: 1 / -1;
}

.home-section__empty {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-25);
  color: var(--color-subtle);
}

.home-section__empty p {
  margin: 0;
}

.home-section__empty-title {
  font-weight: var(--font-weight-bold);
}

/* Under a grid a full-width bar would read as another cell: hug the label instead. */
.home-section__more {
  align-self: flex-start;
  margin-top: var(--spacing-25);
}

/* Minerva: a full-width bar under the stacked cards (home2). */
.home-section__more--page {
  align-self: stretch;
  max-width: none;
}
</style>
