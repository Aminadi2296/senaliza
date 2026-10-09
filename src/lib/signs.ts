export type SignKind = 'warning' | 'prohibition' | 'evacuation' | 'mandatory' | 'info' | 'traffic' | 'generic'

/** Deduce el tipo de señal (forma y color normados) a partir del nombre de la categoría o producto. */
export function signKind(...texts: (string | null | undefined)[]): SignKind {
  const t = texts
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  if (/prohib|no fum|no pasar|no estac/.test(t)) return 'prohibition'
  if (/advert|peligro|riesgo|voltaje|precauc|sustancia|segurid/.test(t)) return 'warning'
  if (/evacu|emergen|salida|extintor|reunion|auxilios|fotolumin/.test(t)) return 'evacuation'
  if (/\bepp\b|obligat|casco|lente|guante|proteccion|mascarilla/.test(t)) return 'mandatory'
  if (/transito|obra|vial|desvio|velocidad|poste|atril|caballete/.test(t)) return 'traffic'
  if (/informativ|condominio|piscina|reciclaje|casa|empresa/.test(t)) return 'info'
  return 'generic'
}
