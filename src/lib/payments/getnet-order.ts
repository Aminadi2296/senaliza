import { getClient } from '@/lib/data'
import { getGetnetSession, interpretGetnet } from './getnet'

/** La referencia que enviamos a Getnet es "<N° de pedido>-<sufijo>" (única por intento de pago). */
export const orderNumberFromReference = (ref: string) => (ref.includes('-') ? ref.slice(0, ref.lastIndexOf('-')) : ref)

export type Settled = {
  outcome: 'approved' | 'rejected' | 'pending' | 'invalid' | 'ignored'
  order?: { id: number; orderNumber: string; accessToken?: string | null }
}

/**
 * Consulta a Getnet (con nuestras credenciales) el estado de una sesión y actualiza el pedido.
 * Es la ÚNICA vía por la que un pedido pasa a "Pagado": ni el retorno del cliente ni la notificación se dan por buenos sin esta consulta.
 * Se puede ejecutar varias veces sobre la misma sesión sin duplicar nada.
 */
export async function settleGetnet(requestId: string): Promise<Settled> {
  const info = await getGetnetSession(requestId)
  const result = interpretGetnet(info)
  console.info('[getnet] consulta', { requestId, estado: result.state, referencia: result.reference, total: result.total })
  if (!result.reference) return { outcome: 'invalid' }

  const payload = await getClient()
  const found = await payload.find({
    collection: 'orders',
    where: { orderNumber: { equals: orderNumberFromReference(result.reference) } },
    limit: 1,
    depth: 0,
  })
  const order = found.docs[0]
  if (!order) return { outcome: 'invalid' }
  const ref = { id: order.id, orderNumber: order.orderNumber, accessToken: order.accessToken }

  if (order.status !== 'pending') {
    return { outcome: ['paid', 'processing', 'shipped', 'delivered'].includes(order.status) ? 'approved' : 'ignored', order: ref }
  }

  if (result.state === 'approved') {
    // El monto aprobado debe ser exactamente el del pedido
    if (result.currency !== 'CLP' || result.total !== order.total) {
      console.error('[getnet] monto no coincide', { pedido: order.orderNumber, esperado: order.total, recibido: result.total, moneda: result.currency })
      await payload.update({
        collection: 'orders',
        id: order.id,
        data: { payment: { ...order.payment, provider: 'getnet', detail: `Getnet aprobó ${result.total} ${result.currency}, pero el pedido es de ${order.total} CLP. Revisar a mano.` } },
      })
      return { outcome: 'invalid', order: ref }
    }
    const p = result.payment ?? {}
    // Solo actualiza si sigue pendiente: evita que el retorno y la notificación lo procesen dos veces a la vez
    await payload.update({
      collection: 'orders',
      where: { and: [{ id: { equals: order.id } }, { status: { equals: 'pending' } }] },
      data: {
        status: 'paid',
        payment: {
          ...order.payment,
          provider: 'getnet',
          token: requestId,
          transactionId: result.reference,
          internalReference: p.internalReference,
          authorizationCode: p.authorization,
          cardLast4: p.lastDigits,
          installments: p.installments,
          paidAt: new Date().toISOString(),
          detail: `Pago aprobado por Getnet. Recibo ${p.receipt ?? '-'}, ${p.method ?? p.franchise ?? 'tarjeta'}${p.issuer ? ` (${p.issuer})` : ''}.`,
        },
      },
    })
    return { outcome: 'approved', order: ref }
  }

  const detail =
    result.state === 'rejected'
      ? `Pago rechazado por Getnet${result.message ? `: ${result.message}` : ''}`
      : `Pago aún sin resultado final en Getnet${result.message ? ` (${result.message})` : ''}`
  await payload.update({ collection: 'orders', id: order.id, data: { payment: { ...order.payment, provider: 'getnet', detail } } })
  return { outcome: result.state === 'rejected' ? 'rejected' : 'pending', order: ref }
}
