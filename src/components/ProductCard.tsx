import Link from 'next/link'
import type { Product } from '@/payload-types'
import { categoriesOf, maxPrice, minPrice } from '@/lib/data'
import { clp } from '@/lib/format'
import { productImages } from '@/lib/media'
import { signKind } from '@/lib/signs'
import { SignTile } from './SignTile'

export function ProductCard({ product }: { product: Product }) {
  const first = productImages(product)[0]
  const kind = signKind(product.title, categoriesOf(product)[0]?.name)
  const lo = minPrice(product)
  const hi = maxPrice(product)
  return (
    <Link href={`/producto/${product.slug}`} className="card">
      <div className="card-media">
        {first ? <img src={first.card} alt={first.alt} width={600} height={600} loading="lazy" /> : <SignTile kind={kind} />}
      </div>
      <div className="card-body">
        <h3>{product.title}</h3>
        <p className="price">
          {lo !== hi && <span className="from">Desde </span>}
          {clp(lo)}
        </p>
      </div>
    </Link>
  )
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
