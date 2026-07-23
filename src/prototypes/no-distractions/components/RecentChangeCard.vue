<script setup lang="ts">
import { CdxIcon } from '@wikimedia/codex'
import { cdxIconArticle, cdxIconUserAvatar } from '@wikimedia/codex-icons'

interface Props {
  articleTitle: string
  articleDescription: string
  editor: string
  relativeTime: string
  editSummary: string
  thumbnailSrc?: string
}

withDefaults(defineProps<Props>(), {
  thumbnailSrc: undefined,
})
</script>

<template>
  <article class="recent-change-card">
    <div class="recent-change-card__body">
      <p class="recent-change-card__headline">
        <strong class="recent-change-card__title">{{ articleTitle }}</strong>
        <template v-if="articleDescription">
          <span class="recent-change-card__desc-sep"> &middot; </span>
          <span class="recent-change-card__desc">{{ articleDescription }}</span>
        </template>
      </p>
      <p class="recent-change-card__meta">
        <CdxIcon class="recent-change-card__meta-icon" :icon="cdxIconUserAvatar" />
        <strong class="recent-change-card__editor">{{ editor }}</strong>
        <span class="recent-change-card__meta-sep"> &middot; </span>
        <span class="recent-change-card__time">{{ relativeTime }}</span>
      </p>
      <p class="recent-change-card__summary">{{ editSummary }}</p>
    </div>

    <span class="recent-change-card__thumb">
      <img v-if="thumbnailSrc" :src="thumbnailSrc" alt="" />
      <CdxIcon v-else :icon="cdxIconArticle" />
    </span>
  </article>
</template>

<style scoped>
.recent-change-card {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-75, 12px);
  padding: 0.8125rem;
  border: var(--border-width-base, 1px) solid var(--border-color-base, #a2a9b1);
  border-radius: var(--border-radius-base, 2px);
  background-color: var(--background-color-base);
}

.recent-change-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-25, 4px);
  flex: 1;
  min-width: 0;
}

.recent-change-card__headline {
  margin: 0;
  font-size: var(--font-size-small, 0.875rem);
  line-height: var(--line-height-small, 1.43);
  color: var(--color-base);
}

.recent-change-card__title {
  font-size: var(--font-size-small, 0.875rem);
  font-weight: var(--font-weight-bold);
}

.recent-change-card__desc {
  font-size: var(--font-size-small, 0.875rem);
}

.recent-change-card__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-25, 4px);
  margin: 0;
  font-size: var(--font-size-small, 0.875rem);
  line-height: var(--line-height-small, 1.43);
  color: var(--color-base);
}

.recent-change-card__meta-icon :deep(.cdx-icon) {
  width: 1rem;
  height: 1rem;
}

.recent-change-card__editor {
  font-weight: var(--font-weight-bold);
}

.recent-change-card__time {
  color: var(--color-subtle, #54595d);
}

.recent-change-card__summary {
  margin: 0;
  padding-top: var(--spacing-25, 4px);
  font-size: var(--font-size-small, 0.875rem);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-subtle, #54595d);
  overflow-wrap: anywhere;
}

.recent-change-card__thumb {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 4rem;
  height: 4rem;
  border: var(--border-width-base, 1px) solid var(--border-color-subtle, #c8ccd1);
  border-radius: var(--border-radius-base, 2px);
  background-color: var(--background-color-interactive-subtle, #f8f9fa);
  overflow: hidden;
  color: var(--color-placeholder, #72777d);
}

.recent-change-card__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
