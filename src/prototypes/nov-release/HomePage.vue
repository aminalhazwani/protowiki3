<script setup lang="ts">
/**
 * The column every Home page sits in: a special page at the width of
 * `Special:CreateAccount` on Vector, with Minerva's 16px gutter.
 */
import SpecialPageWrapper from '@/components/SpecialPageWrapper.vue'

import HomePageHeader from './HomePageHeader.vue'

defineProps<{
  /** The page's `h1`; `null` when the page brings its own (a module page's bar). */
  title: string | null
  /** Production's Homepage / User page / Talk tabs under the title (the Home itself). */
  tabs?: boolean
}>()
</script>

<template>
  <!-- PROTOWIKI+ (nov-release) SpecialPageWrapper: no tabs under the title, so the Home draws its own header. -->
  <SpecialPageWrapper :title="tabs ? null : title" class="home-page">
    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>
    <HomePageHeader v-if="tabs && title" :title="title" />
    <slot />
  </SpecialPageWrapper>
</template>

<style scoped>
.home-page {
  padding-bottom: var(--spacing-300);
}

/*
 * PROTOWIKI+ SpecialPageWrapper: mobile gutter is the desktop one.
 * `--home-gutter` lets full-bleed rows (filter strips) reach the screen edge.
 */
.home-page[data-skin='mobile'] {
  --home-gutter: var(--spacing-100);
  padding-inline: var(--home-gutter);
}

/*
 * PROTOWIKI+ SpecialPageWrapper: no content-width option (it clamps at ~1596px).
 * Vector: the column `Special:CreateAccount` uses — 984px of content inside the
 * wrapper's own padding — rather than the special page's ~1596px clamp.
 */
.home-page[data-skin='desktop'] {
  max-width: calc(984px + 2 * var(--spacing-150));
}
</style>
