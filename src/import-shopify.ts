/**
 * Importa el catálogo desde el feed público de Shopify (tienda.senaliza.cl) a tu base de datos.
 *
 *   npx tsx src/import-shopify.ts --limpiar --limite=10     (prueba con 10 productos)
 *   npx tsx src/import-shopify.ts --limpiar                 (catálogo completo)
 *   npx tsx src/import-shopify.ts                           (actualiza sin borrar nada)
 *
 * --limpiar  borra TODOS los productos y categorías actuales antes de importar (no toca pedidos ni usuarios).
 * --limite=N importa solo los primeros N productos.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import { toSlug } from './lib/slug'
import { toProductData, type SProduct } from './lib/shopify'

const BASE = (process.env.SHOPIFY_STORE_URL || 'https://tienda.senaliza.cl').replace(/\/$/, '')
const args = process.argv.slice(2)
const CLEAN = args.includes('--limpiar')
const LIMIT = Number(args.find((a) => a.startsWith('--limite='))?.split('=')[1]) || Infinity

type Node = { name: string; slug: string; handle?: string; children?: Node[] }

// Misma estructura que el menú de la tienda de referencia.
// "Reciclaje" aparece en dos menús: son dos categorías con los mismos productos.
const TREE: Node[] = [
  {
    name: 'Seguridad', slug: 'seguridad',
    children: [
      { name: 'Emergencias', slug: 'emergencias', handle: 'senaleticas-de-emergencia' },
      { name: 'Advertencia', slug: 'advertencia', handle: 'senaletica-de-advertencia' },
      { name: 'Evacuación', slug: 'evacuacion', handle: 'senaleticas-evacuacion' },
      { name: 'Prohibición', slug: 'prohibicion', handle: 'senaleticas-de-prohibicion' },
      { name: 'Señales dobles', slug: 'senales-dobles', handle: 'senales-de-seguridad-dobles' },
    ],
  },
  {
    name: 'Empresas', slug: 'empresas',
    children: [
      { name: 'EPP', slug: 'epp', handle: 'senales-de-epp' },
      { name: 'Informativas', slug: 'informativas', handle: 'senaleticas-informativas' },
      { name: 'Buenas prácticas', slug: 'buenas-practicas', handle: 'senaletica-buenas-practicas' },
      { name: 'Peligro NCh', slug: 'peligro-nch', handle: 'senales-de-peligro' },
      { name: 'Sustancias peligrosas', slug: 'sustancias-peligrosas', handle: 'sustancias-peligrosas' },
      { name: 'Reciclaje', slug: 'reciclaje', handle: 'senaleticas-para-reciclaje' },
      { name: 'Letreros comerciales', slug: 'letreros-comerciales', handle: 'letreros-comerciales' },
    ],
  },
  {
    name: 'Tránsito', slug: 'transito',
    children: [
      { name: 'Reglamentarias', slug: 'reglamentarias', handle: 'senaleticas-de-transito' },
      { name: 'Postes y atriles', slug: 'postes-y-atriles', handle: 'postes-y-atriles-para-senales' },
    ],
  },
  {
    name: 'Obras viales', slug: 'obras-viales',
    children: [
      { name: 'Línea económica', slug: 'obras-linea-economica', handle: 'senaleticas-para-obras-linea-economica' },
      { name: 'Grado ingeniería', slug: 'obras-grado-ingenieria', handle: 'senaleticas-para-obras-grado-ingenieria' },
      { name: 'Alta intensidad', slug: 'obras-alta-intensidad', handle: 'senaleticas-para-obras-viales' },
    ],
  },
  {
    name: 'Condominios', slug: 'condominios',
    children: [
      { name: 'Casas', slug: 'casas', handle: 'senaleticas-para-casas' },
      { name: 'Piscinas', slug: 'piscinas', handle: 'senaleticas-para-piscinas' },
      { name: 'Reciclaje', slug: 'reciclaje-condominios', handle: 'senaleticas-para-reciclaje' },
      { name: 'Condominios', slug: 'condominios-residenciales', handle: 'senaleticas-para-condominio' },
      { name: 'Alarmas y CCTV', slug: 'alarmas-cctv', handle: 'alarmas-y-vigilancia-cctv' },
    ],
  },
  { name: 'Colegios', slug: 'colegios', handle: 'colegios' },
  { name: 'Fotoluminiscentes', slug: 'fotoluminiscentes', handle: 'senales-fotoluminiscentes' },
  { name: 'Personalizables', slug: 'personalizables', handle: 'senaleticas-personalizadas' },
]

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function getJSON<T>(url: string): Promise<T> {
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'senaliza-importer/1.0', Accept: 'application/json' } })
    if (res.ok) return (await res.json()) as T
    if (res.status === 429 || res.status >= 500) {
      await sleep(1500 * attempt)
      continue
    }
    throw new Error(`${res.status} al leer ${url}`)
  }
  throw new Error(`No se pudo leer ${url} tras varios intentos`)
}

async function fetchAll(path: string): Promise<SProduct[]> {
  const out: SProduct[] = []
  for (let page = 1; ; page++) {
    const data = await getJSON<{ products: SProduct[] }>(`${BASE}${path}?limit=250&page=${page}`)
    out.push(...data.products)
    if (data.products.length < 250) break
    await sleep(400)
  }
  return out
}

async function main() {
  console.log('Conectando a la base de datos…')
  const payload = await getPayload({ config })

  if (CLEAN) {
    console.log('Borrando productos y categorías actuales…')
    await payload.delete({ collection: 'products', where: { id: { exists: true } } })
    await payload.delete({ collection: 'categories', where: { id: { exists: true } } })
  }

  // 1) Categorías (se crean o se actualizan por slug)
  const existingCats = await payload.find({ collection: 'categories', limit: 1000, depth: 0, pagination: false })
  const catIdBySlug = new Map<string, number>(existingCats.docs.map((c) => [c.slug, c.id]))
  const handleToCats = new Map<string, number[]>() // handle de colección -> ids de categoría
  let order = 0

  async function upsertCategory(n: Node, parent?: number) {
    const data = { name: n.name, slug: n.slug, parent: parent ?? null, order: order++ }
    const id = catIdBySlug.get(n.slug)
    const doc = id
      ? await payload.update({ collection: 'categories', id, data })
      : await payload.create({ collection: 'categories', data })
    catIdBySlug.set(n.slug, doc.id)
    if (n.handle) handleToCats.set(n.handle, [...(handleToCats.get(n.handle) ?? []), doc.id])
    for (const c of n.children ?? []) await upsertCategory(c, doc.id)
  }
  for (const n of TREE) await upsertCategory(n)
  console.log(`Categorías listas: ${catIdBySlug.size}`)

  // 2) A qué colecciones pertenece cada producto
  const catsOfProduct = new Map<string, Set<number>>()
  for (const [handle, catIds] of handleToCats) {
    try {
      const products = await fetchAll(`/collections/${handle}/products.json`)
      for (const p of products) {
        const set = catsOfProduct.get(p.handle) ?? new Set<number>()
        catIds.forEach((id) => set.add(id))
        catsOfProduct.set(p.handle, set)
      }
      console.log(`  Colección ${handle}: ${products.length} productos`)
    } catch (e) {
      console.warn(`  No se pudo leer la colección ${handle}: ${(e as Error).message}`)
    }
    await sleep(400)
  }

  // 3) Todos los productos
  const all = (await fetchAll('/collections/all/products.json')).filter((p) => p.variants?.length > 0)
  const list = all.slice(0, LIMIT)
  console.log(`Productos en la tienda: ${all.length}. Se importarán: ${list.length}`)

  let otrosId: number | undefined
  const existing = await payload.find({ collection: 'products', limit: 10000, depth: 0, pagination: false, select: { slug: true } })
  const idBySlug = new Map<string, number>(existing.docs.map((d) => [d.slug, d.id]))

  let created = 0
  let updated = 0
  let uncategorized = 0
  const failures: string[] = []

  async function importOne(p: SProduct) {
    let cats = [...(catsOfProduct.get(p.handle) ?? [])]
    if (cats.length === 0) {
      uncategorized++
      if (!otrosId) {
        const found = catIdBySlug.get('otros')
        otrosId = found ?? (await payload.create({ collection: 'categories', data: { name: 'Otros', slug: 'otros', order: 999 } })).id
      }
      cats = [otrosId]
    }
    const data = toProductData(p, cats)
    const id = idBySlug.get(p.handle)
    try {
      if (id) {
        await payload.update({ collection: 'products', id, data: data as never, draft: false })
        updated++
      } else {
        await payload.create({ collection: 'products', data: data as never, draft: false })
        created++
      }
    } catch (e) {
      failures.push(`${p.handle}: ${(e as Error).message}`)
    }
  }

  const STEP = 4
  for (let i = 0; i < list.length; i += STEP) {
    await Promise.all(list.slice(i, i + STEP).map(importOne))
    if ((i / STEP) % 10 === 0 || i + STEP >= list.length) console.log(`  ${Math.min(i + STEP, list.length)} / ${list.length}`)
  }

  console.log(`\nListo. Creados: ${created}. Actualizados: ${updated}. Con error: ${failures.length}. Sin colección (en "Otros"): ${uncategorized}.`)
  failures.slice(0, 10).forEach((f) => console.log('  ERROR', f))
  process.exit(0)
}

// `payload run` y tsx cierran el proceso al terminar el archivo: hay que esperar a main().
try {
  await main()
} catch (e) {
  console.error('La importación falló:', e)
  process.exit(1)
}
