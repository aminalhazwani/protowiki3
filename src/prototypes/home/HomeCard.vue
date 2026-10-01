<script setup lang="ts">
/**
 * One Home card: a thin adapter over Codex `CdxCard`, driven by `HomeCardData`
 * and the module's `variant`. While loading it renders a flat skeleton of the
 * same shape, so the real card replaces it without moving the page.
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { CdxButton, CdxCard, CdxIcon, CdxInfoChip } from '@wikimedia/codex'
import { cdxIconBookmark, cdxIconBookmarkOutline, type Icon } from '@wikimedia/codex-icons'

import type { HomeCardData } from './data/types'
import type { HomeCardVariant } from './modules'
import { useHomeSaved } from './useHomeSaved'

const props = defineProps<{
  variant: HomeCardVariant
  card?: HomeCardData
  loading?: boolean
  supportingIcon?: Icon
  /** Show a save (bookmark) button for the card's page. */
  saveable?: boolean
}>()

const router = useRouter()
const { isSaved, toggleSaved } = useHomeSaved()

const pageTitle = computed(() => props.card?.pageTitle ?? props.card?.title ?? '')
const saved = computed(() => isSaved(pageTitle.value))

/** Off-prototype cards (`card.href`) open in a new tab, via the leave dialog `HomeChrome` shows. */
const href = computed(() => {
  const card = props.card
  if (!card) return undefined
  return card.href ?? (card.to ? router.resolve(card.to).href : undefined)
})
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
  change: {},
  text: {},
  stat: {},
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
  if (!props.card?.to || event.defaultPrevented || event.button !== 0) return
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

  <div
    v-else
    class="home-card"
    :class="[`home-card--${variant}`, { 'home-card--saveable': saveable }]"
  >
    <CdxCard
      class="home-card__card"
      :url="href"
      :thumbnail="thumbnail"
      :icon="card.icon"
      :thumbnail-position="layout.thumbnailPosition"
      :thumbnail-size="layout.thumbnailSize"
      :force-thumbnail="layout.forceThumbnail"
      :target="card.href ? '_blank' : undefined"
      @click="onClick"
    >
      <template #title>
        <!-- CODEX+ CdxCard: no slot above the title, so status chips lead the title slot. -->
        <span v-if="card.chips?.length" class="home-card__chips">
          <CdxInfoChip
            v-for="chip in card.chips"
            :key="chip.label"
            :status="chip.status"
            :icon="chip.icon"
          >
            {{ chip.label }}
          </CdxInfoChip>
        </span>
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
          <span v-if="supportingIcon" class="home-card__supporting-icon">
            <CdxIcon :icon="supportingIcon" size="small" />
          </span>
          <span>{{ card.supportingText }}</span>
        </span>
      </template>
    </CdxCard>

    <!-- A sibling of the card's link, not inside it: a button can't nest in an <a>. -->
    <CdxButton
      v-if="saveable"
      class="home-card__save"
      weight="quiet"
      :aria-label="saved ? 'Saved' : 'Save'"
      :aria-pressed="saved"
      @click="toggleSaved(pageTitle)"
    >
      <CdxIcon :icon="saved ? cdxIconBookmark : cdxIconBookmarkOutline" />
    </CdxButton>
  </div>
</template>

<style scoped>
/*
 * CODEX+ CdxCard: no option to top-align a title-only card.
 * Codex centres title-only cards vertically; a hook reads from the top, so its
 * text (and thumbnail) start at the top edge, even in a row stretched taller.
 */
.home-card--hook .home-card__card.cdx-card--title-only {
  align-items: flex-start;
}

/* CODEX+ CdxCard: no regular-weight title. A hook is a sentence: only its subject is bold. */
.home-card--hook :deep(.cdx-card__text__title) {
  font-weight: var(--font-weight-normal);
}

.home-card--hook :deep(.cdx-card__text__title strong) {
  font-weight: var(--font-weight-bold);
}

.home-card {
  position: relative;
  display: flex;
  min-width: 0;
}

.home-card__card {
  flex: 1 1 auto;
  min-width: 0;
}

/* CODEX+ CdxCard: no action slot, so the save button sits over the card's corner. */
.home-card__save {
  position: absolute;
  top: var(--spacing-50);
  inset-inline-end: var(--spacing-50);
}

/* Keep the text clear of the save button. */
.home-card--saveable :deep(.cdx-card__text) {
  padding-inline-end: calc(var(--min-size-interactive-pointer, 32px) + var(--spacing-25));
}

/* Chips sit on their own row above the title, in regular weight. */
.home-card__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-25);
  margin-bottom: var(--spacing-50);
  font-weight: var(--font-weight-normal);
}

/* When the label wraps, the icon stays with its first line. */
.home-card__supporting {
  display: inline-flex;
  align-items: flex-start;
  gap: var(--spacing-25);
}

/* One line box tall, so the icon centres on the first line of text. */
.home-card__supporting-icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  height: 1lh;
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

/* A change card: chip row, title, one-line summary, editor (measured 139 on both skins). */
.home-card-skeleton--change {
  height: 139px;
}

/* A text card: title, one-line description, supporting line. */
.home-card-skeleton--text {
  height: 107px;
}

/* A stat card: number and label beside an icon. */
.home-card-skeleton--stat {
  height: 74px;
}

/* Minerva's half-width stats wrap their labels; the full-width first one doesn't. */
[data-skin='mobile'] .home-card-skeleton--stat:not(:first-child) {
  height: 96px;
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
