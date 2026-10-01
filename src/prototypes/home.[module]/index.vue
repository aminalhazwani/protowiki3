<script setup lang="ts">
/**
 * A Home module on its own page — `/home/<module>` (home2's drill-downs). The
 * module's title rides in a back bar in place of the wiki header, and its cards
 * reveal as the reader scrolls. Any other path, or a logged-out reader, goes
 * back to the Home.
 */
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import HomeChrome from '../home/HomeChrome.vue'
import HomePage from '../home/HomePage.vue'
import HomeSection from '../home/HomeSection.vue'
import HomeSubpageHeader from '../home/HomeSubpageHeader.vue'
import { findModule, hasModulePage } from '../home/modules'
import { HOME_PATH } from '../home/routes'
import { useHomeAccount } from '../home/useHomeAccount'

const route = useRoute()
const router = useRouter()
const { isLoggedIn } = useHomeAccount()

const spec = computed(() => {
  const param = (route.params as { module?: string | string[] }).module
  const found = findModule(String(Array.isArray(param) ? param[0] : (param ?? '')))
  return found && hasModulePage(found) ? found : null
})

watch(
  [spec, isLoggedIn],
  ([module, loggedIn]) => {
    if (!module || !loggedIn) void router.replace(HOME_PATH)
  },
  { immediate: true },
)

// PROTOWIKI+ Router: no `scrollBehavior`, so a new page keeps the old scroll position.
watch(spec, () => window.scrollTo(0, 0), { immediate: true })
</script>

<template>
  <HomeChrome :show-footer="false">
    <template v-if="spec" #header>
      <HomeSubpageHeader :title="spec.title" />
    </template>
    <HomePage v-if="spec && isLoggedIn" :title="null" class="home-module-page">
      <!-- Keyed: each module gets a fresh load, not the last one's cards. -->
      <HomeSection :key="spec.id" :spec="spec" standalone />
    </HomePage>
  </HomeChrome>
</template>

<style scoped>
/*
 * The list starts right under the bar: each divider row brings its own 12px
 * (home2's spacing). The extra `[data-skin]` outranks the special page's padding.
 */
.home-page.home-module-page[data-skin] {
  padding-top: 0;
}

/* Vector: a full-width takeover with a slim inset, not the Home's 984px column (home2). */
.home-page.home-module-page[data-skin='desktop'] {
  --home-gutter: var(--spacing-50);
  max-width: none;
  padding-inline: var(--home-gutter);
}
</style>
