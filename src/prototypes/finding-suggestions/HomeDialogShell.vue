<script setup lang="ts">
/**
 * The Home's dialog frame (home2's FullscreenDialogShell): a centred Codex
 * modal on Vector, and a full-height one on Minerva. Keyed on the global skin
 * rather than a media query, so it flips with the chrome (and follows `?skin=`).
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { CdxDialog } from '@wikimedia/codex'

import { globalSkin } from '@/theme'

interface Props {
  title: string
  /** Under the title, in Codex's dialog header. */
  subtitle?: string
  /**
   * One height whatever the content (the onboarding wizard, the pickers): 48rem
   * on Vector (or the window, if shorter), and a body that fills it, so the card
   * doesn't resize as content loads and a screen can push content to the bottom.
   */
  tall?: boolean
}

withDefaults(defineProps<Props>(), { subtitle: undefined, tall: false })

const open = defineModel<boolean>('open', { required: true })

const isMobile = computed(() => globalSkin.value === 'mobile')

/*
 * CODEX+ CdxDialog: it shows its header and footer dividers only when the
 * body's own height changes. In a fixed-height dialog that never happens, so
 * content that arrives after opening (loaded suggestions) scrolls without them.
 * The content's size is watched too, and the dividers follow it.
 */
const content = ref<HTMLElement | null>(null)
const overflowing = ref(false)
let observer: ResizeObserver | null = null

function measure(): void {
  const body = content.value?.parentElement
  overflowing.value = !!body && body.clientHeight < body.scrollHeight
}

watch(content, (el) => {
  observer?.disconnect()
  observer = null
  if (!el) return
  observer = new ResizeObserver(measure)
  observer.observe(el)
  if (el.parentElement) observer.observe(el.parentElement)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <CdxDialog
    v-model:open="open"
    class="home-dialog-shell"
    :class="{
      'home-dialog-shell--full-height': isMobile,
      'home-dialog-shell--tall': tall,
      'cdx-dialog--dividers': overflowing,
    }"
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
    <div ref="content" class="home-dialog-shell__content">
      <slot />
    </div>
    <!-- Above Codex's own actions (`primary-action` / `default-action` pass through). -->
    <template v-if="$slots['footer-text']" #footer-text>
      <slot name="footer-text" />
    </template>
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </CdxDialog>
</template>

<!-- CdxDialog teleports out of this component, so these rules can't be scoped. -->
<style>
/* CODEX+ CdxDialog: no backdrop blur. The page behind blurs, as well as dims. */
.cdx-dialog-backdrop:has(> .home-dialog-shell) {
  backdrop-filter: blur(8px);
}

.home-dialog-shell__focus-holder {
  display: block;
  height: 0;
  outline: none;
}

/*
 * CODEX+ CdxDialog: no fixed height of our choosing (home2's onboarding card).
 * 48rem has no Codex size token yet.
 */
.home-dialog-shell--tall:not(.home-dialog-shell--full-height).cdx-dialog {
  height: min(48rem, calc(100dvh - 2 * var(--spacing-100)));
}

/* The body fills the card, as a column, so a screen can grow into the height. */
.home-dialog-shell--tall .cdx-dialog__body {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 0;
}

/* The content wrapper (measured for the dividers) passes the column on. */
.home-dialog-shell--tall .home-dialog-shell__content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
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
