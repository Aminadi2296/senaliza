import type { Metadata } from 'next'
import { CartView } from './CartView'

export const metadata: Metadata = { title: 'Carrito', robots: { index: false } }

export default function CartPage() {
  return (
    <div className="section">
      <h1>Tu carrito</h1>
      <CartView />
    </div>
  )
}
