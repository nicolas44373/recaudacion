'use client';
import { useState, useEffect } from 'react';
import { Banknote, Trash2 } from 'lucide-react';

const DENOMINACIONES = [
  { valor: 100,   label: '$100',    color: 'text-red-600',     border: 'border-red-300',     dot: 'bg-red-400' },
  { valor: 200,   label: '$200',    color: 'text-orange-600',  border: 'border-orange-300',  dot: 'bg-orange-400' },
  { valor: 500,   label: '$500',    color: 'text-violet-600',  border: 'border-violet-300',  dot: 'bg-violet-400' },
  { valor: 1000,  label: '$1.000',  color: 'text-blue-600',    border: 'border-blue-300',    dot: 'bg-blue-400' },
  { valor: 2000,  label: '$2.000',  color: 'text-emerald-600', border: 'border-emerald-300', dot: 'bg-emerald-500' },
  { valor: 10000, label: '$10.000', color: 'text-teal-600',    border: 'border-teal-300',    dot: 'bg-teal-500' },
  { valor: 20000, label: '$20.000', color: 'text-pink-600',    border: 'border-pink-300',    dot: 'bg-pink-400' },
] as const;

const STORAGE_KEY = 'contador-billetes-v1';

const fmt = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

interface Props {
  netoEfectivo: number;
}

export default function ContadorBilletes({ netoEfectivo }: Props) {
  const [cantidades, setCantidades] = useState<Record<number, string>>({});
  const [listo, setListo] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setCantidades(JSON.parse(saved));
    } catch {}
    setListo(true);
  }, []);

  useEffect(() => {
    if (!listo) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cantidades));
  }, [cantidades, listo]);

  const setCantidad = (valor: number, raw: string) => {
    setCantidades(prev => ({ ...prev, [valor]: raw }));
  };

  const limpiar = () => {
    setCantidades({});
    localStorage.removeItem(STORAGE_KEY);
  };

  const totalContado = DENOMINACIONES.reduce((sum, d) => {
    const n = parseInt(cantidades[d.valor] ?? '0', 10);
    return sum + (isNaN(n) || n < 0 ? 0 : n * d.valor);
  }, 0);

  const diferencia = totalContado - netoEfectivo;
  const coincide = Math.abs(diferencia) < 1;
  const sobran = diferencia > 0;

  return (
    <div className="max-w-lg mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Banknote size={20} className="text-emerald-600" />
          <h2 className="text-lg font-bold text-gray-900">Contador de billetes</h2>
        </div>
        <button
          onClick={limpiar}
          className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Trash2 size={12} />
          Limpiar
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

        {/* Encabezado */}
        <div className="grid grid-cols-3 px-5 py-2.5 bg-gray-50 border-b border-gray-200">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Billete</span>
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest text-center">Cantidad</span>
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest text-right">Subtotal</span>
        </div>

        {/* Filas */}
        <div className="divide-y divide-gray-100">
          {DENOMINACIONES.map((d, idx) => {
            const raw = cantidades[d.valor] ?? '';
            const n = parseInt(raw || '0', 10);
            const subtotal = isNaN(n) || n < 0 ? 0 : n * d.valor;

            return (
              <div key={d.valor} className="grid grid-cols-3 items-center px-5 py-3 hover:bg-gray-50 transition-colors">

                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${d.dot}`} />
                  <span className={`font-bold text-sm tabular-nums ${d.color}`}>{d.label}</span>
                </div>

                <div className="flex justify-center">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={raw}
                    onChange={e => setCantidad(d.valor, e.target.value)}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                    tabIndex={idx + 1}
                    className={`w-20 text-center bg-gray-50 border ${d.border} rounded-lg px-2 py-1.5 text-gray-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums`}
                  />
                </div>

                <div className="text-right">
                  <span className={`text-sm font-semibold tabular-nums ${subtotal > 0 ? d.color : 'text-gray-300'}`}>
                    {subtotal > 0 ? fmt(subtotal) : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">Total contado</span>
          <span className="text-2xl font-extrabold text-gray-900 tabular-nums">{fmt(totalContado)}</span>
        </div>
      </div>

      {/* Comparación */}
      <div className={`rounded-2xl border p-5 space-y-3 shadow-sm ${
        coincide ? 'bg-emerald-50 border-emerald-200'
        : sobran  ? 'bg-amber-50 border-amber-200'
        :           'bg-red-50 border-red-200'
      }`}>
        <p className={`text-xs font-bold uppercase tracking-widest ${
          coincide ? 'text-emerald-700' : sobran ? 'text-amber-700' : 'text-red-700'
        }`}>
          Comparación con caja
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Billetes contados</span>
            <span className="text-gray-900 font-semibold tabular-nums">{fmt(totalContado)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Neto esperado en caja</span>
            <span className="text-emerald-700 font-semibold tabular-nums">{fmt(netoEfectivo)}</span>
          </div>
          <div className={`flex items-center justify-between border-t pt-2 font-bold ${
            coincide ? 'border-emerald-200' : sobran ? 'border-amber-200' : 'border-red-200'
          }`}>
            <span className={coincide ? 'text-emerald-700' : sobran ? 'text-amber-700' : 'text-red-700'}>
              {coincide ? '✓ Cuadra perfecto' : sobran ? 'Sobran billetes' : 'Faltan billetes'}
            </span>
            <span className={`tabular-nums text-lg ${
              coincide ? 'text-emerald-700' : sobran ? 'text-amber-700' : 'text-red-700'
            }`}>
              {coincide ? '—' : (sobran ? '+' : '') + fmt(diferencia)}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
