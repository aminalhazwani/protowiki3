/** A random article's title (Special:Random), or `null` when the lookup fails. */
export async function fetchRandomTitle(lang: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: 'query',
    list: 'random',
    rnnamespace: '0',
    rnlimit: '1',
    format: 'json',
    formatversion: '2',
    origin: '*',
  })
  try {
    const response = await fetch(`https://${lang}.wikipedia.org/w/api.php?${params}`)
    const data = await response.json()
    return data?.query?.random?.[0]?.title ?? null
  } catch {
    return null
  }
}
