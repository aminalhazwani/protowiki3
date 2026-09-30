import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useConfig, useUserOverride } from '@/composables/useConfig'

import {
  HOME_CONFIG_STORAGE_KEY,
  loadHomeConfig,
  patchHomeConfig,
  resetHomeConfig,
} from './data/homeConfig'
import { applyHomeUrlParams } from './data/homeUrlParams'

// Module-level: every Home page shares one account name.
const username = ref<string | null>(loadHomeConfig().username)

// Another tab changed it.
window.addEventListener('storage', (event) => {
  if (event.key === HOME_CONFIG_STORAGE_KEY || event.key === null) {
    username.value = loadHomeConfig().username
  }
})

/**
 * Who is signed in to the Home prototype. Signed in or not follows the ProtoWiki
 * **Mock user** preset (settings, or `?user=`); the Home only adds the name of
 * the account made in the prototype, shown for the **New user** preset.
 */
export function useHomeAccount() {
  const { user } = useConfig()
  const isLoggedIn = computed(() => user.value !== 'logged-out')

  /** Sign in as a new account (the onboarding outcome), optionally naming it. */
  function logIn(name?: string): void {
    if (name) username.value = patchHomeConfig({ username: name }).username
    user.value = 'new'
  }

  function logOut(): void {
    user.value = 'logged-out'
  }

  /** Forget everything the Home prototype stored. */
  function reset(): void {
    username.value = resetHomeConfig().username
  }

  return { username, isLoggedIn, logIn, logOut, reset }
}

/**
 * For the Home page shell: applies `?reset` / `?username=` from the URL (then
 * strips them), and shows the prototype account's name in the chrome while the
 * **New user** preset is active.
 */
export function useHomeSession() {
  const route = useRoute()
  const router = useRouter()
  // The saved preset, read directly — `user` from useConfig() includes overrides.
  const { config } = useConfig()

  const rest = applyHomeUrlParams(route.query)
  if (rest) {
    username.value = loadHomeConfig().username
    void router.replace({ query: rest, hash: route.hash })
  }

  useUserOverride(() =>
    config.value.user === 'new' && username.value ? { displayName: username.value } : null,
  )

  return useHomeAccount()
}
