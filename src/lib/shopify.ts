/** Conversión de productos del feed público de Shopify (products.json) al modelo de la tienda. */

export type SVariant = {
  id: number
  option1?: string | null
  option2?: string | null
  option3?: string | null
  sku?: string | null
  price: string
  compare_at_price?: string | null
  available?: boolean
}
export type SProduct = {
  id: number
  title: string
  handle: string
  body_html?: string | null
  options?: { name: string; position: number }[]
  variants: SVariant[]
  images?: { src: string; alt?: string | null }[]
}

const NAMED: Record<string, string> = {
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú',
  ntilde: 'ñ', Ntilde: 'Ñ', uuml: 'ü', Uuml: 'Ü', iquest: '¿', iexcl: '¡', deg: '°', ordm: 'º', ordf: 'ª', laquo: '«', raquo: '»',
  ndash: '–', mdash: '—', hellip: '…', bull: '•', middot: '·', times: '×', copy: '©', reg: '®', trade: '™', euro: '€',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', sup2: '²', sup3: '³', frac12: '½',
}

export function decodeEntities(s: string) {
  return s
    .replace(/&([a-zA-Z0-9]+);/g, (m, name) => NAMED[name] ?? m)
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
}

export function htmlToLines(html: string): string[] {
  const text = decodeEntities(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<\/(p|div|li|h[1-6]|tr|ul|ol)>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
  return text
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
}

/** Árbol mínimo de texto en el formato del editor (Lexical) de Payload: un párrafo por línea. */
export const toLexical = (lines: string[]) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: lines.map((t) => ({
      type: 'paragraph',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      textFormat: 0,
      children: [{ type: 'text', text: t, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
    })),
  },
})

const short = (s: string, max = 280) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s)

export function toProductData(p: SProduct, categoryIds: number[]) {
  const names = (p.options ?? []).map((o) => o.name)
  const seen = new Set<string>()

  const variants = p.variants.map((v) => {
    const vals = [v.option1, v.option2, v.option3]
    const options = names
      .map((name, i) => ({ name, value: String(vals[i] ?? '').trim() }))
      .filter((o) => o.value && !(o.name === 'Title' && o.value === 'Default Title'))
    let sku = (v.sku ?? '').trim() || `V${v.id}`
    if (seen.has(sku)) sku = `${sku}-${v.id}`
    seen.add(sku)
    const price = Math.round(parseFloat(v.price) || 0)
    const compare = v.compare_at_price ? Math.round(parseFloat(v.compare_at_price) || 0) : 0
    return {
      options,
      sku,
      price,
      compareAtPrice: compare > price ? compare : undefined,
      available: v.available !== false,
      trackStock: false,
    }
  })

  const lines = htmlToLines(p.body_html ?? '')
  return {
    title: decodeEntities(p.title).trim(),
    slug: p.handle,
    _status: 'published' as const,
    shortDescription: short(lines[0] ?? ''),
    description: lines.length ? toLexical(lines) : undefined,
    categories: categoryIds,
    variants,
    externalImages: (p.images ?? []).slice(0, 8).map((i) => ({ url: i.src, alt: i.alt || undefined })),
    customizable: false,
  }
}
