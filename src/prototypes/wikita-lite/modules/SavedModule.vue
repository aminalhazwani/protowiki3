<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { RouterLink } from 'vue-router'

import { CdxCard, CdxIcon, CdxProgressBar } from '@wikimedia/codex'
import {
  cdxIconBookmark,
  cdxIconBookmarkList,
  cdxIconBookmarkOutline,
} from '@wikimedia/codex-icons'

import type { HomeSavedItem } from '../../musical-group/data/types'
import {
  savedItemHref,
  useWikitaLiteSaveActions,
} from '../composables/useWikitaLiteCardActions'
import { useWikitaLiteCardListClasses } from '../composables/useWikitaLiteCardListClasses'
import { useWikitaLiteSaveFeedback } from '../composables/useWikitaLiteSaveFeedback'
import { useWikitaLiteOverflowShowMore } from '../composables/useWikitaLiteOverflowShowMore'
import { WIKITA_LITE_CARD_CLASS_THUMBNAIL_SIZE_LARGE } from '../wikita-lite-card'
import WikitaLiteCardWithAction from '../components/WikitaLiteCardWithAction.vue'
import WikitaLiteSupportingRow from '../components/WikitaLiteSupportingRow.vue'

interface Props {
  standalone?: boolean
  items?: HomeSavedItem[]
  loading?: boolean
  previewLimit?: number
  moreTo?: RouteLocationRaw
}

const props = withDefaults(defineProps<Props>(), {
  standalone: false,
  items: () => [],
  loading: false,
  previewLimit: 5,
  moreTo: undefined,
})

/** Standalone Saved page keeps items visible after unsave until the user leaves. */
const sessionItems = ref<HomeSavedItem[] | null>(null)

watch(
  () => props.items,
  (items) => {
    if (!props.standalone) return

    if (sessionItems.value === null) {
      sessionItems.value = [...items]
      return
    }

    const existingIds = new Set(sessionItems.value.map((item) => item.id))
    for (const item of items) {
      if (!existingIds.has(item.id)) {
        sessionItems.value.push(item)
      }
    }
  },
  { immediate: true, deep: true },
)

const displayItems = computed(() => {
  const items =
    props.standalone && sessionItems.value !== null ? sessionItems.value : props.items
  return props.standalone ? items : items.slice(0, props.previewLimit)
})

const { listsVersion } = useWikitaLiteSaveFeedback()
const listsVersionRef = computed(() => listsVersion.value)
const { relatedReadingSaved, relatedReadingInList, onRelatedReadingSave } =
  useWikitaLiteSaveActions(listsVersionRef)

function saveIcon(itemId: string, title: string) {
  if (relatedReadingInList(itemId)) return cdxIconBookmarkList
  return relatedReadingSaved(title) ? cdxIconBookmark : cdxIconBookmarkOutline
}

function saveLabel(title: string): string {
  return relatedReadingSaved(title) ? 'Saved' : 'Save'
}

function cardThumbnail(url?: string) {
  return url?.trim() ? { url: url.trim() } : null
}

function formatSavedLabel(savedAt: number | undefined): string {
  if (!Number.isFinite(savedAt) || savedAt <= 0) return ''

  const diffMs = Date.now() - savedAt
  if (!Number.isFinite(diffMs) || diffMs < 0) return ''

  if (diffMs < 60_000) return 'Saved just now'

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 60) {
    return minutes === 1 ? 'Saved 1 min ago' : `Saved ${minutes} mins ago`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return hours === 1 ? 'Saved 1 hour ago' : `Saved ${hours} hours ago`
  }

  const days = Math.floor(hours / 24)
  return days === 1 ? 'Saved 1 day ago' : `Saved ${days} days ago`
}

const { groupClass, cardClass } = useWikitaLiteCardListClasses({ standalone: () => props.standalone })

const showMoreLink = useWikitaLiteOverflowShowMore({
  standalone: () => props.standalone,
  moreTo: () => props.moreTo,
  hasItems: () => displayItems.value.length > 0,
})
</script>

<template>
  <div class="saved-module">
    <CdxProgressBar v-if="standalone && loading" inline aria-label="Loading saved pages" />

    <template v-else>
      <template v-if="displayItems.length">
        <div :class="['saved-module__cards', groupClass]">
          <template v-for="item in displayItems" :key="item.id">
            <WikitaLiteCardWithAction
              v-if="standalone"
              :url="savedItemHref(item)"
              :title="item.title"
              :description="item.description"
              :supporting-text="
                relatedReadingSaved(item.title) ? formatSavedLabel(item.savedAt) : undefined
              "
              :supporting-icon="relatedReadingSaved(item.title) ? cdxIconBookmark : undefined"
              :thumbnail-url="item.thumbnailUrl"
              thumbnail-size="large"
              :force-thumbnail="true"
              :action-label="saveLabel(item.title)"
              :action-icon="saveIcon(item.id, item.title)"
              :action-active="relatedReadingSaved(item.title)"
              @action-click="onRelatedReadingSave(item.id, item.title, item.thumbnailUrl)"
            />

            <CdxCard
              v-else
              :class="[WIKITA_LITE_CARD_CLASS_THUMBNAIL_SIZE_LARGE, cardClass]"
              :url="savedItemHref(item)"
              :thumbnail="cardThumbnail(item.thumbnailUrl)"
              :force-thumbnail="true"
            >
              <template #title>
                {{ item.title }}
              </template>
              <template v-if="item.description" #description>
                {{ item.description }}
              </template>
              <template #supporting-text>
                <WikitaLiteSupportingRow :icon="cdxIconBookmark">
                  {{ formatSavedLabel(item.savedAt) }}
                </WikitaLiteSupportingRow>
              </template>
            </CdxCard>
          </template>
        </div>

        <slot name="after-cards" />

        <RouterLink
          v-if="showMoreLink && moreTo"
          :to="moreTo"
          class="cdx-button cdx-button--fake-button cdx-button--fake-button--enabled wikita-lite-button-link"
        >
          Show more saved
        </RouterLink>
      </template>

      <p
        v-else
        class="saved-module__empty"
        :class="{ 'saved-module__empty--standalone': standalone }"
      >
        Use the save icon
        <CdxIcon :icon="cdxIconBookmarkOutline" class="saved-module__empty-icon" />
        on any page to add items.
      </p>
    </template>
  </div>
</template>

<style scoped>
.saved-module {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50, 8px);
  width: 100%;
}

.saved-module__cards {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.saved-module__empty {
  margin: 0;
  padding-bottom: var(--spacing-50, 8px);
  font-family: var(--font-family-base);
  font-size: var(--font-size-medium, 1rem);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-subtle, #54595d);
}

.saved-module__empty--standalone {
  padding-top: var(--spacing-75, 12px);
}

.saved-module__empty-icon {
  display: inline-block;
  vertical-align: text-bottom;
  color: var(--color-subtle, #54595d);
}

.saved-module__empty-icon :deep(svg path) {
  fill: currentColor;
}
</style>
