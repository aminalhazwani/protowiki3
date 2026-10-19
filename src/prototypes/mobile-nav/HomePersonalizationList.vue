<script setup lang="ts">
/**
 * "Personalization" (home2's dialog, now a section of ☰ Prototype settings):
 * which of the reader's activity shapes the personal modules, with a lookup
 * for adding interests, and each activity's pages as a comma-separated field —
 * the same lists ProtoWiki's own user settings edit. The modules reload as things change.
 */
import { computed, reactive } from 'vue'
import { CdxTextInput, CdxToggleSwitch } from '@wikimedia/codex'

import { useConfig } from '@/composables/useConfig'
import { formatPageList, parsePageList, type PageListKey } from '@/config'

import type { HomeSources } from './data/homeConfig'
import HomeInterestsLookup from './HomeInterestsLookup.vue'
import { useHomePersonalization } from './useHomePersonalization'

const { interests, sources, setInterests, setSource } = useHomePersonalization()
const { user, currentUserPageLists, setCurrentUserPageList } = useConfig()

/* As in ProtoWiki's user settings: a real account's lists come from the wiki, not from here. */
const editableLists = computed(() => user.value !== 'real' && user.value !== 'logged-out')

/*
 * What's typed stays as typed while the field has focus (the list still updates
 * as you type); re-formatting it mid-edit would eat a trailing ", " and jump the caret.
 */
const drafts = reactive<Partial<Record<PageListKey, string>>>({})

function listText(list: PageListKey): string {
  return drafts[list] ?? formatPageList(currentUserPageLists.value[list])
}

function onListInput(list: PageListKey, value: string): void {
  drafts[list] = value
  setCurrentUserPageList(list, parsePageList(value))
}

const count = (n: number, one: string, many: string) => (n === 1 ? `1 ${one}` : `${n} ${many}`)

/** home2's rows: each source with how much of the reader's activity it holds. */
const rows = computed(
  (): {
    key: keyof HomeSources
    label: string
    count: number
    unit: string
    /** The ProtoWiki page list this source reads. */
    list?: PageListKey
  }[] => {
    const lists = currentUserPageLists.value
    return [
      {
        key: 'interests',
        label: 'Interests or topics',
        count: interests.value.length,
        unit: 'page',
      },
      {
        key: 'saved',
        label: 'Saved pages',
        count: lists.readingList.length,
        unit: 'page',
        list: 'readingList',
      },
      {
        key: 'watchlist',
        label: 'Watchlist',
        count: lists.watchlist.length,
        unit: 'page',
        list: 'watchlist',
      },
      {
        key: 'contributions',
        label: 'Contributions',
        count: lists.editedPages.length,
        unit: 'edit',
        list: 'editedPages',
      },
    ]
  },
)
</script>

<template>
  <div class="home-personalization-list">
    <template v-for="row in rows" :key="row.key">
      <CdxToggleSwitch
        :model-value="sources[row.key]"
        align-switch
        @update:model-value="setSource(row.key, $event)"
      >
        {{ row.label }}
        <template #description>
          <span
            class="home-personalization-list__count"
            :class="{ 'home-personalization-list__count--active': row.count > 0 }"
          >
            {{ count(row.count, row.unit, `${row.unit}s`) }}
          </span>
        </template>
      </CdxToggleSwitch>

      <HomeInterestsLookup
        v-if="row.key === 'interests' && sources.interests"
        class="home-personalization-list__field"
        :model-value="interests"
        @update:model-value="setInterests"
      />

      <CdxTextInput
        v-else-if="row.list && sources[row.key] && editableLists"
        class="home-personalization-list__field"
        :model-value="listText(row.list)"
        placeholder="Page titles, separated by commas"
        :aria-label="`${row.label}: page titles, separated by commas`"
        @update:model-value="onListInput(row.list, String($event))"
        @blur="delete drafts[row.list]"
      />
    </template>
  </div>
</template>

<style scoped>
.home-personalization-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75);
}

/* Sits close under its switch, which it belongs to. */
.home-personalization-list__field {
  margin-top: calc(-1 * var(--spacing-75));
}

.home-personalization-list__count {
  color: var(--color-subtle);
}

/* A source with something in it reads as live. */
.home-personalization-list__count--active {
  color: var(--color-progressive);
}
</style>
