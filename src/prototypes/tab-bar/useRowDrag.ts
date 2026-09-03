import { nextTick, ref, type Ref } from 'vue'

/**
 * Pointer-event reordering for a vertical list of equal-height rows.
 *
 * Rows are the direct children of **`listEl`**. During a drag the DOM order
 * never changes — the dragged row follows the pointer and siblings shift with
 * transforms — and **`onMove(from, to)`** fires once on release so the owner
 * can splice its array (rows must be keyed by a stable id).
 */
export function useRowDrag(
  listEl: Ref<HTMLElement | null>,
  onMove: (from: number, to: number) => void,
  gripSelector = '.toolbar-row__grip',
) {
  const dragging = ref<number | null>(null)

  function onGripPointerDown(event: PointerEvent, index: number): void {
    if (event.button !== 0 || !listEl.value) return
    const rows = Array.from(listEl.value.children) as HTMLElement[]
    if (rows.length < 2 || !rows[index]) return

    event.preventDefault()
    const grip = event.currentTarget as HTMLElement
    try {
      grip.setPointerCapture(event.pointerId)
    } catch {
      // Synthetic or already-released pointers: fall back to plain listeners on the grip.
    }

    const rects = rows.map((row) => row.getBoundingClientRect())
    const rowStep = rects[1].top - rects[0].top
    const from = index
    const startY = event.clientY
    let target = index
    dragging.value = index

    rows.forEach((row, i) => {
      if (i !== from) row.style.transition = 'transform 120ms ease'
    })

    const onPointerMove = (moveEvent: PointerEvent): void => {
      const dy = moveEvent.clientY - startY
      rows[from].style.transform = `translateY(${dy}px)`
      const centerY = rects[from].top + rects[from].height / 2 + dy
      target = rects.filter((rect, i) => i !== from && rect.top + rect.height / 2 < centerY).length
      rows.forEach((row, i) => {
        if (i === from) return
        let shift = 0
        if (from < i && i <= target) shift = -rowStep
        else if (target <= i && i < from) shift = rowStep
        row.style.transform = shift ? `translateY(${shift}px)` : ''
      })
    }

    const finish = (): void => {
      grip.removeEventListener('pointermove', onPointerMove)
      grip.removeEventListener('pointerup', finish)
      grip.removeEventListener('pointercancel', finish)
      if (grip.hasPointerCapture(event.pointerId)) grip.releasePointerCapture(event.pointerId)
      rows.forEach((row) => {
        row.style.transform = ''
        row.style.transition = ''
      })
      dragging.value = null
      if (target !== from) onMove(from, target)
    }

    grip.addEventListener('pointermove', onPointerMove)
    grip.addEventListener('pointerup', finish)
    grip.addEventListener('pointercancel', finish)
  }

  /** ArrowUp / ArrowDown move the row one step and keep focus on its grip. */
  function onGripKeydown(event: KeyboardEvent, index: number): void {
    const delta = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0
    if (!delta || !listEl.value) return
    const to = index + delta
    if (to < 0 || to >= listEl.value.children.length) return
    event.preventDefault()
    onMove(index, to)
    void nextTick(() => {
      const row = listEl.value?.children[to]
      row?.querySelector<HTMLElement>(gripSelector)?.focus()
    })
  }

  return { dragging, onGripPointerDown, onGripKeydown }
}
