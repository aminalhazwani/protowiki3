<script setup lang="ts">
/**
 * The signed-in Home: a special-page shell with the greeting as its title (and
 * the "Home layout" button beside it), then the layout's modules in order.
 */
import { ref } from 'vue'
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconConfigure } from '@wikimedia/codex-icons'

import { useConfig } from '@/composables/useConfig'

import HomeLayoutDialog from './HomeLayoutDialog.vue'
import HomePage from './HomePage.vue'
import HomeSection from './HomeSection.vue'
import HomeSectionFrame from './HomeSectionFrame.vue'
import { isCustomModule } from './modules'
import { useHomeLayout } from './useHomeLayout'

const { pageTitle } = useConfig()
const { visibleModules } = useHomeLayout()
const layoutOpen = ref(false)

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
    <div class="home-dashboard__modules">
      <template v-for="spec in visibleModules" :key="spec.id">
        <HomeSectionFrame v-if="isCustomModule(spec)" :id="spec.id" :title="titleOf(spec.title)">
          <component :is="spec.body" />
        </HomeSectionFrame>
        <HomeSection v-else :spec="spec" />
      </template>
    </div>
    <HomeLayoutDialog v-model:open="layoutOpen" />
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
