import { randomBytes } from 'crypto'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { SITE } from '@/lib/config'
import { getClient } from '@/lib/data'
import { createGetnetSession } from '@/lib/payments/getnet'

export const metadata: Metadata = { title: 'Redirigiendo a Getnet', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

/** Crea una sesión nueva en Getnet para el pedido (primer intento y reintentos) y envía al cliente a pagar. */
export default async function GoToGetnet({ searchParams }: { searchParams: Promise<{ n?: string; t?: string }> }) {
  const { n, t } = await searchParams
  if (!n || !t) notFound()

  const payload = await getClient()
  const { docs } = await payload.find({
    collection: 'orders',
    where: { and: [{ orderNumber: { equals: n } }, { accessToken: { equals: t } }] },
    limit: 1,
    depth: 0,
  })
  const order = docs[0]
  if (!order) notFound()
  if (order.status !== 'pending') redirect(`/pedido/${order.orderNumber}?t=${t}`)

  const h = await headers()
  const forwarded = (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? '').trim()
  // El manual limita ipAddress a 16 caracteres; si llega una IPv6 se usa una IP local de respaldo
  const ip = /^\d{1,3}(\.\d{1,3}){3}$/.test(forwarded) ? forwarded : '127.0.0.1'

  // Getnet exige una referencia NUEVA en cada intento de pago (máx. 32 caracteres)
  const reference = `${order.orderNumber}-${randomBytes(2).toString('hex')}`
  const items = order.items.map((i) => `${i.quantity} x ${i.title}${i.variantLabel ? ` (${i.variantLabel})` : ''}`).join(', ')

  let session
  try {
    session = await createGetnetSession({
      reference,
      description: `Pedido ${order.orderNumber}: ${items}`,
      total: order.total,
      buyer: { name: order.customer.name, email: order.customer.email, phone: order.customer.phone ?? undefined },
      ip,
      userAgent: h.get('user-agent') ?? 'Mozilla/5.0',
      returnUrl: `${SITE.url}/pagos/getnet/retorno?r=${reference}`,
      cancelUrl: `${SITE.url}/pagos/getnet/retorno?r=${reference}&c=1`,
    })
  } catch (e) {
    console.error('[getnet] no se pudo crear la sesión', e)
    return (
      <div className="section empty">
        <h1>No pudimos iniciar el pago</h1>
        <p>Tu pedido {order.orderNumber} quedó registrado. Intenta de nuevo en unos minutos o escríbenos por WhatsApp.</p>
        <a className="btn btn-primary" href={`/pedido/${order.orderNumber}?t=${t}`}>
          Ver mi pedido
        </a>
      </div>
    )
  }
  console.info('[getnet] sesión creada', { pedido: order.orderNumber, requestId: session.requestId, referencia: reference })

  await payload.update({
    collection: 'orders',
    id: order.id,
    data: { payment: { ...order.payment, provider: 'getnet', token: session.requestId, transactionId: reference, detail: 'Pago iniciado en Getnet' } },
  })

  redirect(session.processUrl) // fuera de try/catch: redirect() funciona lanzando una excepción interna
}
