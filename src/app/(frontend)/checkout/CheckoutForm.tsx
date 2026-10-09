'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useCart } from '@/components/CartProvider'
import { REGIONES, SHIPPING, shippingFor } from '@/lib/config'
import { clp } from '@/lib/format'
import { createOrder, type CheckoutState } from './actions'

export function CheckoutForm() {
  const { items, ready, subtotal } = useCart()
  const [state, action, pending] = useActionState<CheckoutState, FormData>(createOrder, null)
  const v = state?.values ?? {}

  if (!ready) return <p className="empty">Cargando…</p>
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
  const cart = JSON.stringify(items.map((i) => ({ productId: i.productId, sku: i.sku, qty: i.qty, customization: i.customization })))

  return (
    <form action={action} className="cart-layout checkout">
      <input type="hidden" name="cart" value={cart} />
      <div className="checkout-fields">
        {state?.error && (
          <p className="alert" role="alert">
            {state.error}
          </p>
        )}

        <fieldset>
          <legend>Tus datos</legend>
          <label className="field">
            <span>Nombre y apellido</span>
            <input name="name" autoComplete="name" required defaultValue={v.name} />
          </label>
          <div className="two">
            <label className="field">
              <span>Email</span>
              <input name="email" type="email" autoComplete="email" required defaultValue={v.email} />
            </label>
            <label className="field">
              <span>Teléfono</span>
              <input name="phone" type="tel" autoComplete="tel" required defaultValue={v.phone} placeholder="+56 9 1234 5678" />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Despacho</legend>
          <label className="field">
            <span>Región</span>
            <select name="region" required defaultValue={v.region ?? ''} autoComplete="address-level1">
              <option value="" disabled>
                Selecciona tu región
              </option>
              {REGIONES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <div className="two">
            <label className="field">
              <span>Comuna</span>
              <input name="comuna" required autoComplete="address-level2" defaultValue={v.comuna} />
            </label>
            <label className="field">
              <span>Dirección</span>
              <input name="address" required autoComplete="street-address" defaultValue={v.address} placeholder="Calle, número, depto u oficina" />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Empresa (opcional)</legend>
          <p className="muted small">Si compras para una empresa, déjanos los datos. La factura electrónica estará disponible próximamente.</p>
          <div className="two">
            <label className="field">
              <span>Razón social</span>
              <input name="company" defaultValue={v.company} />
            </label>
            <label className="field">
              <span>RUT</span>
              <input name="rut" defaultValue={v.rut} placeholder="12.345.678-9" />
            </label>
          </div>
          <label className="field">
            <span>Comentarios del pedido</span>
            <textarea name="notes" rows={2} maxLength={500} defaultValue={v.notes} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Pago</legend>
          <label className="pay-option is-on">
            <input type="radio" name="payment" value="transferencia" defaultChecked readOnly />
            <span>
              <strong>Transferencia bancaria</strong>
              <small>Al confirmar, te mostramos los datos para transferir. Preparamos tu pedido cuando recibimos el pago.</small>
            </span>
          </label>
          <p className="muted small">Pago con tarjeta (Webpay) disponible próximamente.</p>
        </fieldset>
      </div>

      <aside className="summary">
        <h2>Tu pedido</h2>
        <ul className="mini-list">
          {items.map((i) => (
            <li key={i.key}>
              <span>
                {i.qty} × {i.title}
                <small>{i.variantLabel}</small>
              </span>
              <span>{clp(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <dl>
          <div><dt>Subtotal</dt><dd>{clp(subtotal)}</dd></div>
          <div><dt>Envío</dt><dd>{shipping === 0 ? 'Gratis' : clp(shipping)}</dd></div>
          <div className="total"><dt>Total</dt><dd>{clp(subtotal + shipping)}</dd></div>
        </dl>
        {shipping > 0 && <p className="muted small">Agrega {clp(SHIPPING.freeFrom - subtotal)} más y el envío es gratis.</p>}
        <button type="submit" className="btn btn-yellow btn-block" disabled={pending}>
          {pending ? 'Creando tu pedido…' : 'Confirmar pedido'}
        </button>
        <p className="muted small">
          <Link href="/carrito">Volver al carrito</Link>
        </p>
      </aside>
    </form>
  )
}
