<script setup lang="ts">
/**
 * Account setup's last step (home2's onboarding, step 3 of 3): "What are 3 of
 * your interests?" over the new account's Home. The picker edits the reader's
 * interests directly. "Go to your Home" (or Escape) closes it onto a Home with
 * no suggested edits.
 */
import { computed } from 'vue'
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconPrevious } from '@wikimedia/codex-icons'

import HomeDialogShell from './HomeDialogShell.vue'
import HomeInterestsPicker from './HomeInterestsPicker.vue'
import { useFindingSuggestions } from './useFindingSuggestions'

/** The step asks for three; its button goes primary once there are (home2). */
const REQUESTED_INTERESTS = 3

const { setupOpen, interests, setInterests, finishSetup } = useFindingSuggestions()
const model = computed({ get: () => interests.value, set: setInterests })

const open = computed({
  get: () => setupOpen.value,
  set: (value: boolean) => {
    if (!value) finishSetup()
  },
})
</script>

<template>
  <HomeDialogShell v-model:open="open" title="Personalize your Home" tall>
    <template #header>
      <div class="home-account-setup__header">
        <!-- Steps 1 and 2 aren't part of this scenario, so going back stays put. -->
        <CdxButton class="home-account-setup__nav" weight="quiet" aria-label="Go back">
          <CdxIcon :icon="cdxIconPrevious" />
        </CdxButton>
        <span class="home-account-setup__counter">3 of 3</span>
      </div>
    </template>

    <section>
      <h1 class="home-account-setup__title">What are 3 of your interests?</h1>

      <HomeInterestsPicker v-model="model" class="home-account-setup__body" />
    </section>

    <template #footer>
      <CdxButton
        class="home-account-setup__cta"
        :action="interests.length >= REQUESTED_INTERESTS ? 'progressive' : 'default'"
        :weight="interests.length >= REQUESTED_INTERESTS ? 'primary' : 'quiet'"
        size="large"
        @click="finishSetup"
      >
        Go to your Home
      </CdxButton>
    </template>
  </HomeDialogShell>
</template>

<style scoped>
.home-account-setup__header {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: space-between;
}

/* The quiet button's icon lines up with the content edge, as Codex's close button does. */
.home-account-setup__nav {
  margin-inline-start: calc(-1 * var(--spacing-50));
}

.home-account-setup__counter {
  font-size: var(--font-size-medium);
  line-height: var(--line-height-small);
  color: var(--color-subtle);
}

/*
 * The step's title (home2's `.ob-title`): bold system sans, a 48px lead-in on
 * Minerva and the card's own rhythm on Vector.
 */
.home-account-setup__title {
  margin: 0;
  padding-top: var(--spacing-300);
  font-family: var(--font-family-system-sans), var(--font-family-base);
  font-size: var(--font-size-x-large);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-x-large);
  color: var(--color-base);
}

[data-skin='desktop'] .home-account-setup__title {
  padding-top: var(--spacing-100);
}

/* home2's step body: 12px under the title. */
.home-account-setup__body {
  padding-top: var(--spacing-75);
}

/* The step's whole footer (Codex caps buttons at 28rem). */
.home-account-setup__cta {
  width: 100%;
  max-width: none;
}
</style>
