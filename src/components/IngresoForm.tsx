'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import CategoriaCombobox from '@/components/CategoriaCombobox';
import {
  AlertCircle, DollarSign, CheckCircle, ChevronDown, ChevronUp,
  X, Sun, Calculator,
} from 'lucide-react';
import { format } from 'date-fns';

const CATEGORIA_INICIO_DIA = 'INICIO DEL DIA';
const UMBRAL_ALERTA = 500_000_000;

const CATEGORIAS_INGRESOS = [
  'INICIO DEL DIA',
  'ANTICIPO DE CAJA COLON',
  'ANTICIPO DE CAJA MAYORISTA',
  'ANTICIPO DE CAJA MINORISTA',
  'CAJA COLON TM',
  'CAJA COLON TT',
  'CAJA MAYORISTA TM',
  'CAJA MAYORISTA TT',
  'CAJA MINORISTA TM',
  'CAJA MINORISTA TT',
  'CHEQUES DE LEO FINANCISTA',
  'CHEQUES FINANCIEROS',
  'COBRANZAS',
  'CUENTA GALICIA JULITO',
  'CUENTA GALICIA ROCIO',
  'CUENTA MERCADO PAGO',
  'DEPOSITO EN CUENTA',
  'ELI PERSONAL',
  'INGRESOS EXTRAS',
  'PRESTAMOS',
  'REPARTO',
  'SOBRANTES',
  'TRANSFERENCIAS FINANCIERAS',
];

const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Depósito', 'Tarjeta', 'Cheque', 'eCheq'];

const DENOMINACIONES = [
  { valor: 50,    color: 'text-cyan-600',    ring: 'focus:ring-cyan-500',    border: 'border-cyan-200',    bg: 'bg-cyan-50'    },
  { valor: 100,   color: 'text-red-600',     ring: 'focus:ring-red-500',     border: 'border-red-200',     bg: 'bg-red-50'     },
  { valor: 200,   color: 'text-orange-600',  ring: 'focus:ring-orange-500',  border: 'border-orange-200',  bg: 'bg-orange-50'  },
  { valor: 500,   color: 'text-violet-600',  ring: 'focus:ring-violet-500',  border: 'border-violet-200',  bg: 'bg-violet-50'  },
  { valor: 1000,  color: 'text-blue-600',    ring: 'focus:ring-blue-500',    border: 'border-blue-200',    bg: 'bg-blue-50'    },
  { valor: 2000,  color: 'text-emerald-600', ring: 'focus:ring-emerald-500', border: 'border-emerald-200', bg: 'bg-emerald-50' },
  { valor: 10000, color: 'text-teal-600',    ring: 'focus:ring-teal-500',    border: 'border-teal-200',    bg: 'bg-teal-50'    },
  { valor: 20000, color: 'text-pink-600',    ring: 'focus:ring-pink-500',    border: 'border-pink-200',    bg: 'bg-pink-50'    },
];

const fmt = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function IngresoForm({ onSuccess }: { onSuccess: () => void }) {
  const [categoria, setCategoria] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [montoRaw, setMontoRaw] = useState('');
  const [notas, setNotas] = useState('');
  const [fecha, setFecha] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [denominaciones, setDenominaciones] = useState<Record<number, string>>({});
  const [mostrarBilletes, setMostrarBilletes] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState<{ tipo: 'ok' | 'err'; msg: string } | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const esInicioDia = categoria === CATEGORIA_INICIO_DIA;
  const montoNum = parseInt(montoRaw || '0', 10);
  const montoDisplay = montoRaw ? montoNum.toLocaleString('es-AR') : '';
  const montoEsAlto = montoNum > UMBRAL_ALERTA && !esInicioDia;

  const totalBilletes = DENOMINACIONES.reduce(
    (acc, d) => acc + (parseInt(denominaciones[d.valor] || '0', 10)) * d.valor,
    0
  );

  const showToast = (tipo: 'ok' | 'err', msg: string) => {
    setToast({ tipo, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleMontoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').replace(/^0+(\d)/, '$1');
    setMontoRaw(raw);
    if (raw) setErrores(p => ({ ...p, monto: '' }));
  };

  const usarTotalBilletes = () => {
    if (totalBilletes > 0) setMontoRaw(String(totalBilletes));
  };

  const setDen = (valor: number, qty: string) => {
    const raw = qty.replace(/\D/g, '');
    setDenominaciones(p => ({ ...p, [valor]: raw }));
  };

  const validar = () => {
    const e: Record<string, string> = {};
    if (!categoria) e.categoria = 'Seleccioná una categoría';
    if (!metodoPago) e.metodoPago = 'Seleccioná un método de pago';
    if (!montoRaw || montoNum <= 0) e.monto = 'Ingresá un monto válido';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const limpiar = () => {
    setCategoria('');
    setMetodoPago('');
    setMontoRaw('');
    setNotas('');
    setFecha(format(new Date(), 'yyyy-MM-dd'));
    setDenominaciones({});
    setMostrarBilletes(false);
    setErrores({});
  };

  const guardar = async () => {
    if (!validar()) return;
    if (montoEsAlto && !confirm(`El monto ${fmt(montoNum)} es muy alto. ¿Confirmás?`)) return;

    setGuardando(true);
    const { error } = await supabase.from('ingresos').insert({
      metodo_pago: metodoPago,
      categoria,
      monto: montoNum,
      notas: notas.trim() || null,
      fecha,
    });
    setGuardando(false);

    if (!error) {
      showToast('ok', esInicioDia ? 'Apertura de caja registrada' : 'Ingreso guardado correctamente');
      limpiar();
      onSuccess();
    } else {
      showToast('err', `Error: ${error.message}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-white text-sm font-medium animate-in slide-in-from-top-2 ${toast.tipo === 'ok' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.tipo === 'ok' ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100"><X size={15} /></button>
        </div>
      )}

      {/* Encabezado dinámico */}
      <div className={`rounded-xl p-5 border flex items-center gap-4 ${esInicioDia ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
        <div className={`p-3 rounded-xl ${esInicioDia ? 'bg-yellow-100' : 'bg-emerald-100'}`}>
          {esInicioDia
            ? <Sun size={24} className="text-yellow-600" />
            : <DollarSign size={24} className="text-emerald-600" />}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {esInicioDia ? 'Apertura de Caja del Día' : 'Nuevo Ingreso'}
          </h2>
          {esInicioDia
            ? <p className="text-xs text-yellow-600 mt-0.5">Este monto no se suma a los totales del día ni al balance</p>
            : <p className="text-xs text-gray-500 mt-0.5">Registrá un ingreso de dinero</p>
          }
        </div>
      </div>

      {/* Cuerpo del formulario */}
      <div className={`rounded-xl border p-5 space-y-5 ${esInicioDia ? 'bg-white border-yellow-200' : 'bg-white border-gray-200'}`}>

        {/* Categoría */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Categoría <span className="text-red-500">*</span>
          </label>
          <CategoriaCombobox
            value={categoria}
            onChange={v => { setCategoria(v); setErrores(p => ({ ...p, categoria: '' })); }}
            opciones={CATEGORIAS_INGRESOS}
            error={!!errores.categoria}
            ringColor="ring-emerald-500"
            selectedColor="bg-emerald-50 text-emerald-700"
          />
          {errores.categoria && <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={12} />{errores.categoria}</p>}
        </div>

        {/* Método de pago – botones */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Método de Pago <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {METODOS_PAGO.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMetodoPago(m);
                  setMostrarBilletes(m === 'Efectivo');
                  setErrores(p => ({ ...p, metodoPago: '' }));
                }}
                className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${metodoPago === m
                  ? esInicioDia
                    ? 'bg-yellow-500 border-yellow-400 text-white shadow-md'
                    : 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          {errores.metodoPago && <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={12} />{errores.metodoPago}</p>}
        </div>

        {/* Calculadora de billetes (solo Efectivo) */}
        {metodoPago === 'Efectivo' && (
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setMostrarBilletes(!mostrarBilletes)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-600"
            >
              <div className="flex items-center gap-2">
                <Calculator size={15} className="text-gray-400" />
                <span>Contar billetes</span>
              </div>
              <div className="flex items-center gap-3">
                {totalBilletes > 0 && (
                  <span className="text-emerald-600 text-xs font-bold">{fmt(totalBilletes)}</span>
                )}
                {mostrarBilletes ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
              </div>
            </button>

            {mostrarBilletes && (
              <div className="p-4 border-t border-gray-200 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {DENOMINACIONES.map(d => {
                    const qty = parseInt(denominaciones[d.valor] || '0', 10);
                    const subtotal = qty * d.valor;
                    return (
                      <div key={d.valor} className={`rounded-xl border p-3 ${d.bg} ${d.border}`}>
                        <div className={`text-xs font-bold mb-2 ${d.color}`}>
                          {d.valor.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })}
                        </div>
                        <input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={denominaciones[d.valor] ?? ''}
                          onChange={e => setDen(d.valor, e.target.value)}
                          className={`w-full bg-white border border-gray-300 rounded-lg p-1.5 text-gray-900 text-sm text-center focus:outline-none focus:ring-2 ${d.ring}`}
                        />
                        {subtotal > 0 && (
                          <div className="text-xs text-gray-500 mt-1.5 text-center">
                            {subtotal.toLocaleString('es-AR')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Total de billetes */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Total contado</p>
                    <p className={`text-2xl font-bold tabular-nums ${totalBilletes > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                      {fmt(totalBilletes)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={usarTotalBilletes}
                    disabled={totalBilletes === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 disabled:text-gray-400 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                  >
                    Usar este total →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Monto */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Monto <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">$</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={montoDisplay}
              onChange={handleMontoChange}
              className={`w-full pl-9 pr-4 py-4 bg-gray-50 border rounded-xl text-gray-900 text-2xl font-bold tabular-nums focus:outline-none focus:ring-2 transition-colors ${montoEsAlto ? 'border-red-400 focus:ring-red-500' : errores.monto ? 'border-red-400 focus:ring-red-500' : esInicioDia ? 'border-yellow-300 focus:ring-yellow-500' : 'border-gray-300 focus:ring-emerald-500 hover:border-gray-400'}`}
            />
          </div>
          {errores.monto && (
            <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1"><AlertCircle size={12} />{errores.monto}</p>
          )}
          {montoEsAlto && (
            <div className="mt-2 flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              <AlertCircle size={14} className="flex-shrink-0" />
              Monto inusualmente alto. Verificá antes de guardar.
            </div>
          )}
        </div>

        {/* Fecha + Notas en 2 columnas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:border-gray-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notas (opcional)</label>
            <textarea
              placeholder="Observaciones adicionales..."
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={1}
              className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 hover:border-gray-400 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Vista previa del registro */}
        {categoria && metodoPago && montoNum > 0 && (
          <div className={`rounded-xl p-4 border text-sm ${esInicioDia ? 'bg-yellow-50 border-yellow-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Vista previa</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span className="text-gray-700"><span className="text-gray-400">Categoría:</span> {categoria}</span>
              <span className="text-gray-700"><span className="text-gray-400">Método:</span> {metodoPago}</span>
              <span className={`font-bold tabular-nums ${esInicioDia ? 'text-yellow-600' : 'text-emerald-600'}`}>{fmt(montoNum)}</span>
              <span className="text-gray-700"><span className="text-gray-400">Fecha:</span> {fecha}</span>
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={guardar}
            disabled={guardando}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white transition-all shadow-md ${guardando
              ? 'bg-gray-300 cursor-not-allowed'
              : esInicioDia
                ? 'bg-yellow-500 hover:bg-yellow-600 active:scale-95'
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
            }`}
          >
            {esInicioDia ? <Sun size={18} /> : <DollarSign size={18} />}
            {guardando ? 'Guardando...' : esInicioDia ? 'Registrar Apertura' : 'Guardar Ingreso'}
          </button>
          <button
            onClick={limpiar}
            disabled={guardando}
            className="px-5 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-semibold transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}
