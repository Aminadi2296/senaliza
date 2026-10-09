'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { clp } from '@/lib/format'
import type { SignKind } from '@/lib/signs'
import { useCart } from './CartProvider'

export type VariantOption = {
  sku: string
  label: string
  price: number
  compareAtPrice?: number | null
  available: boolean
  maxQty?: number
}

export function AddToCart({
  product,
  variants,
  customizable,
}: {
  product: { id: number; slug: string; title: string; image: string | null; kind: SignKind }
  variants: VariantOption[]
  customizable: boolean
}) {
  const router = useRouter()
  const { add } = useCart()
  const firstAvail = variants.find((v) => v.available) ?? variants[0]
  const [sku, setSku] = useState(firstAvail.sku)
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')
  const v = variants.find((x) => x.sku === sku) ?? firstAvail
  const cap = v.maxQty ?? 999

  const addNow = (silent = false) => {
    add(
      {
      productId: product.id,
      slug: product.slug,
      title: product.title,
      sku: v.sku,
      variantLabel: v.label,
      price: v.price,
      qty,
      image: product.image,
      kind: product.kind,
      customization: note.trim() || undefined,
      },
      { silent },
    )
  }

  return (
    <div className="buybox">
      <p className="buy-price">
        {clp(v.price)}
        {v.compareAtPrice && v.compareAtPrice > v.price && <s>{clp(v.compareAtPrice)}</s>}
      </p>

      <fieldset className="variants">
        <legend>Tamaño y material</legend>
        {variants.map((x) => (
          <label key={x.sku} className={`variant ${x.sku === sku ? 'is-on' : ''} ${x.available ? '' : 'is-off'}`}>
            <input type="radio" name="variant" value={x.sku} checked={x.sku === sku} disabled={!x.available} onChange={() => { setSku(x.sku); setQty(1) }} />
            <span>{x.label}</span>
            <span className="variant-price">{x.available ? clp(x.price) : 'Agotado'}</span>
          </label>
        ))}
      </fieldset>

      {customizable && (
        <label className="field">
          <span>Texto o detalle a personalizar (opcional)</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500} placeholder="Ej: nombre de la empresa, texto de la señal. El logo lo coordinamos por WhatsApp." />
        </label>
      )}

      <div className="buy-row">
        <div className="qty" role="group" aria-label="Cantidad">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Menos">−</button>
          <input type="number" min={1} max={cap} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(cap, Number(e.target.value) || 1)))} aria-label="Cantidad" />
          <button type="button" onClick={() => setQty((q) => Math.min(cap, q + 1))} aria-label="Más">+</button>
        </div>
        <button type="button" className="btn btn-primary" disabled={!v.available} onClick={() => addNow()}>
          Agregar al carrito
        </button>
      </div>
      <button
        type="button"
        className="btn btn-yellow"
        disabled={!v.available}
        onClick={() => {
          addNow(true)
          router.push('/checkout')
        }}
      >
        Comprar ahora
      </button>
    </div>
  )
}
