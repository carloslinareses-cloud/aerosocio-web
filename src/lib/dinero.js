/**
 * Céntimos → "24,90 €", como se escribe en España: coma decimal y el símbolo
 * detrás. Se formatea con Intl y no a mano, que es donde salen los "24.9€".
 */
const FORMATO = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

export function euros(centimos) {
  return FORMATO.format((Number(centimos) || 0) / 100);
}

/** Céntimos → "24.90", el formato con punto que piden los datos para Google. */
export function importeSchema(centimos) {
  return ((Number(centimos) || 0) / 100).toFixed(2);
}
