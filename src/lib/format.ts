const nf = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
export const clp = (n: number) => nf.format(Math.round(n))

/** "Lámina autoadhesiva, 30x20cm" a partir de las opciones de una variante. */
export const variantLabel = (opts?: { value?: string | null }[] | null) =>
  (opts ?? []).map((o) => o.value).filter(Boolean).join(', ')
