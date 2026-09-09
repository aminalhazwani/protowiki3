<script setup lang="ts">
import { computed, nextTick, onMounted } from 'vue'

import ChromeHeader from '@/components/chrome/ChromeHeader.vue'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import MobileWrapper from '@/components/MobileWrapper.vue'
import SpecialPageWrapper from '@/components/SpecialPageWrapper.vue'

import { useWikitaLiteCardBordersSingleton } from '../composables/useWikitaLiteCardBorders'
import { useWikitaLiteChromeHeaderRight } from '../composables/useWikitaLiteChromeHeaderRight'
import { useWikitaLiteCardRadiusSingleton } from '../composables/useWikitaLiteCardRadius'
import { useWikitaLiteLeavePrototype } from '../composables/useWikitaLiteLeavePrototype'
import { initWikitaLiteUrlState } from '../composables/useWikitaLiteUrlState'
import { useWikitaLiteView } from '../composables/useWikitaLiteView'
import WikitaLiteLeavePrototypeDialog from './WikitaLiteLeavePrototypeDialog.vue'

initWikitaLiteUrlState()
import { SHOW_WIKITA_LITE_FLOATING_NAV } from '../routes'
import '../wikita-lite-shell.css'
import WikitaLiteFloatingNav from './WikitaLiteFloatingNav.vue'
import WikitaLitePrototypeMenuPopover from './WikitaLitePrototypeMenuPopover.vue'

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
const { headerRight } = useWikitaLiteChromeHeaderRight()

const isSubpage = computed(() => props.title === null)

// Codex menus stay in-place (default). Teleporting into MobileWrapper's overlay
// races with route changes — useFloatingMenu can touch a null floating element.

onMounted(async () => {
  if (props.title !== null) return
  await nextTick()
  scrollToTop()
})
</script>

<template>
  <MobileWrapper>
    <div class="wikita-lite-shell-root" @click.capture="onLeaveCapture">
      <ChromeWrapper
        skin="mobile"
        :last-edited-notice="false"
        :show-header="!isSubpage"
        :show-footer="!isSubpage"
        :brand-link="false"
      >
        <template v-if="!isSubpage" #header>
          <ChromeHeader skin="mobile" :right="headerRight" :brand-link="false">
            <template #menu>
              <WikitaLitePrototypeMenuPopover />
            </template>
          </ChromeHeader>
        </template>
        <SpecialPageWrapper
          :title="isSubpage ? null : undefined"
          :help="Boolean(title && !isSubpage)"
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
            <h3 class="special-page-wrapper__title">{{ title }}</h3>
          </template>
          <template v-if="$slots.actions" #actions>
            <slot name="actions" />
          </template>
          <slot />
        </SpecialPageWrapper>
      </ChromeWrapper>
      <WikitaLiteFloatingNav
        v-show="SHOW_WIKITA_LITE_FLOATING_NAV"
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
