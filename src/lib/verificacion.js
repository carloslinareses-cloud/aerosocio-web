/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ¿ESTE PEDIDO ESTÁ PAGADO?
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Se decide con lo que dice SumUp desde el servidor, nunca con lo que dice el
 * navegador. La documentación de SumUp lo avisa: un "success" del widget "no
 * siempre significa que la transacción haya salido bien".
 *
 * Y no basta con PAID: el cobro tiene que CUADRAR con el pedido guardado —
 * misma referencia, EUR y el mismo importe al céntimo—. Si no cuadra, algo
 * está mal o alguien manipuló el cobro, y el pedido se bloquea para revisarlo.
 *
 * Estados de SumUp:
 *   PAID     cobrado                          → 'pagado'   (final)
 *   EXPIRED  el cobro ya no se puede usar     → 'caducado' (final)
 *   FAILED   falló el ÚLTIMO intento          → sigue 'pendiente': el cliente
 *            puede reintentar con otra tarjeta en el mismo cobro. Marcarlo
 *            como fallido para siempre bloquearía un pago que llega bien al
 *            segundo intento.
 *   PENDING  todavía no se ha pagado          → 'pendiente'
 */

/** Euros con decimales de SumUp → céntimos enteros. 28.89 × 100 = 2888,99… */
export function aCentimos(importe) {
  return Math.round(Number(importe) * 100);
}

/** Céntimos → el número en euros que pide la API de SumUp. */
export function aEuros(centimos) {
  return Number((centimos / 100).toFixed(2));
}

export function decidirEstado(checkout, pedido) {
  if (!checkout || typeof checkout !== 'object') return { estado: 'pendiente' };

  const cuadra =
    checkout.checkout_reference === pedido.id &&
    String(checkout.currency || '').toUpperCase() === 'EUR' &&
    aCentimos(checkout.amount) === pedido.total;

  if (!cuadra) return { estado: 'no_cuadra' };

  switch (checkout.status) {
    case 'PAID':
      return { estado: 'pagado', transactionCode: String(checkout.transaction_code || '') };
    case 'EXPIRED':
      return { estado: 'caducado' };
    case 'FAILED':
      return { estado: 'pendiente', ultimoIntento: 'fallido' };
    default:
      return { estado: 'pendiente' };
  }
}
