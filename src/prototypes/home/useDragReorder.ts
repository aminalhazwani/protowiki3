import { nextTick, onBeforeUnmount, ref, type Ref } from 'vue'

/** How long a row takes to slide into the gap the dragged row leaves. */
const ROW_SHIFT_MS = 120

/**
 * Reorder a list's rows by dragging a handle, or with ↑/↓ on it (home2's Home
 * layout list). The DOM order never changes mid-drag: the dragged row follows
 * the pointer on a transform while its siblings slide aside, and `move` runs
 * once on release, so nothing is rebuilt under the pointer.
 *
 * `list` is the element whose children are the rows; `handleSelector` finds a
 * row's handle, to keep focus on it after a keyboard move.
 */
export function useDragReorder(
  list: Ref<HTMLElement | null>,
  handleSelector: string,
  move: (from: number, to: number) => void,
) {
  /** The row being dragged, or `null`. */
  const dragging = ref<number | null>(null)

  function onPointerDown(event: PointerEvent, from: number): void {
    if (event.button !== 0 || !list.value) return
    const rows = Array.from(list.value.children) as HTMLElement[]
    if (rows.length < 2 || !rows[from]) return
    event.preventDefault()

    const handle = event.currentTarget as HTMLElement
    try {
      handle.setPointerCapture(event.pointerId)
    } catch {
      // Synthetic or already-released pointers: the listeners below still fire.
    }

    // Measured once: rows keep their layout position for the whole drag.
    const rects = rows.map((row) => row.getBoundingClientRect())
    const step = rects[1].top - rects[0].top
    const startY = event.clientY
    let to = from

    dragging.value = from
    document.body.style.cursor = 'grabbing'
    rows.forEach((row, i) => {
      if (i !== from) row.style.transition = `transform ${ROW_SHIFT_MS}ms ease`
    })

    const onMove = (moveEvent: PointerEvent): void => {
      const dy = moveEvent.clientY - startY
      rows[from].style.transform = `translateY(${dy}px)`
      // Rows whose centre the dragged row has passed give up their slot.
      const centre = rects[from].top + rects[from].height / 2 + dy
      to = rects.filter((rect, i) => i !== from && rect.top + rect.height / 2 < centre).length
      rows.forEach((row, i) => {
        if (i === from) return
        const shift = from < i && i <= to ? -step : to <= i && i < from ? step : 0
        row.style.transform = shift ? `translateY(${shift}px)` : ''
      })
    }

    const finish = (): void => {
      handle.removeEventListener('pointermove', onMove)
      handle.removeEventListener('pointerup', finish)
      handle.removeEventListener('pointercancel', finish)
      // Clear the transforms in the same frame as the move, so the row lands in
      // the slot its neighbours already opened.
      rows.forEach((row) => {
        row.style.transform = ''
        row.style.transition = ''
      })
      dragging.value = null
      document.body.style.cursor = ''
      move(from, to)
    }

    handle.addEventListener('pointermove', onMove)
    handle.addEventListener('pointerup', finish)
    handle.addEventListener('pointercancel', finish)
  }

  /** ↑ / ↓ move the row one slot; focus stays on its handle. */
  function onKeydown(event: KeyboardEvent, from: number): void {
    const delta = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0
    const to = from + delta
    if (!delta || !list.value || to < 0 || to >= list.value.children.length) return
    event.preventDefault()
    move(from, to)
    void nextTick(() =>
      list.value?.children[to]?.querySelector<HTMLElement>(handleSelector)?.focus(),
    )
  }

  onBeforeUnmount(() => {
    document.body.style.cursor = ''
  })

  return { dragging, onPointerDown, onKeydown }
}
