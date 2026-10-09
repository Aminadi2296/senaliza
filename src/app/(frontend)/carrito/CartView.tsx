'use client'

import Link from 'next/link'
import { SignTile } from '@/components/SignTile'
import { useCart } from '@/components/CartProvider'
import { SHIPPING, shippingFor } from '@/lib/config'
import { clp } from '@/lib/format'

export function CartView() {
  const { items, ready, subtotal, setQty, remove } = useCart()
  if (!ready) return <p className="empty">Cargando carrito…</p>
  if (items.length === 0)
    return (
      <div className="empty">
        <p>Tu carrito está vacío.</p>
        <Link href="/catalogo" className="btn btn-primary">
          Ver catálogo
        </Link>
      </div>
    )

  const shipping = shippingFor(subtotal)
  const missing = SHIPPING.freeFrom - subtotal
  const pct = Math.min(100, Math.round((subtotal / SHIPPING.freeFrom) * 100))

  return (
    <div className="cart-layout">
      <ul className="cart-list">
        {items.map((i) => (
          <li key={i.key} className="cart-item">
            <Link href={`/producto/${i.slug}`} className="cart-thumb">
              {i.image ? <img src={i.image} alt="" width={120} height={120} /> : <SignTile kind={i.kind} />}
            </Link>
            <div className="cart-info">
              <Link href={`/producto/${i.slug}`}>{i.title}</Link>
              <span className="muted">{i.variantLabel}</span>
              {i.customization && <span className="muted">Personalización: {i.customization}</span>}
              <button type="button" className="link-btn" onClick={() => remove(i.key)}>
                Quitar
              </button>
            </div>
            <div className="qty" role="group" aria-label={`Cantidad de ${i.title}`}>
              <button type="button" onClick={() => setQty(i.key, i.qty - 1)} aria-label="Menos">−</button>
              <input type="number" min={1} value={i.qty} onChange={(e) => setQty(i.key, Number(e.target.value))} aria-label="Cantidad" />
              <button type="button" onClick={() => setQty(i.key, i.qty + 1)} aria-label="Más">+</button>
            </div>
            <p className="cart-line">{clp(i.price * i.qty)}</p>
          </li>
        ))}
      </ul>

      <aside className="summary">
        <h2>Resumen</h2>
        <div className="ship-progress">
          <p>{missing > 0 ? `Te faltan ${clp(missing)} para el envío gratis` : 'Tienes envío gratis'}</p>
          <div className="bar"><span style={{ width: `${pct}%` }} /></div>
        </div>
        <dl>
          <div><dt>Subtotal</dt><dd>{clp(subtotal)}</dd></div>
          <div><dt>Envío</dt><dd>{shipping === 0 ? 'Gratis' : clp(shipping)}</dd></div>
          <div className="total"><dt>Total</dt><dd>{clp(subtotal + shipping)}</dd></div>
        </dl>
        <Link href="/checkout" className="btn btn-yellow btn-block">
          Ir a pagar
        </Link>
        <p className="muted small">No necesitas crear una cuenta.</p>
      </aside>
    </div>
  )
}
