<template>
  <Transition name="slide-up">
    <div v-show="visible" class="policy-overlay" @click.self="$emit('close')">
      <div class="policy-sheet">
        <div class="policy-header">
          <h2 class="policy-title">Username policy</h2>
          <CdxButton weight="quiet" aria-label="Close" @click="$emit('close')">
            <CdxIcon :icon="cdxIconClose" />
          </CdxButton>
        </div>
        <ul class="policy-list">
          <li>Consider <b>privacy risks</b> before using your real name.</li>
          <li>Don't use offensive, misleading, or promotional names.</li>
          <li>Your username must represent you as an individual, not an organization.</li>
        </ul>
        <a
          href="https://en.wikipedia.org/wiki/Wikipedia:Username_policy"
          target="_blank"
          rel="noopener"
          class="policy-full-link"
        >Read the full username policy</a>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconClose } from '@wikimedia/codex-icons'

defineProps({
  visible: { type: Boolean, default: false },
})

defineEmits(['close'])
</script>

<style scoped>
.policy-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  background-color: var(--background-color-backdrop-light);
}

.policy-sheet {
  width: 100%;
  background: var(--background-color-base);
  border-top: var(--border-base);
  box-shadow: var(--box-shadow-medium);
  padding: var(--spacing-100);
}

.policy-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: var(--spacing-50);
}

.policy-title {
  flex: 1;
  margin: 0;
  font-family: var(--font-family-system-sans);
  font-size: var(--font-size-medium);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-medium);
  color: var(--color-base);
}

.policy-list {
  margin: 0;
  padding-left: var(--spacing-200);
  line-height: var(--line-height-medium);
  color: var(--color-base);
}

.policy-list li {
  margin-bottom: var(--spacing-25);
}

.policy-list li:last-child {
  margin-bottom: 0;
}

.policy-full-link {
  display: block;
  margin-top: var(--spacing-100);
  color: var(--color-progressive);
}

.slide-up-enter-active {
  transition: opacity 350ms cubic-bezier(0.77, 0, 0.175, 1);
}
.slide-up-enter-active .policy-sheet {
  transition: transform 350ms cubic-bezier(0.77, 0, 0.175, 1),
              opacity 350ms cubic-bezier(0.77, 0, 0.175, 1);
}
.slide-up-enter-from {
  opacity: 0;
}
.slide-up-enter-from .policy-sheet {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-active {
  transition: opacity 250ms cubic-bezier(0.77, 0, 0.175, 1);
}
.slide-up-leave-active .policy-sheet {
  transition: transform 250ms cubic-bezier(0.77, 0, 0.175, 1),
              opacity 250ms cubic-bezier(0.77, 0, 0.175, 1);
}
.slide-up-leave-to {
  opacity: 0;
}
.slide-up-leave-to .policy-sheet {
  transform: translateY(100%);
  opacity: 0;
}
</style>
