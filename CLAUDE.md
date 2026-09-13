# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

**AeroSocio** es una **tienda online de dropshipping** que vende en España (Península y Baleares). Hasta septiembre de 2026 fue un marketplace de servicios en Madrid; esa web se eliminó por completo y sigue en el historial de git (commit `630fb87`).

Dominio: **aerosocio.es** — registrado en Hostinger, **DNS en Cloudflare** (zona activa desde el 13-sep-2026).

## Comandos

- `npm run dev` — servidor de desarrollo de Astro.
- `npm run build` — genera la tienda estática en `dist/`.
- `npm test` — pruebas de la lógica de dinero y datos (`node --test`).
- `npm run deploy` — build + `wrangler deploy`.
- `npx wrangler d1 migrations apply aerosocio-pedidos --remote` — aplica migraciones de `migrations/`.

## Arquitectura

**Astro 7 (salida estática) + un Worker de Cloudflare.** Se eligió estático porque la tienda vive del tráfico de Google: cada producto sale como página ya escrita con su título, descripción y datos estructurados.

- `src/datos/productos.js` — **la única fuente de precios**. La leen las páginas y el Worker que cobra. Dinero en **céntimos enteros, IVA incluido**.
- `src/lib/pedido.js` — calcula el importe a cobrar. **El precio nunca viene del navegador**: el carrito solo guarda producto y cantidad.
- `src/lib/cliente.js` — valida los datos de envío. No se envía a Canarias, Ceuta ni Melilla (no pagan IVA).
- `src/lib/verificacion.js` — decide si un pedido está pagado según SumUp.
- `worker/index.js` — `/api/checkout`, `/api/pedido/{id}`, `/api/sumup/aviso`. Solo se ejecuta para `/api/*`; el resto lo sirve Cloudflare desde `dist/`.
- `worker/sumup.js` — cliente de la API de SumUp.
- Pedidos en **D1 `aerosocio-pedidos`, jurisdicción UE** (guarda datos personales de clientes españoles).

### El cobro (SumUp)

1. `POST /api/checkout`: valida cliente, calcula el importe, **guarda el pedido 'pendiente' antes** de crear el cobro en SumUp.
2. El navegador monta el **SumUp Card Widget** en la página.
3. El pedido solo pasa a **'pagado'** cuando el Worker consulta a SumUp y el cobro **cuadra** (referencia = id del pedido, EUR, importe exacto). SumUp avisa de que un `success` del widget **no garantiza** el pago.
4. `FAILED` no es final (el cliente puede reintentar); solo `PAID` y `EXPIRED` cierran el pedido.

Secretos del Worker (no se pueden leer después de guardarlos): `SUMUP_API_KEY`, `SUMUP_MERCHANT_CODE`.

## Lo que NO se toca

- `public/.well-known/apple-developer-merchantid-domain-association` — verificación de **Apple Pay de SumUp** para el dominio.
- Las tablas de Supabase del negocio anterior (`perfiles`, `clientes_externos`, `solicitudes_servicios`, `solicitudes_parking`, `envios_baliza`) tienen datos reales. Eliminar la web no autoriza borrarlas.
- En `wrangler.toml`, las rutas `custom_domain` están **comentadas a propósito**: activarlas reemplaza al instante la web que sirve hoy GitHub Pages. Solo el día del lanzamiento.

## Convenciones

- Textos en **español de España**, precios "24,90 €" con IVA incluido.
- Tailwind v4 por `@tailwindcss/vite`; los colores de la marca (marino `#0d1b2a`, ámbar `#f39c12`) están en `src/styles/global.css`.
- Productos de ejemplo (`ejemplo: true`): `noindex`, fuera del sitemap y el Worker no los cobra salvo `PERMITIR_EJEMPLOS=1`.
- Un precio tachado (`precioAnterior`) tiene que ser el más bajo de los 30 días previos: lo exige la ley.
