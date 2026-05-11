'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Bell, AlertTriangle, Clock, CheckCircle,
  ChevronDown, ChevronUp, CalendarClock, X,
} from 'lucide-react';
import { format, parseISO, differenceInHours, differenceInMinutes, addDays, isBefore } from 'date-fns';

interface Recordatorio {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: 'pendiente' | 'completada';
  fecha_recordar: string | null;
}

// Clasifica el estado temporal de un recordatorio
function clasificar(r: Recordatorio): 'vencido' | 'hoy' | 'proximo' | null {
  if (!r.fecha_recordar || r.estado !== 'pendiente') return null;
  const fecha = parseISO(r.fecha_recordar);
  const ahora = new Date();
  if (isBefore(fecha, ahora)) return 'vencido';
  if (isBefore(fecha, addDays(ahora, 1))) return 'proximo';
  return null;
}

function tiempoRestante(fechaStr: string): string {
  const fecha = parseISO(fechaStr);
  const ahora = new Date();
  if (isBefore(fecha, ahora)) {
    const h = differenceInHours(ahora, fecha);
    if (h < 1) return `hace ${differenceInMinutes(ahora, fecha)} min`;
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    return `hace ${d} día${d > 1 ? 's' : ''}`;
  }
  const h = differenceInHours(fecha, ahora);
  if (h < 1) return `en ${differenceInMinutes(fecha, ahora)} min`;
  if (h < 24) return `en ${h} h`;
  // Comparar por día calendario, no por horas
  if (format(fecha, 'yyyy-MM-dd') === format(addDays(ahora, 1), 'yyyy-MM-dd')) return 'mañana';
  return format(fecha, 'dd/MM/yyyy');
}

interface ModalData { id: string; titulo: string }

export default function NotificacionesRecordatorios() {
  const [records, setRecords] = useState<Recordatorio[]>([]);
  const [expandido, setExpandido] = useState(true);
  const [modal, setModal] = useState<ModalData | null>(null);
  const [notas, setNotas] = useState('');
  const [posponerFecha, setPosponerFecha] = useState('');
  const [modoModal, setModoModal] = useState<'resolver' | 'posponer'>('resolver');
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    const { data } = await supabase
      .from('recordatorios')
      .select('id, titulo, descripcion, estado, fecha_recordar')
      .eq('estado', 'pendiente')
      .not('fecha_recordar', 'is', null)
      .order('fecha_recordar', { ascending: true });
    if (data) setRecords(data);
  }, []);

  useEffect(() => {
    cargar();
    // Poll cada minuto por cambios de tiempo
    const timer = setInterval(cargar, 60_000);
    // Suscripción real-time a cambios en la tabla
    const channel = supabase
      .channel('notif-panel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recordatorios' }, cargar)
      .subscribe();
    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [cargar]);

  const vencidos = records.filter(r => clasificar(r) === 'vencido');
  const proximos = records.filter(r => clasificar(r) === 'proximo');
  const total = vencidos.length + proximos.length;

  if (total === 0) return null;

  const marcarResuelto = async (id: string, notasExtra?: string) => {
    setGuardando(true);
    const updates: Record<string, any> = {
      estado: 'completada',
      updated_at: new Date().toISOString(),
    };
    if (notasExtra?.trim()) updates.descripcion = notasExtra.trim();
    await supabase.from('recordatorios').update(updates).eq('id', id);
    setModal(null);
    setNotas('');
    setGuardando(false);
    cargar();
  };

  const posponer = async (id: string, nuevaFecha: string) => {
    setGuardando(true);
    await supabase.from('recordatorios').update({
      fecha_recordar: new Date(nuevaFecha).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    setModal(null);
    setPosponerFecha('');
    setGuardando(false);
    cargar();
  };

  const abrirModal = (r: Recordatorio, modo: 'resolver' | 'posponer') => {
    setModal({ id: r.id, titulo: r.titulo });
    setModoModal(modo);
    setNotas('');
    setPosponerFecha('');
  };

  return (
    <>
      {/* Panel principal */}
      <div className={`rounded-xl overflow-hidden shadow-lg border ${vencidos.length > 0 ? 'border-red-700/60 bg-gray-800' : 'border-amber-700/50 bg-gray-800'}`}>

        {/* Header colapsable */}
        <button
          onClick={() => setExpandido(!expandido)}
          className={`w-full flex items-center justify-between px-5 py-3.5 transition-colors ${vencidos.length > 0 ? 'bg-red-950/50 hover:bg-red-950/70' : 'bg-amber-950/40 hover:bg-amber-950/60'}`}
        >
          <div className="flex items-center gap-3">
            <Bell
              size={17}
              className={`${vencidos.length > 0 ? 'text-red-400' : 'text-amber-400'} ${total > 0 ? 'animate-pulse' : ''}`}
            />
            <span className="font-semibold text-white text-sm">Alertas</span>

            {vencidos.length > 0 && (
              <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                {vencidos.length} vencido{vencidos.length > 1 ? 's' : ''}
              </span>
            )}
            {proximos.length > 0 && (
              <span className="bg-amber-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                {proximos.length} próximo{proximos.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {expandido
            ? <ChevronUp size={15} className="text-gray-400" />
            : <ChevronDown size={15} className="text-gray-400" />}
        </button>

        {expandido && (
          <div className="p-4 space-y-3">

            {/* ── Vencidos ── */}
            {vencidos.map(r => (
              <div key={r.id} className="bg-red-950/30 border border-red-700/40 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white leading-tight">{r.titulo}</p>
                    {r.descripcion && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{r.descripcion}</p>
                    )}
                    <p className="text-xs text-red-400 mt-1 font-medium">
                      Venció {tiempoRestante(r.fecha_recordar!)} · {format(parseISO(r.fecha_recordar!), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => abrirModal(r, 'resolver')}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs py-2 rounded-lg font-semibold transition-colors"
                  >
                    ¿Qué pasó?
                  </button>
                  <button
                    onClick={() => abrirModal(r, 'posponer')}
                    className="flex-1 bg-amber-800/60 hover:bg-amber-700/60 text-amber-200 text-xs py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <CalendarClock size={12} /> Posponer
                  </button>
                  <button
                    onClick={() => marcarResuelto(r.id)}
                    className="flex-1 bg-emerald-700/70 hover:bg-emerald-600/80 text-emerald-100 text-xs py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    <CheckCircle size={12} /> Resuelto
                  </button>
                </div>
              </div>
            ))}

            {/* ── Próximos (≤24h) ── */}
            {proximos.map(r => (
              <div key={r.id} className="bg-amber-950/20 border border-amber-700/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Clock size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white leading-tight">{r.titulo}</p>
                    {r.descripcion && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{r.descripcion}</p>
                    )}
                    <p className="text-xs text-amber-400 mt-1 font-medium">
                      Vence {tiempoRestante(r.fecha_recordar!)} · {format(parseISO(r.fecha_recordar!), 'dd/MM HH:mm')}
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => abrirModal(r, 'posponer')}
                      className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs p-1.5 rounded-lg transition-colors"
                      title="Posponer"
                    >
                      <CalendarClock size={13} />
                    </button>
                    <button
                      onClick={() => marcarResuelto(r.id)}
                      className="bg-emerald-700/60 hover:bg-emerald-600/80 text-emerald-100 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                    >
                      ✓ Hecho
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal flotante ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">

            {/* Header modal */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  {modoModal === 'resolver' ? '¿Qué pasó con este recordatorio?' : 'Posponer recordatorio'}
                </p>
                <p className="text-base font-bold text-white">{modal.titulo}</p>
              </div>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            {/* Resolver */}
            {modoModal === 'resolver' && (
              <>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1.5 block">
                    Notas de resolución (opcional)
                  </label>
                  <textarea
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    placeholder="Ej: Pago realizado por transferencia, cheque cobrado..."
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
                    onClick={() => setModoModal('posponer')}
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
            {modoModal === 'posponer' && (
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
          </div>
        </div>
      )}
    </>
  );
}
