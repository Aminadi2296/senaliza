import { IntegrationApiKeys, IntegrationCommerceCodes, WebpayPlus } from 'transbank-sdk'
import { SITE } from '@/lib/config'

/** Webpay Plus. Sin variables de entorno usa el ambiente de integración (pruebas) con las credenciales públicas de Transbank. */
export const webpayIsTest = () => process.env.TBK_ENV !== 'production'

function client() {
  if (!webpayIsTest()) {
    const code = process.env.TBK_COMMERCE_CODE
    const key = process.env.TBK_API_KEY
    if (!code || !key) throw new Error('Faltan TBK_COMMERCE_CODE y TBK_API_KEY para operar en producción.')
    return WebpayPlus.Transaction.buildForProduction(code, key)
  }
  return WebpayPlus.Transaction.buildForIntegration(IntegrationCommerceCodes.WEBPAY_PLUS, IntegrationApiKeys.WEBPAY)
}

export type WebpayStart = { token: string; url: string }

export async function createWebpayTransaction(order: { orderNumber: string; total: number }): Promise<WebpayStart> {
  // buyOrder: máx. 26 caracteres, único por transacción
  const res = await client().create(order.orderNumber, order.orderNumber, order.total, `${SITE.url}/pagos/webpay/retorno`)
  if (!res?.token || !res?.url) throw new Error('Webpay no devolvió token o URL.')
  return { token: String(res.token), url: String(res.url) }
}

export const commitWebpay = (token: string) => client().commit(token)
export const statusWebpay = (token: string) => client().status(token)
