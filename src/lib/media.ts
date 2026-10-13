import type { Media, Product } from '@/payload-types'

export function mediaUrl(m: number | Media | null | undefined, size?: 'thumb' | 'card' | 'large'): string | null {
  if (!m || typeof m === 'number') return null
  return (size && m.sizes?.[size]?.url) || m.url || null
}

const isShopify = (u: string) => /cdn\.shopify\.com|\/cdn\/shop\//.test(u)
/** Pide a la CDN de Shopify una versión del ancho indicado (más liviana). */
const sized = (url: string, width: number) => (isShopify(url) ? `${url}${url.includes('?') ? '&' : '?'}width=${width}` : url)

export type Img = { full: string; card: string; thumb: string; alt: string }

/** Imágenes de un producto: las subidas por ti tienen prioridad; si no hay, las externas (URL). */
export function productImages(p: Product): Img[] {
  const uploaded = (p.images ?? []).flatMap((i) => {
    const m = i.image
    const full = mediaUrl(m, 'large')
    if (!full) return []
    return [{ full, card: mediaUrl(m, 'card') ?? full, thumb: mediaUrl(m, 'thumb') ?? full, alt: (typeof m === 'object' && m?.alt) || p.title }]
  })
  if (uploaded.length) return uploaded
  return (p.externalImages ?? [])
    .filter((e) => e.url)
    .map((e) => ({ full: sized(e.url, 1200), card: sized(e.url, 600), thumb: sized(e.url, 200), alt: e.alt || p.title }))
}
