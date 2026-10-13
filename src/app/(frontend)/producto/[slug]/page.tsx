import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { AddToCart, type VariantOption } from '@/components/AddToCart'
import { Gallery } from '@/components/Gallery'
import { JsonLd } from '@/components/JsonLd'
import { ProductGrid } from '@/components/ProductCard'
import { SignTile } from '@/components/SignTile'
import { NORMS, SITE } from '@/lib/config'
import { categoriesOf, getProduct, listProducts, maxPrice, minPrice } from '@/lib/data'
import { mediaUrl, productImages } from '@/lib/media'
import { signKind } from '@/lib/signs'

export const revalidate = 60
type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const p = await getProduct(slug)
  if (!p) return {}
  const title = p.meta?.title || p.title
  const description = p.meta?.description || p.shortDescription || `${p.title}. Señalética normada con despacho a todo Chile.`
  const img = mediaUrl(p.meta?.image, 'large') || productImages(p)[0]?.full
  return { title, description, alternates: { canonical: `/producto/${slug}` }, openGraph: { title, description, type: 'website', images: img ? [img] : undefined } }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const p = await getProduct(slug)
  if (!p) notFound()

  const cats = categoriesOf(p)
  const kind = signKind(p.title, cats[0]?.name)
  const images = productImages(p)

  const variants: VariantOption[] = (p.variants ?? []).map((v) => ({
    sku: v.sku,
    options: (v.options ?? []).map((o) => ({ name: o.name, value: o.value })),
    price: v.price,
    compareAtPrice: v.compareAtPrice,
    available: v.available !== false && (!v.trackStock || (v.stock ?? 0) > 0),
    maxQty: v.trackStock ? (v.stock ?? 0) : undefined,
  }))

  const related = cats[0] ? (await listProducts({ categoryIds: [cats[0].id], limit: 4, excludeId: p.id })).docs : []
  const url = `${SITE.url}/producto/${p.slug}`

  return (
    <div className="section">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: p.title,
          description: p.shortDescription ?? undefined,
          image: images.map((i) => i.full),
          sku: p.variants?.[0]?.sku,
          brand: { '@type': 'Brand', name: SITE.name },
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'CLP',
            lowPrice: minPrice(p),
            highPrice: maxPrice(p),
            offerCount: p.variants?.length ?? 1,
            availability: variants.some((v) => v.available) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url,
          },
        }}
      />
      <nav className="crumbs" aria-label="Ruta">
        <Link href="/">Inicio</Link>
        {cats[0] && (
          <>
            {' / '}
            <Link href={`/categoria/${cats[0].slug}`}>{cats[0].name}</Link>
          </>
        )}
        {' / '}
        {p.title}
      </nav>

      <div className="product">
        <div>{images.length > 0 ? <Gallery images={images.map((i) => ({ src: i.full, thumb: i.thumb, alt: i.alt }))} /> : <SignTile kind={kind} className="sign-big" />}</div>
        <div>
          <h1>{p.title}</h1>
          {p.shortDescription && <p className="lead">{p.shortDescription}</p>}
          {(p.norms?.length ?? 0) > 0 && (
            <ul className="badges" aria-label="Normas">
              {p.norms!.map((n) => (
                <li key={n}>{NORMS[n] ?? n}</li>
              ))}
            </ul>
          )}
          {variants.length > 0 ? (
            <AddToCart
              product={{ id: p.id, slug: p.slug, title: p.title, image: images[0]?.thumb ?? null, kind }}
              variants={variants}
              customizable={Boolean(p.customizable)}
            />
          ) : (
            <p className="lead">Consulta el precio de este producto por WhatsApp.</p>
          )}
          <p className="ship-note">Despacho a todo Chile. Pagas sin crear cuenta.</p>
        </div>
      </div>

      {p.description && (
        <div className="prose">
          <h2>Descripción</h2>
          <RichText data={p.description} />
        </div>
      )}

      {related.length > 0 && (
        <div className="related">
          <h2>También te puede servir</h2>
          <ProductGrid products={related} />
        </div>
      )}
    </div>
  )
}
