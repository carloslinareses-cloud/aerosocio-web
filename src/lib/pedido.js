import { PRODUCTOS } from '../datos/productos.js';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CUÁNTO SE COBRA
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Esto lo ejecuta el Worker ANTES de cobrar, y es lo único que decide el
 * importe. Del navegador solo se acepta qué producto y cuántas unidades.
 *
 * Si el precio viniera del navegador, bastaría abrir las herramientas del
 * desarrollador, cambiar 2990 por 1 y pagar un céntimo por el arnés. Por eso
 * el carrito del cliente ni siquiera guarda precios.
 */

export const MAX_POR_PRODUCTO = 10;
const MAX_LINEAS = 30;

export function calcularPedido(lineas, { catalogo = PRODUCTOS, permitirEjemplos = false } = {}) {
  if (!Array.isArray(lineas) || lineas.length === 0) {
    return { ok: false, error: 'El carrito está vacío.' };
  }
  if (lineas.length > MAX_LINEAS) {
    return { ok: false, error: 'El pedido tiene demasiados productos distintos.' };
  }

  // Se juntan las líneas repetidas: el mismo producto dos veces es una línea.
  const cantidades = new Map();
  for (const linea of lineas) {
    const slug = typeof linea?.slug === 'string' ? linea.slug : '';
    // Solo números de verdad. `Number('3')` daría 3 y `Number(null)` daría 0:
    // convertir en silencio es aceptar datos que nuestro carrito nunca manda,
    // o sea, peticiones fabricadas a mano.
    const cantidad = linea?.cantidad;
    if (!slug || typeof cantidad !== 'number' || !Number.isInteger(cantidad) || cantidad < 1) {
      return { ok: false, error: 'Hay una cantidad que no es válida en el carrito.' };
    }
    cantidades.set(slug, (cantidades.get(slug) || 0) + cantidad);
  }

  const resultado = [];
  let subtotal = 0;
  let envio = 0;

  for (const [slug, pedida] of cantidades) {
    const p = catalogo.find((x) => x.slug === slug);
    if (!p) {
      return { ok: false, error: 'Uno de los productos del carrito ya no está disponible.' };
    }
    if (p.ejemplo && !permitirEjemplos) {
      return { ok: false, error: `"${p.nombre}" es un producto de ejemplo y no se puede comprar.` };
    }
    if (!p.disponible) {
      return { ok: false, error: `"${p.nombre}" está agotado. Quítalo del carrito para seguir.` };
    }

    const cantidad = Math.min(pedida, MAX_POR_PRODUCTO);
    const importe = p.precio * cantidad;
    subtotal += importe;
    // ⚠️ Regla PROVISIONAL: un solo envío, el más caro de lo pedido. Se cambia
    // cuando se conozcan las tarifas reales del proveedor.
    envio = Math.max(envio, Number(p.envio?.coste) || 0);

    resultado.push({ slug, nombre: p.nombre, cantidad, precioUnidad: p.precio, importe });
  }

  return { ok: true, lineas: resultado, subtotal, envio, total: subtotal + envio };
}
