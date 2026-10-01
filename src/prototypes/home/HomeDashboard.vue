<script setup lang="ts">
/**
 * The signed-in Home: a special-page shell with the greeting as its title, then
 * every registry module in order.
 */
import { useConfig } from '@/composables/useConfig'

import HomePage from './HomePage.vue'
import HomeSection from './HomeSection.vue'
import HomeSectionFrame from './HomeSectionFrame.vue'
import { HOME_MODULES, isCustomModule } from './modules'

const { pageTitle } = useConfig()

function titleOf(title: string | (() => string)): string {
  return typeof title === 'function' ? title() : title
}
</script>

<template>
  <HomePage :title="pageTitle" class="home-dashboard">
    <div class="home-dashboard__modules">
      <template v-for="spec in HOME_MODULES" :key="spec.id">
        <HomeSectionFrame v-if="isCustomModule(spec)" :id="spec.id" :title="titleOf(spec.title)">
          <component :is="spec.body" />
        </HomeSectionFrame>
        <HomeSection v-else :spec="spec" />
      </template>
    </div>
  </HomePage>
</template>

<style scoped>
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
