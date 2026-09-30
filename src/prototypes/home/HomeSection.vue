<script setup lang="ts">
/**
 * One Home module, rendered generically from its registry spec: heading, then
 * its cards (skeletons while loading), or an error with a retry. A module that
 * loads with nothing to show drops out of the Home.
 */
import { computed } from 'vue'
import { CdxButton } from '@wikimedia/codex'

import HomeCard from './HomeCard.vue'
import type { HomeModuleSpec } from './modules'
import { useHomeModule } from './useHomeModule'

const props = defineProps<{ spec: HomeModuleSpec }>()

const { items, loading, error, reload } = useHomeModule(props.spec)

const cards = computed(() => items.value.slice(0, props.spec.slots))
const isEmpty = computed(() => !loading.value && !error.value && cards.value.length === 0)
</script>

<template>
  <section v-if="!isEmpty" class="home-section" :data-module-id="spec.id">
    <h2 class="home-section__heading">{{ spec.title }}</h2>

    <div v-if="error" class="home-section__error">
      <p>Couldn't load this section.</p>
      <CdxButton weight="quiet" @click="reload">Try again</CdxButton>
    </div>

    <div v-else class="home-section__cards" :aria-busy="loading">
      <template v-if="loading">
        <HomeCard v-for="n in spec.slots" :key="n" :variant="spec.variant" loading />
      </template>
      <template v-else>
        <HomeCard
          v-for="card in cards"
          :key="card.key"
          :variant="spec.variant"
          :card="card"
          :supporting-icon="spec.supportingIcon"
        />
      </template>
    </div>
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
</style>
