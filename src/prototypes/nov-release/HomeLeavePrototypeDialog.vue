<script setup lang="ts">
/**
 * "Leaving prototype" confirmation. Desktop skin: a centred Codex dialog.
 * Mobile skin: a Codex bottom sheet at every viewport width
 * (`use-bottom-sheet="always"`). Keyed on the global skin, not a media query,
 * so it follows the chrome — including `?skin=mobile` on a wide screen.
 */
import { computed } from 'vue'
import { CdxDialog, CdxPopover } from '@wikimedia/codex'

import { globalSkin } from '@/theme'

import { useHomeLeavePrototype } from './useHomeLeavePrototype'

const { dialogOpen, confirmLeave, cancelLeave } = useHomeLeavePrototype()

const isDesktop = computed(() => globalSkin.value === 'desktop')

const TITLE = 'Leaving prototype'
const BODY =
  'You are leaving the prototype. Any changes you make beyond this point will affect real ' +
  'wikis, and the experience you land in may not be fully integrated with the features here.'
const primaryAction = { label: 'Continue', actionType: 'progressive' as const }
const defaultAction = { label: 'Stay in the prototype' }

function onOpenChange(open: boolean): void {
  if (!open) cancelLeave()
}
</script>

<template>
  <CdxDialog
    v-if="isDesktop"
    v-model:open="dialogOpen"
    class="home-leave-prototype-dialog"
    :title="TITLE"
    use-close-button
    :primary-action="primaryAction"
    :default-action="defaultAction"
    @update:open="onOpenChange"
    @primary="confirmLeave"
    @default="cancelLeave"
  >
    {{ BODY }}
  </CdxDialog>

  <CdxPopover
    v-else
    v-model:open="dialogOpen"
    use-bottom-sheet="always"
    :title="TITLE"
    use-close-button
    :primary-action="primaryAction"
    :default-action="defaultAction"
    stacked-actions
    @update:open="onOpenChange"
    @primary="confirmLeave"
    @default="cancelLeave"
  >
    {{ BODY }}
  </CdxPopover>
</template>

<style>
/* CODEX+ CdxDialog: no size prop. It teleports out of this component, so this can't be scoped. */
.home-leave-prototype-dialog {
  max-width: 32rem;
}
</style>
