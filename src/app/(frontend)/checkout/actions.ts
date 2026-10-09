'use server'

import { randomBytes } from 'crypto'
import { redirect } from 'next/navigation'
import { REGIONES, shippingFor } from '@/lib/config'
import { getClient } from '@/lib/data'
import { MATERIALS } from '@/lib/config'

export type CheckoutState = { error?: string; values?: Record<string, string> } | null

type CartLine = { productId: number; sku: string; qty: number; customization?: string }

const str = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? '').trim().slice(0, max)

export async function createOrder(_prev: CheckoutState, fd: FormData): Promise<CheckoutState> {
  const values: Record<string, string> = {}
  for (const [k, v] of fd.entries()) if (k !== 'cart' && typeof v === 'string' && !k.startsWith('$')) values[k] = v

  // 1) Datos del cliente
  const name = str(fd, 'name')
  const email = str(fd, 'email').toLowerCase()
  const phone = str(fd, 'phone', 30)
  const region = str(fd, 'region')
  const comuna = str(fd, 'comuna')
  const address = str(fd, 'address', 300)
  if (!name || !comuna || !address) return { error: 'Completa nombre, comuna y dirección.', values }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Revisa el email: parece incompleto.', values }
  if (phone.replace(/\D/g, '').length < 8) return { error: 'Ingresa un teléfono de contacto válido.', values }
  if (!REGIONES.includes(region)) return { error: 'Selecciona tu región.', values }

  // 2) Carrito (solo se confía en id, sku y cantidad; el precio se lee de la base de datos)
  let lines: CartLine[] = []
  try {
    const parsed = JSON.parse(String(fd.get('cart') ?? '[]'))
    if (Array.isArray(parsed)) {
      lines = parsed
        .map((l) => ({
          productId: Number(l.productId),
          sku: String(l.sku ?? ''),
          qty: Math.floor(Number(l.qty)),
          customization: typeof l.customization === 'string' ? l.customization.slice(0, 500) : undefined,
        }))
        .filter((l) => Number.isInteger(l.productId) && l.sku && l.qty >= 1 && l.qty <= 999)
        .slice(0, 50)
    }
  } catch {}
  if (lines.length === 0) return { error: 'Tu carrito está vacío.', values }

  const payload = await getClient()
  const { docs: products } = await payload.find({
    collection: 'products',
    where: { and: [{ id: { in: [...new Set(lines.map((l) => l.productId))] } }, { _status: { equals: 'published' } }] },
    limit: 100,
    depth: 0,
  })

  const items = []
  for (const l of lines) {
    const product = products.find((p) => p.id === l.productId)
    const variant = product?.variants?.find((v) => v.sku === l.sku)
    if (!product || !variant) return { error: 'Un producto de tu carrito ya no está disponible. Revisa el carrito y vuelve a intentar.', values }
    if (variant.trackStock && (variant.stock ?? 0) < l.qty)
      return { error: `No hay stock suficiente de “${product.title}” (${variant.size}). Disponible: ${variant.stock ?? 0}.`, values }
    items.push({
      product: product.id,
      title: product.title,
      variantLabel: `${variant.size}, ${MATERIALS[variant.material] ?? variant.material}`,
      sku: variant.sku,
      unitPrice: variant.price,
      quantity: l.qty,
      customization: l.customization,
    })
  }

  const subtotal = items.reduce((n, i) => n + i.unitPrice * i.quantity, 0)
  const shippingCost = shippingFor(subtotal)

  // 3) Crear el pedido
  const d = new Date()
  const stamp = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const orderNumber = `SEN-${stamp}-${randomBytes(3).toString('hex').toUpperCase()}`
  const accessToken = randomBytes(16).toString('hex')

  try {
    await payload.create({
      collection: 'orders',
      data: {
        orderNumber,
        accessToken,
        status: 'pending',
        customer: { name, email, phone, rut: str(fd, 'rut', 20) || undefined, companyName: str(fd, 'company') || undefined },
        shipping: { region, comuna, address },
        items,
        subtotal,
        shippingCost,
        total: subtotal + shippingCost,
        payment: { provider: 'transferencia' },
        notes: str(fd, 'notes', 500) || undefined,
      },
    })
  } catch (e) {
    console.error('Error al crear pedido', e)
    return { error: 'No pudimos registrar tu pedido. Intenta de nuevo o escríbenos por WhatsApp.', values }
  }

  redirect(`/pedido/${orderNumber}?t=${accessToken}`)
}
