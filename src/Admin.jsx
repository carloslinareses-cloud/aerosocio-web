import { useCallback, useEffect, useMemo, useState } from 'react';

const TABS = [
  { id: 'overview', label: 'Resumen',  icon: '📊' },
  { id: 'pedidos',  label: 'Pedidos',  icon: '🧾' },
  { id: 'parking',  label: 'Parking',  icon: '🅿️' },
  { id: 'envios',   label: 'Envíos',   icon: '📦' },
  { id: 'socios',   label: 'Socios',   icon: '👥' },
];

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
  const cfg = ESTADOS[value] || { label: value || '—', color: 'bg-white/5 text-slate-300 border-white/10' };
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState(null);   // { tabla, fila, estadoField }
  const [editForm, setEditForm] = useState({ estado: '', notas: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [filterEstado, setFilterEstado] = useState('todos');
  const [search, setSearch] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [s1, s2, s3, s4] = await Promise.all([
        supabase.from('solicitudes_servicios').select('*').order('created_at', { ascending: false }),
        supabase.from('solicitudes_parking').select('*').order('created_at', { ascending: false }),
        supabase.from('envios_baliza').select('*').order('created_at', { ascending: false }),
        supabase.from('perfiles').select('*'),
      ]);
      if (s1.error) throw s1.error;
      if (s2.error) throw s2.error;
      if (s3.error) throw s3.error;
      if (s4.error) console.warn('perfiles:', s4.error);
      setPedidos(s1.data || []);
      setParking(s2.data || []);
      setEnvios(s3.data || []);
      setSocios(s4.data || []);
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
