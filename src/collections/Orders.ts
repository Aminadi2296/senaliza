import type { Access, CollectionConfig } from 'payload'

const isAdmin: Access = ({ req }) => req.user?.role === 'admin'
const isStaff: Access = ({ req }) => Boolean(req.user)

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Pedido', plural: 'Pedidos' },
  admin: {
    useAsTitle: 'orderNumber',
    group: 'Ventas',
    defaultColumns: ['orderNumber', 'customer.name', 'total', 'status', 'createdAt'],
  },
  // Los pedidos los crea el servidor (checkout) con overrideAccess; el panel solo lee y actualiza.
  access: { read: isStaff, update: isStaff, create: isStaff, delete: isAdmin },
  fields: [
    { name: 'orderNumber', label: 'N° de pedido', type: 'text', required: true, unique: true, index: true },
    {
      name: 'accessToken',
      label: 'Token de acceso (enlace de confirmación)',
      type: 'text',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'status',
      label: 'Estado',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      admin: { position: 'sidebar' },
      options: [
        { label: 'Pendiente de pago', value: 'pending' },
        { label: 'Pagado', value: 'paid' },
        { label: 'En preparación', value: 'processing' },
        { label: 'Despachado', value: 'shipped' },
        { label: 'Entregado', value: 'delivered' },
        { label: 'Cancelado', value: 'cancelled' },
      ],
    },
    {
      name: 'customer',
      label: 'Cliente',
      type: 'group',
      fields: [
        { name: 'name', label: 'Nombre', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Teléfono', type: 'text' },
        { name: 'rut', label: 'RUT', type: 'text' },
        { name: 'companyName', label: 'Razón social (para factura, etapa 2)', type: 'text' },
      ],
    },
    {
      name: 'shipping',
      label: 'Despacho',
      type: 'group',
      fields: [
        { name: 'region', label: 'Región', type: 'text', required: true },
        { name: 'comuna', label: 'Comuna', type: 'text', required: true },
        { name: 'address', label: 'Dirección', type: 'text', required: true },
        { name: 'carrier', label: 'Transportista', type: 'text' },
        { name: 'trackingNumber', label: 'N° de seguimiento', type: 'text' },
      ],
    },
    {
      name: 'items',
      label: 'Productos',
      type: 'array',
      required: true,
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products' },
        // Se guarda una copia para que cambios futuros del catálogo no alteren pedidos antiguos
        { name: 'title', label: 'Producto', type: 'text', required: true },
        { name: 'variantLabel', label: 'Variante', type: 'text' },
        { name: 'sku', type: 'text' },
        { name: 'unitPrice', label: 'Precio unitario', type: 'number', required: true },
        { name: 'quantity', label: 'Cantidad', type: 'number', required: true, min: 1 },
        { name: 'customization', label: 'Personalización (texto / logo)', type: 'textarea' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'subtotal', label: 'Subtotal', type: 'number', required: true },
        { name: 'shippingCost', label: 'Envío', type: 'number', defaultValue: 0 },
        { name: 'total', label: 'Total (CLP)', type: 'number', required: true },
      ],
    },
    {
      name: 'payment',
      label: 'Pago',
      type: 'group',
      fields: [
        { name: 'provider', label: 'Pasarela', type: 'select', options: ['webpay', 'flow', 'mercadopago', 'transferencia'] },
        { name: 'transactionId', label: 'ID de transacción', type: 'text' },
        { name: 'paidAt', label: 'Fecha de pago', type: 'date' },
      ],
    },
    { name: 'notes', label: 'Notas internas', type: 'textarea' },
  ],
}
