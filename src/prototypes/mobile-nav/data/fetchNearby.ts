/**
 * Articles around a point, for the prototype's Special:Nearby. The real page is
 * an empty mount point filled by the NearbyPages extension's JavaScript, so only
 * its data comes from the wiki: the Action API's geosearch, as NearbyPages uses.
 */

export interface NearbyArticle {
  title: string
  description: string | null
  thumbnailUrl: string | null
  /** Metres from the reader. */
  distance: number
}

const RADIUS_M = 10000
const LIMIT = 50

export async function fetchNearby(
  latitude: number,
  longitude: number,
  { lang, signal }: { lang: string; signal?: AbortSignal },
): Promise<NearbyArticle[]> {
  const point = `${latitude}|${longitude}`
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    origin: '*',
    generator: 'geosearch',
    ggscoord: point,
    ggsradius: String(RADIUS_M),
    ggslimit: String(LIMIT),
    prop: 'coordinates|pageimages|description',
    colimit: 'max',
    codistancefrompoint: point,
    piprop: 'thumbnail',
    pithumbsize: '200',
    pilimit: 'max',
  })
  const response = await fetch(`https://${lang}.wikipedia.org/w/api.php?${params}`, { signal })
  if (!response.ok) throw new Error(`Nearby request failed: ${response.status}`)
  const data = await response.json()
  const pages: any[] = data?.query?.pages ?? []
  return pages
    .map((page) => ({
      title: page.title as string,
      description: page.description ?? null,
      thumbnailUrl: page.thumbnail?.source ?? null,
      distance: page.coordinates?.[0]?.dist ?? Infinity,
    }))
    .sort((a, b) => a.distance - b.distance)
}

/** NearbyPages' format: "470 m" under a kilometre (to 10 m), "1.2 km" beyond. */
export function formatDistance(metres: number): string {
  if (!Number.isFinite(metres)) return ''
  if (metres < 1000) return `${Math.max(10, Math.round(metres / 10) * 10)} m`
  return `${(metres / 1000).toFixed(1)} km`
}

/** NearbyPages' own empty-state illustration, served by the wiki's ResourceLoader. */
export function nearbyIllustrationUrl(lang: string): string {
  return `https://${lang}.wikipedia.org/w/load.php?modules=ext.nearby.images&image=mw-vue-nearby__image&format=original&lang=${lang}&skin=minerva`
}
