import Link from 'next/link'
import { ProductGrid } from '@/components/ProductCard'
import { SignTile } from '@/components/SignTile'
import { SHIPPING, SITE } from '@/lib/config'
import { getCategoryTree, listProducts } from '@/lib/data'
import { clp } from '@/lib/format'
import { signKind } from '@/lib/signs'

export const revalidate = 60

export default async function Home() {
  const { tree } = await getCategoryTree()
  const latest = await listProducts({ limit: 8 }).catch(() => null)

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <h1>Señalética de seguridad normada, fabricada y enviada a todo Chile</h1>
            <p>
              Advertencia, prohibición, evacuación, EPP y obras. Cumple DS 594, NCh 1410 y NCh 1411.
              Compras sin crear cuenta y envío gratis sobre {clp(SHIPPING.freeFrom)}.
            </p>
            <div className="hero-actions">
              <Link href="/catalogo" className="btn btn-yellow">
                Ver catálogo
              </Link>
              <a
                href={`https://wa.me/${SITE.whatsapp}`}
                className="btn btn-ghost"
                target="_blank"
                rel="noopener noreferrer"
              >
                Pedir cotización
              </a>
            </div>
          </div>
          <div className="hero-board" aria-hidden="true">
            <SignTile kind="warning" />
            <SignTile kind="prohibition" />
            <SignTile kind="evacuation" />
            <SignTile kind="mandatory" />
          </div>
        </div>
      </section>

      {latest && latest.docs.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Novedades</h2>
            <Link href="/catalogo">Ver todo</Link>
          </div>
          <ProductGrid products={latest.docs} />
        </section>
      )}

      <section className="section values">
        <div>
          <h3>Fabricación propia</h3>
          <p>Sin intermediarios: precio de fabricante y control de calidad en cada señal.</p>
        </div>
        <div>
          <h3>Normas chilenas</h3>
          <p>Colores, formas y pictogramas según DS 594, NCh 1410 y NCh 1411.</p>
        </div>
        <div>
          <h3>A tu medida</h3>
          <p>Tamaños, materiales y textos personalizados. Escríbenos y cotizamos por WhatsApp.</p>
        </div>
      </section>
    </>
  )
}
