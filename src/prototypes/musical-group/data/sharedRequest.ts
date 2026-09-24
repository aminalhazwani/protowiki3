import { backgroundSignal, isBackgroundSignal } from '@/lib/fetchWikimedia'

/**
 * One network request shared by every caller that asks for the same thing
 * while it's in flight. The request runs on its own signal and is only
 * cancelled once every caller has aborted — so one caller cancelling (a
 * reload, a page leaving) never hands the others an `AbortError`.
 */
export interface SharedRequest<T> {
  promise: Promise<T>
  controller: AbortController
  waiters: number
}

export function createSharedRequest<T>(
  run: (signal: AbortSignal) => Promise<T>,
  creatorSignal?: AbortSignal,
): SharedRequest<T> {
  const controller = new AbortController()
  // Keep a background caller's queue priority for the shared request.
  const signal = isBackgroundSignal(creatorSignal)
    ? backgroundSignal(controller.signal)
    : controller.signal
  return { promise: run(signal), controller, waiters: 0 }
}

function abortReason(signal: AbortSignal): unknown {
  return signal.reason ?? new DOMException('Aborted', 'AbortError')
}

/** Wait on `request`, rejecting early (and leaving it) if `signal` aborts. */
export function joinSharedRequest<T>(request: SharedRequest<T>, signal?: AbortSignal): Promise<T> {
  if (signal?.aborted) return Promise.reject(abortReason(signal))

  request.waiters++
  // A caller without a signal can never leave, so the request always completes.
  if (!signal) return request.promise

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      request.waiters--
      if (request.waiters <= 0) request.controller.abort(abortReason(signal))
      reject(abortReason(signal))
    }
    signal.addEventListener('abort', onAbort, { once: true })
    request.promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort)
        resolve(value)
      },
      (err) => {
        signal.removeEventListener('abort', onAbort)
        reject(err)
      },
    )
  })
}
