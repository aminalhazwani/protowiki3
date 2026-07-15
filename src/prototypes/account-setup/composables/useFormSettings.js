import { ref } from 'vue'
import { baseSettings } from '../config/formSettings'

/**
 * Static replacement for the account-creation-v3-alt `useAdminSettings`
 * composable. It exposes the same `{ settings }` shape (a ref whose `.value`
 * matches the admin panel's settings object) so the form and validators consume
 * it unchanged — but the settings are fixed and never synced to the URL.
 */
const settings = ref(baseSettings)

export function useFormSettings() {
  return { settings }
}
