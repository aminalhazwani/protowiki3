<script setup lang="ts">
/**
 * Onboarding step 1 (home2): "Welcome to Wikipedia, {name}!" over the globe
 * mascot, which plays once (tap to replay).
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { useConfig } from '@/composables/useConfig'

const GLOBE = `${import.meta.env.BASE_URL}images/home-onboarding-globe.gif`
/** The globe's first frame (`gifsicle --unoptimize globe.gif '#0'`); regenerate with the GIF. */
const POSTER = `${import.meta.env.BASE_URL}images/home-onboarding-globe-poster.gif`

/**
 * Held on the first frame this long before playing: the browser's "save your
 * password" prompt can cover the screen right after account creation, and the
 * one-shot animation shouldn't play behind it.
 */
const START_DELAY_MS = 1000

const { displayName } = useConfig()

const src = ref(POSTER)
const canAnimate = ref(false)

/*
 * A GIF only restarts when the <img> gets a URL it hasn't decoded, so the file
 * is fetched once (during the hold) and each play mints a fresh object URL —
 * the first play and every replay, without re-downloading it. If the fetch
 * fails, a cache-busted URL still restarts it.
 */
let gif: Promise<Blob | null> = Promise.resolve(null)
let objectUrl: string | null = null
let timer: ReturnType<typeof setTimeout> | undefined
let disposed = false

async function play(): Promise<void> {
  const blob = await gif
  if (disposed) return
  const previous = objectUrl
  objectUrl = blob ? URL.createObjectURL(blob) : null
  src.value = objectUrl ?? `${GLOBE}?t=${Date.now()}`
  if (previous) URL.revokeObjectURL(previous)
}

function replay(): void {
  clearTimeout(timer)
  void play()
}

onMounted(() => {
  // With reduced motion the poster is the final state: no fetch, no timer, no replay.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  canAnimate.value = true
  gif = fetch(GLOBE)
    .then((response) => (response.ok ? response.blob() : null))
    .catch(() => null)
  timer = setTimeout(() => void play(), START_DELAY_MS)
})

onBeforeUnmount(() => {
  disposed = true
  clearTimeout(timer)
  if (objectUrl) URL.revokeObjectURL(objectUrl)
})
</script>

<template>
  <div class="home-onboarding-welcome">
    <h1 class="home-onboarding-welcome__title home-onboarding-welcome__rise">
      Welcome to Wikipedia, {{ displayName }}!
    </h1>
    <div class="home-onboarding-welcome__globe home-onboarding-welcome__pop">
      <button
        v-if="canAnimate"
        type="button"
        class="home-onboarding-welcome__replay"
        aria-label="Play animation again"
        @click="replay"
      >
        <img :src="src" alt="" width="480" height="480" />
      </button>
      <img v-else :src="src" alt="" width="480" height="480" />
    </div>
  </div>
</template>

<style scoped>
/* Fills the step: the title grows, pushing the globe to the bottom (home2). */
.home-onboarding-welcome {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
}

.home-onboarding-welcome__title {
  flex-grow: 1;
  margin: 0;
  padding-top: var(--spacing-300);
  font-family: var(--font-family-serif);
  font-size: var(--font-size-xxx-large);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-xxx-large);
  color: var(--color-base);
}

/* Vector's card has no phone-sized lead-in to fill. */
[data-skin='desktop'] .home-onboarding-welcome__title {
  padding-top: var(--spacing-100);
}

.home-onboarding-welcome__globe {
  display: flex;
  justify-content: center;
}

/* The 480px source, capped on Vector's card; on Minerva it can take the step's width. */
.home-onboarding-welcome__globe img {
  display: block;
  width: 100%;
  max-width: 256px;
  height: auto;
}

[data-skin='mobile'] .home-onboarding-welcome__globe img {
  max-width: 100%;
}

/* An invisible tap target: the globe looks the same with or without it. */
.home-onboarding-welcome__replay {
  display: block;
  width: 100%;
  max-width: 256px;
  padding: 0;
  border: 0;
  border-radius: var(--border-radius-base);
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

[data-skin='mobile'] .home-onboarding-welcome__replay {
  max-width: 100%;
}

.home-onboarding-welcome__replay:focus-visible {
  outline: var(--border-width-thick) solid var(--outline-color-progressive--focus);
  outline-offset: 2px;
}

/* First-run reveal, this screen only (home2): the title rises, the globe pops in just after. */
.home-onboarding-welcome__rise,
.home-onboarding-welcome__pop {
  animation: home-onboarding-rise 280ms cubic-bezier(0.23, 1, 0.32, 1) both;
}

.home-onboarding-welcome__pop {
  animation-name: home-onboarding-pop;
  animation-delay: 80ms;
}

@keyframes home-onboarding-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

@keyframes home-onboarding-pop {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
}

/* Keep the fade, drop the distance. */
@media (prefers-reduced-motion: reduce) {
  .home-onboarding-welcome__rise,
  .home-onboarding-welcome__pop {
    animation-name: home-onboarding-fade;
  }

  @keyframes home-onboarding-fade {
    from {
      opacity: 0;
    }
  }
}
</style>
