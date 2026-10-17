import { NextResponse, type NextRequest } from 'next/server'
import { verifyGetnetSignature, type GetnetNotification } from '@/lib/payments/getnet'
import { settleGetnet } from '@/lib/payments/getnet-order'

export const dynamic = 'force-dynamic'

/**
 * Notificación asíncrona de Getnet (POST con JSON) cuando el pago queda aprobado o rechazado.
 * Esta URL debe entregarse a Getnet en el Formulario de Validación: https://TU-DOMINIO/pagos/getnet/notificacion
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as GetnetNotification | null
  if (!body?.requestId || !body.status || !body.signature) return NextResponse.json({ ok: false }, { status: 400 })

  if (!verifyGetnetSignature(body)) {
    console.warn('[getnet] notificación con firma inválida', { requestId: body.requestId })
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  try {
    const res = await settleGetnet(String(body.requestId))
    console.info('[getnet] notificación procesada', { requestId: body.requestId, resultado: res.outcome })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[getnet] error al procesar la notificación', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
