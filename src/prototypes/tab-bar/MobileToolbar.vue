<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CdxButton, CdxIcon, CdxMenuButton } from '@wikimedia/codex'
import type { MenuItemValue } from '@wikimedia/codex'

import { globalSkin, PROTOWIKI_CHROME_SKIN } from '@/theme'
import type { ToolbarItem } from './toolbarItems'

interface Props {
  items: ToolbarItem[]
}

defineProps<Props>()

const router = useRouter()

// Mobile only. Reads the wrapper's skin so a local `skin` override is honoured.
const inheritedSkin = inject(PROTOWIKI_CHROME_SKIN, null)
const isMobile = computed(() => (inheritedSkin?.value ?? globalSkin.value) === 'mobile')

// Menu items are static in this iteration: picking one just closes the menu.
const menuSelection = ref<MenuItemValue | null>(null)

function onMenuSelected(): void {
  menuSelection.value = null
}

function onClick(item: ToolbarItem): void {
  if (item.to && !item.selected) router.push(item.to)
}

function showHomeDot(item: ToolbarItem): boolean {
  return item.id === 'home' && !item.selected
}
</script>

<template>
  <!-- In-flow spacer reserving the bar's height so the footer is never covered. -->
  <div v-if="isMobile" class="mobile-toolbar">
    <nav class="mobile-toolbar__bar" aria-label="Toolbar">
      <template v-for="item in items" :key="item.id">
        <CdxMenuButton
          v-if="item.menuItems"
          v-model:selected="menuSelection"
          class="mobile-toolbar__item mobile-toolbar__item--menu"
          weight="quiet"
          :menu-items="item.menuItems"
          :disabled="item.disabled"
          :aria-label="item.label"
          @update:selected="onMenuSelected"
        >
          <span class="mobile-toolbar__glyph">
            <CdxIcon :icon="item.icon" />
          </span>
        </CdxMenuButton>

        <CdxButton
          v-else
          class="mobile-toolbar__item"
          :class="{ 'mobile-toolbar__item--selected': item.selected }"
          weight="quiet"
          :action="item.selected ? 'progressive' : 'default'"
          :aria-label="item.label"
          :aria-current="item.selected ? 'page' : undefined"
          :disabled="item.disabled"
          @click="onClick(item)"
        >
          <span class="mobile-toolbar__glyph">
            <CdxIcon :icon="item.icon" />
            <span v-if="item.badge" class="mobile-toolbar__badge" aria-hidden="true">
              {{ item.badge }}
            </span>
            <span v-if="showHomeDot(item)" class="mobile-toolbar__dot" aria-hidden="true" />
          </span>
          <span v-if="item.text" class="mobile-toolbar__text">{{ item.text }}</span>
        </CdxButton>
      </template>
    </nav>
  </div>
</template>

<style scoped>
.mobile-toolbar {
  height: 56px;
  flex-shrink: 0;
}

.mobile-toolbar__bar {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: var(--z-index-fixed, 200);
  display: flex;
  box-sizing: border-box;
  height: 56px;
  border-top: 1px solid var(--border-color-subtle, #c8ccd1);
  background-color: var(--background-color-base, #fff);
}

/* The menu item is a wrapper div around its own button; give it the same flex share. */
.mobile-toolbar__item--menu.cdx-menu-button {
  display: flex;
  flex: 1 1 0;
  min-width: 0;
}

/* Codex root-class override only: square, full-height, equal-width items. */
.mobile-toolbar__item.cdx-button,
.mobile-toolbar__item--menu :deep(> .cdx-button) {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  max-width: none;
  height: 100%;
  min-height: 0;
  padding: 0 0 var(--spacing-30, 6px) 0;
  border: 0;
  border-radius: 0;
}

/* Selected indicator as a pseudo-element: immune to Codex focus/hover border rules, no layout shift. */
.mobile-toolbar__item--selected.cdx-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: var(--border-width-thick, 2px);
  background-color: var(--color-progressive, #36c);
}

.mobile-toolbar__glyph {
  position: relative;
  display: inline-flex;
}

.mobile-toolbar__text {
  font-size: var(--font-size-small, 0.875rem);
}

.mobile-toolbar__badge {
  position: absolute;
  right: -8px;
  bottom: -6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: 16px;
  height: 16px;
  padding: 0 3px;
  border-radius: var(--border-radius-base, 2px);
  background-color: var(--background-color-progressive, #36c);
  color: var(--color-inverted, #fff);
  font-size: var(--font-size-x-small, 0.75rem);
  font-weight: 700;
  line-height: 1;
}

.mobile-toolbar__dot {
  position: absolute;
  top: calc(100% + var(--spacing-30, 6px));
  left: 50%;
  width: 5px;
  height: 5px;
  margin-left: -2.5px;
  border-radius: 50%;
  background-color: var(--color-progressive, #36c);
}
</style>
