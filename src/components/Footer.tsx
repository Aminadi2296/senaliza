import Link from 'next/link'
import Image from 'next/image'
import type { CategoryNode } from '@/lib/data'
import { SITE } from '@/lib/config'

export function Footer({ tree }: { tree: CategoryNode[] }) {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <Link href="/" className="footer-brand">
            <Image src="/logo-white.svg" alt={SITE.name} width={298} height={56} />
          </Link>
          <p>Fabricamos señalética de seguridad normada para empresas, obras, condominios y colegios.</p>
        </div>
        <div>
          <p className="footer-title">Categorías</p>
          <ul className="footer-categories">
            {tree.map((c) => (
              <li key={c.id}>
                <Link href={`/categoria/${c.slug}`}>{c.name}</Link>
              </li>
            ))}
            <li>
              <Link href="/catalogo">Todo el catálogo</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="footer-title">Contacto</p>
          <ul>
            <li>
              <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </li>
            <li>
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </li>
          </ul>
        </div>
      </div>
      <p className="footer-legal">
        © {new Date().getFullYear()} {SITE.name}. Precios en pesos chilenos, IVA incluido.
      </p>
    </footer>
  )
}
