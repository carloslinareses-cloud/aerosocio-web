/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LOS DATOS DE ENVÍO
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Se revisan en el servidor aunque el formulario ya los revise: el formulario
 * es para que la persona no pierda el tiempo, esto es lo que de verdad decide.
 *
 * Cada error dice qué corregir y POR QUÉ se pide el dato. Un "campo inválido"
 * a secas es el típico motivo de carrito abandonado.
 */

// Canarias (35, 38), Ceuta (51) y Melilla (52) no pagan IVA: tienen IGIC e
// IPSI, y los envíos pasan aduana. Venderles con IVA incluido sería cobrar
// mal. Hasta resolverlo con el gestor, no se envía ahí.
const FUERA_DEL_IVA = new Set(['35', '38', '51', '52']);

function texto(valor, maximo) {
  return String(valor ?? '').trim().replace(/\s+/g, ' ').slice(0, maximo);
}

export function validarCliente(entrada) {
  const c = entrada && typeof entrada === 'object' ? entrada : {};
  const error = (mensaje) => ({ ok: false, error: mensaje });

  const nombre = texto(c.nombre, 80);
  if (nombre.length < 3) return error('Escribe tu nombre y apellidos.');

  const email = texto(c.email, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return error('Revisa tu correo: ahí te enviamos la confirmación del pedido.');
  }

  // Móvil o fijo de España: 9 cifras que empiezan por 6, 7, 8 o 9. Se aceptan
  // espacios, guiones y el prefijo +34, que es como la gente lo escribe.
  const telefono = texto(c.telefono, 25).replace(/[\s\-().]/g, '').replace(/^(\+34|0034)/, '');
  if (!/^[6789]\d{8}$/.test(telefono)) {
    return error('Escribe un teléfono de España de 9 cifras: el transportista lo necesita para entregarte.');
  }

  const direccion = texto(c.direccion, 120);
  if (direccion.length < 5) return error('Escribe la calle y el número.');

  const piso = texto(c.piso, 40);

  // Los códigos postales de España van del 01000 al 52999.
  const cp = texto(c.cp, 5);
  if (!/^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/.test(cp)) {
    return error('El código postal debe tener 5 cifras.');
  }
  if (FUERA_DEL_IVA.has(cp.slice(0, 2))) {
    return error('Por ahora no enviamos a Canarias, Ceuta ni Melilla.');
  }

  const ciudad = texto(c.ciudad, 60);
  if (ciudad.length < 2) return error('Escribe tu ciudad o localidad.');

  const provincia = texto(c.provincia, 60);
  if (provincia.length < 2) return error('Escribe tu provincia.');

  // Antes de comprar hay que haber podido leer las condiciones y el derecho de
  // desistimiento: lo exige la ley de consumidores.
  if (c.aceptaCondiciones !== true) {
    return error('Para continuar tienes que aceptar las condiciones de venta.');
  }

  return {
    ok: true,
    cliente: { nombre, email, telefono, direccion, piso, cp, ciudad, provincia },
  };
}
