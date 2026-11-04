<script setup lang="ts">
/**
 * A dialog's footer text: whether the reader's picks find suggested edits.
 * Each message rises into place as the last one rises out, fading, after
 * account setup's step counter (home2). While finding, the ellipsis counts up.
 */
import { FOUND_COUNT } from './useFindingSuggestions'
import type { FindingStatus } from './useFindingStatus'

defineProps<{
  status: FindingStatus
  /** The other dialog, as a link in "Try selecting more interests and types of edits". */
  link: 'interests' | 'types of edits'
}>()

const emit = defineEmits<{ link: [] }>()
</script>

<template>
  <span class="home-finding-status" aria-live="polite">
    <Transition name="home-finding-status-roll">
      <span :key="status" class="home-finding-status__message">
        <template v-if="status === 'none'">
          <strong>No suggested edits found.</strong>
          <br />
          Try selecting more
          <template v-if="link === 'interests'">
            <a href="#" @click.prevent="emit('link')">interests</a> and types of edits
          </template>
          <template v-else>
            interests and <a href="#" @click.prevent="emit('link')">types of edits</a>
          </template>
          or check back later.
        </template>
        <template v-else-if="status === 'finding'">
          Finding suggested edits<span class="home-finding-status__dots"
            ><span>.</span><span>.</span><span>.</span></span
          >
        </template>
        <template v-else>{{ FOUND_COUNT }} suggested edits found</template>
      </span>
    </Transition>
  </span>
</template>

<!-- Codex renders the footer text's `<p>` itself, so these rules reach into it. -->
<style>
/*
 * CODEX+ CdxDialog: the footer text has no way to animate between messages.
 * Its `<p>` is the clipping box, so a message only shows inside it.
 */
.cdx-dialog__footer__text:has(.home-finding-status) {
  position: relative;
  overflow: hidden;
}
</style>

<style scoped>
.home-finding-status__message {
  display: block;
}

/* As the Home's empty Suggested edits: all subtle, the title and links bold. */
.home-finding-status__message {
  color: var(--color-subtle);
}

.home-finding-status__message strong,
.home-finding-status__message a {
  font-weight: var(--font-weight-bold);
}

/* The leaving message overlaps the entering one, so the box takes the new height. */
.home-finding-status-roll-leave-active {
  position: absolute;
  inset-inline: 0;
  top: 0;
}

/*
 * Out quickly, in softly: the old message clears in 160ms, and the new one
 * starts as it goes, rising 8px over 300ms while it fades in more gently than
 * it moves. A 2px blur at either end blends the two where they overlap.
 */
.home-finding-status-roll-leave-active {
  transition:
    transform 160ms cubic-bezier(0.23, 1, 0.32, 1),
    opacity 160ms cubic-bezier(0.23, 1, 0.32, 1),
    filter 160ms cubic-bezier(0.23, 1, 0.32, 1);
}

.home-finding-status-roll-enter-active {
  transition:
    transform 300ms cubic-bezier(0.23, 1, 0.32, 1) 60ms,
    opacity 300ms ease 60ms,
    filter 300ms ease 60ms;
}

.home-finding-status-roll-enter-from {
  opacity: 0;
  filter: blur(2px);
  transform: translateY(var(--spacing-50));
}

.home-finding-status-roll-leave-to {
  opacity: 0;
  filter: blur(2px);
  transform: translateY(calc(-1 * var(--spacing-50)));
}

/*
 * "Finding…": the dots count up, none, ".", "..", "...", and start over —
 * 400ms a step, stepped, no fade. Twice round, then the result
 * (`DOTS_LOOP_MS` in `useFindingStatus`).
 */
.home-finding-status__dots > span {
  animation: 1600ms step-end infinite;
}

.home-finding-status__dots > span:nth-child(1) {
  animation-name: home-finding-status-dot-1;
}

.home-finding-status__dots > span:nth-child(2) {
  animation-name: home-finding-status-dot-2;
}

.home-finding-status__dots > span:nth-child(3) {
  animation-name: home-finding-status-dot-3;
}

@keyframes home-finding-status-dot-1 {
  0% {
    opacity: 0;
  }

  25% {
    opacity: 1;
  }
}

@keyframes home-finding-status-dot-2 {
  0% {
    opacity: 0;
  }

  50% {
    opacity: 1;
  }
}

@keyframes home-finding-status-dot-3 {
  0% {
    opacity: 0;
  }

  75% {
    opacity: 1;
  }
}

/* Keep the fades, drop the movement; the dots stay as "...". */
@media (prefers-reduced-motion: reduce) {
  .home-finding-status-roll-enter-from,
  .home-finding-status-roll-leave-to {
    transform: none;
  }

  .home-finding-status__dots > span {
    animation: none;
  }
}
</style>
