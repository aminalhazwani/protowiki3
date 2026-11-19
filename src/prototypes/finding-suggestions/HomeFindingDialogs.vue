<script setup lang="ts">
/** The scenario's dialogs, on the Home and on a module's own page: account setup, and the two pickers. */
import HomeAccountSetup from './HomeAccountSetup.vue'
import HomeEditTypesDialog from './HomeEditTypesDialog.vue'
import HomeInterestsDialog from './HomeInterestsDialog.vue'
</script>

<template>
  <HomeAccountSetup />
  <HomeInterestsDialog />
  <HomeEditTypesDialog />
</template>
