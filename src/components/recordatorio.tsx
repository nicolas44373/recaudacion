'use client';
import { useState, useEffect, useCallback, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Bell, CheckCircle, Clock, AlertTriangle, CalendarClock,
  Plus, Trash2, RotateCcw, ChevronDown, ChevronUp, X, Calendar,
} from 'lucide-react';
import {
  format, parseISO, differenceInHours, differenceInMinutes,
  addDays, isBefore, isAfter,
} from 'date-fns';

interface Recordatorio {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: 'pendiente' | 'completada';
  fecha_recordar: string | null;
  created_at: string;
}

type Clasificacion = 'vencido' | 'proximo' | 'futuro' | 'sin_fecha' | 'completada';
type Filtro = 'todos' | 'pendientes' | 'completadas' | 'vencidos';

function clasificar(r: Recordatorio): Clasificacion {
  if (r.estado === 'completada') return 'completada';
  if (!r.fecha_recordar) return 'sin_fecha';
  const fecha = parseISO(r.fecha_recordar);
  const ahora = new Date();
  if (isBefore(fecha, ahora)) return 'vencido';
  if (isBefore(fecha, addDays(ahora, 1))) return 'proximo';
  return 'futuro';
}

const ORDEN_CLASIFICACION: Record<Clasificacion, number> = {
  vencido: 0, proximo: 1, futuro: 2, sin_fecha: 3, completada: 4,
};

function tiempoRelativo(fechaStr: string): string {
  const fecha = parseISO(fechaStr);
  const ahora = new Date();
  if (isBefore(fecha, ahora)) {
    const h = differenceInHours(ahora, fecha);
    if (h < 1) return `hace ${differenceInMinutes(ahora, fecha)} min`;
    if (h < 24) return `hace ${h}h`;
    const d = Math.floor(h / 24);
    return `hace ${d} día${d > 1 ? 's' : ''}`;
  }
  const h = differenceInHours(fecha, ahora);
  if (h < 1) return `en ${differenceInMinutes(fecha, ahora)} min`;
  if (h < 24) return `en ${h}h`;
  // Comparar por día calendario, no por horas
  if (format(fecha, 'yyyy-MM-dd') === format(addDays(ahora, 1), 'yyyy-MM-dd')) return 'mañana';
  return format(fecha, 'dd/MM/yyyy');
}

const BADGE: Record<Clasificacion, { label: string; className: string }> = {
  vencido:   { label: 'Vencido',   className: 'bg-red-500/20 text-red-400 border border-red-500/40' },
  proximo:   { label: 'Hoy',       className: 'bg-amber-500/20 text-amber-400 border border-amber-500/40' },
  futuro:    { label: 'Pendiente', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/40' },
  sin_fecha: { label: 'Sin fecha', className: 'bg-gray-500/20 text-gray-400 border border-gray-500/40' },
  completada:{ label: 'Completado',className: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' },
};

const CARD_BORDER: Record<Clasificacion, string> = {
  vencido:    'border-red-700/50 bg-red-950/20',
  proximo:    'border-amber-700/50 bg-amber-950/20',
  futuro:     'border-blue-700/40 bg-gray-800',
  sin_fecha:  'border-gray-700 bg-gray-800',
  completada: 'border-gray-700/40 bg-gray-800/60 opacity-60',
};

interface ModalData {
  id: string;
  titulo: string;
  modo: 'resolver' | 'posponer' | 'eliminar';
}

export default function RecordatoriosPage() {
  const [records, setRecords] = useState<Recordatorio[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formAbierto, setFormAbierto] = useState(false);
  const [modal, setModal] = useState<ModalData | null>(null);
  const [notas, setNotas] = useState('');
  const [posponerFecha, setPosponerFecha] = useState('');

  // Form state
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaRecordar, setFechaRecordar] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data } = await supabase
      .from('recordatorios')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setRecords(data as Recordatorio[]);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
    const channel = supabase
      .channel('recordatorios-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recordatorios' }, cargar)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [cargar]);

  // ─── Acciones ───────────────────────────────────────────────────────────────

  const agregar = async (e: FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    setGuardando(true);
    await supabase.from('recordatorios').insert([{
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || null,
      fecha_recordar: fechaRecordar ? new Date(fechaRecordar).toISOString() : null,
    }]);
    setTitulo(''); setDescripcion(''); setFechaRecordar('');
    setFormAbierto(false);
    setGuardando(false);
    cargar();
  };

  const marcarResuelto = async (id: string, notasExtra?: string) => {
    setGuardando(true);
    const updates: Record<string, unknown> = { estado: 'completada', updated_at: new Date().toISOString() };
    if (notasExtra?.trim()) updates.descripcion = notasExtra.trim();
    await supabase.from('recordatorios').update(updates).eq('id', id);
    setModal(null); setNotas(''); setGuardando(false); cargar();
  };

  const reactivar = async (id: string) => {
    await supabase.from('recordatorios').update({ estado: 'pendiente', updated_at: new Date().toISOString() }).eq('id', id);
    cargar();
  };

  const posponer = async (id: string, nuevaFecha: string) => {
    setGuardando(true);
    await supabase.from('recordatorios').update({
      fecha_recordar: new Date(nuevaFecha).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    setModal(null); setPosponerFecha(''); setGuardando(false); cargar();
  };

  const eliminar = async (id: string) => {
    setGuardando(true);
    await supabase.from('recordatorios').delete().eq('id', id);
    setModal(null); setGuardando(false); cargar();
  };

  // ─── Derivados ──────────────────────────────────────────────────────────────

  const clasificados = records.map(r => ({ ...r, _clase: clasificar(r) }));

  const filtrados = clasificados
    .filter(r => {
      if (filtro === 'pendientes') return r.estado === 'pendiente';
      if (filtro === 'completadas') return r.estado === 'completada';
      if (filtro === 'vencidos') return r._clase === 'vencido';
      return true;
    })
    .sort((a, b) => ORDEN_CLASIFICACION[a._clase] - ORDEN_CLASIFICACION[b._clase]);

  const counts = {
    total: records.length,
    pendientes: records.filter(r => r.estado === 'pendiente').length,
    completadas: records.filter(r => r.estado === 'completada').length,
    vencidos: records.filter(r => clasificar(r) === 'vencido').length,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell size={20} className="text-amber-400" />
          <h2 className="text-lg font-bold text-white">Recordatorios</h2>
          {counts.vencidos > 0 && (
            <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
              {counts.vencidos} vencido{counts.vencidos > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={() => setFormAbierto(!formAbierto)}
          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Nuevo
        </button>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: counts.total, color: 'text-gray-300' },
          { label: 'Pendientes', value: counts.pendientes, color: 'text-blue-400' },
          { label: 'Vencidos', value: counts.vencidos, color: 'text-red-400' },
          { label: 'Completados', value: counts.completadas, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-800 rounded-xl p-3 border border-gray-700 text-center">
            <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Formulario nuevo ───────────────────────────────────────────────── */}
      {formAbierto && (
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-white">Nuevo recordatorio</p>
            <button onClick={() => setFormAbierto(false)} className="text-gray-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={agregar} className="space-y-3">
            <input
              type="text"
              placeholder="Título *"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              required
              maxLength={100}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <textarea
              placeholder="Descripción (opcional)"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              maxLength={500}
              rows={2}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-gray-400 flex-shrink-0" />
              <input
                type="datetime-local"
                value={fechaRecordar}
                onChange={e => setFechaRecordar(e.target.value)}
                className="flex-1 p-2.5 bg-gray-700 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={guardando || !titulo.trim()}
              className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 disabled:text-gray-500 text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              {guardando ? 'Guardando...' : 'Agregar recordatorio'}
            </button>
          </form>
        </div>
      )}

      {/* ── Filtros ────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'todos',      label: 'Todos',       count: counts.total },
          { key: 'pendientes', label: 'Pendientes',  count: counts.pendientes },
          { key: 'vencidos',   label: 'Vencidos',    count: counts.vencidos },
          { key: 'completadas',label: 'Completados', count: counts.completadas },
        ] as { key: Filtro; label: string; count: number }[]).map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              filtro === f.key
                ? 'bg-amber-600 border-amber-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {f.label} {f.count > 0 && <span className="ml-1 opacity-70">({f.count})</span>}
          </button>
        ))}
      </div>

      {/* ── Lista ──────────────────────────────────────────────────────────── */}
      {cargando && records.length === 0 ? (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8 text-center">
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8 text-center space-y-2">
          <Bell size={32} className="text-gray-600 mx-auto" />
          <p className="text-gray-400 font-medium">
            {filtro === 'todos' ? 'Sin recordatorios' :
             filtro === 'pendientes' ? 'No hay pendientes' :
             filtro === 'vencidos' ? 'Sin vencidos — todo al día' :
             'Sin completados'}
          </p>
          {filtro === 'todos' && (
            <p className="text-gray-600 text-sm">Presioná "Nuevo" para agregar uno</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(r => {
            const clase = r._clase;
            const badge = BADGE[clase];
            const cardBorder = CARD_BORDER[clase];

            return (
              <div key={r.id} className={`rounded-2xl border p-4 space-y-3 transition-opacity ${cardBorder}`}>

                {/* Fila principal */}
                <div className="flex items-start gap-3">
                  {/* Icono de estado */}
                  <div className="mt-0.5 flex-shrink-0">
                    {clase === 'vencido'   && <AlertTriangle size={15} className="text-red-400" />}
                    {clase === 'proximo'   && <Clock size={15} className="text-amber-400" />}
                    {clase === 'futuro'    && <CalendarClock size={15} className="text-blue-400" />}
                    {clase === 'sin_fecha' && <Bell size={15} className="text-gray-400" />}
                    {clase === 'completada'&& <CheckCircle size={15} className="text-emerald-400" />}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold leading-tight ${clase === 'completada' ? 'line-through text-gray-500' : 'text-white'}`}>
                        {r.titulo}
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    {r.descripcion && (
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{r.descripcion}</p>
                    )}
                    {r.fecha_recordar && (
                      <p className={`text-xs mt-1.5 font-medium ${
                        clase === 'vencido' ? 'text-red-400' :
                        clase === 'proximo' ? 'text-amber-400' :
                        'text-gray-500'
                      }`}>
                        {tiempoRelativo(r.fecha_recordar)} · {format(parseISO(r.fecha_recordar), 'dd/MM/yyyy HH:mm')}
                      </p>
                    )}
                  </div>

                  {/* Botones de acción pequeños (siempre visibles) */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    {r.estado === 'pendiente' && (
                      <button
                        onClick={() => { setModal({ id: r.id, titulo: r.titulo, modo: 'posponer' }); setPosponerFecha(''); }}
                        className="bg-gray-700 hover:bg-gray-600 text-gray-300 p-1.5 rounded-lg transition-colors"
                        title="Posponer"
                      >
                        <CalendarClock size={13} />
                      </button>
                    )}
                    {r.estado === 'completada' && (
                      <button
                        onClick={() => reactivar(r.id)}
                        className="bg-gray-700 hover:bg-gray-600 text-gray-300 p-1.5 rounded-lg transition-colors"
                        title="Reactivar"
                      >
                        <RotateCcw size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => setModal({ id: r.id, titulo: r.titulo, modo: 'eliminar' })}
                      className="bg-gray-700 hover:bg-red-800/60 text-gray-400 hover:text-red-300 p-1.5 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Botones principales para pendientes */}
                {r.estado === 'pendiente' && (
                  <div className={`flex gap-2 ${clase === 'vencido' ? '' : 'pt-1'}`}>
                    {clase === 'vencido' ? (
                      <>
                        <button
                          onClick={() => { setModal({ id: r.id, titulo: r.titulo, modo: 'resolver' }); setNotas(''); }}
                          className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs py-2 rounded-lg font-semibold transition-colors"
                        >
                          ¿Qué pasó?
                        </button>
                        <button
                          onClick={() => marcarResuelto(r.id)}
                          className="flex-1 bg-emerald-700/70 hover:bg-emerald-600/80 text-emerald-100 text-xs py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          <CheckCircle size={12} /> Resuelto
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => marcarResuelto(r.id)}
                        className="bg-emerald-700/60 hover:bg-emerald-600/80 text-emerald-100 text-xs px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-1"
                      >
                        <CheckCircle size={12} /> Marcar como hecho
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modales ────────────────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  {modal.modo === 'resolver' ? '¿Qué pasó con este recordatorio?' :
                   modal.modo === 'posponer' ? 'Posponer recordatorio' :
                   'Eliminar recordatorio'}
                </p>
                <p className="text-base font-bold text-white">{modal.titulo}</p>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            {/* Resolver */}
            {modal.modo === 'resolver' && (
              <>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5 block">
                    Notas de resolución (opcional)
                  </label>
                  <textarea
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    placeholder="Ej: Pago realizado, cheque cobrado, llamada hecha..."
                    rows={3}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-xl text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => marcarResuelto(modal.id, notas)}
                    disabled={guardando}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle size={16} />
                    {guardando ? 'Guardando...' : 'Fue resuelto'}
                  </button>
                  <button
                    onClick={() => { setModal({ ...modal, modo: 'posponer' }); setPosponerFecha(''); }}
                    className="bg-amber-700/60 hover:bg-amber-600/70 text-amber-100 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <CalendarClock size={16} />
                    Posponer
                  </button>
                </div>
                <button
                  onClick={() => setModal(null)}
                  className="w-full py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
              </>
            )}

            {/* Posponer */}
            {modal.modo === 'posponer' && (
              <>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5 block">
                    Nueva fecha y hora
                  </label>
                  <input
                    type="datetime-local"
                    value={posponerFecha}
                    onChange={e => setPosponerFecha(e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => posponerFecha && posponer(modal.id, posponerFecha)}
                    disabled={!posponerFecha || guardando}
                    className="bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 disabled:text-gray-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <CalendarClock size={16} />
                    {guardando ? 'Guardando...' : 'Posponer'}
                  </button>
                  <button
                    onClick={() => setModal(null)}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 py-3 rounded-xl font-medium text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}

            {/* Eliminar */}
            {modal.modo === 'eliminar' && (
              <>
                <p className="text-sm text-gray-400">Esta acción no se puede deshacer.</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => eliminar(modal.id)}
                    disabled={guardando}
                    className="bg-red-700 hover:bg-red-600 disabled:bg-gray-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trash2 size={16} />
                    {guardando ? 'Eliminando...' : 'Eliminar'}
                  </button>
                  <button
                    onClick={() => setModal(null)}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 py-3 rounded-xl font-medium text-sm transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
