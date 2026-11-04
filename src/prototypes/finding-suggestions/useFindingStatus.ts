import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

export type FindingStatus = 'none' | 'finding' | 'found'

/** How long "Finding suggested edits…" shows after each change. */
const FINDING_MS = 2000

/**
 * A dialog's footer status. It opens on the reader's current result; each
 * change to the dialog's picks (`key`) shows "Finding…", then the result
 * (`finds`) for the picks as they are by then.
 */
export function useFindingStatus(open: Ref<boolean>, key: () => string, finds: () => boolean) {
  const status = ref<FindingStatus>('none')
  let settledKey = ''
  let timer: ReturnType<typeof setTimeout> | undefined

  /** Call once the dialog's picks are reset to the reader's own. */
  function reset(): void {
    clearTimeout(timer)
    settledKey = key()
    status.value = finds() ? 'found' : 'none'
  }

  watch(key, (next) => {
    if (!open.value || next === settledKey) return
    clearTimeout(timer)
    status.value = 'finding'
    timer = setTimeout(() => {
      status.value = finds() ? 'found' : 'none'
    }, FINDING_MS)
  })

  onBeforeUnmount(() => clearTimeout(timer))

  return { status, reset }
}
