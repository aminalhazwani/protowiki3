<script setup lang="ts">
/**
 * "Username policy" (home2): a popover off the help button on Vector, a bottom
 * sheet on Minerva. Keyed on the global skin, like the leave dialog.
 */
import { computed } from 'vue'
import { CdxPopover } from '@wikimedia/codex'

import { globalSkin } from '@/theme'

import { useHomeLeavePrototype } from './useHomeLeavePrototype'

defineProps<{ anchor: HTMLElement | null }>()

const open = defineModel<boolean>('open', { required: true })

const isDesktop = computed(() => globalSkin.value === 'desktop')

// Teleported out of HomeChrome, so its leave-the-prototype capture is wired here too.
const { onLeaveCapture } = useHomeLeavePrototype()
</script>

<template>
  <CdxPopover
    v-model:open="open"
    class="home-username-policy"
    :anchor="anchor"
    :use-bottom-sheet="isDesktop ? false : 'always'"
    title="Username policy"
    use-close-button
  >
    <div @click.capture="onLeaveCapture">
      <ul class="home-username-policy__list">
        <li>Consider <b>privacy risks</b> before using your real name.</li>
        <li>Don't use offensive, misleading, or promotional names.</li>
        <li>Your username must represent you as an individual, not an organization.</li>
      </ul>
      <a
        class="home-username-policy__link"
        href="https://en.wikipedia.org/wiki/Wikipedia:Username_policy"
        target="_blank"
        rel="noopener"
      >
        Read the full username policy
      </a>
    </div>
  </CdxPopover>
</template>

<!-- CdxPopover teleports out of this component, so these rules can't be scoped. -->
<style>
/* CODEX+ CdxPopover: no width prop. The popover stays narrower than the 448px form it explains. */
.home-username-policy:not(.cdx-popover--bottom-sheet) .cdx-popover__body {
  max-width: 400px;
}

.home-username-policy__list {
  margin: 0;
  padding-inline-start: var(--spacing-200);
  line-height: var(--line-height-medium);
}

.home-username-policy__list li + li {
  margin-top: var(--spacing-25);
}

.home-username-policy__link {
  display: block;
  margin-top: var(--spacing-100);
}
</style>
