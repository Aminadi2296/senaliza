/**
 * Datos de ejemplo para ver la tienda poblada: npm run seed
 * Los precios son ficticios. Bórralos desde el panel cuando cargues tu catálogo real.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import { toSlug } from './lib/slug'

type V = { size: string; material: string; price: number }
const PVC = (a: number, b: number, c: number): V[] => [
  { size: '20x30 cm', material: 'pvc', price: a },
  { size: '30x40 cm', material: 'pvc', price: b },
  { size: '30x40 cm', material: 'aluminio', price: c },
]
const FOTO = (a: number, b: number): V[] => [
  { size: '20x30 cm', material: 'fotoluminiscente', price: a },
  { size: '30x40 cm', material: 'fotoluminiscente', price: b },
]

const TREE: Record<string, string[]> = {
  'Condominios y casas': ['Piscinas', 'Condominios'],
  Empresas: ['EPP', 'Informativas', 'Reciclaje'],
  Seguridad: ['Advertencia', 'Prohibición', 'Emergencia', 'Evacuación'],
  'Tránsito y obras': ['Señales de obras', 'Postes y atriles'],
}

const PRODUCTS: { title: string; cat: string; norms: string[]; variants: V[]; short: string; custom?: boolean }[] = [
  { title: 'Peligro alto voltaje', cat: 'Advertencia', norms: ['ds594', 'nch1410'], variants: PVC(3490, 4990, 7490), short: 'Advierte riesgo eléctrico en tableros, subestaciones y cercos.' },
  { title: 'Riesgo eléctrico', cat: 'Advertencia', norms: ['ds594', 'nch1410'], variants: PVC(3490, 4990, 7490), short: 'Señal de advertencia por presencia de energía eléctrica.' },
  { title: 'Prohibido fumar', cat: 'Prohibición', norms: ['ds594', 'nch1411'], variants: PVC(2990, 4490, 6990), short: 'Prohíbe fumar en áreas con riesgo de incendio o espacios cerrados.' },
  { title: 'Prohibido el paso', cat: 'Prohibición', norms: ['ds594', 'nch1411'], variants: PVC(2990, 4490, 6990), short: 'Restringe el acceso a personal no autorizado.' },
  { title: 'Salida de emergencia', cat: 'Evacuación', norms: ['ds594', 'nch1411'], variants: FOTO(3990, 5490), short: 'Indica la salida de emergencia. Visible incluso sin luz.' },
  { title: 'Vía de evacuación', cat: 'Evacuación', norms: ['ds594', 'nch1411'], variants: FOTO(3990, 5490), short: 'Marca la ruta de evacuación hacia la zona segura.' },
  { title: 'Punto de reunión', cat: 'Evacuación', norms: ['ds594', 'nch1411'], variants: PVC(4490, 6990, 9490), short: 'Identifica la zona segura de encuentro ante una emergencia.' },
  { title: 'Extintor', cat: 'Emergencia', norms: ['ds594', 'nch1411'], variants: PVC(2990, 4490, 6490), short: 'Señala la ubicación de un extintor de incendios.' },
  { title: 'Uso obligatorio de casco', cat: 'EPP', norms: ['ds594', 'nch1411'], variants: PVC(2990, 4490, 6990), short: 'Obliga el uso de casco de seguridad en la zona.' },
  { title: 'Uso obligatorio de lentes de seguridad', cat: 'EPP', norms: ['ds594', 'nch1411'], variants: PVC(2990, 4490, 6990), short: 'Obliga el uso de protección ocular.' },
  { title: 'Prohibido nadar sin salvavidas', cat: 'Piscinas', norms: [], variants: PVC(3490, 4990, 7490), short: 'Normas de uso para piscinas de condominios y recintos.' },
  { title: 'Velocidad máxima 20 km/h', cat: 'Condominios', norms: ['tránsito'], variants: PVC(4990, 7490, 11990), short: 'Regula la velocidad dentro del condominio.' },
  { title: 'Hombres trabajando', cat: 'Señales de obras', norms: ['tránsito'], variants: [{ size: '60x60 cm', material: 'reflectante', price: 24990 }, { size: '75x75 cm', material: 'reflectante', price: 34990 }], short: 'Señal transitoria reflectante para faenas y obras viales.' },
  { title: 'Señal personalizada con tu logo', cat: 'Informativas', norms: [], variants: PVC(6990, 9990, 14990), short: 'Diseñamos la señal con el texto y logo de tu empresa.', custom: true },
]

async function main() {
  console.log('Conectando a la base de datos…')
  const payload = await getPayload({ config })
  const existing = await payload.count({ collection: 'categories' })
  if (existing.totalDocs > 0) {
    console.log('Ya hay categorías cargadas. No se agregan datos de ejemplo.')
    process.exit(0)
  }

  const ids: Record<string, number> = {}
  for (const [parent, children] of Object.entries(TREE)) {
    const p = await payload.create({ collection: 'categories', data: { name: parent, slug: toSlug(parent) } })
    ids[parent] = p.id
    for (const child of children) {
      const c = await payload.create({ collection: 'categories', data: { name: child, slug: toSlug(child), parent: p.id } })
      ids[child] = c.id
    }
  }

  for (const pr of PRODUCTS) {
    const slug = toSlug(pr.title)
    await payload.create({
      collection: 'products',
      draft: false,
      data: {
        title: pr.title,
        slug,
        _status: 'published',
        shortDescription: pr.short,
        categories: [ids[pr.cat]],
        norms: pr.norms as ('ds594' | 'nch1410' | 'nch1411' | 'tránsito')[],
        customizable: Boolean(pr.custom),
        variants: pr.variants.map((v, i) => ({
          size: v.size,
          material: v.material as 'pvc',
          sku: `${slug.toUpperCase().slice(0, 14)}-${i + 1}`,
          price: v.price,
          trackStock: false,
        })),
      },
    })
  }
  console.log(`Listo: ${Object.keys(ids).length} categorías y ${PRODUCTS.length} productos de ejemplo.`)
  process.exit(0)
}

// Importante: `payload run` termina el proceso apenas se carga este archivo,
// así que hay que esperar (await) a que main() termine.
try {
  await main()
} catch (e) {
  console.error('El seed falló:', e)
  process.exit(1)
}
