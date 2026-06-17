<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  body: string
  description?: string
  thumbnailSrc?: string
  /** When set, the card is tappable. */
  articleTitle?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  description: undefined,
  thumbnailSrc: undefined,
  articleTitle: undefined,
})

const emit = defineEmits<{
  open: [title: string]
}>()

const isInteractive = computed(() => Boolean(props.articleTitle?.trim()))

function onActivate(): void {
  if (!props.articleTitle?.trim()) return
  emit('open', props.articleTitle.trim())
}

function onKeydown(event: KeyboardEvent): void {
  if (!isInteractive.value) return
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onActivate()
  }
}
</script>

<template>
  <component
    :is="isInteractive ? 'button' : 'article'"
    class="featured-card"
    :class="{ 'featured-card--interactive': isInteractive }"
    :type="isInteractive ? 'button' : undefined"
    @click="onActivate"
    @keydown="onKeydown"
  >
    <div class="featured-card__body">
      <p v-if="title" class="featured-card__title">{{ title }}</p>
      <p class="featured-card__text">{{ body }}</p>
      <p v-if="description" class="featured-card__description">{{ description }}</p>
    </div>

    <span v-if="thumbnailSrc" class="featured-card__thumb">
      <img :src="thumbnailSrc" alt="" />
    </span>
  </component>
</template>

<style scoped>
.featured-card {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-75, 12px);
  width: 100%;
  padding: 0.8125rem;
  border: var(--border-width-base, 1px) solid var(--border-color-base, #a2a9b1);
  border-radius: var(--border-radius-base, 2px);
  background-color: var(--background-color-base);
  text-align: start;
}

.featured-card--interactive {
  cursor: pointer;
  font: inherit;
  color: inherit;
}

.featured-card--interactive:focus-visible {
  outline: 2px solid var(--color-progressive, #36c);
  outline-offset: 2px;
}

.featured-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-25, 4px);
  flex: 1;
  min-width: 0;
}

.featured-card__title {
  margin: 0;
  font-size: var(--font-size-medium, 1rem);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-base);
}

.featured-card__text {
  margin: 0;
  font-size: var(--font-size-small, 0.875rem);
  line-height: var(--line-height-small, 1.43);
  color: var(--color-base);
}

.featured-card__description {
  margin: 0;
  font-size: var(--font-size-small, 0.875rem);
  line-height: var(--line-height-small, 1.43);
  color: var(--color-subtle, #54595d);
}

.featured-card__thumb {
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

.featured-card__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
