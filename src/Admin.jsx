import { useCallback, useEffect, useMemo, useState } from 'react';

const TABS = [
  { id: 'overview', label: 'Resumen',  icon: '📊' },
  { id: 'pedidos',  label: 'Pedidos',  icon: '🧾' },
  { id: 'parking',  label: 'Parking',  icon: '🅿️' },
  { id: 'envios',   label: 'Envíos',   icon: '📦' },
  { id: 'socios',   label: 'Socios',   icon: '👥' },
  { id: 'clientes', label: 'Clientes Externos', icon: '📇' },
];

const ESTADOS_OUTREACH = {
  pendiente:  { label: 'Sin contactar', color: 'bg-white/5 text-slate-300 border-white/10' },
  contactado: { label: 'Contactado',    color: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
  respondio:  { label: 'Respondió',     color: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' },
  convertido: { label: 'Convertido',    color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
  opt_out:    { label: 'No molestar',   color: 'bg-red-500/10 text-red-300 border-red-500/30' },
};

const MENSAJES_TEMPLATES = [
  {
    id: 'baliza_v16',
    label: '🚨 Baliza V16 obligatoria',
    body: `Hola {{nombre}}, soy Carlos, fundador de AeroSocio.

Te escribo con un aviso importante: desde el 1 de enero de 2026, la Baliza V16 conectada será obligatoria en España y tu {{marca}} {{modelo}} ({{matricula}}) va a necesitar una sí o sí.

En AeroSocio te la regalamos al suscribirte al Plan Anual (49€/año) y te la enviamos a casa sin coste. Te ahorras la búsqueda de modelos homologados y la cumples antes de la fecha.

Más info: https://aerosocio.es

¿Quieres que te aparte una?`,
  },
  {
    id: 'esim_viaje',
    label: '📱 eSIM internacional',
    body: `Hola {{nombre}}, soy Carlos de AeroSocio.

¿Algún viaje a la vista? Tenemos eSIM internacional para 190 países a 10€/día. Sin roaming, sin tarjetas físicas — recibes un QR por email y activas el plan en 2 minutos.

Si tienes pensado viajar este mes, te lo dejo todo gestionado en menos de 24 h.

https://aerosocio.es

Si no es para ti ahora, ignora este mensaje. Saludos.`,
  },
  {
    id: 'recurso_multa',
    label: '⚖️ Recurso de multa 9,90€',
    body: `Hola {{nombre}}, soy Carlos de AeroSocio.

¿Te ha llegado alguna multa últimamente con tu {{marca}} ({{matricula}})? Te redactamos el recurso formal y lo presentamos en la sede electrónica del organismo competente por 9,90€.

Detalles: https://aerosocio.es

Si no tienes ninguna pendiente, ignora este mensaje. Saludos.`,
  },
  {
    id: 'opt_in',
    label: '✋ Opt-in inicial',
    body: `Hola {{nombre}}, soy Carlos de AeroSocio, un club de movilidad para conductores.

Recibes este mensaje porque aceptaste recibir información sobre servicios de movilidad. Somos un servicio nuevo y queremos ofrecer ventajas exclusivas a un grupo reducido de socios fundadores: Baliza V16 obligatoria gratis, recurso de multas, eSIM en viajes, gestoría DGT y mucho más.

Si quieres recibir nuestras ofertas, responde SÍ.
Si prefieres no recibir más mensajes, responde BAJA y borraré tu número de inmediato.

Gracias.`,
  },
];

function aplicarTemplate(template, cliente) {
  return template
    .replace(/\{\{nombre\}\}/g, cliente.nombre || '')
    .replace(/\{\{marca\}\}/g, cliente.marca_coche || '')
    .replace(/\{\{modelo\}\}/g, cliente.modelo_coche || '')
    .replace(/\{\{matricula\}\}/g, cliente.matricula || '')
    .replace(/\{\{telefono\}\}/g, cliente.telefono || '')
    .replace(/\{\{email\}\}/g, cliente.email || '');
}

function whatsappLink(phone, mensaje) {
  const clean = (phone || '').replace(/[^0-9]/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(mensaje)}`;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const parseLine = (line) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuotes) {
        if (c === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
        } else cur += c;
      } else {
        if (c === ',' || c === ';' || c === '\t') { result.push(cur); cur = ''; }
        else if (c === '"' && cur === '') inQuotes = true;
        else cur += c;
      }
    }
    result.push(cur);
    return result;
  };
  const headers = parseLine(lines[0]).map(h => h.trim().toLowerCase());
  const rows = lines.slice(1).map(line => {
    const cols = parseLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = (cols[i] || '').trim(); });
    return row;
  });
  return { headers, rows };
}

const ESTADOS = {
  pendiente:       { label: 'Pendiente',       color: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' },
  pendiente_pago:  { label: 'Esperando pago',  color: 'bg-orange-500/10 text-orange-300 border-orange-500/30' },
  pagado:          { label: 'Pagado',          color: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
  en_curso:        { label: 'En curso',        color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' },
  completado:      { label: 'Completado',      color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
  cancelado:       { label: 'Cancelado',       color: 'bg-red-500/10 text-red-300 border-red-500/30' },
  pending:         { label: 'Pendiente',       color: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' },
  enviado:         { label: 'Enviado',         color: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
  entregado:       { label: 'Entregado',       color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
};

function Badge({ value }) {
  const cfg = ESTADOS[value] || ESTADOS_OUTREACH[value] || { label: value || '—', color: 'bg-white/5 text-slate-300 border-white/10' };
  return (
    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
}

function fmtEuros(n) {
  if (n == null) return '—';
  return `€${Number(n).toFixed(2)}`;
}

export default function Admin({ supabase, user, onExit }) {
  const [tab, setTab] = useState('overview');
  const [pedidos, setPedidos] = useState([]);
  const [parking, setParking] = useState([]);
  const [envios, setEnvios] = useState([]);
  const [socios, setSocios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState(null);   // { tabla, fila, estadoField }
  const [editForm, setEditForm] = useState({ estado: '', notas: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [filterEstado, setFilterEstado] = useState('todos');
  const [search, setSearch] = useState('');
  // Estado especifico para la pestaña de clientes externos
  const [importCsvOpen, setImportCsvOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvPreview, setCsvPreview] = useState(null); // { rows, valid, invalid }
  const [importing, setImporting] = useState(false);
  const [templateId, setTemplateId] = useState('baliza_v16');
  const [templateBody, setTemplateBody] = useState(MENSAJES_TEMPLATES[0].body);
  const [filtroMarca, setFiltroMarca] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s1, s2, s3, s4, s5] = await Promise.all([
        supabase.from('solicitudes_servicios').select('*').order('created_at', { ascending: false }),
        supabase.from('solicitudes_parking').select('*').order('created_at', { ascending: false }),
        supabase.from('envios_baliza').select('*').order('created_at', { ascending: false }),
        supabase.from('perfiles').select('*'),
        supabase.from('clientes_externos').select('*').order('created_at', { ascending: false }),
      ]);
      if (s1.error) throw s1.error;
      if (s2.error) throw s2.error;
      if (s3.error) throw s3.error;
      if (s4.error) console.warn('perfiles:', s4.error);
      if (s5.error) console.warn('clientes_externos:', s5.error);
      setPedidos(s1.data || []);
      setParking(s2.data || []);
      setEnvios(s3.data || []);
      setSocios(s4.data || []);
      setClientes(s5.data || []);
    } catch (e) {
      console.error(e);
      setError(e.message || 'No pudimos cargar datos. ¿Aplicaste las RLS de admin en Supabase?');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadAll(); }, [loadAll]);

  const stats = useMemo(() => {
    const ahora = new Date();
    const ingresosMes = pedidos
      .filter(p => ['pagado', 'completado'].includes(p.estado))
      .filter(p => {
        const d = new Date(p.created_at);
        return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear();
      })
      .reduce((acc, p) => acc + Number(p.monto || 0), 0);
    return {
      pedidosPendientes: pedidos.filter(p => ['pendiente', 'pendiente_pago', 'pagado', 'en_curso'].includes(p.estado)).length,
      pedidosTotales: pedidos.length,
      parkingPendientes: parking.filter(p => p.estado === 'pendiente').length,
      enviosPendientes: envios.filter(e => (e.status || 'pending') === 'pending').length,
      sociosTotales: socios.length,
      sociosVip: socios.filter(s => s.es_vip).length,
      ingresosMes,
    };
  }, [pedidos, parking, envios, socios]);

  const openEdit = (tabla, fila, estadoField = 'estado', notasField = 'notas_admin') => {
    setEdit({ tabla, fila, estadoField, notasField });
    setEditForm({ estado: fila[estadoField] || '', notas: fila[notasField] || '' });
  };

  const closeEdit = () => { setEdit(null); setEditSaving(false); };

  const saveEdit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const update = { [edit.estadoField]: editForm.estado };
      if (edit.notasField) update[edit.notasField] = editForm.notas || null;
      const { error: err } = await supabase.from(edit.tabla).update(update).eq('id', edit.fila.id);
      if (err) throw err;
      await loadAll();
      closeEdit();
    } catch (e2) {
      alert('Error guardando: ' + e2.message);
      setEditSaving(false);
    }
  };

  // --- Clientes externos: parser, preview, import, marcar contactado ---
  const previsualizarCsv = () => {
    if (!csvText.trim()) { setCsvPreview(null); return; }
    try {
      const parsed = parseCsv(csvText);
      const valid = [];
      const invalid = [];
      const phoneOk = /^\+?\d{8,15}$/;
      parsed.rows.forEach((r) => {
        const tel = (r.telefono || r.phone || '').replace(/\s+/g, '');
        if (!tel || !phoneOk.test(tel.replace(/^\+/, ''))) {
          invalid.push({ row: r, motivo: 'Teléfono inválido o vacío' });
          return;
        }
        valid.push({
          nombre: r.nombre || r.name || '',
          telefono: tel,
          email: r.email || '',
          matricula: (r.matricula || r.plate || '').toUpperCase(),
          marca_coche: r.marca || r.marca_coche || r.brand || '',
          modelo_coche: r.modelo || r.modelo_coche || r.model || '',
          anio_coche: parseInt(r.anio || r.year || r.anio_coche || '', 10) || null,
          ultima_compra: r.ultima_compra || r.last_purchase || null,
          total_compras: parseInt(r.total_compras || r.compras || '1', 10) || 1,
          notas: r.notas || r.notes || '',
        });
      });
      setCsvPreview({ valid, invalid });
    } catch (e) {
      setError('Error parseando CSV: ' + e.message);
      setCsvPreview(null);
    }
  };

  const importarClientes = async () => {
    if (!csvPreview || csvPreview.valid.length === 0) return;
    setImporting(true);
    try {
      const rows = csvPreview.valid.map(c => ({
        ...c,
        source: 'valet_madrid',
        consentimiento_marketing: true,
        estado_outreach: 'pendiente',
      }));
      const { error: err } = await supabase.from('clientes_externos').insert(rows);
      if (err) throw err;
      setCsvText('');
      setCsvPreview(null);
      setImportCsvOpen(false);
      await loadAll();
    } catch (e) {
      alert('Error importando: ' + e.message);
    } finally {
      setImporting(false);
    }
  };

  const marcarContactado = async (cliente) => {
    try {
      await supabase.from('clientes_externos').update({
        estado_outreach: 'contactado',
        enviado_at: new Date().toISOString(),
      }).eq('id', cliente.id);
      await loadAll();
    } catch (e) {
      console.warn('No se pudo marcar como contactado:', e);
    }
  };

  // --- Filtro común a las tablas con `estado` ---
  const matchesFilter = (row, estadoField = 'estado') => {
    const estadoOk = filterEstado === 'todos' || row[estadoField] === filterEstado;
    if (!estadoOk) return false;
    if (!search) return true;
    const haystack = JSON.stringify(row).toLowerCase();
    return haystack.includes(search.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-[#08101a] text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-brand-navy/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <h1 className="text-lg md:text-xl font-extrabold tracking-tight">
                AeroSocio <span className="text-brand-amber">Admin</span>
              </h1>
              <p className="text-[11px] text-slate-500 hidden md:block">Conectado como {user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadAll} disabled={loading}
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold py-2 px-3 rounded-full transition-colors disabled:opacity-60">
              {loading ? 'Cargando…' : 'Recargar'}
            </button>
            <button onClick={onExit}
              className="bg-brand-amber text-brand-navy text-xs font-bold py-2 px-3 rounded-full hover:bg-yellow-400 transition-colors">
              ← Volver al sitio
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id}
              onClick={() => { setTab(t.id); setFilterEstado('todos'); setSearch(''); }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id ? 'text-brand-amber border-brand-amber' : 'text-slate-400 border-transparent hover:text-white'
              }`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {tab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Stat label="Pedidos pendientes" value={stats.pedidosPendientes} hint={`${stats.pedidosTotales} totales`} />
              <Stat label="Búsquedas parking" value={stats.parkingPendientes} hint="esperando respuesta" />
              <Stat label="Baliza por enviar" value={stats.enviosPendientes} hint="direcciones registradas" />
              <Stat label="Ingresos del mes" value={fmtEuros(stats.ingresosMes)} hint={`${stats.sociosTotales} socios · ${stats.sociosVip} VIP`} amber />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <QuickList
                title="Últimos pedidos"
                rows={pedidos.slice(0, 6)}
                renderRow={(p) => (
                  <button onClick={() => openEdit('solicitudes_servicios', p)}
                    className="w-full flex items-start justify-between gap-3 text-left hover:bg-white/5 px-3 py-2 rounded-xl transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{p.titulo}</p>
                      <p className="text-xs text-slate-500 truncate">{p.email} · {fmtDate(p.created_at)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge value={p.estado} />
                      {p.monto != null && <span className="text-xs text-slate-400">{fmtEuros(p.monto)}</span>}
                    </div>
                  </button>
                )}
              />
              <QuickList
                title="Búsquedas de parking recientes"
                rows={parking.slice(0, 6)}
                renderRow={(p) => (
                  <button onClick={() => openEdit('solicitudes_parking', p)}
                    className="w-full flex items-start justify-between gap-3 text-left hover:bg-white/5 px-3 py-2 rounded-xl transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{p.destino}</p>
                      <p className="text-xs text-slate-500 truncate">{p.email} · {p.fecha_entrada} → {p.fecha_salida}</p>
                    </div>
                    <Badge value={p.estado} />
                  </button>
                )}
              />
            </div>
          </div>
        )}

        {tab === 'pedidos' && (
          <SectionTable
            titulo="Pedidos del Marketplace"
            ayuda="Solicitudes de servicios y productos (recurso de multa, ITV, eSIM, baliza premium, etc.)"
            estadoOpciones={['todos', 'pendiente_pago', 'pagado', 'en_curso', 'completado', 'cancelado', 'pendiente']}
            filterEstado={filterEstado} setFilterEstado={setFilterEstado}
            search={search} setSearch={setSearch}
            rows={pedidos.filter(r => matchesFilter(r))}
            columns={[
              { label: 'Servicio', render: (p) => <div><div className="font-bold">{p.titulo}</div><div className="text-[11px] text-slate-500">{p.tipo}</div></div> },
              { label: 'Cliente', render: (p) => <div className="text-sm">{p.email}</div> },
              { label: 'Monto', render: (p) => <div className="font-bold text-brand-amber">{fmtEuros(p.monto)}</div> },
              { label: 'Estado', render: (p) => <Badge value={p.estado} /> },
              { label: 'Fecha', render: (p) => <div className="text-xs text-slate-400 whitespace-nowrap">{fmtDate(p.created_at)}</div> },
            ]}
            onRowClick={(p) => openEdit('solicitudes_servicios', p)}
            loading={loading}
          />
        )}

        {tab === 'parking' && (
          <SectionTable
            titulo="Búsquedas de Parking"
            ayuda="Captura de demanda. Respondé manualmente con el mejor precio que encuentres en Parclick / Looking4Parking."
            estadoOpciones={['todos', 'pendiente', 'en_curso', 'completado', 'cancelado']}
            filterEstado={filterEstado} setFilterEstado={setFilterEstado}
            search={search} setSearch={setSearch}
            rows={parking.filter(r => matchesFilter(r))}
            columns={[
              { label: 'Destino', render: (p) => <div className="font-bold">{p.destino}</div> },
              { label: 'Cliente', render: (p) => <div className="text-sm">{p.email}</div> },
              { label: 'Fechas', render: (p) => <div className="text-sm">{p.fecha_entrada} → {p.fecha_salida}</div> },
              { label: 'Estado', render: (p) => <Badge value={p.estado} /> },
              { label: 'Fecha', render: (p) => <div className="text-xs text-slate-400 whitespace-nowrap">{fmtDate(p.created_at)}</div> },
            ]}
            onRowClick={(p) => openEdit('solicitudes_parking', p)}
            loading={loading}
          />
        )}

        {tab === 'envios' && (
          <SectionTable
            titulo="Envíos de Baliza V16"
            ayuda="Direcciones registradas por socios anuales y VIP+. Tickear conforme vayas enviando."
            estadoOpciones={['todos', 'pending', 'enviado', 'entregado', 'cancelado']}
            filterEstado={filterEstado} setFilterEstado={setFilterEstado}
            search={search} setSearch={setSearch}
            rows={envios.filter(r => matchesFilter(r, 'status'))}
            columns={[
              { label: 'Destinatario', render: (e) => <div><div className="font-bold">{e.full_name}</div><div className="text-[11px] text-slate-500">{e.user_email}</div></div> },
              { label: 'Dirección', render: (e) => <div className="text-sm">{e.address_line_1}{e.address_line_2 ? `, ${e.address_line_2}` : ''}, {e.postal_code} {e.city}</div> },
              { label: 'Teléfono', render: (e) => <div className="text-sm">{e.phone}</div> },
              { label: 'Estado', render: (e) => <Badge value={e.status} /> },
              { label: 'Fecha', render: (e) => <div className="text-xs text-slate-400 whitespace-nowrap">{fmtDate(e.created_at)}</div> },
            ]}
            onRowClick={(e) => openEdit('envios_baliza', e, 'status')}
            loading={loading}
          />
        )}

        {tab === 'clientes' && (
          <ClientesPanel
            clientes={clientes}
            loading={loading}
            templateId={templateId} setTemplateId={(id) => {
              setTemplateId(id);
              const t = MENSAJES_TEMPLATES.find(x => x.id === id);
              if (t) setTemplateBody(t.body);
            }}
            templateBody={templateBody} setTemplateBody={setTemplateBody}
            filtroMarca={filtroMarca} setFiltroMarca={setFiltroMarca}
            filterEstado={filterEstado} setFilterEstado={setFilterEstado}
            search={search} setSearch={setSearch}
            onImport={() => setImportCsvOpen(true)}
            onContactado={marcarContactado}
          />
        )}

        {tab === 'socios' && (
          <SectionTable
            titulo="Socios registrados"
            ayuda="Usuarios que se han logueado con Google. Para gestionar planes y fechas de renovación, edita directamente desde la fila."
            estadoOpciones={[]}
            filterEstado={filterEstado} setFilterEstado={setFilterEstado}
            search={search} setSearch={setSearch}
            rows={socios.filter(r => !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase()))}
            columns={[
              { label: 'Nombre', render: (s) => <div className="font-bold">{s.nombre || '—'}</div> },
              { label: 'ID', render: (s) => <div className="text-[11px] text-slate-500 font-mono">{s.id.slice(0, 8)}…</div> },
              { label: 'VIP', render: (s) => s.es_vip ? <Badge value="completado" /> : <span className="text-xs text-slate-500">No</span> },
              { label: 'Vence', render: (s) => <div className="text-sm">{s.suscripcion_fin || '—'}</div> },
              { label: 'Referido por', render: (s) => <div className="text-[11px] text-slate-500 font-mono">{(s.referido_por || '').slice(0, 8) || '—'}</div> },
            ]}
            onRowClick={null}
            loading={loading}
          />
        )}
      </main>

      {/* Edit modal */}
      {edit && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeEdit}>
          <div className="bg-brand-navy border border-white/10 rounded-3xl p-6 md:p-8 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={closeEdit} aria-label="Cerrar" className="absolute top-5 right-5 text-slate-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-1">Editar registro</h3>
            <p className="text-xs text-slate-500 mb-5">Tabla: <code className="text-brand-amber">{edit.tabla}</code> · ID: <code className="text-slate-400">{edit.fila.id}</code></p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-5 space-y-2 text-sm">
              {Object.entries(edit.fila).map(([k, v]) => {
                if (k === edit.estadoField || k === edit.notasField) return null;
                if (k === 'id') return null;
                return (
                  <div key={k} className="grid grid-cols-3 gap-3">
                    <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">{k}</div>
                    <div className="col-span-2 text-slate-200 break-words whitespace-pre-wrap">
                      {v == null || v === '' ? <span className="text-slate-600">—</span> : String(v)}
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-widest font-bold">Estado</label>
                <select value={editForm.estado}
                  onChange={(e) => setEditForm(f => ({ ...f, estado: e.target.value }))}
                  className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-amber transition-colors">
                  <option value="">— sin estado —</option>
                  {Object.keys(ESTADOS).map(k => (
                    <option key={k} value={k}>{ESTADOS[k].label} ({k})</option>
                  ))}
                </select>
              </div>

              {edit.notasField && (
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-widest font-bold">Notas internas</label>
                  <textarea rows={3} value={editForm.notas}
                    onChange={(e) => setEditForm(f => ({ ...f, notas: e.target.value }))}
                    placeholder="Anotaciones privadas para tu seguimiento, no visibles al cliente."
                    className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-brand-amber transition-colors resize-none" />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeEdit}
                  className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3 rounded-full transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={editSaving}
                  className="flex-[2] bg-brand-amber text-brand-navy font-bold py-3 rounded-full hover:bg-yellow-400 transition-colors disabled:opacity-60 disabled:cursor-wait">
                  {editSaving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Importar CSV */}
      {importCsvOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setImportCsvOpen(false)}>
          <div className="bg-brand-navy border border-white/10 rounded-3xl p-6 md:p-8 max-w-3xl w-full relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setImportCsvOpen(false)} aria-label="Cerrar"
              className="absolute top-5 right-5 text-slate-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h3 className="text-2xl font-bold mb-2">Importar clientes (CSV)</h3>
            <p className="text-sm text-slate-400 mb-5">Copia las filas desde Excel/Google Sheets y pégalas aquí. La primera fila debe tener los encabezados.</p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 mb-4 text-xs font-mono">
              <div className="text-slate-400 mb-1">Encabezados aceptados (en este orden o cualquiera):</div>
              <div className="text-brand-amber">nombre, telefono, email, matricula, marca, modelo, anio, ultima_compra, total_compras, notas</div>
              <div className="text-slate-500 mt-2">Separadores: coma, punto y coma o tab. Teléfono en formato internacional sin espacios (ej: 34600123456).</div>
            </div>

            <textarea rows={8} value={csvText} onChange={(e) => setCsvText(e.target.value)}
              placeholder={`nombre,telefono,marca,modelo,matricula\nJuan Pérez,34600123456,BMW,Serie 3,1234ABC\nMaría García,34611222333,Seat,Ibiza,5678BCD`}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-xs placeholder-slate-600 focus:outline-none focus:border-brand-amber resize-none"></textarea>

            <div className="flex gap-3 mt-4">
              <button onClick={previsualizarCsv} disabled={!csvText.trim()}
                className="flex-1 bg-white/10 border border-white/20 hover:bg-white/15 text-white font-bold py-3 rounded-full transition-colors disabled:opacity-60">
                Previsualizar
              </button>
              {csvPreview && csvPreview.valid.length > 0 && (
                <button onClick={importarClientes} disabled={importing}
                  className="flex-[2] bg-brand-amber text-brand-navy font-bold py-3 rounded-full hover:bg-yellow-400 transition-colors disabled:opacity-60">
                  {importing ? 'Importando…' : `Importar ${csvPreview.valid.length} clientes`}
                </button>
              )}
            </div>

            {csvPreview && (
              <div className="mt-5">
                <div className="flex items-center gap-4 mb-3 text-sm">
                  <span className="text-emerald-300">✓ Válidos: {csvPreview.valid.length}</span>
                  {csvPreview.invalid.length > 0 && <span className="text-red-300">✕ Inválidos: {csvPreview.invalid.length}</span>}
                </div>
                {csvPreview.valid.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-white/5">
                        <tr><th className="px-3 py-2 text-left">Nombre</th><th className="px-3 py-2 text-left">Tel</th><th className="px-3 py-2 text-left">Coche</th><th className="px-3 py-2 text-left">Matrícula</th></tr>
                      </thead>
                      <tbody>
                        {csvPreview.valid.slice(0, 50).map((c, i) => (
                          <tr key={i} className="border-t border-white/5">
                            <td className="px-3 py-2">{c.nombre}</td>
                            <td className="px-3 py-2 text-slate-400">{c.telefono}</td>
                            <td className="px-3 py-2">{c.marca_coche} {c.modelo_coche}</td>
                            <td className="px-3 py-2 font-mono">{c.matricula}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvPreview.valid.length > 50 && <p className="text-center text-xs text-slate-500 py-2">…y {csvPreview.valid.length - 50} más</p>}
                  </div>
                )}
                {csvPreview.invalid.length > 0 && (
                  <details className="mt-3 text-xs text-slate-400">
                    <summary className="cursor-pointer hover:text-white">Ver filas rechazadas ({csvPreview.invalid.length})</summary>
                    <div className="mt-2 bg-red-500/5 border border-red-500/20 rounded-xl p-3 max-h-32 overflow-y-auto">
                      {csvPreview.invalid.map((inv, i) => (
                        <div key={i} className="py-1 border-b border-red-500/10 last:border-b-0">
                          <span className="text-red-300">{inv.motivo}:</span> <span className="font-mono text-slate-500">{JSON.stringify(inv.row).slice(0, 120)}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ClientesPanel({ clientes, loading, templateId, setTemplateId, templateBody, setTemplateBody, filtroMarca, setFiltroMarca, filterEstado, setFilterEstado, search, setSearch, onImport, onContactado }) {
  const marcasUnicas = Array.from(new Set(clientes.map(c => c.marca_coche).filter(Boolean))).sort();

  const filtrados = clientes.filter(c => {
    if (filtroMarca && c.marca_coche !== filtroMarca) return false;
    if (filterEstado !== 'todos' && (c.estado_outreach || 'pendiente') !== filterEstado) return false;
    if (search && !JSON.stringify(c).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Clientes Externos</h2>
          <p className="text-slate-400 text-sm mt-1">Tu base de clientes históricos del valet. Personaliza el mensaje con sus datos y abre WhatsApp Web con un click — vos envías manualmente para no exponer tu cuenta.</p>
        </div>
        <button onClick={onImport}
          className="bg-brand-amber text-brand-navy font-bold py-2 px-4 rounded-full hover:bg-yellow-400 transition-colors text-sm whitespace-nowrap">
          + Importar CSV
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-5 mb-5">
        <label className="text-xs text-slate-400 uppercase tracking-widest font-bold">Plantilla de mensaje</label>
        <div className="flex flex-wrap gap-2 mt-2 mb-3">
          {MENSAJES_TEMPLATES.map(t => (
            <button key={t.id} onClick={() => setTemplateId(t.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                templateId === t.id
                  ? 'bg-brand-amber text-brand-navy'
                  : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
              }`}>{t.label}</button>
          ))}
        </div>
        <textarea rows={8} value={templateBody}
          onChange={(e) => setTemplateBody(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-brand-amber resize-none"></textarea>
        <p className="text-[11px] text-slate-500 mt-2">
          Variables disponibles: <code className="text-brand-amber">{'{{nombre}}'}</code>, <code className="text-brand-amber">{'{{marca}}'}</code>, <code className="text-brand-amber">{'{{modelo}}'}</code>, <code className="text-brand-amber">{'{{matricula}}'}</code>, <code className="text-brand-amber">{'{{email}}'}</code>. Se reemplazan automáticamente al abrir WhatsApp.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <select value={filtroMarca} onChange={(e) => setFiltroMarca(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white text-sm focus:outline-none focus:border-brand-amber">
          <option value="">Todas las marcas</option>
          {marcasUnicas.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <div className="flex gap-1 overflow-x-auto bg-white/5 border border-white/10 rounded-full p-1">
          {['todos', ...Object.keys(ESTADOS_OUTREACH)].map(op => (
            <button key={op} onClick={() => setFilterEstado(op)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                filterEstado === op ? 'bg-brand-amber text-brand-navy' : 'text-slate-300 hover:bg-white/5'
              }`}>
              {op === 'todos' ? 'Todos' : ESTADOS_OUTREACH[op].label}
            </button>
          ))}
        </div>
        <input type="search" placeholder="Buscar por nombre, matrícula, teléfono…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-amber" />
      </div>

      <div className="text-sm text-slate-400 mb-3">{filtrados.length} de {clientes.length} clientes</div>

      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-4 py-3">Cliente</th>
                <th className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-4 py-3">Coche</th>
                <th className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-4 py-3">Matrícula</th>
                <th className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-4 py-3">Estado</th>
                <th className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-500">Cargando…</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-500">
                  {clientes.length === 0
                    ? 'Aún no has importado clientes. Click en "+ Importar CSV" arriba.'
                    : 'No hay clientes que coincidan con los filtros.'}
                </td></tr>
              ) : filtrados.map((c) => {
                const mensaje = aplicarTemplate(templateBody, c);
                const link = whatsappLink(c.telefono, mensaje);
                return (
                  <tr key={c.id} className="border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold">{c.nombre || '—'}</div>
                      <div className="text-[11px] text-slate-500">{c.telefono}</div>
                      {c.email && <div className="text-[11px] text-slate-500">{c.email}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{c.marca_coche} {c.modelo_coche}</div>
                      {c.anio_coche && <div className="text-[11px] text-slate-500">{c.anio_coche}</div>}
                    </td>
                    <td className="px-4 py-3"><div className="text-sm font-mono">{c.matricula || '—'}</div></td>
                    <td className="px-4 py-3"><Badge value={c.estado_outreach || 'pendiente'} /></td>
                    <td className="px-4 py-3">
                      <a href={link} target="_blank" rel="noopener noreferrer"
                        onClick={() => onContactado(c)}
                        className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs px-3 py-2 rounded-full hover:bg-emerald-500/25 transition-colors whitespace-nowrap">
                        📱 WhatsApp
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, hint, amber }) {
  return (
    <div className={`rounded-3xl p-5 border ${amber ? 'bg-gradient-to-br from-brand-amber/15 to-yellow-200/5 border-brand-amber/40' : 'bg-white/5 border-white/10'}`}>
      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{label}</p>
      <p className={`text-3xl md:text-4xl font-extrabold mt-2 ${amber ? 'text-brand-amber' : 'text-white'}`}>{value}</p>
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function QuickList({ title, rows, renderRow }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
      <h4 className="text-sm font-bold uppercase tracking-widest text-slate-300 mb-3">{title}</h4>
      {rows.length === 0
        ? <p className="text-slate-500 text-sm py-4 text-center">Sin datos todavía.</p>
        : <div className="space-y-1">{rows.map((r, i) => <div key={r.id || i}>{renderRow(r)}</div>)}</div>}
    </div>
  );
}

function SectionTable({ titulo, ayuda, estadoOpciones, filterEstado, setFilterEstado, search, setSearch, rows, columns, onRowClick, loading }) {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{titulo}</h2>
        <p className="text-slate-400 text-sm mt-1">{ayuda}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-5">
        {estadoOpciones.length > 0 && (
          <div className="flex gap-1 overflow-x-auto bg-white/5 border border-white/10 rounded-full p-1">
            {estadoOpciones.map(op => (
              <button key={op} onClick={() => setFilterEstado(op)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  filterEstado === op ? 'bg-brand-amber text-brand-navy' : 'text-slate-300 hover:bg-white/5'
                }`}>
                {op === 'todos' ? 'Todos' : (ESTADOS[op]?.label || op)}
              </button>
            ))}
          </div>
        )}
        <input type="search" placeholder="Buscar por email, destino, ID…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-brand-amber transition-colors" />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                {columns.map(c => (
                  <th key={c.label} className="text-[10px] uppercase tracking-widest text-slate-400 font-bold px-4 py-3">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} className="text-center py-12 text-slate-500">Cargando…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="text-center py-12 text-slate-500">No hay registros que coincidan con los filtros.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.id}
                  onClick={onRowClick ? () => onRowClick(r) : undefined}
                  className={`border-b border-white/5 last:border-b-0 ${onRowClick ? 'hover:bg-white/5 cursor-pointer' : ''} transition-colors`}>
                  {columns.map((c) => (
                    <td key={c.label} className="px-4 py-3 align-top">{c.render(r)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
