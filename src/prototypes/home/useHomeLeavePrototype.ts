import { ref } from 'vue'

type LeaveTarget = '_blank' | '_self'

// Module-level: one dialog, shared by every Home page and link handler.
const dialogOpen = ref(false)
const pendingUrl = ref<string | null>(null)
const pendingTarget = ref<LeaveTarget>('_blank')

function clearPending(): void {
  dialogOpen.value = false
  pendingUrl.value = null
  pendingTarget.value = '_blank'
}

/** True for absolute http(s) links to another origin — i.e. off the prototype. */
export function isLeavingHref(href: string): boolean {
  const trimmed = href.trim()
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('./')) return false
  try {
    const url = new URL(trimmed, window.location.href)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
    return url.origin !== window.location.origin
  } catch {
    return false
  }
}

/**
 * Guards every exit from the prototype (links to production Wikipedia or other
 * sites) behind a "Leaving prototype" confirmation.
 */
export function useHomeLeavePrototype() {
  /** Ask before opening `url`; the dialog opens it on "Continue". */
  function requestLeave(url: string, target: LeaveTarget = '_blank'): void {
    pendingUrl.value = url
    pendingTarget.value = target
    dialogOpen.value = true
  }

  /** `@click.capture` handler: intercepts off-prototype `<a href>` clicks anywhere below it. */
  function onLeaveCapture(event: MouseEvent): void {
    const anchor = (event.target as Element | null)?.closest?.('a[href]')
    if (!(anchor instanceof HTMLAnchorElement)) return
    if (!isLeavingHref(anchor.getAttribute('href') ?? '')) return

    event.preventDefault()
    event.stopPropagation()
    requestLeave(anchor.href, anchor.target === '_blank' ? '_blank' : '_self')
  }

  function confirmLeave(): void {
    const url = pendingUrl.value
    const target = pendingTarget.value
    clearPending()
    if (!url) return
    if (target === '_blank') window.open(url, '_blank', 'noopener,noreferrer')
    else window.location.assign(url)
  }

  return { dialogOpen, requestLeave, onLeaveCapture, confirmLeave, cancelLeave: clearPending }
}
