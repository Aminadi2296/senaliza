import type { CollectionConfig } from 'payload'
import { formatSlug } from '../lib/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Categoría', plural: 'Categorías' },
  admin: { useAsTitle: 'name', group: 'Catálogo', defaultColumns: ['name', 'parent', 'slug'] },
  access: { read: () => true },
  fields: [
    { name: 'name', label: 'Nombre', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar', description: 'Se genera desde el nombre. Es la URL: /categoria/<slug>' },
      hooks: { beforeValidate: [formatSlug('name')] },
    },
    {
      name: 'parent',
      label: 'Categoría padre',
      type: 'relationship',
      relationTo: 'categories',
      admin: { description: 'Ej: "Emergencia" dentro de "Seguridad". Déjalo vacío para una categoría principal.' },
    },
    {
      name: 'order',
      label: 'Orden en el menú',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Menor número aparece primero.' },
    },
    { name: 'description', label: 'Descripción (aparece en la página de categoría)', type: 'textarea' },
    { name: 'image', label: 'Imagen', type: 'upload', relationTo: 'media' },
  ],
}
