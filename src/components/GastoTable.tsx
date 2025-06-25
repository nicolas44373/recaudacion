'use client';
import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { AlertCircle } from 'lucide-react';

const UMBRAL_ALERTA = 5000000;

const CATEGORIAS_GASTOS = [
  "CUENTA GALICIA JULITO",
  "CUENTA GALICIA ROCIO",
  "CUENTA MERCADO PAGO",
  "TRANSFERENCIAS FINANCIERAS",
  "CHEQUES FINANCIEROS",
  "CHEQUES DE LEO FINANCISTA",
  "SUELDOS FIJOS",
  "SUELDOS TEMPORALES",
  "LIMPIEZA",
  "BOLSAS",
  "DESAYUNO",
  "COMBUSTIBLE",
  "ROCIO PERSONAL",
  "JULITO PERSONAL",
  "LEO PERSONAL",
  "EPI PERSONAL",
  "CASA",
  "MARKETING",
  "SEGURIDAD",
  "ALMUERZO",
  "LIBRERIA",
  "HORAS EXTRA",
  "GASTOS EXTRA",
  "TAXI/UBER",
  "SUPER",
  "SERVICIOS",
  "PAGO TARJETA",
  "PAGO PROVEEDORES",
  "MUNICIPALES",
  "MANTENIMIENTO JURAMENTO",
  "MANTENIMIENTO COLON",
  "MANTENIMIENTO JUAN B JUSTO",
  "MANTENIMIENTO DE VEHICULOS",
  "ALQUILER",
  "IMPUESTOS",
  "COSTOS FINANCIEROS",
  "TARJETA",
  "PUERTOS DE FRIO",
  "LEO",
  "FINANCIERA",
  "DEPOSITO EN CUENTA"
];


export default function GastoTable({ gastos }: { gastos: any[] }) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');

  const formatMonto = (monto: number) =>
    monto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  const gastosFiltrados = categoriaSeleccionada
    ? gastos.filter((g) => g.categoria === categoriaSeleccionada)
    : gastos;

  return (
    <div className="bg-gray-800 p-6 rounded-lg mb-8 shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h2 className="text-xl font-semibold">Listado de Gastos</h2>
        <select
          className="bg-gray-700 border border-gray-600 text-sm rounded-lg px-3 py-2"
          value={categoriaSeleccionada}
          onChange={(e) => setCategoriaSeleccionada(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS_GASTOS.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {gastosFiltrados.length > 0 ? (
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
              {gastosFiltrados.map((gasto) => (
                <tr key={gasto.id} className="bg-gray-700 hover:bg-gray-600 transition rounded-lg">
                  <td className="px-4 py-3 text-xs text-gray-300">
                    {format(parseISO(gasto.fecha), 'dd/MM/yyyy HH:mm')}
                  </td>
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
        <p className="text-center py-4 text-gray-400">No hay gastos en esta categoría</p>
      )}
    </div>
  );
}
