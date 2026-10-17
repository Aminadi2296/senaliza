import { NextResponse, type NextRequest } from 'next/server'
import { SITE } from '@/lib/config'
import { getClient } from '@/lib/data'
import { orderNumberFromReference, settleGetnet } from '@/lib/payments/getnet-order'

export const dynamic = 'force-dynamic'

/**
 * Getnet devuelve al cliente aquí (GET) al terminar el pago (returnUrl) o si aborta (cancelUrl, con c=1).
 * El estado NO viene en la URL: se consulta a Getnet con nuestras credenciales antes de decidir nada.
 */
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('r') ?? ''
  const cancelled = req.nextUrl.searchParams.get('c') === '1'
  const payload = await getClient()

  const found = ref
    ? await payload.find({ collection: 'orders', where: { orderNumber: { equals: orderNumberFromReference(ref) } }, limit: 1, depth: 0 })
    : { docs: [] }
  const order = found.docs[0]
  if (!order) return NextResponse.redirect(`${SITE.url}/carrito`, 303)

  const back = (extra = '') => NextResponse.redirect(`${SITE.url}/pedido/${order.orderNumber}?t=${order.accessToken ?? ''}${extra}`, 303)
  const requestId = order.payment?.token
  if (!requestId) return back('&pago=error')

  try {
    const res = await settleGetnet(requestId)
    if (res.order && res.order.orderNumber !== order.orderNumber) return back('&pago=error')
    if (res.outcome === 'approved') return back()
    if (cancelled) return back('&pago=anulado')
    if (res.outcome === 'rejected') return back('&pago=rechazado')
    if (res.outcome === 'pending') return back('&pago=pendiente')
    return back('&pago=error')
  } catch (e) {
    console.error('[getnet] error al confirmar el pago en el retorno', e)
    return back('&pago=error')
  }
}
