<script setup lang="ts">
import { ref } from 'vue'

import { CdxPopover } from '@wikimedia/codex'

import { useWikitaLiteLeavePrototype } from '../composables/useWikitaLiteLeavePrototype'

const { dialogOpen, confirmLeave, cancelLeave } = useWikitaLiteLeavePrototype()

const sheetAnchor = ref<HTMLElement | null>(null)

const primaryAction = {
  label: 'Continue',
  actionType: 'progressive' as const,
}

const defaultAction = {
  label: 'Stay in the prototype',
}

function onOpenChange(open: boolean): void {
  if (!open) cancelLeave()
}
</script>

<template>
  <span
    ref="sheetAnchor"
    class="wikita-lite-leave-prototype-sheet__anchor"
    aria-hidden="true"
  />
  <CdxPopover
    v-if="sheetAnchor"
    v-model:open="dialogOpen"
    class="wikita-lite-leave-prototype-sheet mobile-wrapper__sheet-popover"
    use-bottom-sheet
    :anchor="sheetAnchor"
    title="Leaving prototype"
    :use-close-button="true"
    :primary-action="primaryAction"
    :default-action="defaultAction"
    :stacked-actions="true"
    @update:open="onOpenChange"
    @primary="confirmLeave"
    @default="cancelLeave"
  >
    You are leaving the prototype. Any changes you make beyond this point will affect real
    wikis, and the experience you land in may not be fully integrated with the features here.
  </CdxPopover>
</template>

<!-- Teleports into MobileWrapper overlay; sheet layout via mobile-wrapper-overlays.css. -->
<style>
.wikita-lite-leave-prototype-sheet__anchor {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 1px;
  height: 1px;
  pointer-events: none;
  opacity: 0;
}

.wikita-lite-leave-prototype-sheet .cdx-popover__header__title {
  font-family: var(--font-family-base, sans-serif);
  font-size: var(--font-size-x-large, 1.25rem);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-x-large, 1.5);
}

.wikita-lite-leave-prototype-sheet .cdx-popover__body {
  font-size: var(--font-size-medium, 1rem);
  line-height: var(--line-height-medium, 1.625rem);
}

.wikita-lite-leave-prototype-sheet .cdx-popover__footer__actions .cdx-button {
  box-sizing: border-box;
  width: 100%;
}
</style>
