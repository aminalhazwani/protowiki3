import { fetchWithTimeout, type FetchWithTimeoutInit } from './fetchWithTimeout'

const MAX_CONCURRENT_PER_HOST = 2
const MIN_SPACING_MS = 150
const MAX_RETRY_ATTEMPTS = 4
const INITIAL_BACKOFF_MS = 500
const MAX_BACKOFF_MS = 30_000

const QUEUED_HOST_SUFFIXES = [
  '.wikipedia.org',
  '.wikidata.org',
  'commons.wikimedia.org',
  'wikimedia.org',
  'mediawiki.org',
]

function hostFromInput(input: RequestInfo | URL): string | null {
  try {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url
    return new URL(url).hostname.toLowerCase()
  } catch {
    return null
  }
}

function shouldQueueHost(host: string): boolean {
  if (host === 'api.wikimedia.org') return false
  return QUEUED_HOST_SUFFIXES.some(
    (suffix) => host === suffix.slice(1) || host.endsWith(suffix),
  )
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve()
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
      return
    }
    const timer = setTimeout(resolve, ms)
    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer)
          reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
        },
        { once: true },
      )
    }
  })
}

function parseRetryAfterMs(header: string | null): number | null {
  if (!header) return null
  const seconds = Number(header)
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000
  const date = Date.parse(header)
  if (Number.isNaN(date)) return null
  return Math.max(0, date - Date.now())
}

function backoffMs(attempt: number): number {
  const base = Math.min(INITIAL_BACKOFF_MS * 2 ** attempt, MAX_BACKOFF_MS)
  const jitter = Math.floor(Math.random() * base * 0.25)
  return base + jitter
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500
}

function abortError(signal?: AbortSignal): unknown {
  return signal?.reason ?? new DOMException('Aborted', 'AbortError')
}

export type FetchWikimediaPriority = 'normal' | 'background'

interface Waiter {
  resolve: () => void
  reject: (err: unknown) => void
  signal?: AbortSignal
  onAbort?: () => void
}

/**
 * Per-host semaphore: at most `MAX_CONCURRENT_PER_HOST` requests in flight,
 * starts spaced `MIN_SPACING_MS` apart. Background waiters only start once no
 * normal waiter is queued, so prefetches never hold up what's on screen.
 */
class HostQueue {
  private active = 0
  private lastStartMs = 0
  private pumpTimer: ReturnType<typeof setTimeout> | null = null
  private readonly waiting: Record<FetchWikimediaPriority, Waiter[]> = {
    normal: [],
    background: [],
  }

  acquire(signal: AbortSignal | undefined, priority: FetchWikimediaPriority): Promise<void> {
    if (signal?.aborted) return Promise.reject(abortError(signal))

    return new Promise<void>((resolve, reject) => {
      const lane = this.waiting[priority]
      const waiter: Waiter = { resolve, reject, signal }
      if (signal) {
        waiter.onAbort = () => {
          const index = lane.indexOf(waiter)
          if (index !== -1) lane.splice(index, 1)
          reject(abortError(signal))
        }
        signal.addEventListener('abort', waiter.onAbort, { once: true })
      }
      lane.push(waiter)
      this.pump()
    })
  }

  release(): void {
    this.active--
    this.pump()
  }

  private pump(): void {
    if (this.pumpTimer) return

    while (this.active < MAX_CONCURRENT_PER_HOST) {
      const lane = this.waiting.normal.length ? this.waiting.normal : this.waiting.background
      if (!lane.length) return

      const waitMs = MIN_SPACING_MS - (Date.now() - this.lastStartMs)
      if (waitMs > 0) {
        this.pumpTimer = setTimeout(() => {
          this.pumpTimer = null
          this.pump()
        }, waitMs)
        return
      }

      const waiter = lane.shift()!
      if (waiter.onAbort) waiter.signal?.removeEventListener('abort', waiter.onAbort)
      this.active++
      this.lastStartMs = Date.now()
      waiter.resolve()
    }
  }
}

const hostQueues = new Map<string, HostQueue>()

function queueForHost(host: string): HostQueue {
  let queue = hostQueues.get(host)
  if (!queue) {
    queue = new HostQueue()
    hostQueues.set(host, queue)
  }
  return queue
}

async function fetchWithRetry(
  input: RequestInfo | URL,
  init: FetchWithTimeoutInit,
  queue: HostQueue | null,
  priority: FetchWikimediaPriority,
): Promise<Response> {
  const { signal } = init
  let lastResponse: Response | undefined

  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    if (signal?.aborted) throw abortError(signal)

    // Hold a queue slot only while the request is in flight, never during backoff.
    if (queue) await queue.acquire(signal, priority)
    let response: Response
    try {
      response = await fetchWithTimeout(input, init)
    } finally {
      queue?.release()
    }
    if (!isRetryableStatus(response.status)) {
      return response
    }

    lastResponse = response
    const isLastAttempt = attempt >= MAX_RETRY_ATTEMPTS - 1
    if (isLastAttempt) break

    const retryAfterMs = parseRetryAfterMs(response.headers.get('Retry-After'))
    const delayMs = retryAfterMs ?? backoffMs(attempt)
    await sleep(delayMs, signal)
  }

  return lastResponse!
}

const backgroundSignals = new WeakSet<AbortSignal>()

/**
 * A signal whose requests should queue behind normal ones. Linked to `parent`
 * (aborting it aborts the child), so a whole feed can be demoted just by
 * handing its fetchers this signal instead of the parent.
 */
export function backgroundSignal(parent?: AbortSignal): AbortSignal {
  const controller = new AbortController()
  if (parent?.aborted) {
    controller.abort(parent.reason)
  } else if (parent) {
    parent.addEventListener('abort', () => controller.abort(parent.reason), { once: true })
  }
  backgroundSignals.add(controller.signal)
  return controller.signal
}

export function isBackgroundSignal(signal: AbortSignal | null | undefined): boolean {
  return Boolean(signal && backgroundSignals.has(signal))
}

export interface FetchWikimediaInit extends FetchWithTimeoutInit {
  /** `background` waits behind every normal request queued for the same host. */
  queuePriority?: FetchWikimediaPriority
}

/** Queued, retried fetch for Wikimedia API hosts. Other hosts pass through. */
export async function fetchWikimedia(
  input: RequestInfo | URL,
  init: FetchWikimediaInit = {},
): Promise<Response> {
  const {
    queuePriority = isBackgroundSignal(init.signal) ? 'background' : 'normal',
    ...fetchInit
  } = init
  const host = hostFromInput(input)
  const queue = host && shouldQueueHost(host) ? queueForHost(host) : null
  return fetchWithRetry(input, fetchInit, queue, queuePriority)
}

/** Clear in-memory host queues (e.g. on reset). */
export function clearWikimediaFetchQueues(): void {
  hostQueues.clear()
}
