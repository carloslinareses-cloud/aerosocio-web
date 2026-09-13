import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aCentimos, aEuros, decidirEstado } from './verificacion.js';

const PEDIDO = { id: 'ped-123', total: 2889 };
const cobro = (extra) => ({
  checkout_reference: 'ped-123',
  currency: 'EUR',
  amount: 28.89,
  status: 'PAID',
  transaction_code: 'TX9',
  ...extra,
});

test('la conversión aguanta el decimal traicionero', () => {
  // 28.89 * 100 en coma flotante da 2888.9999999999995
  assert.equal(aCentimos(28.89), 2889);
  assert.equal(aCentimos(0.29), 29);
  assert.equal(aEuros(2889), 28.89);
  assert.equal(aEuros(1000), 10);
});

test('PAID que cuadra al céntimo → pagado', () => {
  assert.deepEqual(decidirEstado(cobro(), PEDIDO), { estado: 'pagado', transactionCode: 'TX9' });
});

test('PAID por un importe distinto → bloqueado, aunque sea un céntimo', () => {
  assert.equal(decidirEstado(cobro({ amount: 28.88 }), PEDIDO).estado, 'no_cuadra');
  assert.equal(decidirEstado(cobro({ amount: 0.01 }), PEDIDO).estado, 'no_cuadra');
});

test('PAID de otro pedido o en otra moneda → bloqueado', () => {
  assert.equal(decidirEstado(cobro({ checkout_reference: 'ped-999' }), PEDIDO).estado, 'no_cuadra');
  assert.equal(decidirEstado(cobro({ currency: 'USD' }), PEDIDO).estado, 'no_cuadra');
});

test('FAILED no es final: el cliente puede reintentar', () => {
  assert.deepEqual(decidirEstado(cobro({ status: 'FAILED' }), PEDIDO), {
    estado: 'pendiente',
    ultimoIntento: 'fallido',
  });
});

test('EXPIRED es final; PENDING y lo desconocido siguen pendientes', () => {
  assert.equal(decidirEstado(cobro({ status: 'EXPIRED' }), PEDIDO).estado, 'caducado');
  assert.equal(decidirEstado(cobro({ status: 'PENDING' }), PEDIDO).estado, 'pendiente');
  assert.equal(decidirEstado(cobro({ status: 'ALGO_NUEVO' }), PEDIDO).estado, 'pendiente');
  assert.equal(decidirEstado(null, PEDIDO).estado, 'pendiente');
});
