<script setup lang="ts">
/**
 * "Your impact", as the Homepage template draws it, and its states per Mock
 * user (new → empty, experienced → fixtures, real → live). Standalone, so
 * without the template's own card and title: the Home's module heading sits
 * above, and the content gets a card frame like the other modules' cards.
 * The desktop layout on every skin: the template's mobile one is a link card to
 * an Impact page this prototype doesn't have.
 */
import ImpactModule from '../template-homepage/ImpactModule.vue'
import { useHomepageImpact } from '../template-homepage/useHomepageImpact'

const { impactDesktopProps, onImpactRefresh } = useHomepageImpact()
</script>

<template>
  <div class="home-impact">
    <ImpactModule standalone v-bind="impactDesktopProps" @refresh="onImpactRefresh" />
  </div>
</template>

<style scoped>
/* A Codex card's frame (`CdxCard`), so it reads like the other modules' cards. */
.home-impact {
  border: var(--border-width-base) var(--border-style-base) var(--border-color-base);
  border-radius: var(--border-radius-base);
  padding: var(--spacing-75);
  background-color: var(--background-color-base);
}
</style>
