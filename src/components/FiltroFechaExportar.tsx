'use client';
import { Download, Calendar } from 'lucide-react';
import { format, parseISO, isValid, subDays, startOfMonth, startOfWeek } from 'date-fns';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import React from 'react';

const CATEGORIA_INICIO_DIA = 'INICIO DEL DIA';

interface Item {
  categoria: string;
  monto: number;
  metodo_pago: string;
  fecha: string;
  notas?: string;
}

interface Props {
  desde: string;
  hasta: string;
  setDesde: (_: string) => void;
  setHasta: (_: string) => void;
  datos: Item[];
  tipo: 'ingresos' | 'gastos';
}

const hoy = () => format(new Date(), 'yyyy-MM-dd');
const diasAtras = (n: number) => format(subDays(new Date(), n), 'yyyy-MM-dd');

const PRESETS = [
  { label: 'Hoy',       desde: () => hoy(),                        hasta: () => hoy() },
  { label: 'Ayer',      desde: () => diasAtras(1),                  hasta: () => diasAtras(1) },
  { label: 'Esta sem.', desde: () => format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'), hasta: () => hoy() },
  { label: 'Este mes',  desde: () => format(startOfMonth(new Date()), 'yyyy-MM-dd'),                     hasta: () => hoy() },
  { label: '30 días',   desde: () => diasAtras(30),                 hasta: () => hoy() },
  { label: '90 días',   desde: () => diasAtras(90),                 hasta: () => hoy() },
];

const fmtFecha = (fecha: string) => {
  try {
    const d = parseISO(fecha);
    return isValid(d) ? format(d, 'dd/MM/yyyy') : fecha;
  } catch {
    return fecha;
  }
};

export default function FiltroFechaExportar({
  desde, hasta, setDesde, setHasta, datos, tipo,
}: Props) {

  const aplicarPreset = (preset: typeof PRESETS[0]) => {
    setDesde(preset.desde());
    setHasta(preset.hasta());
  };

  const presetActivo = (preset: typeof PRESETS[0]) =>
    desde === preset.desde() && hasta === preset.hasta();

  const exportarExcel = () => {
    if (!Array.isArray(datos) || datos.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }
    try {
      const datosExcel = datos.map(item => ({
        Fecha: fmtFecha(item.fecha),
        Categoría: item.categoria || 'Sin categoría',
        Monto: Number(item.monto) || 0,
        'Método de Pago': item.metodo_pago || 'N/A',
        Notas: item.notas || '',
      }));

      const totalBruto = datos.reduce((s, i) => s + Number(i.monto), 0);
      datosExcel.push({ Fecha: '', Categoría: 'TOTAL BRUTO', Monto: totalBruto, 'Método de Pago': '', Notas: '' });

      if (tipo === 'ingresos') {
        const totalReal = datos
          .filter(i => i.categoria !== CATEGORIA_INICIO_DIA)
          .reduce((s, i) => s + Number(i.monto), 0);
        datosExcel.push({
          Fecha: '', Categoría: 'TOTAL REAL (sin apertura del día)',
          Monto: totalReal, 'Método de Pago': '', Notas: '',
        });
      }

      const ws = XLSX.utils.json_to_sheet(datosExcel);
      ws['!cols'] = [{ wch: 14 }, { wch: 34 }, { wch: 18 }, { wch: 18 }, { wch: 30 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, tipo === 'ingresos' ? 'Ingresos' : 'Gastos');
      const blob = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([blob]), `${tipo}_${desde}_al_${hasta}.xlsx`);
    } catch (err) {
      console.error(err);
      alert('Error al exportar.');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        <span className="text-[10px] text-gray-400 uppercase tracking-widest self-center mr-1">Rápido:</span>
        {PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => aplicarPreset(p)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
              presetActivo(p)
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-gray-50 border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Fechas + exportar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 text-gray-400 flex-shrink-0">
          <Calendar size={15} />
          <span className="text-xs font-semibold text-gray-600">Período</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-10 flex-shrink-0">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={e => setDesde(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent hover:border-gray-400 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-10 flex-shrink-0">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={e => setHasta(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent hover:border-gray-400 transition-colors"
            />
          </div>
        </div>

        <button
          onClick={exportarExcel}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0"
        >
          <Download size={15} />
          Exportar {tipo === 'ingresos' ? 'Ingresos' : 'Gastos'}
        </button>
      </div>

      {/* Resumen */}
      {datos.length > 0 && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 border-t border-gray-100 pt-2">
          <span>
            {datos.length} registros ·{' '}
            <span className="text-gray-900 font-medium">
              {datos.reduce((s, i) => s + Number(i.monto), 0)
                .toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })}
            </span>
            {' '}total bruto
          </span>
          {tipo === 'ingresos' && (
            <span>
              <span className="text-emerald-600 font-medium">
                {datos.filter(i => i.categoria !== CATEGORIA_INICIO_DIA)
                  .reduce((s, i) => s + Number(i.monto), 0)
                  .toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })}
              </span>
              {' '}total real (sin apertura)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
