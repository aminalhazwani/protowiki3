<script setup lang="ts">
/**
 * The column every Home page sits in: a special page at the width of
 * `Special:CreateAccount` on Vector, with Minerva's 16px gutter.
 */
import SpecialPageWrapper from '@/components/SpecialPageWrapper.vue'

/** The page's `h1`; `null` when the page brings its own (a module page's bar). */
defineProps<{ title: string | null }>()
</script>

<template>
  <SpecialPageWrapper :title="title" class="home-page">
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
