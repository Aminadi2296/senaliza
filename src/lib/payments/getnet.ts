import { createHash, randomBytes, timingSafeEqual } from 'crypto'

/**
 * Getnet (Santander) — API Web Checkout, manual de integración v2.3.
 * Ambientes: test  -> https://checkout.test.getnet.cl   |   production -> https://checkout.getnet.cl
 * Variables de entorno: GETNET_ENV (test | production), GETNET_LOGIN, GETNET_SECRET_KEY.
 */
export const getnetIsTest = () => process.env.GETNET_ENV !== 'production'
const baseUrl = () => (getnetIsTest() ? 'https://checkout.test.getnet.cl' : 'https://checkout.getnet.cl')

const credentials = () => {
  const login = process.env.GETNET_LOGIN
  const secret = process.env.GETNET_SECRET_KEY
  if (!login || !secret) throw new Error('Faltan GETNET_LOGIN y GETNET_SECRET_KEY.')
  return { login, secret }
}

/** Objeto `auth` que va en cada petición: tranKey = Base64(SHA-256(nonce + seed + secretKey)), con el nonce SIN codificar. */
export function buildAuth(secretOverride?: string, now = new Date(), rawNonce = randomBytes(16).toString('hex')) {
  const { login, secret } = secretOverride ? { login: process.env.GETNET_LOGIN ?? '', secret: secretOverride } : credentials()
  const seed = now.toISOString()
  const tranKey = createHash('sha256').update(rawNonce + seed + secret).digest('base64')
  return { login, tranKey, nonce: Buffer.from(rawNonce).toString('base64'), seed }
}

/** La API reserva estos caracteres: no pueden viajar en ningún texto. */
export const clean = (s: string, max = 255) => s.replace(/[\[\]{}|"'\\*=~¡!]/g, '').replace(/\s+/g, ' ').trim().slice(0, max)

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
    cache: 'no-store',
  })
  const json = (await res.json().catch(() => null)) as T | null
  if (!json) throw new Error(`Getnet respondió ${res.status} sin contenido JSON.`)
  return json
}

type GStatus = { status: string; reason?: string; message?: string; date?: string }

export type GetnetSession = { requestId: string; processUrl: string }

/** createRequest: crea la sesión de pago y devuelve la URL a la que hay que enviar al cliente. */
export async function createGetnetSession(input: {
  reference: string // única por intento de pago (máx. 32 caracteres)
  description: string
  total: number
  buyer: { name: string; email: string; phone?: string }
  ip: string
  userAgent: string
  returnUrl: string
  cancelUrl: string
}): Promise<GetnetSession> {
  const [first, ...rest] = clean(input.buyer.name, 120).split(' ')
  const body = {
    auth: buildAuth(),
    locale: 'es_CL',
    buyer: {
      name: clean(first ?? '', 60),
      ...(rest.length ? { surname: clean(rest.join(' '), 60) } : {}),
      email: clean(input.buyer.email, 120),
      ...(input.buyer.phone ? { mobile: input.buyer.phone.replace(/[^\d+]/g, '').slice(0, 30) } : {}),
    },
    payment: {
      reference: clean(input.reference, 32),
      description: clean(input.description, 255),
      amount: { currency: 'CLP', total: Math.round(input.total) },
    },
    expiration: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min, lo recomendado por Getnet
    ipAddress: input.ip,
    userAgent: clean(input.userAgent, 255),
    returnUrl: input.returnUrl,
    cancelUrl: input.cancelUrl,
  }
  const res = await post<{ status: GStatus; requestId?: number | string; processUrl?: string }>('/api/session', body)
  if (res.status?.status !== 'OK' || !res.requestId || !res.processUrl)
    throw new Error(`Getnet no creó la sesión: ${res.status?.status ?? '?'} ${res.status?.reason ?? ''} ${res.status?.message ?? ''}`.trim())
  return { requestId: String(res.requestId), processUrl: res.processUrl.trim() }
}

/** getRequestInformation: estado actual de una sesión. Se puede consultar más de una vez. */
export async function getGetnetSession(requestId: string) {
  return post<GetnetInfo>(`/api/session/${encodeURIComponent(requestId)}`, { auth: buildAuth() })
}

/** Reversa (anulación) de un pago aprobado el mismo día, con la referencia interna de Getnet. */
export async function reverseGetnetPayment(internalReference: string) {
  return post<{ status: GStatus }>('/api/reverse', { auth: buildAuth(), internalReference })
}

// ---------- Interpretación de la respuesta ----------

type GField = { keyword: string; value: string | number }
type GPayment = {
  status: GStatus
  internalReference?: number | string
  reference?: string
  authorization?: string
  receipt?: string
  franchise?: string
  issuerName?: string
  paymentMethodName?: string
  amount?: { from?: { total: number | string; currency: string }; to?: { total: number | string; currency: string } }
  processorFields?: GField[]
}
export type GetnetInfo = {
  requestId?: number | string
  status?: GStatus
  request?: { payment?: { reference?: string; amount?: { currency?: string; total?: number | string } } }
  payment?: GPayment[]
}

export type GetnetResult = {
  state: 'approved' | 'rejected' | 'pending' | 'unknown'
  reference?: string
  total?: number
  currency?: string
  message?: string
  payment?: {
    internalReference?: string
    authorization?: string
    receipt?: string
    franchise?: string
    issuer?: string
    method?: string
    lastDigits?: string
    installments?: number
    cardType?: string
  }
}

export function interpretGetnet(info: GetnetInfo): GetnetResult {
  const overall = info.status?.status
  const approvedTx = (info.payment ?? []).find((p) => p.status?.status === 'APPROVED')
  const field = (p: GPayment | undefined, key: string) => p?.processorFields?.find((f) => f.keyword === key)?.value
  const reqAmount = info.request?.payment?.amount

  const base: GetnetResult = {
    state: 'unknown',
    reference: info.request?.payment?.reference,
    total: reqAmount?.total !== undefined ? Number(reqAmount.total) : undefined,
    currency: reqAmount?.currency,
    message: info.status?.message,
  }
  if (overall === 'APPROVED' && approvedTx) {
    return {
      ...base,
      state: 'approved',
      payment: {
        internalReference: approvedTx.internalReference !== undefined ? String(approvedTx.internalReference) : undefined,
        authorization: approvedTx.authorization,
        receipt: approvedTx.receipt,
        franchise: approvedTx.franchise,
        issuer: approvedTx.issuerName,
        method: approvedTx.paymentMethodName,
        lastDigits: field(approvedTx, 'lastDigits') !== undefined ? String(field(approvedTx, 'lastDigits')) : undefined,
        installments: field(approvedTx, 'installments') !== undefined ? Number(field(approvedTx, 'installments')) : undefined,
        cardType: field(approvedTx, 'cardType') !== undefined ? String(field(approvedTx, 'cardType')) : undefined,
      },
    }
  }
  if (overall === 'REJECTED' || overall === 'FAILED') return { ...base, state: 'rejected' }
  if (overall === 'PENDING' || overall === 'OK') return { ...base, state: 'pending' }
  return base
}

// ---------- Notificaciones (POST asíncrono de Getnet) ----------

export type GetnetNotification = {
  status: { status: string; date: string; message?: string; reason?: string }
  requestId: number | string
  reference?: number | string
  signature: string
}

/** Firma = SHA-1( requestId + status + date + secretKey ), en hexadecimal. */
export function verifyGetnetSignature(n: GetnetNotification, secretOverride?: string): boolean {
  try {
    const secret = secretOverride ?? credentials().secret
    const expected = createHash('sha1').update(`${n.requestId}${n.status.status}${n.status.date}${secret}`).digest('hex')
    const given = Buffer.from(String(n.signature ?? '').toLowerCase())
    const exp = Buffer.from(expected)
    return given.length === exp.length && timingSafeEqual(given, exp)
  } catch {
    return false
  }
}
