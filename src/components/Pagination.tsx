import Link from 'next/link'

export function Pagination({ page, totalPages, basePath, query = {} }: { page: number; totalPages: number; basePath: string; query?: Record<string, string> }) {
  if (totalPages <= 1) return null
  const href = (p: number) => {
    const qs = new URLSearchParams({ ...query, ...(p > 1 ? { pagina: String(p) } : {}) }).toString()
    return qs ? `${basePath}?${qs}` : basePath
  }
  const visiblePages = new Set([1, totalPages])
  for (let p = Math.max(1, page - 1); p <= Math.min(totalPages, page + 1); p++) visiblePages.add(p)
  const pages = [...visiblePages].sort((a, b) => a - b)
  const pageItems = pages.flatMap((p, index) => {
    const previous = pages[index - 1]
    return [...(previous && p - previous > 1 ? [{ type: 'ellipsis' as const, key: `ellipsis-${previous}-${p}` }] : []), { type: 'page' as const, page: p }]
  })

  return (
    <nav className="pagination" aria-label="Paginación">
      <div className="pagination-controls">
        {page > 1 ? (
          <Link className="pagination-link pagination-direction" href={href(page - 1)} aria-label="Ir a la página anterior">
            Anterior
          </Link>
        ) : (
          <span className="pagination-link pagination-direction is-disabled" aria-disabled="true">
            Anterior
          </span>
        )}
        {pageItems.map((item) =>
          item.type === 'ellipsis' ? (
            <span key={item.key} className="pagination-ellipsis" aria-hidden="true">
              …
            </span>
          ) : item.page === page ? (
            <span key={item.page} className="pagination-link is-current" aria-current="page" aria-label={`Página ${item.page}`}>
              {item.page}
            </span>
          ) : (
            <Link key={item.page} className="pagination-link" href={href(item.page)} aria-label={`Ir a la página ${item.page}`}>
              {item.page}
            </Link>
          ),
        )}
        {page < totalPages ? (
          <Link className="pagination-link pagination-direction" href={href(page + 1)} aria-label="Ir a la página siguiente">
            Siguiente
          </Link>
        ) : (
          <span className="pagination-link pagination-direction is-disabled" aria-disabled="true">
            Siguiente
          </span>
        )}
      </div>
    </nav>
  )
}
