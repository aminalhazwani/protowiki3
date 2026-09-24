<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue'

import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import MobileWrapper from '@/components/MobileWrapper.vue'
import SpecialPageWrapper from '@/components/SpecialPageWrapper.vue'
import { globalSkin } from '@/theme'

import { useWikitaLiteCardBordersSingleton } from '../composables/useWikitaLiteCardBorders'
import { useWikitaLiteCardRadiusSingleton } from '../composables/useWikitaLiteCardRadius'
import { useWikitaLiteLeavePrototype } from '../composables/useWikitaLiteLeavePrototype'
import { initWikitaLiteUrlState } from '../composables/useWikitaLiteUrlState'
import { useWikitaLiteView } from '../composables/useWikitaLiteView'
import WikitaLiteLeavePrototypeDialog from './WikitaLiteLeavePrototypeDialog.vue'

initWikitaLiteUrlState()
import { SHOW_WIKITA_LITE_FLOATING_NAV } from '../routes'
import '../wikita-lite-shell.css'
import WikitaLiteChromeHeader from './WikitaLiteChromeHeader.vue'
import WikitaLiteFloatingNav from './WikitaLiteFloatingNav.vue'

interface Props {
  title?: string | null
  /** Reserve the title-row actions aside (e.g. configure button on home). */
  actions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  actions: false,
})

const { isHomeFeed, goHome, scrollToTop } = useWikitaLiteView()
const { onLeaveCapture } = useWikitaLiteLeavePrototype()
const { cardRadiusStyle } = useWikitaLiteCardRadiusSingleton()
const { hideCardBorders } = useWikitaLiteCardBordersSingleton()

const isSubpage = computed(() => props.title === null)

/*
 * Minerva keeps the greeting as a section-level heading above the feed; Vector
 * renders the dashboard the way the wiki renders a special page (cf.
 * `Special:CreateAccount` in CreateAccountScreen) — the greeting *is* the page
 * title, so it takes the `h1` and the title rule under it.
 */
const isDesktop = computed(() => globalSkin.value === 'desktop')

// Codex menus stay in-place (default). Teleporting into MobileWrapper's overlay
// races with route changes — useFloatingMenu can touch a null floating element.

onMounted(async () => {
  if (props.title !== null) return
  await nextTick()
  scrollToTop()
})
</script>

<template>
  <MobileWrapper fluid>
    <div class="wikita-lite-shell-root" @click.capture="onLeaveCapture">
      <ChromeWrapper
        :last-edited-notice="false"
        :show-header="!isSubpage"
        :show-footer="!isSubpage"
        :brand-link="false"
      >
        <template v-if="!isSubpage" #header>
          <WikitaLiteChromeHeader />
        </template>
        <SpecialPageWrapper
          :title="isSubpage ? null : undefined"
          :actions="props.actions"
          class="wikita-lite-shell"
          :class="{
            'wikita-lite-shell--subpage': isSubpage,
            'wikita-lite-shell--with-nav': SHOW_WIKITA_LITE_FLOATING_NAV,
            'wikita-lite-shell--hide-card-borders': hideCardBorders,
          }"
          :style="cardRadiusStyle"
        >
          <template v-if="!isSubpage && title" #header>
            <component :is="isDesktop ? 'h1' : 'h3'" class="special-page-wrapper__title">
              {{ title }}
            </component>
          </template>
          <template v-if="$slots.actions" #actions>
            <slot name="actions" />
          </template>
          <slot />
        </SpecialPageWrapper>
      </ChromeWrapper>
      <WikitaLiteFloatingNav
        v-if="SHOW_WIKITA_LITE_FLOATING_NAV"
        :home-active="isHomeFeed"
        @go-home="goHome"
      />
      <slot name="overlay" />
      <WikitaLiteLeavePrototypeDialog />
    </div>
  </MobileWrapper>
</template>

<style scoped>
.wikita-lite-shell-root {
  position: relative;
}
</style>
