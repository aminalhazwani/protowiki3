<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'
import { RouterLink } from 'vue-router'
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconUserAvatarOutline } from '@wikimedia/codex-icons'

import MinervaChromeHeader from '@/components/chrome/MinervaChromeHeader.vue'
import AccountMenuPopover from '@/components/settings/AccountMenuPopover.vue'
import LoggedInAccountMenuPopover from '@/components/settings/LoggedInAccountMenuPopover.vue'
import type { HeaderItem } from '@/components/header/headerItems'

import { useBrandTo } from '../data/useBrandTo'

const WIKIPEDIA_WORDMARK_EN =
  'https://en.wikipedia.org/static/images/mobile/copyright/wikipedia-wordmark-en-25.svg'

interface Props {
  mode: 'read' | 'account'
  username?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  search: []
  'create-account': []
  'go-home': []
}>()

const brandTo = useBrandTo()
const hasUsername = computed(() => Boolean(props.username?.trim()))

const BrandLink = defineComponent({
  name: 'OnboardingBrandLink',
  setup() {
    return () =>
      h(
        RouterLink,
        {
          to: brandTo.value,
          class: 'minerva-chrome-header__brand',
          'aria-label': 'Visit the main page',
        },
        () =>
          h('img', {
            class: 'minerva-chrome-header__wordmark-img',
            src: WIKIPEDIA_WORDMARK_EN,
            alt: 'Wikipedia',
          }),
      )
  },
})

const HeaderFlankSpacer = defineComponent({
  name: 'OnboardingHeaderFlankSpacer',
  setup() {
    return () =>
      h('span', {
        class: 'onboarding-chrome-header__spacer',
        'aria-hidden': 'true',
      })
  },
})

const LoggedOutUserMenu = defineComponent({
  name: 'OnboardingLoggedOutUserMenu',
  setup() {
    return () =>
      h(
        AccountMenuPopover,
        { onCreateAccount: () => emit('create-account') },
        {
          default: ({ toggle, open }: { toggle: () => void; open: boolean }) =>
            h(
              CdxButton,
              {
                weight: 'quiet',
                size: 'large',
                ariaLabel: 'User menu',
                ariaExpanded: open,
                onClick: toggle,
              },
              () => h(CdxIcon, { icon: cdxIconUserAvatarOutline, size: 'medium' }),
            ),
        },
      )
  },
})

const LoggedInUserMenu = defineComponent({
  name: 'OnboardingLoggedInUserMenu',
  props: {
    username: { type: String, required: true },
  },
  emits: ['go-home'],
  setup(menuProps, { emit: menuEmit }) {
    return () =>
      h(
        LoggedInAccountMenuPopover,
        {
          username: menuProps.username,
          onGoHome: () => menuEmit('go-home'),
        },
        {
          default: ({ toggle, open }: { toggle: () => void; open: boolean }) =>
            h(
              CdxButton,
              {
                weight: 'quiet',
                size: 'large',
                ariaLabel: 'User menu',
                ariaExpanded: open,
                onClick: toggle,
              },
              () => h(CdxIcon, { icon: cdxIconUserAvatarOutline, size: 'medium' }),
            ),
        },
      )
  },
})

const middle = computed<HeaderItem[]>(() => [{ type: 'component', component: BrandLink }])

const right = computed<HeaderItem[]>(() => {
  if (props.mode === 'account') {
    return [{ type: 'component', component: HeaderFlankSpacer }]
  }

  const items: HeaderItem[] = [
    {
      type: 'button',
      icon: 'search',
      label: 'Search',
      onClick: () => emit('search'),
    },
  ]

  if (hasUsername.value) {
    items.push({
      type: 'component',
      component: defineComponent({
        name: 'OnboardingLoggedInUserMenuWrapper',
        setup() {
          return () =>
            h(LoggedInUserMenu, {
              username: props.username ?? '',
              onGoHome: () => emit('go-home'),
            })
        },
      }),
    })
  } else {
    items.push({ type: 'component', component: LoggedOutUserMenu })
  }

  return items
})
</script>

<template>
  <MinervaChromeHeader :middle="middle" :right="right" />
</template>

<style scoped>
.onboarding-chrome-header__spacer {
  display: inline-block;
  width: var(--size-icon-large, 40px);
  height: var(--size-icon-large, 40px);
  flex-shrink: 0;
}
</style>
