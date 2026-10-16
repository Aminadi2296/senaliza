import { NextResponse, type NextRequest } from 'next/server'
import { SITE } from '@/lib/config'
import { getClient } from '@/lib/data'
import { commitWebpay, statusWebpay } from '@/lib/payments/webpay'

export const dynamic = 'force-dynamic'

/**
 * Webpay devuelve al cliente aquí:
 *  - pago realizado: token_ws (por POST)
 *  - el cliente anuló o se agotó el tiempo: TBK_TOKEN y TBK_ORDEN_COMPRA (sin token_ws)
 * El pago solo se da por bueno si el SERVIDOR lo confirma con Transbank y el monto coincide con el pedido.
 */
async function handle(req: NextRequest) {
  const q = req.nextUrl.searchParams
  let tokenWs = q.get('token_ws')
  let tbkToken = q.get('TBK_TOKEN')
  let tbkOrder = q.get('TBK_ORDEN_COMPRA')
  if (req.method === 'POST') {
    const fd = await req.formData().catch(() => null)
    tokenWs ??= (fd?.get('token_ws') as string | null) ?? null
    tbkToken ??= (fd?.get('TBK_TOKEN') as string | null) ?? null
    tbkOrder ??= (fd?.get('TBK_ORDEN_COMPRA') as string | null) ?? null
  }

  const payload = await getClient()
  const findOrder = async (where: Record<string, unknown>) =>
    (await payload.find({ collection: 'orders', where: where as never, limit: 1, depth: 0 })).docs[0]
  const back = (o: { orderNumber: string; accessToken?: string | null }, extra = '') =>
    NextResponse.redirect(`${SITE.url}/pedido/${o.orderNumber}?t=${o.accessToken ?? ''}${extra}`, 303)

  // Pago normal
  if (tokenWs) {
    const order = await findOrder({ 'payment.token': { equals: tokenWs } })
    if (!order) return NextResponse.redirect(`${SITE.url}/carrito`, 303)
    if (order.status !== 'pending') return back(order) // ya procesado (por ejemplo, al recargar)

    let result
    try {
      result = await commitWebpay(tokenWs)
    } catch {
      try {
        result = await statusWebpay(tokenWs) // si ya se confirmó antes, consulta el estado
      } catch (e) {
        console.error('No se pudo confirmar el pago con Webpay', e)
        return back(order, '&pago=error')
      }
    }

    const approved =
      result.status === 'AUTHORIZED' &&
      result.response_code === 0 &&
      result.buy_order === order.orderNumber &&
      Number(result.amount) === order.total

    await payload.update({
      collection: 'orders',
      id: order.id,
      data: approved
        ? {
            status: 'paid',
            payment: {
              ...order.payment,
              provider: 'webpay',
              transactionId: String(result.buy_order),
              authorizationCode: String(result.authorization_code ?? ''),
              cardLast4: String(result.card_detail?.card_number ?? ''),
              installments: Number(result.installments_number ?? 0),
              paidAt: new Date().toISOString(),
              detail: 'Pago autorizado por Webpay',
            },
          }
        : { payment: { ...order.payment, detail: `Pago no autorizado (estado ${result.status}, código ${result.response_code})` } },
    })
    return back(order, approved ? '' : '&pago=rechazado')
  }

  // El cliente anuló el pago o se agotó el tiempo en Webpay
  if (tbkToken || tbkOrder) {
    const order = tbkOrder ? await findOrder({ orderNumber: { equals: tbkOrder } }) : await findOrder({ 'payment.token': { equals: tbkToken } })
    if (order) {
      if (order.status === 'pending')
        await payload.update({ collection: 'orders', id: order.id, data: { payment: { ...order.payment, detail: 'Pago anulado por el cliente o tiempo agotado' } } })
      return back(order, '&pago=anulado')
    }
  }
  return NextResponse.redirect(`${SITE.url}/carrito`, 303)
}

export const GET = handle
export const POST = handle
