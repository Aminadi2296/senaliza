import type { CollectionConfig } from 'payload'
import { formatSlug } from '../lib/slug'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Producto', plural: 'Productos' },
  admin: {
    useAsTitle: 'title',
    group: 'Catálogo',
    defaultColumns: ['title', 'categories', 'status', 'updatedAt'],
  },
  versions: { drafts: true },
  access: {
    // El público solo ve productos publicados
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
  },
  fields: [
    { name: 'title', label: 'Nombre del producto', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'URL: /producto/<slug>' },
      hooks: { beforeValidate: [formatSlug('title')] },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            { name: 'shortDescription', label: 'Descripción corta', type: 'textarea', maxLength: 300 },
            { name: 'description', label: 'Descripción completa', type: 'richText' },
            {
              name: 'images',
              label: 'Imágenes',
              type: 'array',
              admin: { description: 'Si no subes imágenes, la tienda muestra la forma normada de la señal.' },
              fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
            },
          ],
        },
        {
          label: 'Variantes y precios',
          fields: [
            {
              name: 'variants',
              label: 'Variantes',
              type: 'array',
              minRows: 1,
              labels: { singular: 'Variante', plural: 'Variantes' },
              admin: { description: 'Cada combinación de tamaño y material es una variante con su precio y stock.' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'size', label: 'Tamaño', type: 'text', required: true, admin: { description: 'Ej: 30x40 cm' } },
                    {
                      name: 'material',
                      label: 'Material',
                      type: 'select',
                      required: true,
                      options: [
                        { label: 'Lámina autoadhesiva', value: 'autoadhesiva' },
                        { label: 'Trovicel / Sintra 3 mm', value: 'trovicel' },
                        { label: 'Aluminio compuesto 2 mm', value: 'alucobond' },
                        { label: 'PVC', value: 'pvc' },
                        { label: 'Aluminio', value: 'aluminio' },
                        { label: 'Reflectante', value: 'reflectante' },
                        { label: 'Fotoluminiscente', value: 'fotoluminiscente' },
                        { label: 'Adhesivo (vinilo)', value: 'adhesivo' },
                        { label: 'Otro', value: 'otro' },
                      ],
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'sku', label: 'SKU', type: 'text', required: true },
                    { name: 'price', label: 'Precio (CLP, IVA incluido)', type: 'number', required: true, min: 0 },
                    { name: 'compareAtPrice', label: 'Precio antes (tachado)', type: 'number', min: 0 },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'trackStock',
                      label: 'Controlar stock (si no, se fabrica a pedido)',
                      type: 'checkbox',
                      defaultValue: false,
                    },
                    {
                      name: 'stock',
                      label: 'Stock',
                      type: 'number',
                      defaultValue: 0,
                      min: 0,
                      admin: { condition: (_, sibling) => Boolean(sibling?.trackStock) },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Clasificación',
          fields: [
            {
              name: 'categories',
              label: 'Categorías',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: true,
              required: true,
            },
            {
              name: 'norms',
              label: 'Normas que cumple',
              type: 'select',
              hasMany: true,
              options: [
                { label: 'DS 594', value: 'ds594' },
                { label: 'NCh 1410', value: 'nch1410' },
                { label: 'NCh 1411', value: 'nch1411' },
                { label: 'Manual de Señalización de Tránsito', value: 'tránsito' },
              ],
            },
            {
              name: 'customizable',
              label: 'Admite personalización (logo / texto)',
              type: 'checkbox',
              defaultValue: false,
            },
          ],
        },
      ],
    },
  ],
}
