'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { SHIPPING } from '@/lib/config'
import { clp } from '@/lib/format'
import type { SignKind } from '@/lib/signs'
import { useCart } from './CartProvider'

export type VariantOption = {
  sku: string
  size: string
  material: string
  materialLabel: string
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
  const [material, setMaterial] = useState(firstAvail.material)
  const [size, setSize] = useState(firstAvail.size)
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')

  const materials = [...new Map(variants.map((x) => [x.material, x.materialLabel])).entries()]
  const sizesFor = (m: string) => variants.filter((x) => x.material === m)
  const v = sizesFor(material).find((x) => x.size === size) ?? sizesFor(material)[0] ?? firstAvail
  const cap = v.maxQty ?? 999

  const pickMaterial = (m: string) => {
    const list = sizesFor(m)
    // Conserva el tamaño elegido si existe en el nuevo material
    const next = list.find((x) => x.size === size && x.available) ?? list.find((x) => x.available) ?? list[0]
    setMaterial(m)
    setSize(next.size)
    setQty(1)
  }

  const addNow = (silent = false) => {
    add(
      {
      productId: product.id,
      slug: product.slug,
      title: product.title,
      sku: v.sku,
      variantLabel: `${v.size}, ${v.materialLabel}`,
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
    <>
    <div className="buybox">
      {materials.length > 1 && (
        <fieldset className="opt-group">
          <legend>
            Material: <strong>{v.materialLabel}</strong>
          </legend>
          <div className="opt-list">
            {materials.map(([m, label]) => (
              <label key={m} className={`opt ${m === material ? 'is-on' : ''}`}>
                <input type="radio" name="material" value={m} checked={m === material} onChange={() => pickMaterial(m)} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="opt-group">
        <legend>
          Tamaño: <strong>{v.size}</strong>
        </legend>
        <div className="opt-list">
          {sizesFor(material).map((x) => (
            <label key={x.sku} className={`opt ${x.size === v.size ? 'is-on' : ''}`} style={x.available ? undefined : { opacity: 0.5 }}>
              <input type="radio" name="size" value={x.size} checked={x.size === v.size} disabled={!x.available} onChange={() => { setSize(x.size); setQty(1) }} />
              {x.size}
              {!x.available && <small>&nbsp;(agotado)</small>}
            </label>
          ))}
        </div>
      </fieldset>

      {customizable && (
        <label className="field">
          <span>Texto o detalle a personalizar (opcional)</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500} placeholder="Ej: nombre de la empresa, texto de la señal. El logo lo coordinamos por WhatsApp." />
        </label>
      )}

      <div className="buy-row">
        <div>
          <span className="qty-label" id="qty-label">Cantidad</span>
          <div className="qty-step" role="group" aria-labelledby="qty-label">
            <input type="number" min={1} max={cap} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(cap, Number(e.target.value) || 1)))} aria-label="Cantidad" />
            <div className="qty-arrows">
              <button type="button" onClick={() => setQty((q) => Math.min(cap, q + 1))} aria-label="Más">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 15 6-6 6 6" /></svg>
              </button>
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Menos">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
              </button>
            </div>
          </div>
        </div>
        <button type="button" className="btn btn-blue" disabled={!v.available} onClick={() => addNow()}>
          Agregar al carrito
        </button>
      </div>
      <button
        type="button"
        className="btn btn-outline"
        disabled={!v.available}
        onClick={() => {
          addNow(true)
          router.push('/checkout')
        }}
      >
        Comprar ahora
      </button>
    </div>

    <div className="buy-after">
      <p className="big-price">
        {clp(v.price)}
        {v.compareAtPrice && v.compareAtPrice > v.price && <s>{clp(v.compareAtPrice)}</s>}
      </p>
      <p className="muted small">IVA incluido. Envío gratis sobre {clp(SHIPPING.freeFrom)}.</p>
    </div>
    </>
  )
}
