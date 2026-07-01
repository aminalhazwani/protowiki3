const DEFAULT_MAX_LENGTH = 200

/**
 * Convert MediaWiki edit-summary wikitext into plain readable text.
 * Links, section markers, and light markup are resolved — never rendered as HTML.
 */
export function editSummaryWikitextToPlainText(raw: string): string {
  let text = raw.trim()

  text = text.replace(/<nowiki>([\s\S]*?)<\/nowiki>/gi, '$1')
  text = text.replace(/\/\* *(.*?) *\*\//g, '$1')
  text = text.replace(/\[\[(?:[^\]|#]+\|)?([^\]]+)\]\]/g, (_, part: string) =>
    part.replace(/_/g, ' ').trim(),
  )
  text = text.replace(
    /\[(https?:\/\/[^\s\]]+)(?:\s+([^\]]+))?\]/g,
    (_match, _url: string, label?: string) => (label ?? _url).trim(),
  )
  text = text.replace(/'''([^']+)'''/g, '$1')
  text = text.replace(/''([^']+)''/g, '$1')

  return text.replace(/\s+/g, ' ').trim()
}

export function normalizeEditSummaryWikitext(raw: string): string {
  return editSummaryWikitextToPlainText(raw)
}

export function truncateEditSummary(text: string, maxLength = DEFAULT_MAX_LENGTH): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 1).trimEnd() + '\u2026'
}

/** Edit summary as plain text for the UI. */
export function formatEditSummaryForDisplay(
  raw: string | null | undefined,
  maxLength = DEFAULT_MAX_LENGTH,
): string {
  const plain = normalizeEditSummaryWikitext(raw?.trim() || '')
  if (!plain.length) return 'No edit summary'
  return truncateEditSummary(plain, maxLength)
}
