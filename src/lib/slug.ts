import type { FieldHook } from 'payload'

export const toSlug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

/** Genera el slug a partir de otro campo si el slug está vacío. */
export const formatSlug =
  (from: string): FieldHook =>
  ({ value, data }) => {
    if (typeof value === 'string' && value.length > 0) return toSlug(value)
    const source = data?.[from]
    return typeof source === 'string' ? toSlug(source) : value
  }
