import React from 'react';

// Componente decorativo para los destellos de luz de fondo
const GlowEffect = ({ className }) => (
  <div className={`absolute rounded-full pointer-events-none blur-[150px] opacity-20 ${className}`}></div>
);

// Componente decorativo para los bordes brillantes
const ShineBorder = () => (
  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-amber/50 to-transparent"></div>
);

function App() {
  return (
    <div className="min-h-screen bg-[#08101a] text-white font-sans selection:bg-brand-amber selection:text-brand-navy relative overflow-hidden">
      
      {/* Luces de fondo dramáticas */}
      <GlowEffect className="w-[600px] h-[600px] bg-brand-amber -top-48 -left-48" />
      <GlowEffect className="w-[500px] h-[500px] bg-blue-500 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <GlowEffect className="w-[600px] h-[600px] bg-emerald-500 bottom-0 -right-48" />

      {/* Navbar con efecto Glassmorphism Super-Thin */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-brand-navy/60 border-b border-white/5">
        <div className="flex justify-between items-center p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <svg className="w-9 h-9 text-brand-amber drop-shadow-[0_0_8px_rgba(243,156,18,0.5)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h1 className="text-3xl font-extrabold tracking-tighter">Aero<span className="text-brand-amber">Socio</span></h1>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 p-1 rounded-full text-sm text-slate-300">
            {['¿Cómo Funciona?', 'Membresía VIP', 'Servicios'].map(item => (
              <button key={item} className="px-5 py-2 rounded-full hover:bg-white/5 transition-colors">{item}</button>
            ))}
          </div>
          <button className="bg-transparent border border-white/10 text-white font-semibold py-2.5 px-8 rounded-full hover:border-brand-amber hover:text-brand-amber transition-all duration-300">
            Acceso Socios
          </button>
        </div>
      </nav>

      {/* Hero Section con fondo cinemático mixto */}
      <main className="relative max-w-7xl mx-auto px-6 py-24 md:py-32 grid md:grid-cols-[1.5fr,1fr] gap-16 items-center">
        {/* Efecto decorativo de split-screen de fondo */}
        <div className="absolute inset-0 z-0 flex rounded-[40px] overflow-hidden border border-white/5">
          <div className="w-[60%] h-full bg-cover bg-left opacity-30" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1544016768-6820f8987107?q=80&w=2000)'}}></div>
          <div className="w-[40%] h-full bg-cover bg-right opacity-30" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1511191060931-df10b808f921?q=80&w=2000)'}}></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#08101a] via-[#08101a]/95 to-[#08101a]"></div>
        </div>

        {/* Columna Izquierda: Texto y CTA */}
        <div className="relative z-10 space-y-8">
          <div className="inline-flex items-center gap-3 bg-brand-amber/10 border border-brand-amber/20 text-brand-amber font-bold px-5 py-2.5 rounded-full text-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-amber opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-amber"></span>
            </span>
            ÚLTIMAS 1.000 BALIZAS DGT CONECTADAS DISPONIBLES
          </div>

          <h2 className="text-6xl md:text-8xl font-extrabold mb-6 leading-[0.9] tracking-tighter">
            El club <span className="text-transparent bg-clip-text bg-gradient-to-b from-brand-amber to-yellow-200">exclusivo</span> de Movilidad y Viajes VIP.
          </h2>

          <p className="text-2xl text-slate-300 leading-relaxed max-w-3xl">
            Gestionamos tu tranquilidad. Evita multas, organiza documentos en la nube y reclama tus vuelos retrasados. Únete hoy y llévate de regalo la nueva Baliza V16 conectada DGT enviada a tu domicilio.
          </p>

          {/* Panel de Suscripción con efecto Cristal y Gradiente de Oro Líquido */}
          <div className="relative group p-8 rounded-4xl bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden max-w-xl">
            <ShineBorder />
            <div className="flex items-center justify-between gap-6 relative z-10">
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-400">MEMBRESÍA VIP ESPAÑA</span>
                <p className="text-4xl font-extrabold tracking-tight">€49 <span className="text-lg font-normal text-slate-400">/año</span></p>
                <div className="text-xs text-green-400 bg-green-950/50 border border-green-800 inline-block px-3 py-1 rounded-full font-medium">STATUS: ACTIVO</div>
              </div>
              <button className="relative flex-shrink-0 bg-gradient-to-b from-brand-amber to-yellow-500 text-brand-navy text-xl font-extrabold py-5 px-10 rounded-full transition-all duration-300 transform group-hover:scale-105 shadow-[0_10px_40px_rgba(243,156,18,0.3)] group-hover:shadow-[0_15px_50px_rgba(243,156,18,0.5)]">
                <span className="relative z-10">UNIRSE AL CLUB VIP</span>
                <span className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></span>
              </button>
            </div>
          </div>
          <p className="text-slate-500 text-sm flex items-center gap-2 justify-start pl-8">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Incluye envío gratuito de la baliza V16 a toda España.
          </p>
        </div>

        {/* Columna Derecha: Showcase de la Baliza */}
        <div className="relative z-10 group bg-cover bg-center h-[500px] rounded-4xl border border-white/5 flex items-end p-10 overflow-hidden" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1596738140801-b7559ca5ca76?q=80&w=1000)'}}>
          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/60 to-transparent"></div>
          {/* Luz ámbar detrás de la baliza */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-brand-amber/30 blur-3xl rounded-full group-hover:bg-brand-amber/50 transition-colors"></div>
          
          <div className="relative z-10 flex items-center gap-6">
            <div className="p-4 bg-brand-amber rounded-2xl shadow-xl shadow-brand-amber/20">
              <span className="text-5xl">🚨</span>
            </div>
            <div>
              <div className="text-xs font-bold text-brand-amber bg-brand-amber/10 border border-brand-amber/20 inline-block px-3 py-1 rounded-full mb-1">REGALO EXCLUSIVO</div>
              <h4 className="text-3xl font-extrabold tracking-tight">Baliza V16 DGT Conectada</h4>
              <p className="text-slate-300">Te enviamos el dispositivo homologado obligatorio en España (Valor €20).</p>
            </div>
          </div>
        </div>
      </main>

      {/* Benefits Grid con Glassmorphism Mejorado */}
      <section className="bg-white/[0.02] backdrop-blur-xl py-32 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 max-w-3xl mx-auto space-y-2">
            <h3 className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-4">Todo lo que incluye tu membresía anual</h3>
            <p className="text-slate-400 text-xl leading-relaxed">Diseñado para que disfrutes del camino, nosotros nos ocupamos de los detalles.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature Cards con Hover Glaze */}
            {[
              {icon: '💻', title: 'Alertas Inteligentes', desc: 'Monitoreamos tu vehículo y te avisamos por WhatsApp antes de que caduque tu seguro o ITV para evitar multas de €200.', color: 'brand-amber', status: 'AHORRA EN MULTAS'},
              {icon: '✈️', title: 'Reclamación de Vuelos', desc: '¿Vuelo retrasado o cancelado? Nuestro equipo legal gestiona tu indemnización sin comisiones abusivas.', color: 'blue-500', status: 'SIN COMISIONES'},
              {icon: '📄', title: 'Gestión Documental DGT', desc: 'Todos tus documentos del coche y conductor seguros y organizados encriptadamente en nuestra nube VIP.', color: 'emerald-500', status: 'SEGURIDAD TOTAL'}
            ].map((item, index) => (
              <div key={index} className="relative group p-10 rounded-3xl bg-brand-navy/60 border border-white/5 hover:border-brand-amber transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-amber/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-2xl"></div>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border border-${item.color}/20 bg-${item.color}/10 text-4xl`}>{item.icon}</div>
                <h4 className="text-2xl font-bold mb-4 text-white tracking-tight">{item.title}</h4>
                <p className="text-slate-400 leading-relaxed mb-6">{item.desc}</p>
                <div className={`text-xs font-bold text-${item.color} bg-${item.color}/10 border border-${item.color}/20 inline-block px-4 py-1.5 rounded-full`}>{item.status}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Minimalista VIP */}
      <footer className="bg-[#04080e] py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-10 items-center text-sm text-slate-500">
          <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
            <span className="text-2xl">✈️</span>
            <span className="font-bold tracking-tight text-xl text-white">AeroSocio</span>
          </div>
          <p className="text-center">© 2026 AeroSocio ESPAÑA. Todos los derechos reservados.</p>
          <div className="flex gap-6 justify-end">
            {['Términos Legales', 'Privacidad', 'Cookies'].map(link => (
              <a key={link} href="#" className="hover:text-brand-amber transition-colors">{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;