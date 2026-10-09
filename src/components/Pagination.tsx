import Link from 'next/link'

export function Pagination({ page, totalPages, basePath, query = {} }: { page: number; totalPages: number; basePath: string; query?: Record<string, string> }) {
  if (totalPages <= 1) return null
  const href = (p: number) => {
    const qs = new URLSearchParams({ ...query, ...(p > 1 ? { pagina: String(p) } : {}) }).toString()
    return qs ? `${basePath}?${qs}` : basePath
  }
  return (
    <nav className="pagination" aria-label="Paginación">
      {page > 1 ? <Link href={href(page - 1)}>Anterior</Link> : <span />}
      <span>
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? <Link href={href(page + 1)}>Siguiente</Link> : <span />}
    </nav>
  )
}
