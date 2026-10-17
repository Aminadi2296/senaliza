import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ClearCart } from '@/components/CartProvider'
import { SITE } from '@/lib/config'
import { getClient } from '@/lib/data'
import { clp } from '@/lib/format'

export const metadata: Metadata = { title: 'Tu pedido', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const PAID = ['paid', 'processing', 'shipped', 'delivered']
const NOTICE: Record<string, string> = {
  rechazado: 'Tu banco no autorizó el pago. Puedes intentar con otra tarjeta.',
  anulado: 'El pago fue anulado o se agotó el tiempo. Tu pedido sigue guardado y puedes reintentar.',
  pendiente: 'Tu pago aún está siendo confirmado. Revisa esta página en unos minutos; si te cobraron, no necesitas pagar de nuevo.',
  error: 'No pudimos confirmar tu pago. Si te cobraron, escríbenos por WhatsApp con tu número de pedido.',
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ numero: string }>
  searchParams: Promise<{ t?: string; pago?: string }>
}) {
  const { numero } = await params
  const { t, pago } = await searchParams
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

  const paid = PAID.includes(order.status)
  const provider = order.payment?.provider
  const bank = process.env.BANK_DETAILS?.split('\\n').filter(Boolean)
  const wspHref = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`Hola, consulta por mi pedido ${order.orderNumber}`)}`

  return (
    <div className="section order-page">
      {/* El carrito se vacía cuando el pedido está pagado, o si eligió transferencia. Si el pago falló, se conserva. */}
      {(paid || provider === 'transferencia') && <ClearCart />}

      <p className={paid ? 'order-ok' : 'order-ok order-wait'}>{paid ? 'Pago confirmado' : 'Pedido recibido'}</p>
      <h1>Gracias, {order.customer.name.split(' ')[0]}</h1>
      <p className="lead">
        Tu número de pedido es <strong>{order.orderNumber}</strong>. Guárdalo para cualquier consulta.
      </p>

      {pago && NOTICE[pago] && !paid && (
        <p className="alert" role="alert">
          {NOTICE[pago]}
        </p>
      )}

      {paid ? (
        <div className="panel">
          <h2>Pago recibido</h2>
          <p>
            Pagaste {clp(order.total)}
            {order.payment?.cardLast4 ? ` con la tarjeta terminada en ${order.payment.cardLast4}` : ''}. Estamos preparando tu pedido y te avisaremos del despacho.
          </p>
        </div>
      ) : provider === 'getnet' ? (
        <div className="panel">
          <h2>Falta completar el pago</h2>
          <p>Tu pedido está guardado, pero aún no registramos el pago de {clp(order.total)}.</p>
          <a className="btn btn-yellow" href={`/pagos/getnet/ir?n=${order.orderNumber}&t=${t}`}>
            Pagar con Getnet
          </a>
          <p className="muted small">
            ¿Problemas con el pago?{' '}
            <a href={wspHref} target="_blank" rel="noopener noreferrer">
              Escríbenos por WhatsApp
            </a>
            .
          </p>
        </div>
      ) : (
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
      )}

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
