<script setup lang="ts">
/**
 * One Home module, rendered generically from its registry spec: heading, then
 * its cards (skeletons while loading or revealing), or an error with a retry. A
 * module that loads with nothing to show drops out of the Home.
 */
import { computed } from 'vue'
import { CdxButton } from '@wikimedia/codex'

import { useSkin } from '@/composables/useSkin'

import HomeCard from './HomeCard.vue'
import HomeFilterChips from './HomeFilterChips.vue'
import HomeSectionFrame from './HomeSectionFrame.vue'
import type { HomeModuleSpec } from './modules'
import { useHomeModule } from './useHomeModule'

const props = defineProps<{ spec: HomeModuleSpec }>()

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

/** Nothing to show and no empty state: the module drops out. */
const hidden = computed(() => isEmpty.value && !props.spec.empty)

/*
 * Vector reveals the next cards in place. Minerva will send the reader to the
 * module's own page instead (a phone column grows unreadably long), once
 * module pages exist — until then, it shows the preview only.
 */
const showMore = computed(() => !!props.spec.pageSize && hasMore.value && skin.value === 'desktop')
</script>

<template>
  <HomeSectionFrame v-if="!hidden" :id="spec.id" :title="spec.title">
    <div v-if="error" class="home-section__error">
      <p>Couldn't load this section.</p>
      <CdxButton weight="quiet" @click="reload">Try again</CdxButton>
    </div>

    <div v-else-if="isEmpty && spec.empty" class="home-section__empty">
      <p class="home-section__empty-title">{{ spec.empty.title }}</p>
      <p v-for="line in spec.empty.text" :key="line">{{ line }}</p>
    </div>

    <template v-else>
      <HomeFilterChips
        v-if="filters.length"
        :model-value="filter"
        :filters="filters"
        :label="`${spec.title} filters`"
        @update:model-value="setFilter"
      />

      <div
        class="home-section__cards"
        :class="`home-section__cards--${spec.variant}`"
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
        />
      </div>

      <CdxButton
        v-if="showMore"
        class="home-section__more"
        :disabled="ready < reserved"
        @click="revealMore"
      >
        {{ spec.moreLabel ?? 'Show more' }}
      </CdxButton>
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
</style>
