import type { Metadata } from 'next'
import { Pagination } from '@/components/Pagination'
import { ProductGrid } from '@/components/ProductCard'
import { listProducts } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Catálogo de señalética',
  description: 'Todo el catálogo de señalética de seguridad normada: advertencia, prohibición, emergencia, evacuación, EPP, obras y más.',
  alternates: { canonical: '/catalogo' },
}
export const revalidate = 60

export default async function Catalog({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  const page = Math.max(1, Number((await searchParams).pagina) || 1)
  const result = await listProducts({ page })
  return (
    <div className="section">
      <h1>Catálogo</h1>
      {result.docs.length === 0 ? (
        <p className="empty">Todavía no hay productos publicados.</p>
      ) : (
        <>
          <p className="result-count">{result.totalDocs} productos</p>
          <ProductGrid products={result.docs} />
          <Pagination page={page} totalPages={result.totalPages} basePath="/catalogo" />
        </>
      )}
    </div>
  )
}
