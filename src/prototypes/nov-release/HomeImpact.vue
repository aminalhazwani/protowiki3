<script setup lang="ts">
/**
 * "Your impact", as the Homepage template draws it: its own card and title, and
 * its states per Mock user (new → empty, experienced → fixtures, real → live).
 * The desktop layout on every skin: the template's mobile one is a link card to
 * an Impact page this prototype doesn't have.
 */
import ImpactModule from '../template-homepage/ImpactModule.vue'
import { useHomepageImpact } from '../template-homepage/useHomepageImpact'

const { impactDesktopProps, onImpactRefresh } = useHomepageImpact()
</script>

<template>
  <ImpactModule v-bind="impactDesktopProps" @refresh="onImpactRefresh" />
</template>
