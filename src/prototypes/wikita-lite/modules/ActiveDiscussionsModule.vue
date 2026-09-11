<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { RouterLink } from 'vue-router'

import { CdxButton, CdxCard, CdxProgressBar } from '@wikimedia/codex'
import { cdxIconSpeechBubbles } from '@wikimedia/codex-icons'

import type { HomeActiveDiscussion } from '../../musical-group/data/types'
import WikitaLiteDailyReadsTabs from '../components/WikitaLiteDailyReadsTabs.vue'
import WikitaLiteSupportingRow from '../components/WikitaLiteSupportingRow.vue'
import { useWikitaLiteActiveDiscussionsTabs } from '../composables/useWikitaLiteActiveDiscussionsTabs'
import { useWikitaLiteCardListClasses } from '../composables/useWikitaLiteCardListClasses'
import { useWikitaLiteOverflowShowMore } from '../composables/useWikitaLiteOverflowShowMore'
import { activeDiscussionCategoryLabel } from '../data/activeDiscussionLabels'
import type { WikitaLiteSupportingSignal } from '../data/supportingSignals'

interface Props {
  standalone?: boolean
  items?: HomeActiveDiscussion[]
  loading?: boolean
  error?: string | null
  previewLimit?: number
  moreTo?: RouteLocationRaw
}

const props = withDefaults(defineProps<Props>(), {
  standalone: false,
  items: () => [],
  loading: false,
  error: null,
  previewLimit: 3,
  moreTo: undefined,
})

defineEmits<{
  retry: []
}>()

/** Comment count, then the latest reply's relative time. */
function discussionSignals(discussion: HomeActiveDiscussion): WikitaLiteSupportingSignal[] {
  return [
    {
      icon: cdxIconSpeechBubbles,
      text: `${discussion.commentCount} ${discussion.commentCount === 1 ? 'comment' : 'comments'}`,
    },
    { text: discussion.latestCommentLabel },
  ]
}

const { tabs, activeTabId, showTabs, filteredItems } = useWikitaLiteActiveDiscussionsTabs({
  items: () => props.items,
})

const displayItems = computed(() => {
  const filtered = filteredItems.value
  return props.standalone ? filtered : filtered.slice(0, props.previewLimit)
})

const { groupClass, cardClass } = useWikitaLiteCardListClasses({
  standalone: () => props.standalone,
})

const showMoreLink = useWikitaLiteOverflowShowMore({
  standalone: () => props.standalone,
  moreTo: () => props.moreTo,
  hasItems: () => displayItems.value.length > 0,
})
</script>

<template>
  <div class="active-discussions-module">
    <CdxProgressBar v-if="standalone && loading" inline aria-label="Loading active discussions" />

    <template v-else-if="error">
      <div class="active-discussions-module__error">
        <p>{{ error }}</p>
        <CdxButton weight="quiet" @click="$emit('retry')">Try again</CdxButton>
      </div>
    </template>

    <template v-else>
      <WikitaLiteDailyReadsTabs
        v-if="showTabs"
        v-model:active-tab-id="activeTabId"
        :tabs="tabs"
        aria-label="Active discussion filters"
      />

      <div :class="['active-discussions-module__cards', groupClass]">
        <CdxCard
          v-for="discussion in displayItems"
          :key="discussion.id"
          :class="cardClass"
          :url="discussion.discussionUrl"
        >
          <template #title>
            {{ discussion.title }}
          </template>
          <template #description>
            {{ activeDiscussionCategoryLabel(discussion.noticeboardTitle) }}
          </template>
          <template #supporting-text>
            <WikitaLiteSupportingRow :signals="discussionSignals(discussion)" />
          </template>
        </CdxCard>
      </div>

      <slot name="after-cards" />

      <RouterLink
        v-if="showMoreLink && moreTo"
        :to="moreTo"
        class="cdx-button cdx-button--fake-button cdx-button--fake-button--enabled wikita-lite-button-link"
      >
        Show more active discussions
      </RouterLink>

      <p v-if="standalone && !displayItems.length" class="active-discussions-module__empty">
        No active discussions right now.
      </p>
    </template>
  </div>
</template>

<style scoped>
.active-discussions-module {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75, 12px);
  width: 100%;
}

.active-discussions-module__cards {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: calc(-1*var(--spacing-25, 4px));
}

.active-discussions-module__error,
.active-discussions-module__empty {
  margin: 0;
  font-family: var(--font-family-base);
  font-size: var(--font-size-medium, 1rem);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-subtle, #54595d);
}

.active-discussions-module__error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-50, 8px);
}
</style>
