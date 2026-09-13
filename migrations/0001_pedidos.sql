-- ═══════════════════════════════════════════════════════════════════════════
--  PEDIDOS
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Un pedido nace 'pendiente' ANTES de pedirle el cobro a SumUp, para que el
-- importe quede escrito aquí y no dependa de nada que mande el navegador.
--
-- Solo pasa a 'pagado' cuando el Worker pregunta a SumUp y el cobro CUADRA
-- (misma referencia, mismo importe, EUR). El dinero va en céntimos enteros.
--
-- Estados:
--   pendiente       creado, esperando el pago (un intento fallido sigue aquí:
--                   el cliente puede reintentar con otra tarjeta)
--   pagado          SumUp confirma PAID y el importe cuadra
--   caducado        SumUp dice EXPIRED: ese cobro ya no se puede usar
--   error_pasarela  no se pudo ni crear el cobro en SumUp
--   no_cuadra       SumUp devolvió un importe o referencia distintos: se bloquea
--                   y se revisa a mano, porque o hay un error o hay manipulación

CREATE TABLE IF NOT EXISTS pedidos (
  id                 TEXT    PRIMARY KEY,
  creado_at          INTEGER NOT NULL,
  actualizado_at     INTEGER NOT NULL,
  estado             TEXT    NOT NULL CHECK (estado IN (
                       'pendiente', 'pagado', 'caducado', 'error_pasarela', 'no_cuadra'
                     )),
  lineas             TEXT    NOT NULL,
  subtotal           INTEGER NOT NULL,
  envio              INTEGER NOT NULL,
  total              INTEGER NOT NULL,
  email              TEXT    NOT NULL,
  cliente            TEXT    NOT NULL,
  sumup_checkout_id  TEXT    UNIQUE,
  transaction_code   TEXT,
  pagado_at          INTEGER
);

CREATE INDEX IF NOT EXISTS pedidos_por_estado ON pedidos (estado, creado_at);
