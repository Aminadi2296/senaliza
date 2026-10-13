import type { CollectionConfig } from 'payload'
import { formatSlug } from '../lib/slug'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Producto', plural: 'Productos' },
  admin: {
    useAsTitle: 'title',
    group: 'Catálogo',
    defaultColumns: ['title', 'categories', '_status', 'updatedAt'],
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
              label: 'Imágenes (subidas por ti)',
              type: 'array',
              admin: { description: 'Si subes imágenes aquí, tienen prioridad sobre las externas. Sin imágenes, la tienda muestra la señal dibujada.' },
              fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
            },
            {
              name: 'externalImages',
              label: 'Imágenes externas (por URL)',
              type: 'array',
              admin: { description: 'Se usan mientras no subas imágenes propias.' },
              fields: [
                { name: 'url', label: 'URL', type: 'text', required: true },
                { name: 'alt', label: 'Texto alternativo', type: 'text' },
              ],
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
              admin: {
                description:
                  'Cada variante es una combinación de opciones (ej: Material = Aluminio compuesto 2mm, Tamaño = 30x20cm) con su precio. Usa los mismos nombres de opción en todas las variantes del producto y en el mismo orden.',
              },
              fields: [
                {
                  name: 'options',
                  label: 'Opciones',
                  type: 'array',
                  labels: { singular: 'Opción', plural: 'Opciones' },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        { name: 'name', label: 'Nombre', type: 'text', required: true, admin: { description: 'Ej: Material, Tamaño' } },
                        { name: 'value', label: 'Valor', type: 'text', required: true, admin: { description: 'Ej: Lámina autoadhesiva, 30x20cm' } },
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
                    { name: 'available', label: 'Disponible', type: 'checkbox', defaultValue: true },
                    { name: 'trackStock', label: 'Controlar stock (si no, se fabrica a pedido)', type: 'checkbox', defaultValue: false },
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
            { name: 'categories', label: 'Categorías', type: 'relationship', relationTo: 'categories', hasMany: true, required: true },
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
            { name: 'customizable', label: 'Admite personalización (logo / texto)', type: 'checkbox', defaultValue: false },
          ],
        },
      ],
    },
  ],
}
