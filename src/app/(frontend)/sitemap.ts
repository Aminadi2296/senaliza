import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/config'
import { getClient } from '@/lib/data'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    { url: SITE.url, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE.url}/catalogo`, changeFrequency: 'daily', priority: 0.9 },
  ]
  try {
    const payload = await getClient()
    const [cats, prods] = await Promise.all([
      payload.find({ collection: 'categories', limit: 1000, depth: 0, pagination: false }),
      payload.find({ collection: 'products', where: { _status: { equals: 'published' } }, limit: 5000, depth: 0, pagination: false }),
    ])
    return [
      ...base,
      ...cats.docs.map((c) => ({ url: `${SITE.url}/categoria/${c.slug}`, lastModified: c.updatedAt, changeFrequency: 'weekly' as const, priority: 0.8 })),
      ...prods.docs.map((p) => ({ url: `${SITE.url}/producto/${p.slug}`, lastModified: p.updatedAt, changeFrequency: 'weekly' as const, priority: 0.7 })),
    ]
  } catch {
    return base
  }
}
