import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularPedido, MAX_POR_PRODUCTO } from './pedido.js';

// Un catálogo propio de la prueba: si mañana cambian los precios reales, estas
// pruebas siguen midiendo la regla y no el catálogo.
const CATALOGO = [
  { slug: 'a', nombre: 'Producto A', precio: 2490, disponible: true, envio: { coste: 399 } },
  { slug: 'b', nombre: 'Producto B', precio: 1000, disponible: true, envio: { coste: 599 } },
  { slug: 'agotado', nombre: 'Agotado', precio: 500, disponible: false, envio: { coste: 0 } },
  { slug: 'demo', nombre: 'Demo', precio: 700, disponible: true, envio: { coste: 0 }, ejemplo: true },
];
const calc = (lineas, extra = {}) => calcularPedido(lineas, { catalogo: CATALOGO, ...extra });

test('el total sale en céntimos exactos, sin decimales perdidos', () => {
  const r = calc([{ slug: 'a', cantidad: 3 }, { slug: 'b', cantidad: 1 }]);
  assert.equal(r.ok, true);
  assert.equal(r.subtotal, 2490 * 3 + 1000);
  assert.equal(r.envio, 599, 'un solo envío: el más caro');
  assert.equal(r.total, 2490 * 3 + 1000 + 599);
});

test('el precio sale del catálogo, nunca de lo que mande el navegador', () => {
  const r = calc([{ slug: 'a', cantidad: 1, precio: 1, precioUnidad: 1 }]);
  assert.equal(r.lineas[0].precioUnidad, 2490);
  assert.equal(r.total, 2490 + 399);
});

test('el mismo producto repetido se junta en una línea', () => {
  const r = calc([{ slug: 'a', cantidad: 1 }, { slug: 'a', cantidad: 2 }]);
  assert.equal(r.lineas.length, 1);
  assert.equal(r.lineas[0].cantidad, 3);
});

test('las cantidades se topan en el máximo por producto', () => {
  const r = calc([{ slug: 'b', cantidad: 500 }]);
  assert.equal(r.lineas[0].cantidad, MAX_POR_PRODUCTO);
});

test('cantidades raras se rechazan en vez de redondearse', () => {
  for (const cantidad of [0, -2, 1.5, '3', null, NaN]) {
    assert.equal(calc([{ slug: 'a', cantidad }]).ok, false, `cantidad ${cantidad}`);
  }
});

test('carrito vacío, producto inexistente o agotado no se cobran', () => {
  assert.equal(calc([]).ok, false);
  assert.equal(calc(null).ok, false);
  assert.equal(calc([{ slug: 'no-existe', cantidad: 1 }]).ok, false);
  assert.match(calc([{ slug: 'agotado', cantidad: 1 }]).error, /agotado/);
});

test('un producto de ejemplo no se cobra salvo que se permita a propósito', () => {
  assert.equal(calc([{ slug: 'demo', cantidad: 1 }]).ok, false);
  assert.equal(calc([{ slug: 'demo', cantidad: 1 }], { permitirEjemplos: true }).ok, true);
});
