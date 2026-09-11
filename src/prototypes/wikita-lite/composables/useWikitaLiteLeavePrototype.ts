import { ref } from 'vue'

import { isLeavePrototypeHref } from './useWikitaLiteCardActions'

const dialogOpen = ref(false)
const pendingUrl = ref<string | null>(null)
const pendingTarget = ref<'_blank' | '_self'>('_blank')

function clearPending(): void {
  dialogOpen.value = false
  pendingUrl.value = null
  pendingTarget.value = '_blank'
}

export function useWikitaLiteLeavePrototype() {
  function onLeaveCapture(event: MouseEvent): void {
    if (dialogOpen.value) {
      event.preventDefault()
      event.stopPropagation()
      return
    }

    const anchor = (event.target as Element | null)?.closest('a[href]')
    if (!anchor || !(anchor instanceof HTMLAnchorElement)) return
    if (anchor.dataset.wikitaLiteSkipLeave !== undefined) return

    const href = anchor.getAttribute('href') ?? ''
    if (!isLeavePrototypeHref(href)) return

    event.preventDefault()
    event.stopPropagation()

    pendingUrl.value = anchor.href
    pendingTarget.value = anchor.target === '_blank' ? '_blank' : '_self'
    dialogOpen.value = true
  }

  function confirmLeave(): void {
    const url = pendingUrl.value
    const target = pendingTarget.value
    clearPending()

    if (!url) return

    if (target === '_blank') {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      window.location.assign(url)
    }
  }

  function cancelLeave(): void {
    clearPending()
  }

  return {
    dialogOpen,
    onLeaveCapture,
    confirmLeave,
    cancelLeave,
  }
}
