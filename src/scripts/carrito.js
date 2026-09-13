/**
 * El carrito vive en el navegador y guarda SOLO qué producto y cuántos.
 *
 * Nunca el precio: el precio lo pone el servidor al cobrar (src/lib/pedido.js).
 * Así, aunque alguien edite lo que hay guardado aquí, no puede pagar menos.
 */

const CLAVE = 'aerosocio-carrito';
const MAX = 10;

export function leerCarrito() {
  try {
    const crudo = JSON.parse(localStorage.getItem(CLAVE) || '[]');
    if (!Array.isArray(crudo)) return [];
    return crudo.filter(
      (l) => l && typeof l.slug === 'string' && Number.isInteger(l.cantidad) && l.cantidad > 0,
    );
  } catch {
    // Navegación privada o almacenamiento bloqueado: el carrito empieza vacío,
    // pero la tienda no se rompe.
    return [];
  }
}

function guardar(lineas) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lineas));
  } catch {
    /* sin almacenamiento, el carrito dura lo que la pestaña */
  }
  window.dispatchEvent(new CustomEvent('carrito:cambio'));
}

export function anadir(slug, cantidad = 1) {
  const lineas = leerCarrito();
  const linea = lineas.find((l) => l.slug === slug);
  if (linea) linea.cantidad = Math.min(MAX, linea.cantidad + cantidad);
  else lineas.push({ slug, cantidad: Math.min(MAX, cantidad) });
  guardar(lineas);
}

export function cambiarCantidad(slug, cantidad) {
  const n = Math.max(0, Math.min(MAX, Math.trunc(cantidad)));
  const lineas = leerCarrito()
    .map((l) => (l.slug === slug ? { ...l, cantidad: n } : l))
    .filter((l) => l.cantidad > 0);
  guardar(lineas);
}

export function quitar(slug) {
  guardar(leerCarrito().filter((l) => l.slug !== slug));
}

export function vaciar() {
  guardar([]);
}

export function totalUnidades() {
  return leerCarrito().reduce((n, l) => n + l.cantidad, 0);
}

function pintarContador() {
  const n = totalUnidades();
  document.querySelectorAll('[data-contador-carrito]').forEach((el) => {
    el.textContent = String(n);
    el.hidden = n === 0;
  });
}

// Botones "Añadir" de cualquier página: un solo escuchador para todos.
document.addEventListener('click', (e) => {
  const boton = e.target.closest('[data-anadir]');
  if (!boton || boton.disabled) return;
  anadir(boton.dataset.anadir);
  const original = boton.textContent;
  boton.textContent = 'Añadido ✓';
  setTimeout(() => {
    boton.textContent = original;
  }, 1400);
});

window.addEventListener('carrito:cambio', pintarContador);
// Si el carrito cambia en otra pestaña, el contador de esta también se entera.
window.addEventListener('storage', pintarContador);
pintarContador();
