<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconClose, cdxIconPrevious } from '@wikimedia/codex-icons'

import './onboarding-layout.css'

/**
 * Full-height onboarding shell for the personalisation steps: a header with a
 * navigation button and a step counter (e.g. `1 / 3`) at the top, and a
 * scrollable content area. When screens use inline actions (Figma dashpage
 * pattern), they pin CTAs inside `.ob-body`.
 */
interface Props {
  /** Active step (1 = welcome, 2 = survey, 3 = interests). 0 = no step highlighted. */
  current?: number
  /** Total number of steps shown in the counter. */
  total?: number
  /** Hide the progress header entirely (kept for flexibility). */
  showProgress?: boolean
  /** Remove padding from the scrollable content area (full-bleed layouts). */
  flushContent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  current: 0,
  total: 3,
  showProgress: true,
  flushContent: false,
})

const emit = defineEmits<{ dismiss: [] }>()

const router = useRouter()

/** Step 1 shows a close button that dismisses; later steps show a back button. */
const isFirst = computed(() => props.current <= 1)

function onNavigate(): void {
  if (isFirst.value) {
    emit('dismiss')
  } else {
    router.back()
  }
}
</script>

<template>
  <div class="onboarding-shell">
    <div v-if="props.showProgress" class="onboarding-shell__progress">
      <CdxButton
        weight="quiet"
        size="medium"
        :aria-label="isFirst ? 'Close' : 'Go back'"
        @click="onNavigate"
      >
        <CdxIcon :icon="isFirst ? cdxIconClose : cdxIconPrevious" />
      </CdxButton>
      <span class="onboarding-shell__counter">{{ props.current }} / {{ props.total }}</span>
    </div>

    <div
      class="onboarding-shell__content"
      :class="{ 'onboarding-shell__content--flush': props.flushContent }"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.onboarding-shell {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  /* 100vh on iOS Safari uses the largest viewport (toolbar hidden), so the
     shell ends up taller than what's actually visible and the page scrolls.
     100dvh tracks the real visible viewport as the toolbar shows/hides. */
  min-height: 100vh;
  min-height: 100dvh;
  background-color: var(--background-color-base);
}

.onboarding-shell__progress {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-100, 16px) var(--spacing-150, 24px) var(--spacing-100, 16px) var(--spacing-100, 16px);
}

.onboarding-shell__counter {
  font-size: var(--font-size-medium, 1rem);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-subtle, #54595d);
}

.onboarding-shell__content {
  flex: 1 1 auto;
  min-height: 0;
  padding: var(--spacing-75, 12px) var(--spacing-100, 16px) var(--spacing-100, 16px);
}

.onboarding-shell__content--flush {
  display: flex;
  flex-direction: column;
  padding: 0;
}
</style>
