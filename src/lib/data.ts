import { cache } from 'react'
import { getPayload, type Where } from 'payload'
import config from '@payload-config'
import type { Category, Product } from '@/payload-types'

export const getClient = () => getPayload({ config })

export type CategoryNode = Category & { children: CategoryNode[] }

const parentId = (c: Category) => (typeof c.parent === 'object' && c.parent ? c.parent.id : (c.parent as number | null | undefined))

/** Todas las categorías como árbol (padres con sus hijos). */
export const getCategoryTree = cache(async (): Promise<{ tree: CategoryNode[]; flat: Category[] }> => {
  try {
    const payload = await getClient()
    const { docs } = await payload.find({ collection: 'categories', limit: 300, depth: 1, sort: ['order', 'name'], pagination: false })
    const nodes = new Map<number, CategoryNode>(docs.map((d) => [d.id, { ...d, children: [] }]))
    const tree: CategoryNode[] = []
    for (const n of nodes.values()) {
      const pid = parentId(n)
      const parent = pid ? nodes.get(pid) : undefined
      if (parent) parent.children.push(n)
      else tree.push(n)
    }
    return { tree, flat: docs }
  } catch {
    return { tree: [], flat: [] }
  }
})

export function descendantIds(node: CategoryNode): number[] {
  return [node.id, ...node.children.flatMap(descendantIds)]
}

export function findNode(tree: CategoryNode[], slug: string): CategoryNode | undefined {
  for (const n of tree) {
    if (n.slug === slug) return n
    const hit = findNode(n.children, slug)
    if (hit) return hit
  }
}

export function pathTo(tree: CategoryNode[], id: number, trail: CategoryNode[] = []): CategoryNode[] | null {
  for (const n of tree) {
    if (n.id === id) return [...trail, n]
    const hit = pathTo(n.children, id, [...trail, n])
    if (hit) return hit
  }
  return null
}

const PAGE_SIZE = 24

export async function listProducts(opts: { categoryIds?: number[]; q?: string; page?: number; limit?: number; excludeId?: number }) {
  const payload = await getClient()
  const and: Where[] = [{ _status: { equals: 'published' } }]
  if (opts.categoryIds?.length) and.push({ categories: { in: opts.categoryIds } })
  if (opts.excludeId) and.push({ id: { not_equals: opts.excludeId } })
  if (opts.q) and.push({ or: [{ title: { like: opts.q } }, { shortDescription: { like: opts.q } }] })
  return payload.find({
    collection: 'products',
    where: { and },
    depth: 1,
    limit: opts.limit ?? PAGE_SIZE,
    page: opts.page ?? 1,
    sort: '-createdAt',
  })
}

export async function getProduct(slug: string): Promise<Product | null> {
  const payload = await getClient()
  const { docs } = await payload.find({
    collection: 'products',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    depth: 2,
    limit: 1,
  })
  return docs[0] ?? null
}

export const minPrice = (p: Product) => Math.min(...(p.variants ?? []).map((v) => v.price))
export const maxPrice = (p: Product) => Math.max(...(p.variants ?? []).map((v) => v.price))

export const categoriesOf = (p: Product): Category[] => (p.categories ?? []).filter((c): c is Category => typeof c === 'object')
