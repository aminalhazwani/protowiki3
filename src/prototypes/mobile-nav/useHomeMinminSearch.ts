import { onBeforeUnmount, onMounted, shallowRef, type Ref } from 'vue'

// Module-level: Minmin's header registers its field, the tab bar focuses it.
const field = shallowRef<HTMLElement | null>(null)

/** Minmin's always-showing search field, for the tab bar's Search tab to focus. */
export function useHomeMinminSearch() {
  /** Call from the header: `el` holds the field. */
  function register(el: Ref<HTMLElement | null>): void {
    onMounted(() => (field.value = el.value))
    onBeforeUnmount(() => {
      if (field.value === el.value) field.value = null
    })
  }

  /**
   * Scroll back up to the field and focus it (in the tap's handler, so a phone
   * opens its keyboard). `false` when there's no field to focus.
   */
  function focus(): boolean {
    const input = field.value?.querySelector('input')
    if (!input) return false
    // Focus first: focusing during a smooth scroll stops it short.
    input.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return true
  }

  return { register, focus }
}
