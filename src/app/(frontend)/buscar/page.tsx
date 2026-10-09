import type { Metadata } from 'next'
import { Pagination } from '@/components/Pagination'
import { ProductGrid } from '@/components/ProductCard'
import { listProducts } from '@/lib/data'

export const metadata: Metadata = { title: 'Buscar', robots: { index: false, follow: true } }

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string; pagina?: string }> }) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim().slice(0, 80)
  const page = Math.max(1, Number(sp.pagina) || 1)
  const result = q ? await listProducts({ q, page }) : null
  return (
    <div className="section">
      <h1>{q ? `Resultados para “${q}”` : 'Buscar señales'}</h1>
      {!q && <p className="empty">Escribe qué señal necesitas, por ejemplo “no fumar” o “extintor”.</p>}
      {result && result.docs.length === 0 && (
        <p className="empty">No encontramos señales para “{q}”. Prueba con otra palabra o escríbenos por WhatsApp y la fabricamos.</p>
      )}
      {result && result.docs.length > 0 && (
        <>
          <ProductGrid products={result.docs} />
          <Pagination page={page} totalPages={result.totalPages} basePath="/buscar" query={{ q }} />
        </>
      )}
    </div>
  )
}
