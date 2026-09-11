import { normalizeQid } from '../../musical-group/data/wikidataApi'
import {
  getCachedItemThumbnail,
  setCachedItemThumbnail,
} from '../../musical-group/data/itemThumbnailCache'
import type { UserList } from '../../musical-group/data/lists'
import { useWikitaLiteUrlState } from './useWikitaLiteUrlState'

function syncListThumbnail(list: UserList): void {
  const firstId = list.itemIds[0]
  if (!firstId) {
    list.thumbnailUrl = undefined
    return
  }
  list.thumbnailUrl = getCachedItemThumbnail(firstId)
}

export function useWikitaLiteLists() {
  const { state, patchState } = useWikitaLiteUrlState()

  function readLists(): UserList[] {
    return [...state.value.lists]
  }

  function writeLists(lists: UserList[]): void {
    void patchState({ lists: [...lists] })
  }

  function listUserLists(): UserList[] {
    return readLists().sort((a, b) => b.createdAt - a.createdAt)
  }

  function createList(name: string): UserList {
    const list: UserList = {
      id: crypto.randomUUID(),
      name,
      itemIds: [],
      createdAt: Date.now(),
    }
    writeLists([...readLists(), list])
    return list
  }

  function addPageToList(listId: string, pageId: string, thumbnailUrl?: string): void {
    const id = normalizeQid(pageId) ?? pageId
    const lists = readLists()
    const list = lists.find((entry) => entry.id === listId)
    if (!list || list.itemIds.includes(id)) return

    if (thumbnailUrl) {
      setCachedItemThumbnail(id, thumbnailUrl)
      if (!list.itemIds.length) {
        list.thumbnailUrl = thumbnailUrl
      }
    }

    list.itemIds.push(id)
    writeLists(lists)
  }

  function removePageFromAllLists(pageId: string): boolean {
    const id = normalizeQid(pageId) ?? pageId
    const lists = readLists()
    let changed = false

    for (const list of lists) {
      if (!list.itemIds.includes(id)) continue
      const wasFirst = list.itemIds[0] === id
      list.itemIds = list.itemIds.filter((itemId) => itemId !== id)
      if (wasFirst) syncListThumbnail(list)
      changed = true
    }

    if (changed) writeLists(lists)
    return changed
  }

  function isPageInAnyList(pageId: string): boolean {
    const id = normalizeQid(pageId) ?? pageId
    return readLists().some((list) => list.itemIds.includes(id))
  }

  return {
    listUserLists,
    createList,
    addPageToList,
    removePageFromAllLists,
    isPageInAnyList,
  }
}

let singleton: ReturnType<typeof useWikitaLiteLists> | null = null

export function useWikitaLiteListsSingleton() {
  if (!singleton) {
    singleton = useWikitaLiteLists()
  }
  return singleton
}
