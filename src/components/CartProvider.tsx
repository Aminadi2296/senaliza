'use client'

import Link from 'next/link'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { SignKind } from '@/lib/signs'

export type CartItem = {
  key: string
  productId: number
  slug: string
  title: string
  sku: string
  variantLabel: string
  price: number
  qty: number
  image: string | null
  kind: SignKind
  customization?: string
}

type Ctx = {
  items: CartItem[]
  ready: boolean
  count: number
  subtotal: number
  add: (item: Omit<CartItem, 'key'>, opts?: { silent?: boolean }) => void
  setQty: (key: string, qty: number) => void
  remove: (key: string) => void
  clear: () => void
}

const STORAGE_KEY = 'senaliza-cart-v1'
const CartContext = createContext<Ctx | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw))
    } catch {}
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {}
  }, [items, ready])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(t)
  }, [toast])

  const add = useCallback((item: Omit<CartItem, 'key'>, opts?: { silent?: boolean }) => {
    const key = `${item.sku}|${item.customization ?? ''}`
    setItems((prev) => {
      const hit = prev.find((i) => i.key === key)
      if (hit) return prev.map((i) => (i.key === key ? { ...i, qty: Math.min(999, i.qty + item.qty) } : i))
      return [...prev, { ...item, key }]
    })
    if (!opts?.silent) setToast(item.title)
  }, [])

  const setQty = useCallback(
    (key: string, qty: number) =>
      setItems((prev) => prev.map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(999, qty || 1)) } : i))),
    [],
  )
  const remove = useCallback((key: string) => setItems((prev) => prev.filter((i) => i.key !== key)), [])
  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<Ctx>(
    () => ({
      items,
      ready,
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotal: items.reduce((n, i) => n + i.qty * i.price, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [items, ready, add, setQty, remove, clear],
  )

  return (
    <CartContext.Provider value={value}>
      {children}
      {toast && (
        <div className="toast" role="status">
          <span>
            Agregado al carrito: <strong>{toast}</strong>
          </span>
          <Link href="/carrito" onClick={() => setToast(null)}>
            Ver carrito
          </Link>
          <Link href="/checkout" className="toast-pay" onClick={() => setToast(null)}>
            Pagar
          </Link>
        </div>
      )}
    </CartContext.Provider>
  )
}

/** Vacía el carrito al llegar a la confirmación del pedido. */
export function ClearCart() {
  const { clear } = useCart()
  useEffect(() => {
    clear()
  }, [clear])
  return null
}
