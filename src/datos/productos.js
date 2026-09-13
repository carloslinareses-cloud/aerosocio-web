/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  EL CATÁLOGO
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * La ÚNICA fuente de los precios. La leen a la vez las páginas (lo que ve el
 * cliente) y el Worker que cobra (lo que se cobra). Si hubiera dos listas, un
 * día dirían cosas distintas y se cobraría un precio que no se anunció.
 *
 * ⚠️ Todo el dinero va en CÉNTIMOS ENTEROS e IVA incluido: 2490 = 24,90 €.
 * Con decimales, 0,1 + 0,2 da 0,30000000000000004 y los totales dejan de
 * cuadrar al céntimo.
 *
 * Campos:
 *   slug            la dirección: /producto/<slug>. No se cambia una vez
 *                   publicado, o se pierde lo ganado en Google.
 *   precio          céntimos, IVA incluido.
 *   precioAnterior  opcional. ⚠️ En España, para anunciar una rebaja el precio
 *                   anterior tiene que ser el MÁS BAJO de los 30 días previos.
 *                   Un precio tachado inventado es publicidad engañosa.
 *   envio           coste en céntimos y plazo en días laborables.
 *   ejemplo         true = producto de prueba: página con `noindex`, fuera del
 *                   sitemap, y el Worker se niega a cobrarlo en producción.
 */

export const PRODUCTOS = [
  {
    slug: 'organizador-maleta-6-piezas',
    sku: 'EJ-VIAJE-001',
    nombre: 'Organizador de maleta, 6 piezas',
    categoria: 'Viaje',
    descripcionCorta: 'Seis bolsas para separar ropa, calzado y aseo dentro de la maleta.',
    descripcion: [
      'Producto de ejemplo para probar la tienda. Se sustituye por el catálogo real cuando se elija el nicho con los datos del Planificador de palabras clave.',
    ],
    precio: 2490,
    imagen: null,
    disponible: true,
    envio: { coste: 399, diasMin: 2, diasMax: 4 },
    ejemplo: true,
  },
  {
    slug: 'arnes-perro-antitirones',
    sku: 'EJ-MASC-001',
    nombre: 'Arnés antitirones para perro',
    categoria: 'Mascotas',
    descripcionCorta: 'Arnés con anilla delantera que reduce los tirones durante el paseo.',
    descripcion: [
      'Producto de ejemplo para probar la tienda. Se sustituye por el catálogo real cuando se elija el nicho con los datos del Planificador de palabras clave.',
    ],
    precio: 2990,
    imagen: null,
    disponible: true,
    envio: { coste: 399, diasMin: 2, diasMax: 4 },
    ejemplo: true,
  },
];

export function productoPorSlug(slug, catalogo = PRODUCTOS) {
  return catalogo.find((p) => p.slug === slug) || null;
}

/** Los slugs de ejemplo, para sacarlos del sitemap. */
export const SLUGS_DE_EJEMPLO = PRODUCTOS.filter((p) => p.ejemplo).map((p) => p.slug);
