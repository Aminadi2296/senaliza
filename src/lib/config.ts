export const SITE = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'Señaliza',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  description:
    'Señalética de seguridad normada (DS 594, NCh 1410, NCh 1411): advertencia, prohibición, emergencia, evacuación, EPP y obras. Despacho a todo Chile.',
  // Solo dígitos, con código de país. Cámbialo en .env
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || '56900000000',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'ventas@tudominio.cl',
}

/** Despacho: gratis sobre `freeFrom`, y una tarifa plana bajo ese monto (ajústala cuando definas transportistas). */
export const SHIPPING = { freeFrom: 80000, flat: 5990 }

export const shippingFor = (subtotal: number) =>
  subtotal <= 0 || subtotal >= SHIPPING.freeFrom ? 0 : SHIPPING.flat

export const REGIONES = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana de Santiago',
  "Libertador General Bernardo O'Higgins",
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén',
  'Magallanes y de la Antártica Chilena',
]

export const NORMS: Record<string, string> = {
  ds594: 'DS 594',
  nch1410: 'NCh 1410',
  nch1411: 'NCh 1411',
  'tránsito': 'Manual de Tránsito',
}

export const MATERIALS: Record<string, string> = {
  autoadhesiva: 'Lámina autoadhesiva',
  trovicel: 'Trovicel / Sintra 3 mm',
  alucobond: 'Aluminio compuesto 2 mm',
  pvc: 'PVC',
  aluminio: 'Aluminio',
  reflectante: 'Reflectante',
  fotoluminiscente: 'Fotoluminiscente',
  adhesivo: 'Adhesivo',
  otro: 'Otro',
}
