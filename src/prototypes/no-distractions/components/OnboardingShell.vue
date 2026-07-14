<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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

/**
 * Rolling counter direction. Only the current digit animates (the " / N" is
 * fixed); advancing rolls it up (new from the bottom), going back rolls it down
 * (new from the top) — mirroring the direction-aware content slide. Self-contained
 * here since the shell owns the counter and already receives `current`.
 */
const counterDir = ref<'up' | 'down'>('up')
watch(
  () => props.current,
  (to, from) => {
    if (to > from) counterDir.value = 'up'
    else if (to < from) counterDir.value = 'down'
  },
)
const counterTransition = computed(() =>
  counterDir.value === 'up' ? 'ob-counter-up' : 'ob-counter-down',
)

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
      <!-- Rolling counter: the " / N" stays fixed and only the current digit
           slides + fades when the step changes (T2). The header stays put. -->
      <span class="onboarding-shell__counter">
        <span class="onboarding-shell__counter-current">
          <Transition :name="counterTransition">
            <span :key="props.current" class="onboarding-shell__counter-digit">{{
              props.current
            }}</span>
          </Transition>
        </span>
        <span class="onboarding-shell__counter-total">&nbsp;/ {{ props.total }}</span>
      </span>
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
  padding: var(--spacing-100, 16px) var(--spacing-100, 16px) var(--spacing-100, 16px)
    var(--spacing-50, 8px);
}

.onboarding-shell__counter {
  display: inline-flex;
  align-items: baseline;
  font-size: var(--font-size-medium, 1rem);
  line-height: var(--line-height-small, 1.375);
  color: var(--color-subtle, #54595d);
}

/* Clipped one-line slot the rolling digit animates within. `position:relative`
   anchors the leaving digit (absolute) so both share the slot; `min-width: 1ch`
   keeps the fixed " / N" from shifting while the slot is briefly empty mid-roll. */
.onboarding-shell__counter-current {
  position: relative;
  display: inline-block;
  min-width: 1ch;
  overflow: hidden;
  text-align: center;
  vertical-align: baseline;
}

.onboarding-shell__counter-digit {
  display: inline-block;
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
