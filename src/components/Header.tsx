import Link from 'next/link'
import type { CategoryNode } from '@/lib/data'
import { SHIPPING, SITE } from '@/lib/config'
import { clp } from '@/lib/format'
import { CartLink } from './CartLink'

export function Header({ tree }: { tree: CategoryNode[] }) {
  return (
    <header className="site-header">
      <div className="announce">
        Despacho a todo Chile. Envío gratis sobre {clp(SHIPPING.freeFrom)}.
      </div>
      <div className="header-main">
        <details className="mobile-menu">
          <summary aria-label="Abrir menú de categorías">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </summary>
          <nav className="mobile-panel" aria-label="Categorías">
            <Link href="/catalogo">Todo el catálogo</Link>
            {tree.map((c) => (
              <div key={c.id} className="mobile-group">
                <Link href={`/categoria/${c.slug}`} className="mobile-parent">
                  {c.name}
                </Link>
                {c.children.map((ch) => (
                  <Link key={ch.id} href={`/categoria/${ch.slug}`}>
                    {ch.name}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </details>

        <Link href="/" className="logo">
          <svg width="30" height="30" viewBox="0 0 100 100" aria-hidden="true">
            <path
              d="M50 11 93 86H7Z"
              fill="#611c1f"
              stroke="#fff"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            <rect x="46" y="38" width="8" height="25" rx="3" fill="#001E3C" />
            <circle cx="50" cy="73" r="4.6" fill="#001E3C" />
          </svg>
          {SITE.name}
        </Link>

        <form action="/buscar" className="search" role="search">
          <label htmlFor="q" className="sr-only">
            Buscar señales
          </label>
          <input
            id="q"
            name="q"
            type="search"
            placeholder="Buscar señales: no fumar, salida de emergencia, casco…"
          />
          <button type="submit">Buscar</button>
        </form>

        <a
          className="wsp-link"
          href={`https://wa.me/${SITE.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Cotizar por WhatsApp
        </a>
        <CartLink />
      </div>

      {tree.length > 0 && (
        <nav className="main-nav" aria-label="Categorías">
          <ul>
            {tree.map((c) => (
              <li key={c.id}>
                <Link href={`/categoria/${c.slug}`} className="nav-link">
                  <span>{c.name}</span>
                  {c.children.length > 0 && (
                    <svg
                      className="chev"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  )}
                </Link>
                {c.children.length > 0 && (
                  <ul className="dropdown">
                    {c.children.map((ch) => (
                      <li key={ch.id}>
                        <Link href={`/categoria/${ch.slug}`}>{ch.name}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
