<script setup lang="ts">
/**
 * The prototype's own `Special:CreateAccount` — `/home/create-account`, opened
 * by "Create account" in either skin's chrome (`accountActions`). Creating the
 * account signs the reader in as the **New user** preset, named as typed, and
 * starts onboarding.
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import HomeChrome from '../home/HomeChrome.vue'
import HomeCreateAccountForm from '../home/HomeCreateAccountForm.vue'
import HomePage from '../home/HomePage.vue'
import { normalizeTitle } from '../home/routes'
import { useHomeAccount } from '../home/useHomeAccount'
import { useHomeOnboarding } from '../home/useHomeOnboarding'

const route = useRoute()
const { logIn, goHomeAs } = useHomeAccount()
const { start } = useHomeOnboarding()

/** The article "Create account" was opened from (`?from=`), if any: the first interest. */
const from = computed(() => {
  const value = Array.isArray(route.query.from) ? route.query.from[0] : route.query.from
  const title = normalizeTitle(value ?? '')
  return title && title !== 'Main Page' ? title : null
})

// The Home opens with the onboarding wizard over it.
function onSubmit(username: string): void {
  const seed = from.value
  window.scrollTo(0, 0)
  goHomeAs(() => {
    logIn(username)
    start(seed)
  })
}
</script>

<template>
  <HomeChrome :last-edited-notice="false" :show-footer="false">
    <HomePage title="Create account">
      <div class="home-create-account">
        <HomeCreateAccountForm @submit="onSubmit" />
      </div>
    </HomePage>
  </HomeChrome>
</template>

<style scoped>
/* A form column (a field is unreadable at the content column's width), as on Special:CreateAccount. */
.home-create-account {
  max-width: 448px;
  padding-top: var(--spacing-150);
}
</style>
