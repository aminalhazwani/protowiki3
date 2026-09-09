import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue'

import type { HeaderButtonItem, HeaderItem } from '@/components/header/headerItems'
import { useConfig } from '@/composables/useConfig'

import WikitaLiteAccountMenuButton from '../components/WikitaLiteAccountMenuButton.vue'

const DEFAULT_SEARCH: HeaderButtonItem = {
  type: 'button',
  icon: 'search',
  label: 'Search',
}

const DEFAULT_BELL: HeaderButtonItem = {
  type: 'button',
  icon: 'bell-outline',
  label: 'Notifications',
}

const DEFAULT_USER: HeaderButtonItem = {
  type: 'button',
  icon: 'user-avatar-outline',
  label: 'User menu',
}

export function useWikitaLiteChromeHeaderRight(options?: {
  search?: MaybeRefOrGetter<HeaderButtonItem | undefined>
  hideUserMenu?: MaybeRefOrGetter<boolean>
}): { headerRight: ComputedRef<HeaderItem[]> } {
  const { user } = useConfig()

  const headerRight = computed((): HeaderItem[] => {
    const items: HeaderItem[] = [toValue(options?.search) ?? DEFAULT_SEARCH]

    if (user.value !== 'logged-out') {
      items.push(DEFAULT_BELL)
    }

    if (!toValue(options?.hideUserMenu)) {
      if (user.value === 'logged-out') {
        items.push({ type: 'component', component: WikitaLiteAccountMenuButton })
      } else {
        items.push(DEFAULT_USER)
      }
    }

    return items
  })

  return { headerRight }
}
