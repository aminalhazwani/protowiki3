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
  /**
   * One height for every screen of a flow (the onboarding wizard): 640px on
   * Vector (or the window, if shorter), and a body that fills it, so the card
   * doesn't resize between steps and a screen can push content to the bottom.
   */
  tall?: boolean
}

withDefaults(defineProps<Props>(), { subtitle: undefined, tall: false })

const open = defineModel<boolean>('open', { required: true })

const isMobile = computed(() => globalSkin.value === 'mobile')
</script>

<template>
  <CdxDialog
    v-model:open="open"
    class="home-dialog-shell"
    :class="{ 'home-dialog-shell--full-height': isMobile, 'home-dialog-shell--tall': tall }"
    :title="title"
    :subtitle="subtitle"
    use-close-button
    :fixed-height="isMobile || tall"
  >
    <!-- A flow's own header (e.g. back + step counter) replaces Codex's title row. -->
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    <!--
      Focus holder (home2). On open, Codex's focus trap focuses the body's first
      focusable node, which would be a control the reader never picked (a drag
      handle, a switch). This takes it instead, so nothing looks selected and
      Tab starts from the top. An `<a>`, because the trap only looks for
      focusable tags and non-negative `tabindex`; `tabindex="-1"` keeps it out
      of the tab order.
    -->
    <a class="home-dialog-shell__focus-holder" tabindex="-1" />
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </CdxDialog>
</template>

<!-- CdxDialog teleports out of this component, so these rules can't be scoped. -->
<style>
.home-dialog-shell__focus-holder {
  display: block;
  height: 0;
  outline: none;
}

/* CODEX+ CdxDialog: no fixed height of our choosing (home2's onboarding card). */
.home-dialog-shell--tall:not(.home-dialog-shell--full-height).cdx-dialog {
  height: min(var(--size-4000), calc(100dvh - 2 * var(--spacing-100)));
}

/* The body fills the card, as a column, so a screen can grow into the height. */
.home-dialog-shell--tall .cdx-dialog__body {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 0;
}

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
