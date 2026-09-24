<script setup lang="ts">
/**
 * Empty card slots a home module holds while its feed is still filling the
 * preview: flat blocks the size of a card, so the grid keeps its shape and
 * nothing below moves when the cards land. Render them inside the module's own
 * cards container, after the real cards, so each one sits in the cell its card
 * will take. Height comes from `--wikita-lite-card-skeleton-height`, which a
 * module sets to its typical card (see wikita-lite-shell.css).
 */
defineProps<{
  count: number
}>()
</script>

<template>
  <div
    v-for="n in count"
    :key="`skeleton-${n}`"
    class="wikita-lite-card-skeleton"
    aria-hidden="true"
  />
</template>
