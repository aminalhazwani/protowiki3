/**
 * The namespace prefix of a wiki page title — the part before the first colon,
 * which is what separates an encyclopedia article from the pages *about* the
 * project (`Wikipedia:Manual of Style`), the ones belonging to a contributor
 * (`User:Jimbo Wales`) and the ones documenting how to edit (`Help:Links`).
 *
 * Titles come in reader-visible form (`Wikipedia:Simplified Manual of Style`)
 * or URL form (`Wikipedia:Simplified_Manual_of_Style`), so underscores are
 * normalised, and `MediaWiki:` prefixes are case-insensitive on the first
 * letter, so the comparison is lowercased.
 *
 * English prefixes only, plus MediaWiki's `Project:` alias for the project
 * namespace. A localised wiki spells them differently (`Hjelp:`, `Wikipédia:`),
 * which a prototype reading one language at a time doesn't need — the chrome
 * affordances keyed off this are English-language explorations.
 */

/**
 * Namespaces holding a page about the project rather than an article: the
 * project namespace (`Wikipedia:`, aliased `Project:`), user pages and help
 * pages. These are what the chrome's floating help button keys off, and what a
 * prototype passes to {@link wikiLinkClick} to make such links followable.
 */
export const PROJECT_NAMESPACES = ['wikipedia', 'project', 'user', 'help'] as const

/** Normalised namespace prefix of `title` (lowercased, spaced), or `null` in mainspace. */
export function wikiNamespace(title: string): string | null {
  const colon = title.indexOf(':')
  if (colon <= 0) return null
  const prefix = title.slice(0, colon).trim().toLowerCase().replace(/_/g, ' ')
  return prefix || null
}

/** Is `title` a project, user or help page? See {@link PROJECT_NAMESPACES}. */
export function isProjectNamespaceTitle(title: string): boolean {
  const namespace = wikiNamespace(title)
  return namespace !== null && (PROJECT_NAMESPACES as readonly string[]).includes(namespace)
}
