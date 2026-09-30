<script setup lang="ts">
/**
 * One Home card: a thin adapter over Codex `CdxCard`, driven by `HomeCardData`
 * and the module's `variant`. While loading it renders a flat skeleton of the
 * same shape, so the real card replaces it without moving the page.
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { CdxCard, CdxIcon } from '@wikimedia/codex'
import type { Icon } from '@wikimedia/codex-icons'

import type { HomeCardData } from './data/types'
import type { HomeCardVariant } from './modules'

const props = defineProps<{
  variant: HomeCardVariant
  card?: HomeCardData
  loading?: boolean
  supportingIcon?: Icon
}>()

const router = useRouter()

const href = computed(() => (props.card ? router.resolve(props.card.to).href : undefined))
const thumbnail = computed(() =>
  props.card?.thumbnailUrl ? { url: props.card.thumbnailUrl } : null,
)

interface CardLayout {
  thumbnailPosition?: 'inline-start' | 'inline-end' | 'block-start'
  thumbnailSize?: 'small' | 'large'
  forceThumbnail?: boolean
}

/** Codex card layout per variant (see `HomeCardVariant`). */
const LAYOUTS: Record<HomeCardVariant, CardLayout> = {
  hero: { thumbnailPosition: 'block-start' },
  article: { thumbnailSize: 'large', forceThumbnail: true },
  hook: { thumbnailPosition: 'inline-end', thumbnailSize: 'large' },
}

const layout = computed(() => LAYOUTS[props.variant])

/** Title split around `titleEmphasis`, which renders bold (Did you know hooks). */
const titleParts = computed(() => {
  const title = props.card?.title ?? ''
  const emphasis = props.card?.titleEmphasis
  const index = emphasis ? title.indexOf(emphasis) : -1
  if (!emphasis || index < 0) return null
  return {
    before: title.slice(0, index),
    bold: emphasis,
    after: title.slice(index + emphasis.length),
  }
})

/** Cards lead inside the prototype; modified clicks still open a new tab. */
function onClick(event: MouseEvent): void {
  if (!props.card || event.defaultPrevented || event.button !== 0) return
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  void router.push(props.card.to)
}
</script>

<template>
  <div
    v-if="loading || !card"
    class="home-card-skeleton"
    :class="`home-card-skeleton--${variant}`"
    aria-hidden="true"
  >
    <div v-if="variant === 'hero'" class="home-card-skeleton__image" />
  </div>

  <CdxCard
    v-else
    class="home-card"
    :url="href"
    :class="`home-card--${variant}`"
    :thumbnail="thumbnail"
    :thumbnail-position="layout.thumbnailPosition"
    :thumbnail-size="layout.thumbnailSize"
    :force-thumbnail="layout.forceThumbnail"
    @click="onClick"
  >
    <template #title>
      <span v-if="titleParts">
        <span>{{ titleParts.before }}</span>
        <strong>{{ titleParts.bold }}</strong>
        <span>{{ titleParts.after }}</span>
      </span>
      <template v-else>{{ card.title }}</template>
    </template>
    <template v-if="card.description" #description>{{ card.description }}</template>
    <template v-if="card.supportingText" #supporting-text>
      <span class="home-card__supporting">
        <CdxIcon v-if="supportingIcon" :icon="supportingIcon" size="small" />
        <span>{{ card.supportingText }}</span>
      </span>
    </template>
  </CdxCard>
</template>

<style scoped>
/*
 * CODEX+ CdxCard: no option to top-align a title-only card.
 * Codex centres title-only cards vertically; a hook reads from the top, so its
 * text (and thumbnail) start at the top edge, even in a row stretched taller.
 */
.home-card--hook.cdx-card--title-only {
  align-items: flex-start;
}

/* CODEX+ CdxCard: no regular-weight title. A hook is a sentence: only its subject is bold. */
.home-card--hook :deep(.cdx-card__text__title) {
  font-weight: var(--font-weight-normal);
}

.home-card--hook :deep(.cdx-card__text__title strong) {
  font-weight: var(--font-weight-bold);
}

.home-card__supporting {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-25);
}

/*
 * CODEX+ No skeleton / loading-placeholder component in Codex.
 * Flat, borderless block at the card's shape. A band of the next neutral step
 * sweeps across it in reading direction, like Codex's indeterminate progress bar
 * (transform only, so it stays on the compositor); the sweep takes 60% of the
 * cycle and the rest is a pause, so it reads as a pulse rather than a belt.
 */
.home-card-skeleton {
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  min-width: 0;
  border-radius: var(--border-radius-base);
  background-color: var(--background-color-neutral-subtle);
}

.home-card-skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: linear-gradient(
    90deg,
    transparent,
    var(--background-color-neutral),
    transparent
  );
  transform: translateX(-100%);
  animation: home-card-skeleton-sweep var(--animation-duration-medium, 1600ms)
    var(--animation-timing-function-base, linear) var(--animation-iteration-count-base, infinite);
}

.home-card-skeleton:dir(rtl)::after {
  animation-direction: reverse;
}

/*
 * Heights match each variant's typical card, so the swap doesn't move the page.
 * Hero: the 16:9 image Codex draws for `block-start`, then the text block.
 */
.home-card-skeleton--hero {
  padding-bottom: 104px;
}

.home-card-skeleton--article,
.home-card-skeleton--hook {
  height: 122px;
}

/* Minerva's narrower column wraps descriptions and hooks onto more lines. */
[data-skin='mobile'] .home-card-skeleton--article {
  height: 129px;
}

[data-skin='mobile'] .home-card-skeleton--hook {
  height: 136px;
}

.home-card-skeleton__image {
  aspect-ratio: 16 / 9;
}

@keyframes home-card-skeleton-sweep {
  60%,
  100% {
    transform: translateX(100%);
  }
}

/* Reduced motion: no travelling band; the block gently breathes instead. */
@media (prefers-reduced-motion: reduce) {
  .home-card-skeleton {
    animation: home-card-skeleton-breathe var(--animation-duration-slow, 2000ms) ease-in-out
      infinite alternate;
  }

  .home-card-skeleton::after {
    content: none;
  }
}

@keyframes home-card-skeleton-breathe {
  to {
    opacity: 0.6;
  }
}
</style>
