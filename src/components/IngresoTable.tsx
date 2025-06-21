'use client';
import { format, parseISO } from 'date-fns';
import { AlertCircle } from 'lucide-react';

const UMBRAL_ALERTA = 50000000;

export default function IngresoTable({ ingresos }: { ingresos: any[] }) {
  const formatMonto = (monto: number) =>
    monto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  const colorMetodo = (metodo: string) => {
    switch (metodo) {
      case 'contado':
        return 'text-green-400';
      case 'tarjeta':
        return 'text-blue-400';
      case 'transferencia':
        return 'text-yellow-400';
      default:
        return 'text-white';
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg mb-8 shadow-lg">
      <h2 className="text-xl font-semibold mb-6 border-b border-gray-700 pb-2">Listado de Ingresos</h2>
      {ingresos.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border-separate border-spacing-y-2">
            <thead className="text-xs uppercase bg-gray-700 text-gray-300">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Fecha</th>
                <th className="px-4 py-3">Caja</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3 rounded-r-lg hidden sm:table-cell">Notas</th>
              </tr>
            </thead>
            <tbody>
              {ingresos.map((ingreso) => (
                <tr key={ingreso.id} className="bg-gray-700 hover:bg-gray-600 transition rounded-lg">
                  <td className="px-4 py-3 text-xs text-gray-300">{format(parseISO(ingreso.fecha), 'dd/MM/yyyy HH:mm')}</td>
                  <td className="px-4 py-3 capitalize">{ingreso.caja}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    <span className="inline-block">
                      {formatMonto(ingreso.monto)}
                      {ingreso.monto > UMBRAL_ALERTA && (
                        <AlertCircle size={14} className="inline text-red-500 ml-1" />
                      )}
                    </span>
                  </td>
                  <td className={`px-4 py-3 capitalize font-medium ${colorMetodo(ingreso.metodo_pago)}`}>
                    {ingreso.metodo_pago}
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                    {ingreso.notas || <span className="italic text-gray-500">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center py-4 text-gray-400">No hay ingresos en el período seleccionado</p>
      )}
    </div>
  );
}
