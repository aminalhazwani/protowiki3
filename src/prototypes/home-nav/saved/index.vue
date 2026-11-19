<script setup lang="ts">
/**
 * Saved (`/home-nav/saved`) — `Special:ReadingLists` for a newcomer who hasn't
 * saved anything yet: the Saved template's title and empty state, inside this
 * prototype's chrome.
 */
definePage({
  meta: {
    // Same pins as the article page — see `@/appearance/route-pins`.
    skin: 'mobile',
    user: 'new',
  },
})

import { CdxIcon } from '@wikimedia/codex'
import { cdxIconLock } from '@wikimedia/codex-icons'

import SpecialPageWrapper from '@/components/SpecialPageWrapper.vue'
import SavedPagesEmptyState from '@/prototypes/template-saved-pages/SavedPagesEmptyState.vue'

import NavChrome from '../NavChrome.vue'
</script>

<template>
  <NavChrome :last-edited-notice="false">
    <SpecialPageWrapper class="nav-saved">
      <template #title>
        <span>Saved</span>
        <CdxIcon class="nav-saved__lock" :icon="cdxIconLock" size="small" aria-hidden="true" />
      </template>
      <SavedPagesEmptyState />
    </SpecialPageWrapper>
  </NavChrome>
</template>

<style scoped>
/* As the Saved template: the lock sits beside the title. */
.nav-saved :deep(.special-page-wrapper__title) {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-50, 8px);
}

.nav-saved__lock {
  color: var(--color-subtle, #54595d);
}
</style>
