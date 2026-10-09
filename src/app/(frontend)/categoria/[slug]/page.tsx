import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/JsonLd'
import { Pagination } from '@/components/Pagination'
import { ProductGrid } from '@/components/ProductCard'
import { SITE } from '@/lib/config'
import { descendantIds, findNode, getCategoryTree, listProducts, pathTo } from '@/lib/data'
import { mediaUrl } from '@/lib/media'

export const revalidate = 60
type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ pagina?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { tree } = await getCategoryTree()
  const cat = findNode(tree, slug)
  if (!cat) return {}
  const title = cat.meta?.title || cat.name
  const description = cat.meta?.description || cat.description || `Señalética de ${cat.name.toLowerCase()} normada. Despacho a todo Chile.`
  const img = mediaUrl(cat.meta?.image) || mediaUrl(cat.image)
  return { title, description, alternates: { canonical: `/categoria/${slug}` }, openGraph: { title, description, images: img ? [img] : undefined } }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const page = Math.max(1, Number((await searchParams).pagina) || 1)
  const { tree } = await getCategoryTree()
  const cat = findNode(tree, slug)
  if (!cat) notFound()

  const result = await listProducts({ categoryIds: descendantIds(cat), page })
  const trail = pathTo(tree, cat.id) ?? [cat]

  return (
    <div className="section">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [{ name: 'Inicio', url: SITE.url }, ...trail.map((n) => ({ name: n.name, url: `${SITE.url}/categoria/${n.slug}` }))].map((it, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: it.name,
            item: it.url,
          })),
        }}
      />
      <nav className="crumbs" aria-label="Ruta">
        <Link href="/">Inicio</Link>
        {trail.map((n) => (
          <span key={n.id}>
            {' / '}
            {n.id === cat.id ? n.name : <Link href={`/categoria/${n.slug}`}>{n.name}</Link>}
          </span>
        ))}
      </nav>
      <h1>{cat.name}</h1>
      {cat.description && <p className="lead">{cat.description}</p>}

      {cat.children.length > 0 && (
        <div className="chips">
          {cat.children.map((c) => (
            <Link key={c.id} href={`/categoria/${c.slug}`}>
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {result.docs.length === 0 ? (
        <p className="empty">Todavía no hay productos en esta categoría.</p>
      ) : (
        <>
          <p className="result-count">{result.totalDocs} productos</p>
          <ProductGrid products={result.docs} />
          <Pagination page={page} totalPages={result.totalPages} basePath={`/categoria/${slug}`} />
        </>
      )}
    </div>
  )
}
