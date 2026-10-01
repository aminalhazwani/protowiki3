<script setup lang="ts">
/** A Home module's frame: its heading over whatever the module shows. */
defineProps<{ id: string; title: string }>()
</script>

<template>
  <section class="home-section-frame" :data-module-id="id">
    <h2 class="home-section-frame__heading">{{ title }}</h2>
    <slot />
  </section>
</template>

<style scoped>
.home-section-frame {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50);
}

/* Codex Heading 4 — the page title above is the h1. */
.home-section-frame__heading {
  margin: 0;
  font-family: var(--font-family-base);
  font-size: var(--font-size-large);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-large);
  color: var(--color-base);
}
</style>
