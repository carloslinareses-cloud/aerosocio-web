import { calcularPedido } from '../src/lib/pedido.js';
import { validarCliente } from '../src/lib/cliente.js';
import { decidirEstado } from '../src/lib/verificacion.js';
import { crearCheckout, leerCheckout } from './sumup.js';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  AEROSOCIO · EL WORKER DE LA TIENDA
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Solo se ejecuta para /api/* (ver `run_worker_first` en wrangler.toml). Las
 * páginas las sirve Cloudflare directo desde dist/.
 *
 * El flujo del cobro, y por qué va así:
 *
 *  1. POST /api/checkout — del navegador llegan productos, cantidades y datos
 *     de envío. El IMPORTE lo calcula este lado con el catálogo. Se guarda el
 *     pedido 'pendiente' ANTES de pedir el cobro, y luego se le pide a SumUp
 *     un cobro por ese importe, con el id del pedido como referencia.
 *  2. El navegador monta el widget de SumUp y cobra ahí mismo.
 *  3. GET /api/pedido/{id} y POST /api/sumup/aviso — el pedido solo pasa a
 *     'pagado' cuando ESTE lado le pregunta a SumUp y el cobro cuadra.
 *
 * Secretos que hay que poner a mano (Cloudflare no deja leerlos después):
 *   npx wrangler secret put SUMUP_API_KEY
 *   npx wrangler secret put SUMUP_MERCHANT_CODE
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const json = (cuerpo, status = 200) => Response.json(cuerpo, { status });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/salud') {
      return json({ ok: true, servicio: 'aerosocio-tienda', pagos: pagosListos(env) });
    }

    if (url.pathname === '/api/checkout') {
      if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
      return crearPedido(request, env, url);
    }

    const coincidencia = url.pathname.match(/^\/api\/pedido\/([^/]+)$/);
    if (coincidencia) {
      if (request.method !== 'GET') return json({ error: 'Método no permitido' }, 405);
      return estadoDelPedido(env, coincidencia[1]);
    }

    if (url.pathname === '/api/sumup/aviso') {
      if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
      return avisoDeSumup(request, env);
    }

    if (url.pathname.startsWith('/api/')) {
      return json({ error: 'Ruta no encontrada' }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};

function pagosListos(env) {
  return Boolean(env.SUMUP_API_KEY && env.SUMUP_MERCHANT_CODE && env.DB);
}

async function crearPedido(request, env, url) {
  // Sin credenciales se dice claro. Una tienda que parece cobrar y no cobra es
  // peor que una que avisa de que todavía no puede.
  if (!pagosListos(env)) {
    return json({ error: 'Los pagos todavía no están activos.' }, 503);
  }

  let cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return json({ error: 'No pudimos leer tu pedido.' }, 400);
  }

  const datos = validarCliente(cuerpo?.cliente);
  if (!datos.ok) return json({ error: datos.error }, 400);

  const pedido = calcularPedido(cuerpo?.lineas, {
    permitirEjemplos: env.PERMITIR_EJEMPLOS === '1',
  });
  if (!pedido.ok) return json({ error: pedido.error }, 400);

  const id = crypto.randomUUID();
  const ahora = Date.now();

  // PRIMERO el pedido y DESPUÉS el cobro. Al revés, un fallo al guardar dejaría
  // a alguien pagado sin pedido que enviar.
  await env.DB.prepare(
    `INSERT INTO pedidos
       (id, creado_at, actualizado_at, estado, lineas, subtotal, envio, total, email, cliente)
     VALUES (?, ?, ?, 'pendiente', ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id, ahora, ahora,
      JSON.stringify(pedido.lineas), pedido.subtotal, pedido.envio, pedido.total,
      datos.cliente.email, JSON.stringify(datos.cliente),
    )
    .run();

  let checkout;
  try {
    checkout = await crearCheckout(env, {
      referencia: id,
      centimos: pedido.total,
      descripcion: `AeroSocio · pedido ${id.slice(0, 8)}`,
      avisoUrl: new URL('/api/sumup/aviso', url).href,
    });
  } catch (e) {
    console.error('[checkout]', id, e?.message || e);
    await env.DB.prepare(`UPDATE pedidos SET estado = 'error_pasarela', actualizado_at = ? WHERE id = ?`)
      .bind(Date.now(), id)
      .run();
    return json({ error: 'No pudimos iniciar el pago. Inténtalo otra vez en un momento.' }, 502);
  }

  await env.DB.prepare(`UPDATE pedidos SET sumup_checkout_id = ?, actualizado_at = ? WHERE id = ?`)
    .bind(checkout.id, Date.now(), id)
    .run();

  return json({ pedidoId: id, checkoutId: checkout.id, total: pedido.total });
}

/**
 * Pregunta a SumUp y, si toca, cierra el pedido.
 *
 * El UPDATE lleva `AND estado = 'pendiente'`: si el aviso de SumUp y la
 * consulta del navegador llegan a la vez, solo uno de los dos lo cambia, y un
 * pedido pagado nunca vuelve atrás.
 */
async function confirmar(env, fila) {
  if (fila.estado !== 'pendiente' || !fila.sumup_checkout_id) return { estado: fila.estado };

  const checkout = await leerCheckout(env, fila.sumup_checkout_id);
  const decision = decidirEstado(checkout, { id: fila.id, total: fila.total });
  if (decision.estado === 'pendiente') return decision;

  if (decision.estado === 'no_cuadra') {
    console.error('[pedido] el cobro NO cuadra con el pedido', fila.id, {
      importe: checkout?.amount, referencia: checkout?.checkout_reference, moneda: checkout?.currency,
    });
  }

  const ahora = Date.now();
  await env.DB.prepare(
    `UPDATE pedidos
        SET estado = ?, transaction_code = ?, pagado_at = ?, actualizado_at = ?
      WHERE id = ? AND estado = 'pendiente'`,
  )
    .bind(
      decision.estado, decision.transactionCode || null,
      decision.estado === 'pagado' ? ahora : null, ahora, fila.id,
    )
    .run();

  return decision;
}

async function estadoDelPedido(env, id) {
  // El id es un UUID aleatorio: no se puede adivinar el de otra persona. Aun
  // así, aquí solo se devuelve el estado y el total, nunca datos de envío.
  if (!UUID.test(id)) return json({ error: 'Pedido no encontrado' }, 404);
  if (!env.DB) return json({ error: 'Los pagos todavía no están activos.' }, 503);

  const fila = await env.DB.prepare(
    `SELECT id, estado, total, sumup_checkout_id FROM pedidos WHERE id = ?`,
  ).bind(id).first();
  if (!fila) return json({ error: 'Pedido no encontrado' }, 404);

  try {
    const decision = await confirmar(env, fila);
    return json({ estado: decision.estado, ultimoIntento: decision.ultimoIntento, total: fila.total });
  } catch (e) {
    console.error('[pedido] no se pudo consultar SumUp', id, e?.message || e);
    return json({ estado: fila.estado, total: fila.total, sinConfirmar: true });
  }
}

/**
 * SumUp avisa aquí cuando cambia un cobro. El cuerpo del aviso NO se cree: se
 * saca el id y se va a preguntar. Si alguien fabricara un aviso falso, lo único
 * que conseguiría es que el Worker consulte a SumUp, que dirá la verdad.
 *
 * Siempre se contesta 200: si el aviso fallara, SumUp reintentaría sin fin.
 */
async function avisoDeSumup(request, env) {
  try {
    const cuerpo = await request.json().catch(() => ({}));
    const checkoutId = typeof cuerpo?.id === 'string' ? cuerpo.id : cuerpo?.checkout_id;
    if (typeof checkoutId === 'string' && checkoutId && env.DB) {
      const fila = await env.DB.prepare(
        `SELECT id, estado, total, sumup_checkout_id FROM pedidos WHERE sumup_checkout_id = ?`,
      ).bind(checkoutId).first();
      if (fila) await confirmar(env, fila);
    }
  } catch (e) {
    console.error('[aviso sumup]', e?.message || e);
  }
  return json({ ok: true });
}
