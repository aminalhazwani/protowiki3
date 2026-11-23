<script setup lang="ts">
/**
 * The newcomer's Home (`/home-nav/home`): the Home template's page, inside
 * this prototype's chrome so the navigation variant stays around it.
 */
definePage({
  meta: {
    // Same pins as the article page — see `@/appearance/route-pins`.
    skin: 'mobile',
    user: 'new',
  },
})

import HomeDashboard from '@/prototypes/template-home/HomeDashboard.vue'

import NavChrome from '../NavChrome.vue'
import { HOME_NAV_USERNAME } from '../navVariants'
</script>

<template>
  <NavChrome :last-edited-notice="false">
    <HomeDashboard :title="`Hello, ${HOME_NAV_USERNAME}!`" />
  </NavChrome>
</template>
