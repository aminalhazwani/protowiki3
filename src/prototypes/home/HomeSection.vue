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
import type { HomeModuleSpec } from './modules'
import { useHomeModule } from './useHomeModule'

const props = defineProps<{ spec: HomeModuleSpec }>()

const { items, loading, error, reserved, ready, hasMore, reload, revealMore } = useHomeModule(
  props.spec,
)

const skin = useSkin()

/** Every reserved slot: its card once ready, a skeleton until then. */
const slots = computed(() =>
  Array.from({ length: reserved.value }, (_, index) => ({
    card: index < ready.value ? items.value[index] : undefined,
    key: items.value[index]?.key ?? `slot-${index}`,
  })),
)

const isEmpty = computed(() => !loading.value && !error.value && items.value.length === 0)

/*
 * Vector reveals the next cards in place. Minerva will send the reader to the
 * module's own page instead (a phone column grows unreadably long), once
 * module pages exist — until then, it shows the preview only.
 */
const showMore = computed(() => !!props.spec.pageSize && hasMore.value && skin.value === 'desktop')
</script>

<template>
  <section v-if="!isEmpty" class="home-section" :data-module-id="spec.id">
    <h2 class="home-section__heading">{{ spec.title }}</h2>

    <div v-if="error" class="home-section__error">
      <p>Couldn't load this section.</p>
      <CdxButton weight="quiet" @click="reload">Try again</CdxButton>
    </div>

    <template v-else>
      <div class="home-section__cards" :aria-busy="ready < reserved">
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
  </section>
</template>

<style scoped>
.home-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
}

/* Codex Heading 4 — the page title above is the h1. */
.home-section__heading {
  margin: 0;
  font-family: var(--font-family-base);
  font-size: var(--font-size-large);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-large);
  color: var(--color-base);
}

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

/* Under a grid a full-width bar would read as another cell: hug the label instead. */
.home-section__more {
  align-self: flex-start;
  margin-top: var(--spacing-25);
}
</style>
