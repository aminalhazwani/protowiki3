<script setup lang="ts">
/**
 * The signed-in Home: a special-page shell with the greeting as its title, then
 * the layout's modules in order (the layout lives in ☰ Prototype settings). On
 * desktop they split 60/40: Impact and Mentor take the side column, the rest
 * the main one, each in the layout's order.
 */
import { computed } from 'vue'

import { useConfig } from '@/composables/useConfig'
import { globalSkin } from '@/theme'

import HomeOnboarding from './HomeOnboarding.vue'
import HomePage from './HomePage.vue'
import HomeModuleMenu from './HomeModuleMenu.vue'
import HomeSection from './HomeSection.vue'
import HomeSectionFrame from './HomeSectionFrame.vue'
import { isCustomModule } from './modules'
import { useHomeLayout } from './useHomeLayout'
import { useRealUserPagesSync } from './useHomeRealUserPages'

const { pageTitle } = useConfig()
const { visibleModules } = useHomeLayout()
// Real user: their edited pages first (the personal modules wait on them), then Impact's fetch.
useRealUserPagesSync()

/** Modules for the desktop side column; everything else stays in the main one. */
const SIDE_MODULE_IDS = new Set<string>(['impact', 'mentor'])

/* Two lists, not one grid: a shared grid would line up rows across the columns. */
const columns = computed(() => {
  if (globalSkin.value !== 'desktop') return [{ key: 'main', modules: visibleModules.value }]
  const main = visibleModules.value.filter((spec) => !SIDE_MODULE_IDS.has(spec.id))
  const side = visibleModules.value.filter((spec) => SIDE_MODULE_IDS.has(spec.id))
  return [
    { key: 'main', modules: main },
    { key: 'side', modules: side },
  ].filter((column) => column.modules.length > 0)
})

function titleOf(title: string | (() => string)): string {
  return typeof title === 'function' ? title() : title
}
</script>

<template>
  <HomePage :title="pageTitle" tabs class="home-dashboard">
    <div class="home-dashboard__columns" :class="{ 'home-dashboard__columns--split': columns.length > 1 }">
      <div
        v-for="column in columns"
        :key="column.key"
        class="home-dashboard__modules"
        :class="`home-dashboard__modules--${column.key}`"
      >
        <template v-for="spec in column.modules" :key="spec.id">
          <HomeSectionFrame v-if="isCustomModule(spec)" :id="spec.id" :title="titleOf(spec.title)">
            <template v-if="spec.menu" #actions>
              <HomeModuleMenu :menu="spec.menu" />
            </template>
            <component :is="spec.body" />
          </HomeSectionFrame>
          <HomeSection v-else :spec="spec" />
        </template>
      </div>
    </div>
    <!-- After account creation: the onboarding wizard, over the reader's new Home. -->
    <HomeOnboarding />
  </HomePage>
</template>

<style scoped>
.home-dashboard__modules {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-200);
}

/* Each desktop module is a block of cards, so it needs a wider break between. */
.home-dashboard[data-skin='desktop'] .home-dashboard__modules {
  gap: var(--spacing-300);
  margin-top: var(--spacing-100);
}

/* Desktop with both columns: 60/40, each column's modules from the top. */
.home-dashboard__columns--split {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  align-items: start;
  column-gap: var(--spacing-200);
}
</style>
