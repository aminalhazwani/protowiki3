/** Same-title check that tolerates underscores, stray spaces and case on the first letter. */
export function sameWikiTitle(a: string, b: string): boolean {
  const normalize = (value: string) =>
    value
      .trim()
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/^./, (c) => c.toUpperCase())
  return normalize(a) === normalize(b)
}
