<script setup lang="ts">
/**
 * The signed-in Home: a special-page shell with the greeting as its title (and
 * the "Home layout" button beside it), then the layout's modules in order. On
 * desktop they split 60/40: Impact and Mentor take the side column, the rest
 * the main one, each in the layout's order.
 */
import { computed, ref } from 'vue'
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconConfigure } from '@wikimedia/codex-icons'

import { useConfig } from '@/composables/useConfig'
import { globalSkin } from '@/theme'

import HomeLayoutDialog from './HomeLayoutDialog.vue'
import HomeOnboarding from './HomeOnboarding.vue'
import HomePage from './HomePage.vue'
import HomePersonalizationDialog from './HomePersonalizationDialog.vue'
import HomeSection from './HomeSection.vue'
import HomeSectionFrame from './HomeSectionFrame.vue'
import { isCustomModule } from './modules'
import { useHomeLayout } from './useHomeLayout'
import { useHomePersonalization } from './useHomePersonalization'

const { pageTitle } = useConfig()
const { visibleModules } = useHomeLayout()
const layoutOpen = ref(false)
// Opened from a personal module's "Configure" (`HomeConfigureMenu`).
const { open: personalizationOpen } = useHomePersonalization()

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
  <HomePage :title="pageTitle" class="home-dashboard">
    <template #actions>
      <CdxButton weight="quiet" aria-label="Home layout" @click="layoutOpen = true">
        <CdxIcon :icon="cdxIconConfigure" />
      </CdxButton>
    </template>
    <div class="home-dashboard__columns" :class="{ 'home-dashboard__columns--split': columns.length > 1 }">
      <div
        v-for="column in columns"
        :key="column.key"
        class="home-dashboard__modules"
        :class="`home-dashboard__modules--${column.key}`"
      >
        <template v-for="spec in column.modules" :key="spec.id">
          <template v-if="isCustomModule(spec)">
            <component :is="spec.body" v-if="spec.framed === false" />
            <HomeSectionFrame v-else :id="spec.id" :title="titleOf(spec.title)">
              <component :is="spec.body" />
            </HomeSectionFrame>
          </template>
          <HomeSection v-else :spec="spec" />
        </template>
      </div>
    </div>
    <HomeLayoutDialog v-model:open="layoutOpen" />
    <HomePersonalizationDialog v-model:open="personalizationOpen" />
    <!-- After account creation: the onboarding wizard, over the reader's new Home. -->
    <HomeOnboarding />
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

/* Desktop with both columns: 60/40, each column's modules from the top. */
.home-dashboard__columns--split {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  align-items: start;
  column-gap: var(--spacing-200);
}
</style>
