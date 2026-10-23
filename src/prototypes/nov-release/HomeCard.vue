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
  /** Supporting text (and its icon) in progressive blue (Suggested edits). */
  supportingProgressive?: boolean
  /** Show a save (bookmark) button for the card's page. */
  saveable?: boolean
  /** A row of a divider list (a module page) rather than an outlined card. */
  divider?: boolean
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

/** Variants that always show a thumbnail, so their skeleton holds its box too (hooks only sometimes do). */
const SKELETON_THUMBNAIL = new Set<HomeCardVariant>(['hero', 'article'])

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
    <div v-if="SKELETON_THUMBNAIL.has(variant)" class="home-card-skeleton__image" />
  </div>

  <div
    v-else
    class="home-card"
    :class="[
      `home-card--${variant}`,
      {
        'home-card--saveable': saveable,
        'home-card--supported': card.supportingText || card.supportingTime,
        'home-card--timed': card.supportingTime,
        'home-card--progressive': supportingProgressive,
      },
    ]"
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
      :separation="divider ? 'divider' : undefined"
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
        <span v-if="card.titleDescription" class="home-card__title-description">
          {{ card.titleDescription }}
        </span>
      </template>
      <template v-if="card.description" #description>{{ card.description }}</template>
      <template v-if="card.supportingText || card.supportingTime" #supporting-text>
        <span class="home-card__supporting">
          <span v-if="supportingIcon" class="home-card__supporting-icon">
            <CdxIcon :icon="supportingIcon" size="small" />
          </span>
          <span>{{ card.supportingText }}</span>
          <span v-if="card.supportingTime" class="home-card__time">{{ card.supportingTime }}</span>
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

/* CODEX+ CdxCard: one description slot. A change card's article description goes under its title. */
.home-card__title-description {
  display: block;
  font-weight: var(--font-weight-normal);
  color: var(--color-subtle);
}

/* A change card's description is the edit summary: the editor's own words, in base colour. */
.home-card--change :deep(.cdx-card__text__description) {
  color: var(--color-base);
  font-style: italic;
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

/*
 * CODEX+ CdxCard: no option to pin the supporting text to the bottom. The text
 * block fills the card's height and the supporting line sits on its bottom edge,
 * so beside a taller neighbour every card's supporting line lines up.
 */
.home-card--supported :deep(.cdx-card__text) {
  flex-grow: 1;
  align-self: stretch;
}

.home-card--supported :deep(.cdx-card__text__supporting-text) {
  margin-top: auto;
  padding-top: var(--spacing-50);
}

/*
 * CODEX+ CdxCard: no slot for a timestamp. A timed card's supporting line runs
 * the full width with the time at its far end, so it lands in the bottom corner (home2).
 */
.home-card--timed .home-card__supporting {
  display: flex;
}

/* CODEX+ CdxCard: no progressive supporting text. A suggestion's task reads as a call to action. */
.home-card--progressive :deep(.cdx-card__text__supporting-text) {
  color: var(--color-progressive);
}

.home-card--progressive .home-card__supporting-icon .cdx-icon {
  color: var(--color-progressive);
}

/* On the label's last line when the label wraps (the icon stays with its first). */
.home-card__time {
  flex-shrink: 0;
  align-self: flex-end;
  margin-inline-start: auto;
  /* With the row's 4px gap: 12px clear of the label, as on home2. */
  padding-inline-start: var(--spacing-50);
  white-space: nowrap;
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
 * The card's own outline, empty, with an outlined box where its thumbnail goes
 * (only on variants that always have one). No fill and no motion.
 */
.home-card-skeleton {
  box-sizing: border-box;
  min-width: 0;
  padding: var(--spacing-75);
  border: var(--border-width-base) var(--border-style-base) var(--border-color-base);
  border-radius: var(--border-radius-base);
  background-color: var(--background-color-base);
}

/* Codex's large thumbnail: 96px, in the thumbnail's subtle outline. */
.home-card-skeleton__image {
  box-sizing: border-box;
  width: var(--size-600);
  height: var(--size-600);
  border: var(--border-width-base) var(--border-style-base) var(--border-color-subtle);
  border-radius: var(--border-radius-base);
}

/*
 * Heights match each variant's typical card, so the swap doesn't move the page.
 * Hero: the full-width 16:9 image Codex draws for `block-start`, then the text block.
 */
.home-card-skeleton--hero {
  padding-bottom: 80px;
}

.home-card-skeleton--hero .home-card-skeleton__image {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  margin-bottom: var(--spacing-75);
}

.home-card-skeleton--article,
.home-card-skeleton--hook {
  height: 122px;
}

/* A change card: chip row, title, article description, one-line summary, editor (measured 158). */
.home-card-skeleton--change {
  height: 158px;
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
</style>
