<script setup lang="ts">
/**
 * "Personalization" (home2): which of the reader's activity shapes the
 * personal modules, with a lookup for adding interests. Opened over the Home
 * from a personal module's "Configure"; the modules reload as things change.
 */
import { computed } from 'vue'
import { CdxToggleSwitch } from '@wikimedia/codex'

import { useConfig } from '@/composables/useConfig'

import type { HomeSources } from './data/homeConfig'
import HomeDialogShell from './HomeDialogShell.vue'
import HomeInterestsLookup from './HomeInterestsLookup.vue'
import { useHomePersonalization } from './useHomePersonalization'

const open = defineModel<boolean>('open', { required: true })

const { interests, sources, setInterests, setSource } = useHomePersonalization()
const { currentUserPageLists } = useConfig()

const count = (n: number, one: string, many: string) => (n === 1 ? `1 ${one}` : `${n} ${many}`)

/** home2's rows: each source with how much of the reader's activity it holds. */
const rows = computed(
  (): { key: keyof HomeSources; label: string; count: number; unit: string }[] => {
    const lists = currentUserPageLists.value
    return [
      {
        key: 'interests',
        label: 'Interests or topics',
        count: interests.value.length,
        unit: 'page',
      },
      { key: 'saved', label: 'Saved pages', count: lists.readingList.length, unit: 'page' },
      { key: 'watchlist', label: 'Watchlist', count: lists.watchlist.length, unit: 'page' },
      {
        key: 'contributions',
        label: 'Contributions',
        count: lists.editedPages.length,
        unit: 'edit',
      },
    ]
  },
)
</script>

<template>
  <HomeDialogShell
    v-model:open="open"
    title="Personalization"
    subtitle="Choose which activity shapes the recommendations on your Home."
  >
    <div class="home-personalization-dialog">
      <template v-for="row in rows" :key="row.key">
        <CdxToggleSwitch
          :model-value="sources[row.key]"
          align-switch
          @update:model-value="setSource(row.key, $event)"
        >
          {{ row.label }}
          <template #description>
            <span
              class="home-personalization-dialog__count"
              :class="{ 'home-personalization-dialog__count--active': row.count > 0 }"
            >
              {{ count(row.count, row.unit, `${row.unit}s`) }}
            </span>
          </template>
        </CdxToggleSwitch>

        <HomeInterestsLookup
          v-if="row.key === 'interests' && sources.interests"
          class="home-personalization-dialog__lookup"
          :model-value="interests"
          @update:model-value="setInterests"
        />
      </template>
    </div>
  </HomeDialogShell>
</template>

<style scoped>
.home-personalization-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75);
}

/* Sits close under its switch, which it belongs to. */
.home-personalization-dialog__lookup {
  margin-top: calc(-1 * var(--spacing-25));
}

.home-personalization-dialog__count {
  color: var(--color-subtle);
}

/* A source with something in it reads as live. */
.home-personalization-dialog__count--active {
  color: var(--color-progressive);
}
</style>
