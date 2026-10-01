<script setup lang="ts">
/**
 * The signed-in Home: a special-page shell with the greeting as its title, then
 * every registry module in order.
 */
import SpecialPageWrapper from '@/components/SpecialPageWrapper.vue'
import { useConfig } from '@/composables/useConfig'

import HomeSection from './HomeSection.vue'
import { HOME_MODULES } from './modules'

const { pageTitle } = useConfig()
</script>

<template>
  <SpecialPageWrapper :title="pageTitle" class="home-dashboard">
    <div class="home-dashboard__modules">
      <HomeSection v-for="spec in HOME_MODULES" :key="spec.id" :spec="spec" />
    </div>
  </SpecialPageWrapper>
</template>

<style scoped>
.home-dashboard {
  padding-bottom: var(--spacing-300);
}

/*
 * PROTOWIKI+ SpecialPageWrapper: mobile gutter is the desktop one.
 * `--home-gutter` lets full-bleed rows (filter strips) reach the screen edge.
 */
.home-dashboard[data-skin='mobile'] {
  --home-gutter: var(--spacing-100);
  padding-inline: var(--home-gutter);
}

/*
 * PROTOWIKI+ SpecialPageWrapper: no content-width option (it clamps at ~1596px).
 * Vector: the column `Special:CreateAccount` uses — 984px of content inside the
 * wrapper's own padding — rather than the special page's ~1596px clamp.
 */
.home-dashboard[data-skin='desktop'] {
  max-width: calc(984px + 2 * var(--spacing-150));
}

.home-dashboard__modules {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-150);
}

/* Each desktop module is a block of cards, so it needs a wider break between. */
.home-dashboard[data-skin='desktop'] .home-dashboard__modules {
  gap: var(--spacing-300);
  margin-top: var(--spacing-100);
}
</style>
