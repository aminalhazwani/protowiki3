import { normalizeEnwikiTitle } from '../../../musical-group/data/enwikiTitle'

/** Case-insensitive dedupe key for article titles (matches fork morelike helpers). */
export function normalizeTitleKey(title: string): string {
  return normalizeEnwikiTitle(title).toLowerCase()
}
