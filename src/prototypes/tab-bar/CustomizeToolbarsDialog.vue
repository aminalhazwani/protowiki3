<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { CdxButton, CdxDialog, CdxIcon, CdxSelect, CdxTextInput } from '@wikimedia/codex'
import type { MenuItemData } from '@wikimedia/codex'
import { cdxIconExpand, cdxIconHome } from '@wikimedia/codex-icons'

import { useConfig } from '@/composables/useConfig'
import ArticleToolbarRow from './ArticleToolbarRow.vue'
import GlobalToolbarRow from './GlobalToolbarRow.vue'
import { applyToolbarState, cloneToolbarState, toolbarStore } from './toolbarStore'
import type { ToolbarState } from './toolbarStore'
import { useRowDrag } from './useRowDrag'
import './toolbarRow.css'

interface Props {
  open: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [open: boolean]
}>()

const { lang } = useConfig()

const HOME_MENU_ITEMS: MenuItemData[] = [{ value: 'home', label: 'Home', icon: cdxIconHome }]

// The dialog edits a deep clone; Done copies it into the store, every other close discards it.
const draft = ref<ToolbarState>(cloneToolbarState(toolbarStore))

const focusStart = ref<HTMLElement | null>(null)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    draft.value = cloneToolbarState(toolbarStore)
    // Codex focuses the first focusable body element after its own nextTick; move focus
    // to the invisible holder right after so no grip button shows a focus ring on open.
    void nextTick(() => {
      setTimeout(() => focusStart.value?.focus({ preventScroll: true }), 0)
    })
  },
)

const globalListEl = ref<HTMLElement | null>(null)
const articleListEl = ref<HTMLElement | null>(null)

function moveWithin<T>(list: T[], from: number, to: number): void {
  const [row] = list.splice(from, 1)
  list.splice(to, 0, row)
}

const {
  dragging: globalDragging,
  onGripPointerDown: onGlobalGripPointerDown,
  onGripKeydown: onGlobalGripKeydown,
} = useRowDrag(globalListEl, (from, to) => moveWithin(draft.value.global, from, to))

const {
  dragging: articleDragging,
  onGripPointerDown: onArticleGripPointerDown,
  onGripKeydown: onArticleGripKeydown,
} = useRowDrag(articleListEl, (from, to) => moveWithin(draft.value.article, from, to))

/** Clear empties the row and moves it to the bottom of its section. */
function clearGlobal(index: number): void {
  const [row] = draft.value.global.splice(index, 1)
  row.icon = null
  row.destination = ''
  draft.value.global.push(row)
}

function clearArticle(index: number): void {
  const [row] = draft.value.article.splice(index, 1)
  row.feature = null
  draft.value.article.push(row)
}

function close(): void {
  emit('update:open', false)
}

function onDone(): void {
  applyToolbarState(draft.value)
  close()
}
</script>

<template>
  <CdxDialog
    :open="open"
    title="Customize Toolbars"
    subtitle="Drag to rearrange"
    use-close-button
    close-button-label="Close"
    stacked-actions
    :primary-action="{ label: 'Done', actionType: 'progressive' }"
    :default-action="{ label: 'Cancel' }"
    class="customize-toolbars"
    @update:open="emit('update:open', $event)"
    @primary="onDone"
    @default="close"
  >
    <div
      ref="focusStart"
      class="customize-toolbars__focus-start cdx-dialog-focus-trap"
      tabindex="-1"
    />

    <section class="customize-toolbars__section">
      <h3 class="customize-toolbars__heading">Global toolbar</h3>

      <div class="toolbar-row toolbar-row--global toolbar-row--header" aria-hidden="true">
        <span class="toolbar-row__spacer" />
        <span>Icon</span>
        <span>Destination</span>
        <span class="toolbar-row__spacer" />
      </div>

      <!-- Home is fixed: no grip, no clear, disabled controls. -->
      <div class="toolbar-row toolbar-row--global">
        <span class="toolbar-row__spacer" />
        <CdxButton class="toolbar-row__icon-button" disabled aria-label="Icon: Home">
          <CdxIcon :icon="cdxIconHome" />
          <CdxIcon :icon="cdxIconExpand" size="small" />
        </CdxButton>
        <CdxTextInput model-value="Special:Home" disabled aria-label="Home destination" />
        <span class="toolbar-row__spacer" />
      </div>

      <div ref="globalListEl" class="customize-toolbars__list">
        <GlobalToolbarRow
          v-for="(row, index) in draft.global"
          :key="row.id"
          :row="row"
          :lang="lang"
          :dragging="globalDragging === index"
          @update:icon="row.icon = $event"
          @update:destination="row.destination = $event"
          @clear="clearGlobal(index)"
          @grip-pointerdown="onGlobalGripPointerDown($event, index)"
          @grip-keydown="onGlobalGripKeydown($event, index)"
        />
      </div>
    </section>

    <section class="customize-toolbars__section">
      <h3 class="customize-toolbars__heading">Article toolbar</h3>

      <div class="toolbar-row toolbar-row--article">
        <span class="toolbar-row__spacer" />
        <CdxSelect
          class="toolbar-row__select"
          selected="home"
          :menu-items="HOME_MENU_ITEMS"
          disabled
          aria-label="Home"
        />
        <span class="toolbar-row__spacer" />
      </div>

      <div ref="articleListEl" class="customize-toolbars__list">
        <ArticleToolbarRow
          v-for="(row, index) in draft.article"
          :key="row.id"
          :row="row"
          :dragging="articleDragging === index"
          @update:feature="row.feature = $event"
          @clear="clearArticle(index)"
          @grip-pointerdown="onArticleGripPointerDown($event, index)"
          @grip-keydown="onArticleGripKeydown($event, index)"
        />
      </div>
    </section>
  </CdxDialog>
</template>

<style scoped>
.customize-toolbars__focus-start {
  outline: none;
}

.customize-toolbars__section + .customize-toolbars__section {
  margin-top: var(--spacing-125, 20px);
}

.customize-toolbars__heading {
  margin: 0 0 var(--spacing-25, 4px);
  padding: 0;
  border: 0;
  font-family: inherit;
  font-size: var(--font-size-large, 1.125rem);
  font-weight: 700;
  line-height: var(--line-height-small, 1.4);
}

/* Rows as grid items so the dragged row's z-index applies without positioning. */
.customize-toolbars__list {
  display: grid;
}
</style>
