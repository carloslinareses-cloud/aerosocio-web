import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarCliente } from './cliente.js';

const BUENO = {
  nombre: '  María   López ',
  email: 'Maria.Lopez@Ejemplo.es',
  telefono: '+34 612 34 56 78',
  direccion: 'Calle Alcalá 120',
  piso: '3º B',
  cp: '28009',
  ciudad: 'Madrid',
  provincia: 'Madrid',
  aceptaCondiciones: true,
};

test('un cliente bien escrito pasa, y queda limpio', () => {
  const r = validarCliente(BUENO);
  assert.equal(r.ok, true);
  assert.equal(r.cliente.nombre, 'María López');
  assert.equal(r.cliente.email, 'maria.lopez@ejemplo.es');
  assert.equal(r.cliente.telefono, '612345678', 'sin espacios ni +34');
});

test('el teléfono tiene que ser de España', () => {
  for (const telefono of ['12345', '512345678', '+58 414 1234567', '6123456789']) {
    assert.equal(validarCliente({ ...BUENO, telefono }).ok, false, telefono);
  }
  assert.equal(validarCliente({ ...BUENO, telefono: '0034 912 345 678' }).ok, true);
});

test('el código postal tiene que existir en España', () => {
  for (const cp of ['00123', '53000', '2800', 'abcde', '99999']) {
    assert.equal(validarCliente({ ...BUENO, cp }).ok, false, cp);
  }
  assert.equal(validarCliente({ ...BUENO, cp: '07001' }).ok, true, 'Baleares sí paga IVA');
});

test('no se vende con IVA a Canarias, Ceuta ni Melilla', () => {
  for (const cp of ['35001', '38001', '51001', '52001']) {
    assert.match(validarCliente({ ...BUENO, cp }).error, /Canarias/, cp);
  }
});

test('sin aceptar las condiciones no hay pedido', () => {
  assert.equal(validarCliente({ ...BUENO, aceptaCondiciones: false }).ok, false);
  assert.equal(validarCliente({ ...BUENO, aceptaCondiciones: 'true' }).ok, false, 'un texto no vale como sí');
});

test('correo mal escrito o vacío se rechaza', () => {
  for (const email of ['', 'maria', 'maria@', 'maria@ejemplo', 'ma ria@ejemplo.es']) {
    assert.equal(validarCliente({ ...BUENO, email }).ok, false, email);
  }
});
