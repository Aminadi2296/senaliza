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
- Pago por ahora: transferencia (datos en `BANK_DETAILS`). La pasarela (Webpay) se conecta después en `src/app/(frontend)/checkout/actions.ts`.
- SEO: metadatos por página, JSON-LD (Product, BreadcrumbList, Organization), `sitemap.xml` y `robots.txt`.
- Importar catálogo desde Shopify: `npx tsx src/import-shopify.ts --limpiar --limite=10` (prueba) y luego sin `--limite` (completo). Ver cabecera de `src/import-shopify.ts`.
- Variantes flexibles: cada producto define sus propias opciones (nombre y valor) con su precio.
- Imágenes: las subidas desde el panel tienen prioridad sobre las externas (URL).
- Despacho gratis sobre $80.000 y tarifa plana bajo ese monto: se ajusta en `src/lib/config.ts`.

## Siguiente
Tienda pública (home, categorías, ficha de producto, carrito), checkout con Webpay y SEO técnico (sitemap, JSON-LD).
