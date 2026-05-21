import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el .env');
}
const supabase = createClient(supabaseUrl, supabaseKey);

// Componente decorativo para los destellos de luz de fondo
const GlowEffect = ({ className }) => (
  <div className={`absolute rounded-full pointer-events-none blur-[100px] md:blur-[150px] opacity-20 ${className}`}></div>
);

// Componente decorativo para los bordes brillantes
const ShineBorder = () => (
  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-amber/50 to-transparent"></div>
);

const EMPTY_SHIPPING = {
  fullName: '',
  addressLine1: '',
  addressLine2: '',
  postalCode: '',
  city: '',
  province: '',
  phone: '',
};

const EMPTY_PARKING = {
  destino: '',
  fechaEntrada: '',
  fechaSalida: '',
  email: '',
};

const MARKETPLACE = {
  gestoria: {
    titulo: 'Servicios de Gestoría',
    descripcion: 'Te ahorramos colas, papeleo y trámites. Lo hacemos por ti.',
    items: [
      { id: 'recurso-multa', icon: '⚖️', titulo: 'Recurso de Multa DGT', desc: 'Analizamos tu multa, redactamos el recurso formal y lo presentamos en la sede electrónica del organismo competente.', precio: '9,90€', disponible: true, requierePago: true, amount: 9.90 },
      { id: 'cita-itv', icon: '🔧', titulo: 'Cita ITV Exprés', desc: 'Te gestionamos cita prioritaria en la ITV más cercana en menos de 24h hábiles.', precio: '5€', disponible: true, requierePago: true, amount: 5 },
    ],
  },
  viajes: {
    titulo: 'Viajes y Movilidad',
    descripcion: 'Búsqueda y reserva al mejor precio. Tú eliges, nosotros comparamos.',
    items: [
      { id: 'parking', icon: '🅿️', titulo: 'Parking Aeropuertos', desc: 'Comparamos los parkings cercanos y te enviamos la mejor oferta.', precio: 'Gratis', disponible: true, ancla: 'parking' },
      { id: 'esim', icon: '📱', titulo: 'eSIM Internacional', desc: 'Datos móviles en 190 países, sin roaming. Recibe tu QR en menos de 24 h hábiles.', precio: '10€/día', disponible: true, requierePago: true, unitAmount: 10, perDay: true },
      { id: 'reclamacion-vuelo', icon: '✈️', titulo: 'Reclamación de Vuelo', desc: 'Vuelo retrasado o cancelado. Tramitamos tu indemnización hasta 600€ ante la aerolínea.', precio: 'Consultar', disponible: false },
      { id: 'hotel', icon: '🏨', titulo: 'Hoteles al Mejor Precio', desc: 'Encontramos el alojamiento más barato según tus fechas y destino.', precio: 'Comisión 0 socios', disponible: false },
      { id: 'alquiler-coche', icon: '🚙', titulo: 'Coche de Alquiler', desc: 'Comparamos las principales rentadoras para tu ruta.', precio: 'Comisión 0 socios', disponible: false },
      { id: 'seguro-viaje', icon: '🛡️', titulo: 'Seguro de Viaje', desc: 'Coberturas médicas y de cancelación con primas preferentes.', precio: 'Desde 12€', disponible: false },
      { id: 'transfer', icon: '🚕', titulo: 'Transfer al Aeropuerto', desc: 'Reserva tu traslado privado puerta-a-puerta con antelación.', precio: 'Desde 25€', disponible: false },
    ],
  },
  productos: {
    titulo: 'Productos AeroSocio',
    descripcion: 'Accesorios curados para el viajero y conductor moderno.',
    items: [
      { id: 'baliza-premium', icon: '🚨', titulo: 'Baliza V16 Premium', desc: 'Homologada DGT 3.0 con SIM IoT incluida 12 años. Envío en 5 días hábiles a España peninsular.', precio: '49€', disponible: true, requierePago: true, amount: 49, requiereEnvio: true },
      { id: 'kit-emergencia', icon: '🧰', titulo: 'Kit Emergencia Coche', desc: 'Chaleco reflectante, triángulos, botiquín y linterna LED en estuche.', precio: '29€', disponible: false },
      { id: 'tag-gps', icon: '📍', titulo: 'Localizador GPS Bluetooth', desc: 'Para llaves, maletas o coche. Compatible Apple/Android.', precio: '25€', disponible: false },
      { id: 'soporte-movil', icon: '📲', titulo: 'Soporte Móvil Coche', desc: 'Magnético con carga inalámbrica. Instalación al salpicadero.', precio: '15€', disponible: false },
    ],
  },
  futuro: {
    titulo: 'En Desarrollo',
    descripcion: 'Servicios que llegarán en los próximos meses para socios VIP+.',
    items: [
      { id: 'asistencia-24h', icon: '🛟', titulo: 'Asistencia en Carretera 24h', desc: 'Grúa, taller móvil y vehículo de sustitución en toda España.', precio: 'Incluido VIP+', disponible: false },
      { id: 'concierge', icon: '💬', titulo: 'Concierge WhatsApp', desc: 'Línea directa con un gestor para cualquier duda de movilidad.', precio: 'Incluido VIP+', disponible: false },
      { id: 'flotas', icon: '🏢', titulo: 'AeroSocio para Empresas', desc: 'Gestión de flotas (10+ vehículos): alertas, multas y mantenimiento centralizado.', precio: 'Desde 5€/vehículo', disponible: false },
    ],
  },
};

function readPaymentFromUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  if (params.get('pago') !== 'ok') return null;
  return { plan: params.get('plan') === 'annual' ? 'annual' : 'monthly' };
}

const SUMUP_SDK_URL = 'https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js';

function loadSumupSdk() {
  if (window.SumUpCard) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SUMUP_SDK_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar el SDK de SumUp')));
      return;
    }
    const script = document.createElement('script');
    script.src = SUMUP_SDK_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar el SDK de SumUp'));
    document.body.appendChild(script);
  });
}

function App() {
  const [user, setUser] = useState(null);
  const [modalContent, setModalContent] = useState(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(readPaymentFromUrl);
  const [shipping, setShipping] = useState(EMPTY_SHIPPING);
  const [shippingStatus, setShippingStatus] = useState('idle'); // 'idle'|'sending'|'done'
  const [shippingError, setShippingError] = useState('');
  // Widget de pago SumUp (in-page)
  const [sumupCheckout, setSumupCheckout] = useState(null); // { checkoutId, plan } | null
  const [sumupError, setSumupError] = useState('');
  // Buscador de parking (Fase 1: captura de demanda)
  const [parking, setParking] = useState(EMPTY_PARKING);
  const [parkingStatus, setParkingStatus] = useState('idle'); // 'idle'|'sending'|'done'
  const [parkingError, setParkingError] = useState('');
  // Marketplace: solicitud de un servicio cualquiera
  const [servicio, setServicio] = useState(null); // { id, titulo, disponible, precio } | null
  const [servicioForm, setServicioForm] = useState({ email: '', detalles: '' });
  const [servicioStatus, setServicioStatus] = useState('idle');
  const [servicioError, setServicioError] = useState('');

  // Verificar si hay sesión activa al cargar
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Si veníamos de SumUp con ?pago=ok, limpiamos la URL una vez detectado
  useEffect(() => {
    if (paymentSuccess && window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cerrar modal con tecla Escape
  useEffect(() => {
    if (!modalContent) return;
    const onKey = (e) => { if (e.key === 'Escape') setModalContent(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalContent]);

  // Montar widget SumUp cuando hay un checkout listo
  useEffect(() => {
    if (!sumupCheckout) return;
    let cancelled = false;

    loadSumupSdk()
      .then(() => {
        if (cancelled || !window.SumUpCard) return;
        const container = document.getElementById('sumup-card');
        if (container) container.innerHTML = '';
        window.SumUpCard.mount({
          id: 'sumup-card',
          checkoutId: sumupCheckout.checkoutId,
          email: user?.email,
          locale: 'es-ES',
          country: 'ES',
          showSubmitButton: true,
          onResponse: (type, body) => {
            console.log('SumUp event:', type, body);
            if (type === 'success') {
              setSumupCheckout(null);
              setPaymentSuccess({ plan: sumupCheckout.plan });
            } else if (type === 'error') {
              setSumupError(body?.message || 'El pago no se pudo procesar. Revisa los datos de tu tarjeta o prueba con otra.');
            }
          },
        });
      })
      .catch((err) => {
        console.error(err);
        setSumupError(err.message);
      });

    return () => { cancelled = true; };
  }, [sumupCheckout, user]);

  const handleShippingSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setShippingError('Tu sesión ha expirado. Inicia sesión con Google de nuevo para guardar tu dirección.');
      return;
    }
    setShippingStatus('sending');
    setShippingError('');
    try {
      const { error } = await supabase.from('envios_baliza').insert({
        user_id: user.id,
        user_email: user.email,
        full_name: shipping.fullName.trim(),
        address_line_1: shipping.addressLine1.trim(),
        address_line_2: shipping.addressLine2.trim() || null,
        postal_code: shipping.postalCode.trim(),
        city: shipping.city.trim(),
        province: shipping.province.trim(),
        phone: shipping.phone.trim(),
        status: 'pending',
      });
      if (error) throw error;
      setShippingStatus('done');
    } catch (err) {
      console.error('Error guardando dirección:', err);
      setShippingError(err.message || 'No pudimos guardar tu dirección. Inténtalo de nuevo en unos minutos o escríbenos a carlos.linares.es@gmail.com.');
      setShippingStatus('idle');
    }
  };

  const closePaymentSuccess = () => {
    setPaymentSuccess(null);
    setShipping(EMPTY_SHIPPING);
    setShippingStatus('idle');
    setShippingError('');
  };

  // Función para Login con Google
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) alert("Error al iniciar sesión: " + error.message);
  };

  // Función para Cerrar Sesión
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const startCheckout = async ({ productId, quantity, userEmail, planLabel }) => {
    setIsLoadingPayment(true);
    setSumupError('');
    try {
      const { data, error } = await supabase.functions.invoke('crear-pago-sumup', {
        body: {
          planType: productId,
          productId,
          quantity,
          userEmail: userEmail || user?.email || '',
        },
      });
      if (error) throw new Error(error.message || 'No se pudo contactar con el servidor de pagos.');
      const checkoutId = data?.checkoutId || data?.id;
      if (!checkoutId) {
        console.error('Respuesta SumUp inesperada:', data);
        throw new Error('SumUp no devolvió un ID de checkout válido.');
      }
      setSumupCheckout({ checkoutId, plan: planLabel || productId });
      return true;
    } catch (err) {
      console.error('Error de pago:', err);
      throw err;
    } finally {
      setIsLoadingPayment(false);
    }
  };

  const handlePayment = async (planType) => {
    if (!user) {
      alert('Inicia sesión con Google primero para asociar tu membresía.');
      handleGoogleLogin();
      return;
    }
    try {
      await startCheckout({ productId: planType, userEmail: user.email, planLabel: planType });
    } catch (err) {
      alert('Error procesando el pago: ' + err.message);
    }
  };

  const closeSumupCheckout = () => {
    setSumupCheckout(null);
    setSumupError('');
    const container = document.getElementById('sumup-card');
    if (container) container.innerHTML = '';
  };

  const openServicio = (item) => {
    if (item.ancla) {
      scrollToSection(item.ancla);
      return;
    }
    setServicio(item);
    setServicioForm({
      email: user?.email || '',
      detalles: '',
      dias: item.perDay ? 1 : null,
      destino: '',
      direccion: '',
      poblacion: '',
      cp: '',
      provincia: '',
      telefono: '',
    });
    setServicioStatus('idle');
    setServicioError('');
  };

  const closeServicio = () => {
    setServicio(null);
    setServicioStatus('idle');
    setServicioError('');
  };

  const servicioTotal = () => {
    if (!servicio?.requierePago) return 0;
    if (servicio.perDay) {
      const d = Math.max(1, parseInt(servicioForm.dias || 1, 10));
      return d * servicio.unitAmount;
    }
    return servicio.amount;
  };

  const handleServicioSubmit = async (e) => {
    e.preventDefault();
    setServicioError('');
    const email = servicioForm.email.trim();
    if (!email) { setServicioError('Indica un email.'); return; }

    // Construir resumen estructurado de detalles segun el tipo
    let detallesTexto;
    if (servicio.perDay) {
      const d = parseInt(servicioForm.dias || 0, 10);
      if (!d || d < 1) { setServicioError('Indica al menos 1 día.'); return; }
      if (!servicioForm.destino.trim()) { setServicioError('Indica el destino del viaje.'); return; }
      detallesTexto = `Destino: ${servicioForm.destino.trim()} · Días: ${d}\n${servicioForm.detalles.trim()}`;
    } else if (servicio.requiereEnvio) {
      const reqd = ['direccion', 'poblacion', 'cp', 'provincia', 'telefono'];
      for (const k of reqd) {
        if (!servicioForm[k]?.trim()) { setServicioError('Completa todos los datos de envío.'); return; }
      }
      detallesTexto = [
        `Envío: ${servicioForm.direccion.trim()}, ${servicioForm.poblacion.trim()}, ${servicioForm.cp.trim()}, ${servicioForm.provincia.trim()}`,
        `Tel: ${servicioForm.telefono.trim()}`,
        servicioForm.detalles.trim() || '(sin notas)',
      ].join('\n');
    } else {
      if (!servicioForm.detalles.trim()) { setServicioError('Cuéntanos los detalles.'); return; }
      detallesTexto = servicioForm.detalles.trim();
    }

    setServicioStatus('sending');
    try {
      const monto = servicioTotal();
      const { error } = await supabase.from('solicitudes_servicios').insert({
        user_id: user?.id || null,
        email,
        tipo: servicio.id,
        titulo: servicio.titulo,
        detalles: detallesTexto,
        estado: servicio.requierePago ? 'pendiente_pago' : 'pendiente',
        monto: servicio.requierePago ? monto : null,
      });
      if (error) throw error;

      if (servicio.requierePago) {
        // Lanza el widget de SumUp con el producto correcto
        await startCheckout({
          productId: servicio.id,
          quantity: servicio.perDay ? parseInt(servicioForm.dias, 10) : 1,
          userEmail: email,
          planLabel: servicio.titulo,
        });
        // Cerramos el modal del marketplace; el widget se abre encima
        setServicio(null);
      } else {
        setServicioStatus('done');
      }
    } catch (err) {
      console.error('Error guardando solicitud servicio:', err);
      setServicioError(err.message || 'No pudimos registrar tu solicitud. Inténtalo de nuevo.');
      setServicioStatus('idle');
    }
  };

  const handleParkingSubmit = async (e) => {
    e.preventDefault();
    setParkingError('');
    const destino = parking.destino.trim();
    const email = (parking.email || user?.email || '').trim();
    const { fechaEntrada, fechaSalida } = parking;
    if (!destino || !fechaEntrada || !fechaSalida || !email) {
      setParkingError('Completa todos los campos.');
      return;
    }
    if (new Date(fechaSalida) <= new Date(fechaEntrada)) {
      setParkingError('La fecha de salida tiene que ser posterior a la de entrada.');
      return;
    }
    setParkingStatus('sending');
    try {
      const { error } = await supabase.from('solicitudes_parking').insert({
        user_id: user?.id || null,
        email,
        destino,
        fecha_entrada: fechaEntrada,
        fecha_salida: fechaSalida,
        estado: 'pendiente',
      });
      if (error) throw error;
      setParkingStatus('done');
    } catch (err) {
      console.error('Error guardando solicitud de parking:', err);
      setParkingError(err.message || 'No pudimos registrar tu búsqueda. Inténtalo de nuevo en unos minutos.');
      setParkingStatus('idle');
    }
  };

  // Función para Scroll Suave
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Contenidos Legales (RGPD + LSSI-CE)
  const legalDocs = {
    terminos: {
      title: 'Términos y Condiciones Legales',
      paragraphs: [
        { text: 'Bienvenido a AeroSocio. Al contratar cualquiera de nuestras membresías, aceptas las presentes condiciones generales de servicio:' },
        { heading: 'Objeto del Servicio', text: 'AeroSocio presta un servicio digital de suscripción que incluye la gestión documental de archivos del vehículo y conductor encriptados en la nube, alertas automatizadas preventivas sobre el vencimiento de la ITV y seguros, y un sistema asistido de auto-servicio para la gestión de reclamaciones por retrasos o cancelaciones de vuelos.' },
        { heading: 'Planes y Facturación', text: 'Se establecen tres modalidades de suscripción:', bullets: [
          'Plan Mensual: con un coste de 5€ al mes, renovable automáticamente de forma periódica.',
          'Plan Anual + Baliza: con un coste de 49€ al año, renovable automáticamente de forma anual. Incluye el envío gratuito de una baliza de emergencia V16 homologada por la DGT.',
          'Plan VIP+: con un coste de 99€ al año, renovable automáticamente de forma anual. Incluye todos los beneficios del Plan Anual más servicio de concierge por WhatsApp y prioridad en todos los servicios del Marketplace AeroSocio.',
        ], footer: 'Cualquier suscripción puede ser cancelada por el usuario en cualquier momento desde su perfil antes del siguiente ciclo de facturación.' },
        { heading: 'Incentivo de la Baliza V16', text: 'Los usuarios que contraten y abonen la modalidad de Plan Anual o Plan VIP+ tendrán derecho a recibir de forma totalmente gratuita una baliza de emergencia V16 homologada por la DGT en su domicilio (promoción válida para envíos dentro del territorio español peninsular y sujeta a disponibilidad de stock). El plan mensual no incluye, en ningún caso, la entrega de este dispositivo físico.' },
        { heading: 'Limitación de Responsabilidad', text: 'AeroSocio es una plataforma informativa de alertas y herramientas de asistencia. La responsabilidad final de pasar la ITV en plazo, renovar las pólizas de seguro obligatorias o tramitar las reclamaciones legales oportunas ante las aerolíneas recae única y exclusivamente sobre el titular del vehículo o el pasajero del vuelo.' },
      ],
    },
    privacidad: {
      title: 'Política de Privacidad (RGPD)',
      paragraphs: [
        { text: 'En cumplimiento del Reglamento General de Protección de Datos (RGPD) y la normativa española vigente, te informamos detalladamente sobre cómo tratamos tus datos personales:' },
        { heading: 'Responsable del Tratamiento', text: 'AeroSocio, con correo electrónico de contacto de soporte técnico y administrativo: carlos.linares.es@gmail.com.' },
        { heading: 'Datos Recopilados', text: 'Al iniciar sesión a través del sistema seguro de Google, recopilamos tu nombre, dirección de correo electrónico y foto de perfil público. Adicionalmente, recopilamos los datos técnicos de tu vehículo (matrícula y fechas de vencimiento) que decidas introducir de manera voluntaria para el correcto funcionamiento del sistema de alertas.' },
        { heading: 'Finalidad del Tratamiento', text: 'Tus datos se utilizan exclusivamente para gestionar tu cuenta de socio en la plataforma, automatizar el envío de alertas críticas de tus vehículos vía email o mensajería, tramitar los envíos postales de las balizas V16 a los suscriptores anuales y emitir las facturas correspondientes.' },
        { heading: 'Seguridad Financiera (SumUp)', text: 'Los pagos de las membresías se procesan de forma 100% externa y cifrada a través de la pasarela de pagos segura de SumUp. AeroSocio no almacena, no ve, ni tiene acceso a los datos de tus tarjetas de crédito o credenciales bancarias.' },
        { heading: 'Tus Derechos', text: 'Tienes derecho a acceder, rectificar, limitar o borrar de forma definitiva todos tus datos de nuestros servidores. Para ejercer estos derechos, solo debes enviar una solicitud por correo electrónico a carlos.linares.es@gmail.com.' },
      ],
    },
    cookies: {
      title: 'Política de Cookies',
      paragraphs: [
        { text: 'De acuerdo con las directrices de la Agencia Española de Protección de Datos (AEPD) y la LSSI-CE, te informamos sobre el uso de cookies en esta plataforma:' },
        { heading: '¿Qué cookies usamos?', text: 'Este sitio web utiliza única y exclusivamente cookies técnicas, operativas y de sesión que son estrictamente esenciales para que la plataforma funcione.' },
        { heading: 'Cookies de Terceros Esenciales', bullets: [
          'Supabase: utiliza cookies de autenticación segura para mantener tu sesión de socio abierta en tu navegador y evitar que tengas que iniciar sesión con Google cada vez que cambias de pestaña.',
          'SumUp: utiliza cookies técnicas durante el proceso de pago para garantizar que la transacción financiera se realice de forma segura y sin interrupciones.',
        ] },
        { heading: 'Cookies de Rastreo', text: 'AeroSocio no utiliza cookies analíticas ni de rastreo publicitario de terceros (como Google Analytics o Facebook Pixel) sin tu consentimiento previo.' },
        { heading: 'Desactivación', text: 'Puedes bloquear o eliminar las cookies instaladas en tu equipo configurando las opciones de privacidad de tu navegador de internet. Ten en cuenta que si deshabilitas por completo las cookies técnicas, el área privada de socios y la pasarela de pago dejarán de funcionar correctamente.' },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-[#08101a] text-white font-sans selection:bg-brand-amber selection:text-brand-navy relative overflow-hidden w-full">
      
      {/* Luces de fondo dramáticas */}
      <GlowEffect className="w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-brand-amber -top-20 -left-20 md:-top-48 md:-left-48" />
      <GlowEffect className="w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-blue-500 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <GlowEffect className="hidden md:block w-[600px] h-[600px] bg-emerald-500 bottom-0 -right-48" />

      {/* Navbar - Optimizada para móvil con Botones Funcionales */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-brand-navy/80 border-b border-white/5">
        <div className="flex justify-between items-center p-4 md:px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <svg className="w-7 h-7 md:w-9 md:h-9 text-brand-amber drop-shadow-[0_0_8px_rgba(243,156,18,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h1 className="text-xl md:text-3xl font-extrabold tracking-tighter">Aero<span className="text-brand-amber">Socio</span></h1>
          </div>
          
          <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 p-1 rounded-full text-sm text-slate-300">
            <button onClick={() => scrollToSection('como-funciona')} className="px-5 py-2 rounded-full hover:bg-white/5 transition-colors">¿Cómo Funciona?</button>
            <button onClick={() => scrollToSection('membresia')} className="px-5 py-2 rounded-full hover:bg-white/5 transition-colors">Membresía VIP</button>
            <button onClick={() => scrollToSection('servicios')} className="px-5 py-2 rounded-full hover:bg-white/5 transition-colors">Servicios</button>
            <button onClick={() => scrollToSection('marketplace')} className="px-5 py-2 rounded-full hover:bg-white/5 transition-colors">Marketplace</button>
          </div>
          
          {user ? (
            <div className="flex items-center gap-4">
              <span className="hidden md:block text-sm text-slate-300">Hola, {user.user_metadata?.full_name?.split(' ')[0] || 'Socio'}</span>
              <button onClick={handleLogout} className="bg-white/10 border border-white/20 text-white font-semibold py-2 px-4 md:px-6 rounded-full text-sm hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 transition-all">
                Salir
              </button>
            </div>
          ) : (
            <button onClick={handleGoogleLogin} className="bg-transparent border border-brand-amber text-brand-amber md:border-white/10 md:text-white font-semibold py-2 px-4 md:px-8 rounded-full text-sm md:text-base hover:border-brand-amber hover:text-brand-amber flex items-center gap-2 transition-all duration-300">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Acceso Socios
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main id="como-funciona" className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-32 grid lg:grid-cols-[1.5fr,1fr] gap-8 md:gap-12 items-stretch">
        <div className="absolute inset-0 z-0 flex rounded-[40px] overflow-hidden border border-white/5">
          <div className="w-[60%] h-full bg-cover bg-left opacity-30" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1544016768-6820f8987107?q=80&w=2000)'}}></div>
          <div className="w-[40%] h-full bg-cover bg-right opacity-30" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1511191060931-df10b808f921?q=80&w=2000)'}}></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#08101a] via-[#08101a]/95 to-[#08101a]"></div>
        </div>

        <div className="relative z-10 space-y-6 md:space-y-8">
          <div className="inline-flex items-center gap-2 md:gap-3 bg-brand-amber/10 border border-brand-amber/20 text-brand-amber font-bold px-4 py-2 md:px-5 md:py-2.5 rounded-full text-xs md:text-sm">
            <span className="relative flex h-2.5 w-2.5 md:h-3 md:w-3 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-amber opacity-75"></span>
              <span className="relative inline-flex rounded-full h-full w-full bg-brand-amber"></span>
            </span>
            ÚLTIMAS 1.000 BALIZAS DGT DISPONIBLES
          </div>

          <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-4 md:mb-6 leading-[1.1] md:leading-[0.9] tracking-tighter">
            El club <span className="text-transparent bg-clip-text bg-gradient-to-b from-brand-amber to-yellow-200">exclusivo</span> de Movilidad y Viajes.
          </h2>

          <p className="text-lg md:text-2xl text-slate-300 leading-relaxed max-w-3xl">
            Gestionamos tu tranquilidad. Evita multas, organiza documentos en la nube y reclama tus vuelos retrasados. Únete hoy y llévate de regalo la nueva Baliza V16 conectada enviada a tu domicilio.
          </p>

          {/* Panel de Suscripción con Planes */}
          <div id="membresia" className="grid sm:grid-cols-3 gap-3 max-w-3xl">
             <button onClick={() => handlePayment('monthly')} disabled={isLoadingPayment} className="p-5 rounded-3xl bg-white/5 border border-white/10 hover:border-white/30 transition-all text-left disabled:opacity-60 disabled:cursor-wait">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">Mensual</span>
                <p className="text-2xl md:text-3xl font-bold mt-1">€5 <span className="text-sm text-slate-500">/mes</span></p>
                <p className="text-[11px] text-slate-500 mt-2">Alertas y gestión documental</p>
             </button>
             <button onClick={() => handlePayment('annual')} disabled={isLoadingPayment} className="relative p-5 rounded-3xl bg-white/5 border border-brand-amber/50 hover:border-brand-amber transition-all text-left group disabled:opacity-60 disabled:cursor-wait">
                <ShineBorder />
                <span className="text-[10px] font-bold text-brand-amber uppercase tracking-widest">Anual + Baliza</span>
                <p className="text-2xl md:text-3xl font-bold mt-1">€49 <span className="text-sm text-slate-500">/año</span></p>
                <p className="text-[11px] text-slate-500 mt-2">Incluye baliza V16 DGT</p>
                <div className="absolute top-3 right-3 text-[9px] bg-brand-amber text-black px-2 py-0.5 rounded-full font-bold">POPULAR</div>
             </button>
             <button onClick={() => handlePayment('vipplus')} disabled={isLoadingPayment} className="relative p-5 rounded-3xl bg-gradient-to-br from-brand-amber/15 to-yellow-200/5 border border-yellow-200/40 hover:border-yellow-200 transition-all text-left disabled:opacity-60 disabled:cursor-wait">
                <span className="text-[10px] font-bold text-yellow-200 uppercase tracking-widest">VIP+</span>
                <p className="text-2xl md:text-3xl font-bold mt-1">€99 <span className="text-sm text-slate-500">/año</span></p>
                <p className="text-[11px] text-slate-400 mt-2">Concierge WhatsApp + prioridad en todos los servicios</p>
                <div className="absolute top-3 right-3 text-[9px] bg-gradient-to-r from-brand-amber to-yellow-200 text-black px-2 py-0.5 rounded-full font-bold">PREMIUM</div>
             </button>
          </div>
          {isLoadingPayment && <p className="text-xs text-slate-400">Redirigiendo a SumUp…</p>}
          
          <p className="text-slate-500 text-xs md:text-sm flex items-center gap-2 justify-start md:pl-8">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Incluye envío gratuito de la baliza a toda España.
          </p>
        </div>

        <div className="relative z-10 group bg-cover bg-center min-h-[260px] md:min-h-0 rounded-3xl border border-white/5 flex items-center justify-center p-6 md:p-10 overflow-hidden" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1596738140801-b7559ca5ca76?q=80&w=1000)'}}>
          <div className="absolute inset-0 bg-gradient-to-br from-brand-navy/95 via-brand-navy/75 to-brand-navy/60"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-72 md:h-72 bg-brand-amber/30 blur-3xl rounded-full"></div>

          <div className="relative z-10 flex flex-col items-center text-center gap-5 md:gap-6">
            <div className="p-4 md:p-5 bg-brand-amber rounded-2xl shadow-xl shadow-brand-amber/30">
              <span className="text-4xl md:text-6xl">🚨</span>
            </div>
            <div>
              <div className="text-[10px] md:text-xs font-bold text-brand-amber bg-brand-amber/10 border border-brand-amber/20 inline-block px-3 py-1 rounded-full mb-3">REGALO EXCLUSIVO</div>
              <h4 className="text-2xl md:text-4xl font-extrabold tracking-tight">Baliza V16 DGT</h4>
              <p className="text-sm md:text-base text-slate-300 mt-2 max-w-xs">Dispositivo homologado obligatorio (Valor €20).</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Envío gratuito a toda España peninsular
            </div>
          </div>
        </div>
      </main>

      <section id="servicios" className="bg-white/[0.02] backdrop-blur-xl py-20 md:py-32 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 md:mb-20 max-w-3xl mx-auto space-y-2">
            <h3 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter mb-4">Todo lo que incluye tu membresía</h3>
            <p className="text-slate-400 text-base md:text-xl leading-relaxed">Diseñado para que disfrutes del camino, nosotros nos ocupamos de los detalles.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: '💻',
                title: 'Alertas Inteligentes',
                desc: 'Monitoreamos tu vehículo y te avisamos por WhatsApp antes de que caduque tu seguro o ITV para evitar multas de €200.',
                status: 'AHORRA EN MULTAS',
                iconBox: 'border-brand-amber/20 bg-brand-amber/10',
                badge: 'text-brand-amber bg-brand-amber/10 border-brand-amber/20',
              },
              {
                icon: '✈️',
                title: 'Reclamación de Vuelos',
                desc: '¿Vuelo retrasado o cancelado? Nuestro equipo legal gestiona tu indemnización sin comisiones abusivas.',
                status: 'SIN COMISIONES',
                iconBox: 'border-blue-500/20 bg-blue-500/10',
                badge: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
              },
              {
                icon: '📄',
                title: 'Gestión Documental',
                desc: 'Todos tus documentos del coche y conductor seguros y organizados encriptadamente en nuestra nube VIP.',
                status: 'SEGURIDAD TOTAL',
                iconBox: 'border-emerald-500/20 bg-emerald-500/10',
                badge: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
              },
            ].map((item) => (
              <div key={item.title} className="relative group p-6 md:p-10 rounded-3xl bg-brand-navy/60 border border-white/5 md:hover:border-brand-amber transition-all duration-300 md:hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-amber/10 to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity blur-2xl"></div>
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-6 md:mb-8 border text-2xl md:text-4xl ${item.iconBox}`}>{item.icon}</div>
                <h4 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-white tracking-tight">{item.title}</h4>
                <p className="text-sm md:text-base text-slate-400 leading-relaxed mb-6">{item.desc}</p>
                <div className={`text-[10px] md:text-xs font-bold inline-block px-3 md:px-4 py-1 md:py-1.5 rounded-full border ${item.badge}`}>{item.status}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="marketplace" className="py-20 md:py-32 border-t border-white/5 relative z-10">
        <GlowEffect className="w-[400px] h-[400px] bg-brand-amber top-1/3 -left-32" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <div className="text-center mb-12 md:mb-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand-amber/10 border border-brand-amber/30 text-brand-amber font-bold px-4 py-2 rounded-full text-xs uppercase tracking-widest mb-5">
              Marketplace de Socios
            </div>
            <h3 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter mb-4">
              Un solo sitio para tu <span className="text-transparent bg-clip-text bg-gradient-to-b from-brand-amber to-yellow-200">vida en movimiento</span>
            </h3>
            <p className="text-slate-400 text-base md:text-xl leading-relaxed">
              Gestoría, viajes y productos curados. Lo que está disponible lo puedes solicitar hoy; lo demás llega muy pronto.
            </p>
          </div>

          <div className="space-y-14">
            {Object.entries(MARKETPLACE).map(([key, cat]) => (
              <div key={key}>
                <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-2">
                  <div>
                    <h4 className="text-2xl md:text-3xl font-extrabold tracking-tight">{cat.titulo}</h4>
                    <p className="text-slate-400 text-sm md:text-base mt-1">{cat.descripcion}</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                  {cat.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => openServicio(item)}
                      className={`group relative text-left p-5 md:p-6 rounded-3xl border transition-all duration-300 overflow-hidden ${
                        item.disponible
                          ? 'bg-white/5 border-white/10 hover:border-brand-amber hover:-translate-y-1'
                          : 'bg-white/[0.02] border-white/5 hover:border-blue-500/40'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="text-3xl md:text-4xl">{item.icon}</div>
                        <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${
                          item.disponible
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                        }`}>
                          {item.disponible ? 'Disponible' : 'Próximamente'}
                        </span>
                      </div>
                      <h5 className="text-base md:text-lg font-bold tracking-tight mb-1.5">{item.titulo}</h5>
                      <p className="text-xs md:text-sm text-slate-400 leading-relaxed mb-4 line-clamp-3">{item.desc}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <span className="text-sm font-bold text-brand-amber">{item.precio}</span>
                        <span className="text-xs text-slate-400 group-hover:text-brand-amber transition-colors">
                          {item.disponible ? 'Solicitar →' : 'Avisarme →'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-slate-500 text-xs md:text-sm mt-12 max-w-2xl mx-auto">
            Los servicios marcados como "Próximamente" se irán activando conforme cerramos acuerdos con proveedores. Apuntate al servicio que más te interese y te avisaremos en cuanto esté listo, sin compromiso.
          </p>
        </div>
      </section>

      <section id="parking" className="py-20 md:py-32 border-t border-white/5 relative z-10 overflow-hidden">
        <GlowEffect className="w-[400px] h-[400px] bg-blue-500 top-0 -right-32" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative">
          <div className="text-center mb-10 md:mb-14 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-300 font-bold px-4 py-2 rounded-full text-xs uppercase tracking-widest mb-5">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              Próximamente
            </div>
            <h3 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter mb-4">
              Buscador de <span className="text-transparent bg-clip-text bg-gradient-to-b from-brand-amber to-yellow-200">Parking</span> al mejor precio
            </h3>
            <p className="text-slate-400 text-base md:text-xl leading-relaxed">
              Comparamos por ti los principales parkings de aeropuertos y centros urbanos de España. Tú nos dices dónde y cuándo, te enviamos la mejor opción a tu email.
            </p>
          </div>

          {parkingStatus === 'done' ? (
            <div className="max-w-xl mx-auto bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 mb-4">
                <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h4 className="text-2xl font-bold mb-2">¡Anotado!</h4>
              <p className="text-emerald-200/80">Te enviamos la mejor opción a <strong className="text-white">{parking.email || user?.email}</strong> en menos de 24h.</p>
              <button
                onClick={() => { setParking(EMPTY_PARKING); setParkingStatus('idle'); }}
                className="mt-6 text-sm text-emerald-300 hover:text-white transition-colors underline"
              >
                Hacer otra búsqueda
              </button>
            </div>
          ) : (
            <form onSubmit={handleParkingSubmit} className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-widest font-bold">Destino</label>
                <input
                  required
                  type="text"
                  placeholder="Ej: Madrid-Barajas, Barcelona aeropuerto, Málaga centro…"
                  value={parking.destino}
                  onChange={(e) => setParking(p => ({ ...p, destino: e.target.value }))}
                  className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-amber transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-widest font-bold">Entrada</label>
                  <input
                    required
                    type="date"
                    value={parking.fechaEntrada}
                    onChange={(e) => setParking(p => ({ ...p, fechaEntrada: e.target.value }))}
                    className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-amber transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-widest font-bold">Salida</label>
                  <input
                    required
                    type="date"
                    value={parking.fechaSalida}
                    onChange={(e) => setParking(p => ({ ...p, fechaSalida: e.target.value }))}
                    className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-amber transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-widest font-bold">Email donde te enviamos la oferta</label>
                <input
                  required
                  type="email"
                  placeholder={user?.email || 'tu@email.com'}
                  value={parking.email || user?.email || ''}
                  onChange={(e) => setParking(p => ({ ...p, email: e.target.value }))}
                  className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-amber transition-colors"
                />
              </div>

              {parkingError && (
                <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{parkingError}</p>
              )}

              <button
                type="submit"
                disabled={parkingStatus === 'sending'}
                className="w-full bg-brand-amber text-brand-navy font-bold py-3.5 rounded-full hover:bg-yellow-400 transition-colors disabled:opacity-60 disabled:cursor-wait"
              >
                {parkingStatus === 'sending' ? 'Buscando…' : 'Encuéntrame el mejor precio'}
              </button>

              <p className="text-[11px] text-slate-500 text-center pt-2">
                Servicio gratuito de prelanzamiento. Sin spam, sin compromiso de compra.
              </p>
            </form>
          )}
        </div>
      </section>

      <footer className="bg-[#04080e] py-10 md:py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-xs md:text-sm text-slate-500">
          <div className="flex items-center gap-2 md:gap-3 opacity-60">
            <span className="text-xl md:text-2xl">✈️</span>
            <span className="font-bold tracking-tight text-lg md:text-xl text-white">AeroSocio</span>
          </div>
          <p className="text-center">© 2026 AeroSocio ESPAÑA. Todos los derechos reservados.</p>
          <div className="flex gap-4 md:gap-6 justify-center md:justify-end">
            <button onClick={() => setModalContent(legalDocs.terminos)} className="hover:text-brand-amber transition-colors">Términos Legales</button>
            <button onClick={() => setModalContent(legalDocs.privacidad)} className="hover:text-brand-amber transition-colors">Privacidad</button>
            <button onClick={() => setModalContent(legalDocs.cookies)} className="hover:text-brand-amber transition-colors">Cookies</button>
          </div>
        </div>
      </footer>

      {modalContent && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalContent(null)}
          role="dialog"
          aria-modal="true"
          aria-label={modalContent.title}
        >
          <div
            className="bg-brand-navy border border-white/10 rounded-3xl p-8 max-w-2xl w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setModalContent(null)} aria-label="Cerrar" className="absolute top-6 right-6 text-slate-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h3 className="text-3xl font-bold mb-6">{modalContent.title}</h3>
            <div className="text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar space-y-5">
              {modalContent.paragraphs.map((p, i) => (
                <div key={i}>
                  {p.heading && <h4 className="font-bold text-white mb-2">{p.heading}</h4>}
                  {p.text && <p>{p.text}</p>}
                  {p.bullets && (
                    <ul className="list-disc pl-6 mt-2 space-y-1.5">
                      {p.bullets.map((b, j) => <li key={j}>{b}</li>)}
                    </ul>
                  )}
                  {p.footer && <p className="mt-3">{p.footer}</p>}
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <button onClick={() => setModalContent(null)} className="bg-brand-amber text-brand-navy font-bold py-3 px-8 rounded-full hover:bg-yellow-400 transition-colors">Aceptar y Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {servicio && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeServicio}
          role="dialog"
          aria-modal="true"
          aria-label={servicio.titulo}
        >
          <div
            className="bg-brand-navy border border-white/10 rounded-3xl p-6 md:p-8 max-w-lg w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={closeServicio} aria-label="Cerrar" className="absolute top-5 right-5 text-slate-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            {servicioStatus === 'done' ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 mb-4">
                  <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="text-2xl font-bold mb-2">¡Solicitud recibida!</h3>
                <p className="text-slate-300 mb-1">{servicio.disponible
                  ? 'Te contactamos en menos de 24h para arrancar la gestión.'
                  : 'Te avisaremos en cuanto el servicio esté disponible.'}</p>
                <p className="text-xs text-slate-500 mt-3">Te confirmamos en <strong className="text-white">{servicioForm.email}</strong>.</p>
                <button onClick={closeServicio} className="mt-6 bg-brand-amber text-brand-navy font-bold py-2.5 px-6 rounded-full hover:bg-yellow-400 transition-colors">Cerrar</button>
              </div>
            ) : (
              <form onSubmit={handleServicioSubmit}>
                <div className="flex items-start gap-3 mb-1">
                  <span className="text-3xl">{servicio.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight">{servicio.titulo}</h3>
                    <p className="text-xs text-slate-400">{servicio.precio} · {servicio.disponible ? 'Disponible ahora' : 'Próximamente'}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300 mb-5 mt-2">{servicio.desc}</p>

                <label className="text-xs text-slate-400 uppercase tracking-widest font-bold">Email</label>
                <input
                  required
                  type="email"
                  placeholder="tu@email.com"
                  value={servicioForm.email}
                  onChange={(e) => setServicioForm(s => ({ ...s, email: e.target.value }))}
                  className="mt-2 mb-4 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-amber transition-colors"
                />

                {servicio.perDay && (
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="col-span-2">
                      <label className="text-xs text-slate-400 uppercase tracking-widest font-bold">Destino del viaje</label>
                      <input required type="text" placeholder="Ej: Japón, EE. UU., Tailandia…"
                        value={servicioForm.destino}
                        onChange={(e) => setServicioForm(s => ({ ...s, destino: e.target.value }))}
                        className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-amber transition-colors" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 uppercase tracking-widest font-bold">Días</label>
                      <input required type="number" min="1" max="90"
                        value={servicioForm.dias}
                        onChange={(e) => setServicioForm(s => ({ ...s, dias: e.target.value }))}
                        className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-amber transition-colors" />
                    </div>
                  </div>
                )}

                {servicio.requiereEnvio && (
                  <div className="space-y-3 mb-4">
                    <input required type="text" placeholder="Dirección de envío (calle, número, piso)" value={servicioForm.direccion}
                      onChange={(e) => setServicioForm(s => ({ ...s, direccion: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-amber transition-colors" />
                    <div className="grid grid-cols-3 gap-3">
                      <input required type="text" inputMode="numeric" pattern="[0-9]{5}" placeholder="C.P." value={servicioForm.cp}
                        onChange={(e) => setServicioForm(s => ({ ...s, cp: e.target.value }))}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-amber transition-colors" />
                      <input required type="text" placeholder="Población" value={servicioForm.poblacion}
                        onChange={(e) => setServicioForm(s => ({ ...s, poblacion: e.target.value }))}
                        className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-amber transition-colors" />
                    </div>
                    <input required type="text" placeholder="Provincia" value={servicioForm.provincia}
                      onChange={(e) => setServicioForm(s => ({ ...s, provincia: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-amber transition-colors" />
                    <input required type="tel" placeholder="Teléfono de contacto" value={servicioForm.telefono}
                      onChange={(e) => setServicioForm(s => ({ ...s, telefono: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-amber transition-colors" />
                  </div>
                )}

                <label className="text-xs text-slate-400 uppercase tracking-widest font-bold">
                  {servicio.id === 'recurso-multa' ? 'Datos de la multa' : (servicio.perDay ? 'Notas adicionales (opcional)' : (servicio.requiereEnvio ? 'Notas adicionales (opcional)' : 'Cuéntanos los detalles'))}
                </label>
                <textarea
                  rows={4}
                  required={!servicio.perDay && !servicio.requiereEnvio}
                  placeholder={
                    servicio.id === 'recurso-multa'
                      ? 'Número de boletín, fecha, matrícula, motivo, organismo emisor (DGT / Ayuntamiento / etc.) y cualquier detalle relevante. Si tienes el PDF, indica que lo enviarás por email tras pagar.'
                      : servicio.id === 'cita-itv'
                      ? 'Matrícula, ciudad / provincia y franja horaria preferente.'
                      : servicio.perDay
                      ? 'Cualquier detalle adicional sobre tu plan de datos.'
                      : servicio.requiereEnvio
                      ? 'Notas para el envío (ej. portal, horario de entrega…).'
                      : (servicio.disponible
                          ? 'Cuéntanos qué necesitas exactamente.'
                          : 'Cuéntanos qué buscas para priorizar este servicio en el roadmap.')
                  }
                  value={servicioForm.detalles}
                  onChange={(e) => setServicioForm(s => ({ ...s, detalles: e.target.value }))}
                  className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-amber transition-colors resize-none"
                />

                {servicio.requierePago && (
                  <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-sm text-slate-300">Total a pagar</span>
                    <span className="text-2xl font-bold text-brand-amber">€{servicioTotal().toFixed(2)}</span>
                  </div>
                )}

                {servicioError && (
                  <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mt-4">{servicioError}</p>
                )}

                <button
                  type="submit"
                  disabled={servicioStatus === 'sending' || isLoadingPayment}
                  className="mt-5 w-full bg-brand-amber text-brand-navy font-bold py-3 rounded-full hover:bg-yellow-400 transition-colors disabled:opacity-60 disabled:cursor-wait"
                >
                  {servicioStatus === 'sending' || isLoadingPayment
                    ? 'Procesando…'
                    : (servicio.requierePago
                        ? `Pagar €${servicioTotal().toFixed(2)}`
                        : (servicio.disponible ? 'Solicitar servicio' : 'Avisarme cuando esté listo'))}
                </button>

                <p className="text-[11px] text-slate-500 text-center mt-3">
                  {servicio.requierePago
                    ? 'Pago seguro con SumUp. Recibirás un email de confirmación con los siguientes pasos.'
                    : (servicio.disponible
                        ? 'Sin coste por registrarte. El precio mostrado se cobra al completar el servicio.'
                        : 'Te avisaremos sin compromiso.')}
                </p>
              </form>
            )}
          </div>
        </div>
      )}

      {sumupCheckout && (
        <div
          className="fixed inset-0 z-[105] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Completar pago"
        >
          <div className="bg-brand-navy border border-white/10 rounded-3xl p-6 md:p-8 max-w-lg w-full relative shadow-2xl">
            <button onClick={closeSumupCheckout} aria-label="Cancelar pago" className="absolute top-5 right-5 text-slate-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h3 className="text-2xl font-bold tracking-tight mb-1">Completa tu pago</h3>
            <p className="text-slate-400 text-sm mb-5">
              {sumupCheckout.plan === 'annual'
                ? 'Plan Anual + Baliza V16 — €49'
                : 'Plan Mensual — €5'}
            </p>
            {sumupError && (
              <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 mb-4">{sumupError}</p>
            )}
            <div id="sumup-card" className="bg-white rounded-2xl p-4 min-h-[360px]"></div>
            <p className="text-[11px] text-slate-500 mt-4 text-center">Pago seguro procesado por SumUp. AeroSocio no almacena los datos de tu tarjeta.</p>
          </div>
        </div>
      )}

      {paymentSuccess && (
        <div
          className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Pago confirmado"
        >
          <div className="bg-brand-navy border border-brand-amber/30 rounded-3xl p-8 md:p-10 max-w-2xl w-full relative shadow-2xl shadow-brand-amber/10">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 mb-4">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight">¡Bienvenido al club{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}!</h3>
              <p className="text-slate-300 mt-3">
                Tu pago se ha procesado correctamente. Ya formas parte de AeroSocio VIP{paymentSuccess.plan === 'annual' ? ' (Plan Anual)' : ' (Plan Mensual)'}.
              </p>
            </div>

            {paymentSuccess.plan !== 'annual' && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center text-slate-300">
                <p>Recibirás un email de confirmación en breve. Si tienes cualquier duda, escríbenos a <a className="text-brand-amber font-semibold" href="mailto:carlos.linares.es@gmail.com">carlos.linares.es@gmail.com</a>.</p>
              </div>
            )}

            {paymentSuccess.plan === 'annual' && shippingStatus !== 'done' && (
              <form onSubmit={handleShippingSubmit} className="space-y-4">
                <div className="bg-brand-amber/10 border border-brand-amber/30 rounded-2xl p-4 text-sm text-brand-amber">
                  🚨 <strong>Tu Baliza V16 DGT está incluida.</strong> Indícanos a dónde la enviamos (España peninsular).
                </div>
                {!user && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-sm text-red-300">
                    Tu sesión ha expirado tras volver de SumUp. <button type="button" onClick={handleGoogleLogin} className="underline font-semibold">Inicia sesión de nuevo</button> para registrar la dirección de envío.
                  </div>
                )}
                <input required type="text" placeholder="Nombre y apellidos" value={shipping.fullName}
                  onChange={(e) => setShipping(s => ({ ...s, fullName: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-amber transition-colors" />
                <input required type="text" placeholder="Calle, número" value={shipping.addressLine1}
                  onChange={(e) => setShipping(s => ({ ...s, addressLine1: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-amber transition-colors" />
                <input type="text" placeholder="Piso, puerta (opcional)" value={shipping.addressLine2}
                  onChange={(e) => setShipping(s => ({ ...s, addressLine2: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-amber transition-colors" />
                <div className="grid grid-cols-3 gap-3">
                  <input required type="text" inputMode="numeric" pattern="[0-9]{5}" placeholder="C.P." value={shipping.postalCode}
                    onChange={(e) => setShipping(s => ({ ...s, postalCode: e.target.value }))}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-amber transition-colors" />
                  <input required type="text" placeholder="Ciudad" value={shipping.city}
                    onChange={(e) => setShipping(s => ({ ...s, city: e.target.value }))}
                    className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-amber transition-colors" />
                </div>
                <input required type="text" placeholder="Provincia" value={shipping.province}
                  onChange={(e) => setShipping(s => ({ ...s, province: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-amber transition-colors" />
                <input required type="tel" placeholder="Teléfono de contacto" value={shipping.phone}
                  onChange={(e) => setShipping(s => ({ ...s, phone: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-amber transition-colors" />

                {shippingError && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{shippingError}</p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button type="button" onClick={closePaymentSuccess}
                    className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3 px-6 rounded-full transition-colors">
                    Más tarde
                  </button>
                  <button type="submit" disabled={shippingStatus === 'sending' || !user}
                    className="flex-[2] bg-brand-amber text-brand-navy font-bold py-3 px-6 rounded-full hover:bg-yellow-400 transition-colors disabled:opacity-60 disabled:cursor-wait">
                    {shippingStatus === 'sending' ? 'Enviando…' : 'Enviar mi Baliza V16'}
                  </button>
                </div>
              </form>
            )}

            {paymentSuccess.plan === 'annual' && shippingStatus === 'done' && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center text-emerald-300">
                <p className="font-semibold text-lg">¡Dirección registrada!</p>
                <p className="text-sm mt-2 text-emerald-200/80">Tu Baliza V16 saldrá rumbo a {shipping.city || 'tu domicilio'} en las próximas 48–72 h. Te enviaremos el número de seguimiento por email.</p>
              </div>
            )}

            <div className="mt-6 text-center">
              <button onClick={closePaymentSuccess} className="text-slate-400 hover:text-white text-sm transition-colors">
                {shippingStatus === 'done' ? 'Cerrar' : 'Volver a la página'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;