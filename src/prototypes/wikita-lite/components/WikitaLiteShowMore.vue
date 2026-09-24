<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { RouterLink } from 'vue-router'

import { CdxButton } from '@wikimedia/codex'

/**
 * A module's overflow control. Minerva sends the reader to the module's own
 * page; Vector reveals the next four cards in the grid, so there it is a
 * button the module's owner handles rather than a link.
 *
 * Both branches carry `wikita-lite-button-link`, which is what the shell
 * styles — full width on the phone, hugging its label at the bottom-right of
 * the desktop matrix.
 */
defineProps<{
  /** The module's own page — used when the control navigates. */
  to?: RouteLocationRaw
  /** Reveal in place instead of navigating. */
  expandable?: boolean
}>()

defineEmits<{ expand: [] }>()
</script>

<template>
  <CdxButton v-if="expandable" class="wikita-lite-button-link" @click="$emit('expand')">
    <slot />
  </CdxButton>

  <RouterLink
    v-else-if="to"
    :to="to"
    class="cdx-button cdx-button--fake-button cdx-button--fake-button--enabled wikita-lite-button-link"
  >
    <slot />
  </RouterLink>
</template>
