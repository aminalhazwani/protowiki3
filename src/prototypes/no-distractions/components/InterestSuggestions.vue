<script setup lang="ts">
import { computed } from 'vue'
import { CdxIcon, CdxProgressBar } from '@wikimedia/codex'
import { cdxIconAdd } from '@wikimedia/codex-icons'

import type { MorelikeSearchHit } from '@/lib/fetchMorelike'

import { useThumbReveal } from '../data/useThumbReveal'

const props = withDefaults(
  defineProps<{
    suggestions: MorelikeSearchHit[]
    loading?: boolean
    source?: 'morelike' | 'random'
    disabled?: boolean
  }>(),
  { source: 'morelike', disabled: false },
)

const heading = computed(() =>
  props.source === 'random' ? 'Random articles' : 'Related articles',
)

// The avatar reveal is a one-shot entrance keyed by title: each chip's <img>
// `@load` marks it loaded and it animates in (staggered within a burst). A
// freshly mounted chip with a retained loaded key still animates on mount
// (keyframe entrance), so there's no need to reset state when the list changes —
// and resetting would strip the class off reused chips whose image is already
// decoded and would never re-fire `load`.
const thumbReveal = useThumbReveal()

defineEmits<{
  add: [title: string]
}>()
</script>

<template>
  <section v-if="loading || suggestions.length" class="interest-suggestions">
    <h2 class="interest-suggestions__heading">{{ heading }}</h2>
    <CdxProgressBar
      v-if="!suggestions.length"
      class="interest-suggestions__progress"
      inline
      :aria-label="`Loading ${heading.toLowerCase()}`"
    />
    <ul v-else class="interest-suggestions__list">
      <li v-for="hit in suggestions" :key="hit.title">
        <button
          type="button"
          class="interest-suggestions__chip"
          :disabled="disabled"
          :aria-label="`Add ${hit.title}`"
          @click="$emit('add', hit.title)"
        >
          <span
            v-if="hit.thumbnail?.url"
            class="interest-suggestions__thumb"
            :class="{ 'interest-suggestions__thumb--loaded': thumbReveal.isLoaded(hit.title) }"
            :style="thumbReveal.style(hit.title)"
          >
            <img :src="hit.thumbnail.url" alt="" @load="thumbReveal.onLoad(hit.title)" />
          </span>
          <span class="interest-suggestions__label">{{ hit.title }}</span>
          <CdxIcon :icon="cdxIconAdd" class="interest-suggestions__add" />
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.interest-suggestions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-50, 8px);
}

.interest-suggestions__heading {
  margin: var(--spacing-75, 12px) 0 0 0;
  font-family: inherit;
  font-size: var(--font-size-medium, 1rem);
  font-weight: var(--font-weight-bold, 700);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-subtle, #54595d);
}

.interest-suggestions__progress {
  margin-top: var(--spacing-25, 4px);
}

.interest-suggestions__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-75, 12px);
  margin: 0;
  padding: 0;
  list-style: none;
}

.interest-suggestions__list li {
  margin-block: 0;
  max-width: 100%;
}

.interest-suggestions__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-50, 8px);
  max-width: 100%;
  min-height: 2.75rem;
  padding: var(--spacing-25, 4px) var(--spacing-50, 8px) var(--spacing-25, 4px) 14px;
  border: var(--border-width-base, 1px) solid var(--border-color-subtle, #c8ccd1);
  border-radius: var(--border-radius-pill, 9999px);
  background-color: var(--background-color-interactive-subtle, #f8f9fa);
  font: inherit;
  text-align: start;
  cursor: pointer;
}

.interest-suggestions__chip:hover {
  background-color: var(--background-color-interactive-subtle--hover, #eaecf0);
}

.interest-suggestions__chip:disabled,
.interest-suggestions__chip:disabled:hover {
  border-color: var(--border-color-disabled, #c8ccd1);
  background-color: var(--background-color-disabled-subtle, #eaecf0);
  cursor: default;
}

.interest-suggestions__chip:disabled .interest-suggestions__label,
.interest-suggestions__chip:disabled .interest-suggestions__add {
  color: var(--color-disabled, #a2a9b1);
}

/* Desaturate the thumbnail so the photo joins the greyed-out palette rather
   than reading as still-active next to the disabled text. Applied to the
   wrapper, not the <img>: the img's opacity is driven by the `ob-thumb-img-in`
   entrance animation, and an animated value outranks a normal declaration in
   the cascade, so `opacity` set on the img would be ignored. The wrapper's own
   animation only touches `width`, leaving opacity/filter free here. */
.interest-suggestions__chip:disabled .interest-suggestions__thumb {
  filter: grayscale(100%);
  opacity: 0.55;
}

.interest-suggestions__thumb {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  /* Collapsed until the image loads: text-only chip, no reserved avatar space.
     Width is the only layout-affecting property that animates, isolated to this
     2rem slot; the negative margin cancels the flex gap while collapsed so the
     empty slot doesn't nudge the label. */
  width: 0;
  height: 2rem;
  margin-left: calc(-1 * var(--spacing-50, 8px));
  border-radius: var(--border-radius-circle, 50%);
  overflow: hidden;
}

/* One-shot entrance on load (keyframes defined in onboarding-motion.css so the
   reveal plays even when the image is cached — see that file). Static `width`
   is the resting value the animation lands on; `both` holds the collapsed
   `from` state through the stagger delay. */
.interest-suggestions__thumb--loaded {
  width: 2rem;
  animation: ob-thumb-slot-in var(--ob-duration-thumb-in, 180ms) var(--ob-ease-out-strong, ease-out) both;
  animation-delay: var(--thumb-delay, 0ms);
  will-change: width;
}

.interest-suggestions__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform-origin: center;
  /* Resting state before load: collapsed/invisible so the entrance has
     somewhere to animate from. */
  opacity: 0;
  transform: scale(0);
}

/* Scale + fade in on the compositor (transform/opacity only, off the layout
   path). Static values are the resting state after the animation ends. */
.interest-suggestions__thumb--loaded img {
  opacity: 1;
  transform: scale(1);
  animation: ob-thumb-img-in var(--ob-duration-thumb-in, 180ms) var(--ob-ease-out-strong, ease-out) both;
  animation-delay: var(--thumb-delay, 0ms);
  will-change: transform, opacity;
}

@media (prefers-reduced-motion: reduce) {
  /* Keep a plain opacity fade only: width snaps (no label slide), no scale. */
  .interest-suggestions__thumb--loaded {
    animation: none;
  }

  .interest-suggestions__thumb img {
    transform: none;
  }

  .interest-suggestions__thumb--loaded img {
    transform: none;
    animation: ob-thumb-img-fade var(--ob-duration-thumb-in, 180ms) var(--ob-ease-out-strong, ease-out) both;
    animation-delay: var(--thumb-delay, 0ms);
  }
}

.interest-suggestions__label {
  min-width: 0;
  overflow: hidden;
  font-size: var(--font-size-medium, 1rem);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-base);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.interest-suggestions__add {
  flex-shrink: 0;
  color: var(--color-base, #404244);
}
</style>
