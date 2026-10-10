import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Imagen', plural: 'Imágenes' },
  admin: { group: 'Catálogo' },
  access: { read: () => true },
  fields: [
    { name: 'alt', label: 'Texto alternativo (SEO)', type: 'text', required: true },
  ],
  upload: {
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'thumb', width: 300 },
      { name: 'card', width: 600 },
      { name: 'large', width: 1200 },
    ],
    formatOptions: { format: 'webp' },
  },
}
