'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { SHIPPING } from '@/lib/config'
import { clp, variantLabel } from '@/lib/format'
import type { SignKind } from '@/lib/signs'
import { useCart } from './CartProvider'

export type VariantOption = {
  sku: string
  options: { name: string; value: string }[]
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
  const first = variants.find((x) => x.available) ?? variants[0]
  const [selected, setSelected] = useState<string[]>(first.options.map((o) => o.value))
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')

  const names = variants[0].options.map((o) => o.name)
  const v = variants.find((x) => x.options.every((o, i) => o.value === selected[i])) ?? first
  const cap = v.maxQty ?? 999

  // Valores posibles de la opción i, según lo elegido en las opciones anteriores
  const valuesFor = (i: number): [string, boolean][] => {
    const out = new Map<string, boolean>()
    for (const x of variants) {
      if (!selected.slice(0, i).every((s, k) => x.options[k]?.value === s)) continue
      const val = x.options[i]?.value
      if (val === undefined) continue
      out.set(val, (out.get(val) ?? false) || x.available)
    }
    return [...out.entries()]
  }

  const pick = (i: number, value: string) => {
    const prefix = [...selected.slice(0, i), value]
    const pool = variants.filter((x) => prefix.every((p, k) => x.options[k]?.value === p))
    // Mantiene las elecciones posteriores si siguen existiendo
    const keep = pool.find((x) => x.available && x.options.every((o, k) => k <= i || o.value === selected[k]))
    const next = keep ?? pool.find((x) => x.available) ?? pool[0]
    setSelected(next.options.map((o) => o.value))
    setQty(1)
  }

  const addNow = (silent = false) => {
    add(
      {
        productId: product.id,
        slug: product.slug,
        title: product.title,
        sku: v.sku,
        variantLabel: variantLabel(v.options),
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
        {names.map((name, i) => {
          const values = valuesFor(i)
          if (values.length <= 1)
            return (
              <p key={name} className="opt-single">
                {name}: <strong>{values[0]?.[0] ?? selected[i]}</strong>
              </p>
            )
          return (
            <fieldset key={name} className="opt-group">
              <legend>
                {name}: <strong>{selected[i]}</strong>
              </legend>
              <div className="opt-list">
                {values.map(([val, avail]) => (
                  <label key={val} className={`opt ${val === selected[i] ? 'is-on' : ''}`} style={avail ? undefined : { opacity: 0.5 }}>
                    <input type="radio" name={`opt-${i}`} value={val} checked={val === selected[i]} disabled={!avail && val !== selected[i]} onChange={() => pick(i, val)} />
                    {val}
                  </label>
                ))}
              </div>
            </fieldset>
          )
        })}

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
            {v.available ? 'Agregar al carrito' : 'No disponible'}
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
