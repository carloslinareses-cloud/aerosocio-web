import { aEuros } from '../src/lib/verificacion.js';

/**
 * La API de SumUp, solo lo que usa la tienda. Contrato sacado de
 * developer.sumup.com/api/checkouts (sep-2026).
 *
 * La clave va como secreto del Worker (SUMUP_API_KEY) y nunca sale de aquí.
 */

const API = 'https://api.sumup.com/v0.1';

function cabeceras(env) {
  return {
    Authorization: `Bearer ${env.SUMUP_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Crea el cobro. `referencia` es el id del pedido: así, al verificar, se puede
 * comprobar que el cobro es de ESTE pedido y no de otro.
 */
export async function crearCheckout(env, { referencia, centimos, descripcion, avisoUrl }) {
  const r = await fetch(`${API}/checkouts`, {
    method: 'POST',
    headers: cabeceras(env),
    body: JSON.stringify({
      checkout_reference: referencia,
      amount: aEuros(centimos),
      currency: 'EUR',
      merchant_code: env.SUMUP_MERCHANT_CODE,
      description: descripcion,
      // SumUp avisa aquí cuando cambia el estado. El aviso NO se cree: solo
      // sirve para ir a preguntar (ver /api/sumup/aviso).
      return_url: avisoUrl,
    }),
  });
  const datos = await r.json().catch(() => null);
  if (!r.ok || !datos?.id) {
    // El detalle va al registro, nunca al cliente.
    throw new Error(`SumUp crear cobro ${r.status}: ${JSON.stringify(datos)?.slice(0, 300)}`);
  }
  return datos;
}

export async function leerCheckout(env, checkoutId) {
  const r = await fetch(`${API}/checkouts/${encodeURIComponent(checkoutId)}`, {
    headers: cabeceras(env),
  });
  if (!r.ok) throw new Error(`SumUp leer cobro ${r.status}`);
  return r.json();
}
