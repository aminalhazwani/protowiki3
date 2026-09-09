<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { CdxButton, CdxCard } from '@wikimedia/codex'
import {
  cdxIconChartBar,
  cdxIconChartLine,
  cdxIconCheckAll,
  cdxIconEdit,
  cdxIconUserTalk,
} from '@wikimedia/codex-icons'

import type { ImpactData } from '../../template-homepage/impact/data/impactTypes'
import { useWikitaLiteCardListClasses } from '../composables/useWikitaLiteCardListClasses'
import { useWikitaLiteRoute } from '../composables/useWikitaLiteRoute'
import { HELP_WANTED_PAGE } from '../routes'

const { wikitaLiteRoute } = useWikitaLiteRoute()

interface Props extends ImpactData {
  standalone?: boolean
  empty?: boolean
  showRefresh?: boolean
  refreshing?: boolean
  refreshError?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  standalone: false,
  empty: false,
  viewLabel: 'On articles you\'ve edited',
  sparklineData: () => [],
  recentActivityData: () => [],
  mostViewed: () => [],
  showRefresh: false,
  refreshing: false,
  refreshError: undefined,
})

const { cardClass } = useWikitaLiteCardListClasses({ standalone: () => props.standalone })

const viewsTitle = computed(() => `${props.viewCount} views`)

function formatStat(value: number | string | undefined): string {
  if (value === undefined || value === '') return '–'
  return String(value)
}
</script>

<template>
  <div
    class="impact-module"
    :class="{
      'impact-module--standalone': standalone,
      'impact-module--empty': empty,
    }"
  >
    <p v-if="refreshError" class="impact-module__refresh-error" role="alert">
      {{ refreshError }}
    </p>

    <div v-if="empty" class="impact-module__empty">
      <div class="impact-module__empty-copy">
        <p class="impact-module__empty-headline">0 edits to articles so far.</p>
        <p class="impact-module__empty-body">
          Help extend free knowledge to the world by editing topics that matter most to you.
        </p>
        <p class="impact-module__empty-caption">
          Start with a few <strong>suggested edits</strong>, then see how many people are viewing
          your contributions here.
        </p>
      </div>
      <RouterLink v-slot="{ navigate }" :to="wikitaLiteRoute(HELP_WANTED_PAGE)" custom>
        <CdxButton class="impact-module__empty-cta" weight="normal" @click="navigate">
          See all suggestions
        </CdxButton>
      </RouterLink>
    </div>

    <template v-else>
      <CdxCard :icon="cdxIconChartLine" :class="['impact-module__card', cardClass]">
        <template #title>{{ viewsTitle }}</template>
        <template #description>{{ viewLabel }}</template>
      </CdxCard>

      <div class="impact-module__row">
        <CdxCard :icon="cdxIconEdit" :class="['impact-module__card', 'impact-module__card--half', cardClass]">
          <template #title>{{ formatStat(totalEdits) }}</template>
          <template #description>Total edits</template>
        </CdxCard>

        <CdxCard :icon="cdxIconUserTalk" :class="['impact-module__card', 'impact-module__card--half', cardClass]">
          <template #title>{{ formatStat(thanksReceived) }}</template>
          <template #description>Thanks received</template>
        </CdxCard>
      </div>

      <div class="impact-module__row">
        <CdxCard :icon="cdxIconChartBar" :class="['impact-module__card', 'impact-module__card--half', cardClass]">
          <template #title>{{ formatStat(longestStreak) }}</template>
          <template #description>Longest editing streak</template>
        </CdxCard>

        <CdxCard :icon="cdxIconCheckAll" :class="['impact-module__card', 'impact-module__card--half', cardClass]">
          <template #title>{{ formatStat(editsReviewed) }}</template>
          <template #description>Edits reviewed</template>
        </CdxCard>
      </div>
    </template>
  </div>
</template>

<style scoped>
.impact-module {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50, 8px);
  width: 100%;
}

.impact-module--standalone {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
}

.impact-module__card {
  width: 100%;
}

.impact-module__row {
  display: flex;
  gap: var(--spacing-50, 8px);
  width: 100%;
}

.impact-module__card--half {
  flex: 1 1 0;
  min-width: 0;
}

.impact-module__refresh-error {
  margin: 0;
  font-size: var(--font-size-small);
  color: var(--color-error, #bf3c2c);
}

.impact-module__empty {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-75, 12px);
  width: 100%;
}

.impact-module__empty-copy {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-25, 4px);
  color: var(--color-subtle, #54595d);
}

.impact-module__empty-headline {
  margin: 0;
  font-size: var(--font-size-medium, 0.875rem);
  font-weight: bold;
  line-height: var(--line-height-medium, 1.375rem);
}

.impact-module__empty-body {
  margin: 0;
  font-size: var(--font-size-medium, 0.875rem);
  line-height: var(--line-height-medium, 1.375rem);
}

.impact-module__empty-caption {
  margin: 0;
  font-size: var(--font-size-small, 0.8125rem);
  line-height: var(--line-height-small, 1.25rem);
}

.impact-module__empty-cta {
  width: 100%;
}
</style>
