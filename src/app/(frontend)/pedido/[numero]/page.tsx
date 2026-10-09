import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ClearCart } from '@/components/CartProvider'
import { SITE } from '@/lib/config'
import { getClient } from '@/lib/data'
import { clp } from '@/lib/format'

export const metadata: Metadata = { title: 'Pedido recibido', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function OrderPage({ params, searchParams }: { params: Promise<{ numero: string }>; searchParams: Promise<{ t?: string }> }) {
  const { numero } = await params
  const { t } = await searchParams
  if (!t) notFound()

  const payload = await getClient()
  const { docs } = await payload.find({
    collection: 'orders',
    where: { and: [{ orderNumber: { equals: numero } }, { accessToken: { equals: t } }] },
    limit: 1,
    depth: 0,
  })
  const order = docs[0]
  if (!order) notFound()

  const bank = process.env.BANK_DETAILS?.split('\\n').filter(Boolean)

  return (
    <div className="section order-page">
      <ClearCart />
      <p className="order-ok">Pedido recibido</p>
      <h1>Gracias, {order.customer.name.split(' ')[0]}</h1>
      <p className="lead">
        Tu número de pedido es <strong>{order.orderNumber}</strong>. Guárdalo para cualquier consulta.
      </p>

      <div className="panel">
        <h2>Cómo pagar</h2>
        {bank && bank.length > 0 ? (
          <>
            <p>Transfiere {clp(order.total)} a esta cuenta e indica tu número de pedido:</p>
            <ul className="bank">{bank.map((l) => <li key={l}>{l}</li>)}</ul>
          </>
        ) : (
          <p>Te enviaremos los datos de transferencia a {order.customer.email} y por WhatsApp al {order.customer.phone}.</p>
        )}
        <p>
          Cuando recibamos el pago, preparamos tu pedido.{' '}
          <a href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`Hola, pagué el pedido ${order.orderNumber}`)}`} target="_blank" rel="noopener noreferrer">
            Avísanos por WhatsApp
          </a>{' '}
          si quieres que lo revisemos antes.
        </p>
      </div>

      <div className="panel">
        <h2>Detalle</h2>
        <ul className="mini-list">
          {order.items.map((i) => (
            <li key={i.id ?? i.sku}>
              <span>
                {i.quantity} × {i.title}
                <small>{i.variantLabel}</small>
              </span>
              <span>{clp(i.unitPrice * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl>
          <div><dt>Subtotal</dt><dd>{clp(order.subtotal)}</dd></div>
          <div><dt>Envío</dt><dd>{order.shippingCost ? clp(order.shippingCost) : 'Gratis'}</dd></div>
          <div className="total"><dt>Total</dt><dd>{clp(order.total)}</dd></div>
        </dl>
        <p className="muted small">
          Despacho a {order.shipping?.address}, {order.shipping?.comuna}, {order.shipping?.region}.
        </p>
      </div>
      <Link href="/catalogo" className="btn btn-primary">
        Seguir comprando
      </Link>
    </div>
  )
}
