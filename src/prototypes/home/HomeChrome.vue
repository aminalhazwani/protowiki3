<script setup lang="ts">
/**
 * Wikipedia chrome for every Home page: the wordmark leads back to `/home`, and
 * any link off the prototype (header or content) asks before leaving.
 */
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'

import HomeLeavePrototypeDialog from './HomeLeavePrototypeDialog.vue'
import { HOME_PATH } from './routes'
import { useHomeLeavePrototype } from './useHomeLeavePrototype'

const { onLeaveCapture } = useHomeLeavePrototype()
</script>

<template>
  <div @click.capture="onLeaveCapture">
    <ChromeWrapper :brand-to="HOME_PATH">
      <slot />
    </ChromeWrapper>
    <HomeLeavePrototypeDialog />
  </div>
</template>
