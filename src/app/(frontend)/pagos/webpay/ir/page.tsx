import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getClient } from '@/lib/data'
import { createWebpayTransaction } from '@/lib/payments/webpay'
import { AutoPostForm } from '../AutoPostForm'

export const metadata: Metadata = { title: 'Redirigiendo a Webpay', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

/** Crea una transacción nueva en Webpay para el pedido (sirve para el primer intento y para reintentos). */
export default async function GoToWebpay({ searchParams }: { searchParams: Promise<{ n?: string; t?: string }> }) {
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

  let start
  try {
    start = await createWebpayTransaction({ orderNumber: order.orderNumber, total: order.total })
  } catch (e) {
    console.error('No se pudo iniciar Webpay', e)
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

  await payload.update({
    collection: 'orders',
    id: order.id,
    data: { payment: { ...order.payment, provider: 'webpay', token: start.token, detail: 'Pago iniciado en Webpay' } },
  })

  return (
    <div className="section">
      <AutoPostForm action={start.url} token={start.token} />
    </div>
  )
}
