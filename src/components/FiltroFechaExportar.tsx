'use client';
import { Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function FiltroFechaExportar({ desde, hasta, setDesde, setHasta, ingresos }: any) {
  const exportarExcel = () => {
    if (ingresos.length === 0) return alert('No hay datos para exportar');
    const datosExcel = ingresos.map((ingreso: any) => ({
      Caja: ingreso.caja,
      Monto: ingreso.monto,
      'Método de Pago': ingreso.metodo_pago,
      Fecha: format(parseISO(ingreso.fecha), 'dd/MM/yyyy HH:mm'),
      Notas: ingreso.notas || ''
    }));
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ingresos');
    ws['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 30 }];
    const blob = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([blob]), `ingresos_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-col">
            <label className="text-sm text-gray-400">Desde</label>
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="bg-gray-700 p-2 rounded border border-gray-600 text-sm w-full" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-400">Hasta</label>
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="bg-gray-700 p-2 rounded border border-gray-600 text-sm w-full" />
          </div>
        </div>
        <button onClick={exportarExcel} className="bg-green-600 hover:bg-green-700 p-2 rounded flex items-center justify-center sm:justify-start">
          <Download size={18} className="mr-2" /> Exportar a Excel
        </button>
      </div>
    </div>
  );
}