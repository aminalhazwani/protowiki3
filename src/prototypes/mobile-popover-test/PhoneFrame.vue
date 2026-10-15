<script setup lang="ts">
/**
 * Real narrow viewport on a desktop window.
 *
 * Codex picks bottom-sheet vs floating from `window.innerWidth` — see
 * `useBreakpoint` in `@wikimedia/codex` (mobile is `<= 639px`) — and both
 * `CdxPopover` and `CdxDialog` teleport to `<body>`. So `useBottomSheet` and
 * dialog width can't be forced from the outside: a CSS column around the page
 * isn't what those components measure.
 *
 * This wrapper reloads the current URL inside a 412px-wide iframe, which makes
 * the inner `window` genuinely phone-sized: bottom sheets engage, dialogs clamp
 * to the frame, `100dvh` resolves against it, and media queries match.
 *
 * Inside the iframe `window.self !== window.top`, so the nested instance
 * renders its slot instead of framing again.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

interface Props {
  /** Frame width. **412px** matches **`MobileWrapper`**'s phone column. */
  width?: number
  /** Frame height. Clamped to the window, so it shrinks on short screens. */
  height?: number
  /** At or above this outer width, frame the page; below it, render in place. */
  frameFrom?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 412,
  height: 916,
  frameFrom: 640,
})

// Synchronous, not in onMounted: a wrong first render would mount the whole
// page (and its data fetches) once before swapping it for the iframe.
const isTopWindow = typeof window !== 'undefined' && window.self === window.top
const isWide = ref(typeof window !== 'undefined' && window.innerWidth >= props.frameFrom)

let mql: MediaQueryList | null = null
function onViewportChange(event: MediaQueryListEvent): void {
  isWide.value = event.matches
}

onMounted(() => {
  if (!isTopWindow || !window.matchMedia) return
  mql = window.matchMedia(`(min-width: ${props.frameFrom}px)`)
  isWide.value = mql.matches
  mql.addEventListener('change', onViewportChange)
})

onBeforeUnmount(() => {
  mql?.removeEventListener('change', onViewportChange)
  mql = null
})

const framed = computed(() => isTopWindow && isWide.value)
// Read once: the iframe must not reload when the inner app changes its own URL.
const src = typeof window !== 'undefined' ? window.location.href : ''
</script>

<template>
  <div v-if="framed" class="phone-frame">
    <iframe
      :src="src"
      class="phone-frame__viewport"
      :style="{
        '--phone-frame-width': `${props.width}px`,
        '--phone-frame-height': `${props.height}px`,
      }"
      title="Phone preview"
    />
  </div>
  <slot v-else />
</template>

<style scoped>
.phone-frame {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: 100vh;
  min-height: 100dvh;
  padding: var(--spacing-100, 16px);
  background-color: var(--background-color-neutral, #eaecf0);
}

.phone-frame__viewport {
  width: var(--phone-frame-width, 412px);
  /* Shrink on short windows rather than overflowing the frame. */
  height: min(var(--phone-frame-height, 916px), calc(100dvh - 2 * var(--spacing-100, 16px)));
  background-color: var(--background-color-base, #fff);
  border: var(--border-width-base, 1px) solid var(--border-color-base, #a2a9b1);
  border-radius: var(--border-radius-base, 2px);
  box-shadow: var(--box-shadow-drop-medium, 0 2px 2px rgba(0, 0, 0, 0.2));
}
</style>
