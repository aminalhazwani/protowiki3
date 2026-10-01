<script setup lang="ts">
/**
 * The Home's dialog frame (home2's FullscreenDialogShell): a centred Codex
 * modal on Vector, and a full-height one on Minerva. Keyed on the global skin
 * rather than a media query, so it flips with the chrome (and follows `?skin=`).
 */
import { computed } from 'vue'
import { CdxDialog } from '@wikimedia/codex'

import { globalSkin } from '@/theme'

interface Props {
  title: string
  /** Under the title, in Codex's dialog header. */
  subtitle?: string
}

withDefaults(defineProps<Props>(), { subtitle: undefined })

const open = defineModel<boolean>('open', { required: true })

const isMobile = computed(() => globalSkin.value === 'mobile')
</script>

<template>
  <CdxDialog
    v-model:open="open"
    class="home-dialog-shell"
    :class="{ 'home-dialog-shell--full-height': isMobile }"
    :title="title"
    :subtitle="subtitle"
    use-close-button
    :fixed-height="isMobile"
  >
    <slot />
  </CdxDialog>
</template>

<!-- CdxDialog teleports out of this component, so these rules can't be scoped. -->
<style>
/* CODEX+ CdxDialog: no size prop. Codex's own clamp, as on the leave dialog. */
.home-dialog-shell {
  max-width: 32rem;
}

/*
 * CODEX+ CdxDialog: no full-screen option. On Minerva the dialog fills the
 * screen inside a 16px margin (32px top and bottom, home2), clear of the notch
 * and home indicator.
 */
.home-dialog-shell--full-height.cdx-dialog {
  width: calc(100% - 2 * var(--spacing-100));
  max-width: none;
  height: calc(
    100dvh - 2 * var(--spacing-200) - env(safe-area-inset-top, 0px) -
      env(safe-area-inset-bottom, 0px)
  );
  max-height: none;
}
</style>
