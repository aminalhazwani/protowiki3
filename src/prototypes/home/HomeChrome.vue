<script setup lang="ts">
/**
 * Wikipedia chrome for every Home page: the wordmark leads back to `/home`, the
 * header follows the prototype's account (see `useHomeSession`), search opens
 * articles inside the prototype, and any link off the prototype (header or
 * content) asks before leaving.
 */
import { useRouter } from 'vue-router'

import { registerArticleOpener } from '@/components/article/shared/articleOpener'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'

import HomeLeavePrototypeDialog from './HomeLeavePrototypeDialog.vue'
import { HOME_PATH, homeArticleLocation } from './routes'
import { useHomeSession } from './useHomeAccount'
import { useHomeLeavePrototype } from './useHomeLeavePrototype'

interface Props {
  /** Footer "last edited" notice — on for wiki pages, off for the Home dashboard. */
  lastEditedNotice?: boolean
  /** Module pages take over the screen: no footer, and their own bar for a header. */
  showFooter?: boolean
}

const props = withDefaults(defineProps<Props>(), { lastEditedNotice: true, showFooter: true })

useHomeSession()
const { onLeaveCapture } = useHomeLeavePrototype()

const router = useRouter()
registerArticleOpener({
  href: (title) => router.resolve(homeArticleLocation(title)).href,
  open: (title) => void router.push(homeArticleLocation(title)),
})
</script>

<template>
  <div @click.capture="onLeaveCapture">
    <ChromeWrapper
      :brand-to="HOME_PATH"
      :last-edited-notice="props.lastEditedNotice"
      :show-footer="props.showFooter"
    >
      <!-- A page's own header (a module page's back bar) replaces the wiki header. -->
      <template v-if="$slots.header" #header>
        <slot name="header" />
      </template>
      <slot />
    </ChromeWrapper>
    <HomeLeavePrototypeDialog />
  </div>
</template>
