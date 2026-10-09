import type { Media } from '@/payload-types'

export function mediaUrl(m: number | Media | null | undefined, size?: 'thumb' | 'card' | 'large'): string | null {
  if (!m || typeof m === 'number') return null
  return (size && m.sizes?.[size]?.url) || m.url || null
}
