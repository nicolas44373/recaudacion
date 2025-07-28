'use client';
import { Download } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import React from 'react';

interface Ingreso {
  categoria: string;
  monto: number;
  metodo_pago: string;
  fecha: string;
  notas?: string;
}

interface Gasto {
  categoria: string;
  monto: number;
  metodo_pago: string;
  fecha: string;
  notas?: string;
}

interface Props {
  desde: string;
  hasta: string;
  setDesde: (value: string) => void;
  setHasta: (value: string) => void;
  datos: Ingreso[] | Gasto[]; // Datos genéricos
  tipo: 'ingresos' | 'gastos'; // Tipo de datos
}

export default function FiltroFechaExportar({ desde, hasta, setDesde, setHasta, datos, tipo }: Props) {
  const exportarExcel = () => {
    if (!Array.isArray(datos) || datos.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    try {
      const datosExcel = datos.map((item) => ({
        Categoría: item.categoria || 'Sin categoría',
        Monto: item.monto || 0,
        'Método de Pago': item.metodo_pago || 'N/A',
        Fecha: isValid(parseISO(item.fecha))
          ? format(parseISO(item.fecha), 'dd/MM/yyyy HH:mm')
          : 'Fecha inválida',
        Notas: item.notas || '',
      }));

      const ws = XLSX.utils.json_to_sheet(datosExcel);
      ws['!cols'] = [
        { wch: 15 }, // Categoría
        { wch: 12 }, // Monto
        { wch: 18 }, // Método de Pago
        { wch: 22 }, // Fecha
        { wch: 30 }, // Notas
      ];

      const wb = XLSX.utils.book_new();
      const nombreHoja = tipo === 'ingresos' ? 'Ingresos' : 'Gastos';
      XLSX.utils.book_append_sheet(wb, ws, nombreHoja);

      const nombreArchivo = `${tipo}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      const blob = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([blob]), nombreArchivo);
    } catch (error) {
      console.error(`Error al exportar Excel de ${tipo}:`, error);
      alert('Ocurrió un error al exportar el archivo.');
    }
  };

  const tituloBoton = tipo === 'ingresos' ? 'Exportar Ingresos' : 'Exportar Gastos';

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-col">
            <label className="text-sm text-gray-400">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="bg-gray-700 p-2 rounded border border-gray-600 text-sm w-full"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-400">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="bg-gray-700 p-2 rounded border border-gray-600 text-sm w-full"
            />
          </div>
        </div>

        <button
          onClick={exportarExcel}
          className="bg-green-600 hover:bg-green-700 p-2 rounded flex items-center justify-center transition-colors duration-200"
        >
          <Download size={18} className="mr-2" />
          {tituloBoton}
        </button>
      </div>
    </div>
  );
}