'use client'

import Link from 'next/link'
import { useCart } from './CartProvider'

export function CartLink() {
  const { count, ready } = useCart()
  return (
    <Link href="/carrito" className="cart-link" aria-label={`Carrito, ${ready ? count : 0} productos`}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 4h2.5l2.2 10.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20 8H6.2" />
        <circle cx="9.5" cy="19" r="1.4" />
        <circle cx="17" cy="19" r="1.4" />
      </svg>
      <span className="cart-count">{ready ? count : 0}</span>
      <span className="cart-text">Carrito</span>
    </Link>
  )
}
