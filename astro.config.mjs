// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { SLUGS_DE_EJEMPLO } from './src/datos/productos.js';

/**
 * La tienda se genera ENTERA en páginas ya escritas (`output: 'static'`).
 *
 * Es la decisión que sostiene todo lo demás: la tienda vive del tráfico de
 * Google, y Google lee al instante una página que llega con su título, su
 * descripción y su precio ya puestos. Una app que los pinta después con
 * JavaScript se indexa peor y más tarde.
 *
 * Lo único que no puede ser estático —cobrar— lo atiende el Worker de
 * Cloudflare en `/api/*` (ver worker/index.js).
 */
export default defineConfig({
  // `site` no es decoración: de aquí salen las URL canónicas y el sitemap. Si
  // faltara, Google podría ver la misma página en dos direcciones y repartir
  // la relevancia entre las dos.
  site: 'https://aerosocio.es',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [
    sitemap({
      // Ni los productos de ejemplo ni el carrito se le ofrecen a Google.
      filter: (pagina) =>
        !pagina.endsWith('/carrito/') &&
        !pagina.endsWith('/pedido/') &&
        !SLUGS_DE_EJEMPLO.some((slug) => pagina.includes(`/producto/${slug}`)),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
