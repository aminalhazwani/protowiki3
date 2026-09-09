<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { CdxButton, CdxDialog, CdxIcon } from '@wikimedia/codex'
import { cdxIconClose } from '@wikimedia/codex-icons'

interface Props {
  title: string
  closeLabel?: string
}

withDefaults(defineProps<Props>(), {
  closeLabel: 'Close',
})

const emit = defineEmits<{ close: [] }>()

const shellEl = ref<HTMLElement | null>(null)
const bodyScrolls = ref(false)
let resizeObserver: ResizeObserver | null = null

function measureScroll(): void {
  const body = shellEl.value?.querySelector<HTMLElement>('.cdx-dialog__body')
  if (!body) return
  bodyScrolls.value = body.scrollHeight - body.clientHeight > 1
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.scrollTo(0, 0)
  }

  const body = shellEl.value?.querySelector<HTMLElement>('.cdx-dialog__body')
  measureScroll()
  resizeObserver = new ResizeObserver(() => measureScroll())
  if (body) {
    resizeObserver.observe(body)
    if (body.firstElementChild) resizeObserver.observe(body.firstElementChild)
  }
})

onBeforeUnmount(() => resizeObserver?.disconnect())

function onDialogClose(open: boolean): void {
  if (!open) emit('close')
}
</script>

<template>
  <div
    ref="shellEl"
    class="wikita-lite-fullscreen-dialog-shell"
    :class="{ 'wikita-lite-fullscreen-dialog-shell--scrolls': bodyScrolls }"
  >
    <CdxDialog
      :open="true"
      :fixed-height="true"
      render-in-place
      :title="title"
      @update:open="onDialogClose"
    >
      <template #header>
        <div class="wikita-lite-fullscreen-dialog-shell__header">
          <h3 class="wikita-lite-fullscreen-dialog-shell__title">{{ title }}</h3>
          <CdxButton
            class="wikita-lite-fullscreen-dialog-shell__close"
            weight="quiet"
            :icon-only="true"
            :aria-label="closeLabel"
            @click="emit('close')"
          >
            <CdxIcon :icon="cdxIconClose" />
          </CdxButton>
        </div>
      </template>

      <slot />
    </CdxDialog>
  </div>
</template>

<style scoped>
.wikita-lite-fullscreen-dialog-shell {
  /* Pin to the visible viewport — relative + min-height sits in document flow and
     ends up off-screen when Home was scrolled before opening configure. */
  position: fixed;
  inset: 0;
  z-index: var(--z-index-overlay, 450);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-height: 100vh;
  min-height: 100dvh;
  background-color: var(--background-color-base);
}

@media (min-width: 480px) {
  .wikita-lite-fullscreen-dialog-shell {
    inset-inline: 0;
    margin-inline: auto;
    width: min(100%, var(--mobile-wrapper-max-width, 412px));
  }
}

.wikita-lite-fullscreen-dialog-shell :deep(.cdx-dialog-backdrop) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.wikita-lite-fullscreen-dialog-shell :deep(.cdx-dialog) {
  width: calc(100% - 2rem);
  max-width: none;
}

.wikita-lite-fullscreen-dialog-shell :deep(.cdx-dialog--fixed-height) {
  height: calc(100% - 2rem);
}

.wikita-lite-fullscreen-dialog-shell :deep(.cdx-dialog__body) {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 0;
  overflow-y: auto;
}

.wikita-lite-fullscreen-dialog-shell--scrolls :deep(.cdx-dialog__header) {
  border-bottom: var(--border-width-base, 1px) solid var(--border-color-muted, #c8ccd1);
}

.wikita-lite-fullscreen-dialog-shell__header {
  display: flex;
  flex: 1;
  align-items: flex-start;
  gap: var(--spacing-100, 16px);
}

.wikita-lite-fullscreen-dialog-shell__title {
  flex: 1;
  min-width: 0;
  margin: 0;
}

.wikita-lite-fullscreen-dialog-shell__close {
  flex-shrink: 0;
  width: 2rem;
  margin-inline-end: -8px;
}
</style>
