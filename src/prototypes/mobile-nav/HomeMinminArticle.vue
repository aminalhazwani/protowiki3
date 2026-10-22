<script setup lang="ts">
/**
 * Minmin's article top, in place of Minerva's header: the title with edit and
 * "more" buttons, a row of small buttons (placeholder numbers, the same on
 * every article), and a carousel of the article's own images. Once the body is
 * in (`root`), it also closes the article up: the lead fades out after ~10
 * lines behind "Read more", and every section starts closed.
 */
import { computed, ref, watch } from 'vue'
import { CdxButton, CdxIcon, CdxMenuButton } from '@wikimedia/codex'
import type { MenuButtonItemData, MenuItemValue } from '@wikimedia/codex'
import {
  cdxIconBookmarkOutline,
  cdxIconEdit,
  cdxIconVerticalEllipsis,
  cdxIconEyeClosed,
  cdxIconLanguage,
  cdxIconLightbulb,
  cdxIconSpeechBubbles,
  cdxIconStar,
  cdxIconVolumeUp,
} from '@wikimedia/codex-icons'

interface Props {
  title: string
  /** The rendered body (`ArticleLive`'s `parserReady`); `null` while it loads. */
  root: HTMLElement | null
  saved?: boolean
}

const props = withDefaults(defineProps<Props>(), { saved: false })

const emit = defineEmits<{
  saveClick: []
  /** The body is closed up — safe to scroll to a `#fragment`. */
  bodyReady: []
}>()

const displayTitle = computed(() => props.title.replace(/_/g, ' '))

/* Placeholders: the same on every article. They don't lead anywhere yet. */
const CHIPS = [
  { icon: cdxIconLanguage, label: '68 languages' },
  { icon: cdxIconSpeechBubbles, label: '25 discussions' },
  { icon: cdxIconStar, label: 'Good article' },
  { icon: cdxIconVolumeUp, label: '12:35' },
  { icon: cdxIconBookmarkOutline, label: '52 saves' },
  { icon: cdxIconLightbulb, label: '10 suggestions' },
]

const menuItems = computed<MenuButtonItemData[]>(() => [
  { value: 'save', label: props.saved ? 'Remove from saved' : 'Save' },
  { value: 'history', label: 'View history' },
  { value: 'talk', label: 'Talk' },
])
const menuSelection = ref<MenuItemValue | null>(null)
watch(menuSelection, (value) => {
  if (value === null) return
  if (value === 'save') emit('saveClick')
  menuSelection.value = null
})

interface CarouselImage {
  src: string
  srcset: string
  caption: string
}

/* Content images only: not icons, flags, maps' furniture or navboxes. */
const MIN_IMAGE_SIZE = 100
const NOT_CONTENT = '.noviewer, .navbox, .metadata, .ambox, .sistersitebox, .mw-kartographer-map'

function collectImages(root: HTMLElement): CarouselImage[] {
  const seen = new Set<string>()
  const images: CarouselImage[] = []
  root.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    const width = Number(img.getAttribute('width'))
    const height = Number(img.getAttribute('height'))
    if (width < MIN_IMAGE_SIZE || height < MIN_IMAGE_SIZE) return
    if (img.closest(NOT_CONTENT)) return
    const resource = img.getAttribute('resource') ?? img.src
    if (seen.has(resource)) return
    seen.add(resource)
    images.push({ src: img.src, srcset: img.srcset, caption: captionOf(img) })
  })
  return images
}

/** A thumbnail's caption, an infobox image's caption row, or its alt text. */
function captionOf(img: HTMLImageElement): string {
  const figcaption = img.closest('figure')?.querySelector('figcaption')
  const infoboxCaption = img.closest('td')?.querySelector('.infobox-caption')
  return (figcaption ?? infoboxCaption)?.textContent?.trim() || img.alt.trim()
}

const images = ref<CarouselImage[]>([])
/** "Hide": this article only, until it's opened again. */
const imagesHidden = ref(false)

const LEAD_COLLAPSED = 'home-minmin-lead--collapsed'
const lead = ref<HTMLElement | null>(null)
/** Where "Read more" goes: right after the lead, inside the body. */
const readMoreTarget = ref<HTMLElement | null>(null)

/** Fade the lead out after ~10 lines, its infobox and other extras hidden too. */
function collapseLead(root: HTMLElement): void {
  const section = root.querySelector<HTMLElement>('section[data-mw-section-id="0"]')
  if (!section) return
  const hasExtras = [...section.children].some(
    (el) => el.tagName !== 'P' && (el as HTMLElement).offsetHeight > 0,
  )
  section.classList.add(LEAD_COLLAPSED)
  if (!hasExtras && section.scrollHeight <= section.clientHeight) {
    section.classList.remove(LEAD_COLLAPSED)
    return
  }
  const target = document.createElement('div')
  target.className = 'home-minmin-read-more'
  section.after(target)
  lead.value = section
  readMoreTarget.value = target
}

function readMore(): void {
  lead.value?.classList.remove(LEAD_COLLAPSED)
  const target = readMoreTarget.value
  readMoreTarget.value = null
  target?.remove()
}

/* PROTOWIKI+ (mobile-nav) ArticleRenderer: web sections start open, with no prop to close them — click each heading. */
function collapseSections(root: HTMLElement): void {
  root
    .querySelectorAll<HTMLElement>('.protowiki-mobile-h2[aria-expanded="true"]')
    .forEach((h2) => h2.click())
}

watch(
  () => props.root,
  (root) => {
    if (!root) return
    // After ArticleRenderer's own pass over the body, which also waits a tick.
    setTimeout(() => {
      images.value = collectImages(root)
      collapseSections(root)
      collapseLead(root)
      emit('bodyReady')
    })
  },
  { immediate: true },
)
</script>

<template>
  <div class="home-minmin-article">
    <div class="home-minmin-article__title-row">
      <h1 class="home-minmin-article__title">{{ displayTitle }}</h1>
      <CdxButton weight="quiet" aria-label="Edit">
        <CdxIcon :icon="cdxIconEdit" />
      </CdxButton>
      <CdxMenuButton
        v-model:selected="menuSelection"
        :menu-items="menuItems"
        aria-label="More options"
      >
        <CdxIcon :icon="cdxIconVerticalEllipsis" />
      </CdxMenuButton>
    </div>

    <div class="home-minmin-article__chips">
      <CdxButton
        v-for="chip in CHIPS"
        :key="chip.label"
        class="home-minmin-article__chip"
        size="small"
        weight="quiet"
        action="progressive"
      >
        <CdxIcon :icon="chip.icon" size="small" />
        {{ chip.label }}
      </CdxButton>
    </div>

    <div v-if="images.length && !imagesHidden" class="home-minmin-article__carousel">
      <ul class="home-minmin-article__track">
        <li v-for="image in images" :key="image.src" class="home-minmin-article__card">
          <img
            class="home-minmin-article__image"
            :src="image.src"
            :srcset="image.srcset || undefined"
            :alt="image.caption"
            loading="lazy"
          />
          <p v-if="image.caption" class="home-minmin-article__caption">{{ image.caption }}</p>
        </li>
      </ul>
      <CdxButton class="home-minmin-article__hide" size="small" @click="imagesHidden = true">
        <CdxIcon :icon="cdxIconEyeClosed" size="small" />
        Hide
      </CdxButton>
    </div>

    <Teleport v-if="readMoreTarget" :to="readMoreTarget">
      <span class="home-minmin-article__read-more">
        <CdxButton weight="quiet" action="progressive" @click="readMore">Read more</CdxButton>
      </span>
    </Teleport>
  </div>
</template>

<style scoped>
.home-minmin-article {
  padding: var(--spacing-100) var(--spacing-100) 0;
  background-color: var(--background-color-base);
}

.home-minmin-article__title-row {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-25);
}

/* The buttons sit level with the title's first line (1.7rem at 1.375), however many lines it wraps to. */
.home-minmin-article__title-row > :not(.home-minmin-article__title) {
  flex-shrink: 0;
  margin-top: calc((1.7rem * 1.375 - var(--min-size-interactive-pointer)) / 2);
}

.home-minmin-article__title {
  flex: 1;
  min-width: 0;
  margin: 0;
  border: 0;
  padding: 0;
  font-family: var(--font-family-serif);
  font-size: 1.7rem;
  font-weight: var(--font-weight-normal);
  /* Unitless: the Codex token is a fixed 1.43rem, shorter than this 1.7rem type. */
  line-height: 1.375;
  color: var(--color-emphasized);
}

/* CODEX+ CdxMenuButton: an inline-block root adds a line box's descender under the 32px button. */
.home-minmin-article__title-row :deep(.cdx-menu-button) {
  display: flex;
}

.home-minmin-article__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-50);
  margin-top: var(--spacing-75);
}

/* CODEX+ CdxButton: no tinted (filled, subtle) progressive weight — quiet progressive on a subtle fill, in regular small text. */
.home-minmin-article__chip.cdx-button {
  background-color: var(--background-color-progressive-subtle);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-small);
}

.home-minmin-article__carousel {
  position: relative;
  /* Bleeds off the end edge, so the next card peeks in. */
  margin: var(--spacing-100) calc(-1 * var(--spacing-100)) 0 0;
  background-color: var(--background-color-interactive-subtle);
}

.home-minmin-article__track {
  display: flex;
  gap: var(--spacing-50);
  margin: 0;
  padding: var(--spacing-25) var(--spacing-100) var(--spacing-25) var(--spacing-25);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  list-style: none;
}

.home-minmin-article__card {
  flex: 0 0 176px;
  margin: 0;
  border: var(--border-width-base) var(--border-style-base) var(--border-color-subtle);
  border-radius: var(--border-radius-base);
  overflow: hidden;
  background-color: var(--background-color-base);
  scroll-snap-align: start;
}

.home-minmin-article__image {
  display: block;
  width: 100%;
  height: 132px;
  object-fit: cover;
}

.home-minmin-article__caption {
  display: -webkit-box;
  /* Margin, not padding: overflow clips at the padding edge, so padding would show a third line. */
  margin: var(--spacing-50) var(--spacing-75);
  overflow: hidden;
  font-size: var(--font-size-small);
  line-height: var(--line-height-small);
  color: var(--color-base);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.home-minmin-article__hide {
  position: absolute;
  inset-block-start: var(--spacing-50);
  inset-inline-end: var(--spacing-100);
}

/*
 * CODEX+ CdxButton: quiet hover blends (multiply) with what's behind it — here
 * the lead's fade — so hovered or pressed it sits on an opaque backdrop, and
 * Codex's own colour shows. At rest it stays see-through over the fade.
 */
.home-minmin-article__read-more {
  display: inline-flex;
  isolation: isolate;
  border-radius: var(--border-radius-base);
}

.home-minmin-article__read-more:hover,
.home-minmin-article__read-more:active {
  background-color: var(--background-color-base);
}
</style>

<style>
/* The body is parser HTML, outside this component's scope. */
.mw-parser-output .home-minmin-lead--collapsed {
  max-height: 10lh;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, #000 calc(100% - 3lh), transparent);
}

/* Outranks the mobile skin's own figure / table display rules. */
[data-skin='mobile'] .mw-parser-output section.home-minmin-lead--collapsed > :not(p) {
  display: none;
}

/*
 * "Read more" rides up over the lead's fade; a full-bleed divider under it,
 * out through the article's 16px gutter.
 */
.mw-parser-output .home-minmin-read-more {
  position: relative;
  display: flex;
  justify-content: center;
  margin: calc(-1 * var(--spacing-75)) calc(-1 * var(--spacing-100)) 0;
  padding-bottom: var(--spacing-75);
  border-bottom: var(--border-width-base) var(--border-style-base) var(--border-color-subtle);
}
</style>
