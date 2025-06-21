// Nuevo componente: GastoTable.tsx
'use client';
import { format, parseISO } from 'date-fns';
import { AlertCircle } from 'lucide-react';

const UMBRAL_ALERTA = 5000000;

export default function GastoTable({ gastos }: { gastos: any[] }) {
  const formatMonto = (monto: number) =>
    monto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  return (
    <div className="bg-gray-800 p-6 rounded-lg mb-8 shadow-lg">
      <h2 className="text-xl font-semibold mb-6 border-b border-gray-700 pb-2">Listado de Gastos</h2>
      {gastos.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border-separate border-spacing-y-2">
            <thead className="text-xs uppercase bg-gray-700 text-gray-300">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Fecha</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3 rounded-r-lg hidden sm:table-cell">Notas</th>
              </tr>
            </thead>
            <tbody>
              {gastos.map((gasto) => (
                <tr key={gasto.id} className="bg-gray-700 hover:bg-gray-600 transition rounded-lg">
                  <td className="px-4 py-3 text-xs text-gray-300">{format(parseISO(gasto.fecha), 'dd/MM/yyyy HH:mm')}</td>
                  <td className="px-4 py-3 capitalize">{gasto.categoria}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    <span className="inline-block">
                      {formatMonto(gasto.monto)}
                      {gasto.monto > UMBRAL_ALERTA && (
                        <AlertCircle size={14} className="inline text-red-500 ml-1" />
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize text-blue-400 font-medium">{gasto.metodo_pago}</td>
                  <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                    {gasto.notas || <span className="italic text-gray-500">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center py-4 text-gray-400">No hay gastos en el período seleccionado</p>
      )}
    </div>
  );
}