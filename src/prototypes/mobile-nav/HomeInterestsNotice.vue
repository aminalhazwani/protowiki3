<script setup lang="ts">
/**
 * "Get articles that match your interests", over a module's random cards while
 * the reader has given the Home nothing to go on. Dismissed per module.
 * "Select interests" does nothing yet: picking interests is out of the prototype's scope here.
 */
import { CdxButton, CdxMessage } from '@wikimedia/codex'
import { cdxIconConfigure } from '@wikimedia/codex-icons'

import type { HomeModuleId } from './modules'
import { useHomeInterestsNotice } from './useHomeInterestsNotice'

const props = defineProps<{ moduleId: HomeModuleId }>()

const { shown, dismiss } = useHomeInterestsNotice(props.moduleId)
</script>

<template>
  <CdxMessage
    v-if="shown"
    class="home-interests-notice"
    :icon="cdxIconConfigure"
    allow-user-dismiss
    @user-dismissed="dismiss"
  >
    <p class="home-interests-notice__text">Get articles that match your interests.</p>
    <CdxButton>Select interests</CdxButton>
  </CdxMessage>
</template>

<style scoped>
/* 12px to the cards, with the frame's 4px gap. */
.home-interests-notice {
  margin-bottom: var(--spacing-50);
}

.home-interests-notice__text {
  margin: 0 0 var(--spacing-50);
}
</style>
