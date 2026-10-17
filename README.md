# Señaliza — Tienda (Next.js + Payload CMS)

## Arranque
1. `cp .env.example .env` y completa `DATABASE_URL` (Postgres: Neon, Supabase o local) y `PAYLOAD_SECRET`.
2. `npm install --legacy-peer-deps`
3. `npm run dev` → abre http://localhost:3000/admin y crea el primer usuario (queda como editor; cámbialo a `admin` desde Usuarios).

## Qué incluye (etapa 1: modelo de datos y panel)
- **Productos**: variantes por tamaño y material con precio y stock, categorías, normas (DS 594, NCh 1410/1411), personalización, borradores/publicado, SEO.
- **Categorías**: jerárquicas (padre/hijo), con imagen y SEO.
- **Pedidos**: cliente, RUT y razón social (para factura en etapa 2), despacho, ítems con copia del precio, pago y estados.
- **Imágenes**: Cloudflare R2 (se activa al completar las variables `R2_*`); WebP y 3 tamaños automáticos.
- **Roles**: `admin` (todo) y `editor` (catálogo y pedidos).

## Etapa 2: tienda pública (incluida)
- Inicio, categorías jerárquicas, catálogo, búsqueda, ficha de producto con variantes, carrito (guardado en el navegador) y checkout **como invitado**.
- El servidor vuelve a leer precios y stock desde la base de datos al crear el pedido; nunca confía en los precios del navegador.
- Pago por ahora: transferencia (datos en `BANK_DETAILS`). La tarjeta se paga con Getnet (ver más abajo).
- SEO: metadatos por página, JSON-LD (Product, BreadcrumbList, Organization), `sitemap.xml` y `robots.txt`.
- Importar catálogo desde Shopify: `npx tsx src/import-shopify.ts --limpiar --limite=10` (prueba) y luego sin `--limite` (completo). Ver cabecera de `src/import-shopify.ts`.
- Variantes flexibles: cada producto define sus propias opciones (nombre y valor) con su precio.
- Imágenes: las subidas desde el panel tienen prioridad sobre las externas (URL).
- Despacho gratis sobre $80.000 y tarifa plana bajo ese monto: se ajusta en `src/lib/config.ts`.

## Pagos: Getnet (Web Checkout)
- Código en `src/lib/payments/getnet.ts` (API), `getnet-order.ts` (confirmación) y `src/app/(frontend)/pagos/getnet/`.
- Variables: `GETNET_ENV` (`test` o `production`), `GETNET_LOGIN`, `GETNET_SECRET_KEY`.
- Flujo: el checkout crea el pedido (pendiente) -> `/pagos/getnet/ir` crea la sesión y envía al cliente a Getnet -> vuelve a `/pagos/getnet/retorno`. El estado nunca se toma de la URL ni de la notificación: siempre se consulta a Getnet con nuestras credenciales y se verifica el monto antes de marcar el pedido como pagado.
- Notificación asíncrona: `POST /pagos/getnet/notificacion` (esa URL se entrega a Getnet en el Formulario de Validación).

## Siguiente
Tienda pública (home, categorías, ficha de producto, carrito), checkout con Getnet y SEO técnico (sitemap, JSON-LD).
