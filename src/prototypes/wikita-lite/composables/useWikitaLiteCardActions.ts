import { ref, type Ref } from 'vue'

import { useConfig } from '@/composables/useConfig'

import { useWikitaSaveFeedback } from '../../musical-group/composables/useWikitaSaveFeedback'
import {
  EN_WIKI_HOST,
  enwikiArticleUrl,
  normalizeEnwikiTitle,
  resolveExternalUrl,
} from '../../musical-group/data/enwikiTitle'
import { isEditThanked, toggleEditThank } from '../../musical-group/data/editThanks'
import { useWikitaLiteListsSingleton } from './useWikitaLiteLists'

export interface ArticleLinkFields {
  articleUrl?: string
  title?: string
  enwikiTitle?: string
}

export function externalArticleHref(item: ArticleLinkFields): string | undefined {
  if (item.articleUrl?.trim()) return item.articleUrl
  const title = item.enwikiTitle?.trim() || item.title?.trim()
  if (title) return enwikiArticleUrl(title)
  return undefined
}

export function savedItemHref(item: { enwikiTitle?: string; title: string }): string | undefined {
  if (item.enwikiTitle?.trim()) return enwikiArticleUrl(item.enwikiTitle)
  if (item.title?.trim()) return enwikiArticleUrl(item.title)
  return undefined
}

export function helpWantedHref(item: { enwikiTitle?: string; title: string }): string | undefined {
  return savedItemHref(item)
}

/** True when the href navigates to production English Wikipedia (leaves the prototype). */
export function isLeavePrototypeHref(href: string): boolean {
  const trimmed = href.trim()
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('./')) return false

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return false
  }

  try {
    const resolved = resolveExternalUrl(trimmed)
    const url = new URL(resolved, typeof window !== 'undefined' ? window.location.href : 'https://example.com')
    const host = url.hostname.toLowerCase()
    return host === EN_WIKI_HOST || host === `www.${EN_WIKI_HOST}`
  } catch {
    return false
  }
}

function savedTitleKey(title: string): string {
  return normalizeEnwikiTitle(title).toLowerCase()
}

export function useWikitaLiteSaveActions(listsVersion: Ref<number>) {
  const { savePage, listsVersion: saveListsVersion } = useWikitaSaveFeedback()
  const { currentUserPageLists } = useConfig()
  const { isPageInAnyList } = useWikitaLiteListsSingleton()

  function relatedReadingSaved(title: string): boolean {
    void listsVersion.value
    void saveListsVersion.value
    void currentUserPageLists.value.readingList

    const key = savedTitleKey(title)
    if (!key) return false

    return currentUserPageLists.value.readingList.some(
      (entry) => savedTitleKey(entry) === key,
    )
  }

  function relatedReadingInList(itemId: string): boolean {
    void listsVersion.value
    return isPageInAnyList(itemId)
  }

  function onRelatedReadingSave(itemId: string, title: string, thumbnailUrl?: string) {
    savePage(itemId, title, thumbnailUrl)
  }

  return {
    relatedReadingSaved,
    relatedReadingInList,
    onRelatedReadingSave,
  }
}

export function useWikitaLiteThankActions() {
  const editThankState = ref<Record<number, boolean>>({})

  function editThanked(revid: number): boolean {
    if (Object.prototype.hasOwnProperty.call(editThankState.value, revid)) {
      return editThankState.value[revid]
    }
    return isEditThanked(revid)
  }

  function onToggleEditThank(revid: number) {
    const thanked = toggleEditThank(revid)
    editThankState.value = {
      ...editThankState.value,
      [revid]: thanked,
    }
  }

  return {
    editThanked,
    onToggleEditThank,
  }
}
