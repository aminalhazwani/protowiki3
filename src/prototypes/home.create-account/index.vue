<script setup lang="ts">
/**
 * The prototype's own `Special:CreateAccount` — `/home/create-account`, opened
 * by "Create account" in either skin's chrome (`accountActions`). Creating the
 * account signs the reader in as the **New user** preset, named as typed.
 */
import HomeChrome from '../home/HomeChrome.vue'
import HomeCreateAccountForm from '../home/HomeCreateAccountForm.vue'
import HomePage from '../home/HomePage.vue'
import { useHomeAccount } from '../home/useHomeAccount'

const { logIn, goHomeAs } = useHomeAccount()

function onSubmit(username: string): void {
  window.scrollTo(0, 0)
  goHomeAs(() => logIn(username))
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
