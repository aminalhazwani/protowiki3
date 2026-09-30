<script setup lang="ts">
/**
 * The signed-in Home: a special-page shell with the greeting as its title.
 * Modules land here in later steps.
 */
import SpecialPageWrapper from '@/components/SpecialPageWrapper.vue'
import { useConfig } from '@/composables/useConfig'

const { pageTitle } = useConfig()
</script>

<template>
  <SpecialPageWrapper :title="pageTitle" class="home-dashboard">
    <slot />
  </SpecialPageWrapper>
</template>
