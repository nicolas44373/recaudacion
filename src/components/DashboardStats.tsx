'use client';
import { format, parseISO } from 'date-fns';
import { DollarSign, TrendingUp, ArrowUpCircle, Users, CreditCard } from 'lucide-react';

interface DashboardStatsProps {
  estadisticas: {
    totalHoy: number;
    totalSemana: number;
    totalMes: number;
    promedioIngreso: number;
    totalGastosMes: number;
  };
  desde: string;
  hasta: string;
}

export default function DashboardStats({ estadisticas, desde, hasta }: DashboardStatsProps) {
  const fechaDesde = format(parseISO(desde), 'dd/MM/yyyy');
  const fechaHasta = format(parseISO(hasta), 'dd/MM/yyyy');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Ingresos del día */}
      <div className="bg-gray-800 p-4 rounded-lg flex flex-col justify-between">
        <div className="flex items-center">
          <div className="rounded-full bg-blue-500 bg-opacity-20 p-3 mr-4 flex-shrink-0">
            <DollarSign size={24} className="text-blue-500" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Ingresos del día</p>
            <p className="text-xl sm:text-2xl font-bold">${estadisticas.totalHoy.toFixed(2)}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Día: {fechaHasta}</p>
      </div>

      {/* Ingresos últimos 7 días */}
      <div className="bg-gray-800 p-4 rounded-lg flex flex-col justify-between">
        <div className="flex items-center">
          <div className="rounded-full bg-green-500 bg-opacity-20 p-3 mr-4 flex-shrink-0">
            <TrendingUp size={24} className="text-green-500" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Ingresos últimos 7 días</p>
            <p className="text-xl sm:text-2xl font-bold">${estadisticas.totalSemana.toFixed(2)}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Hasta: {fechaHasta}</p>
      </div>

      {/* Ingresos del mes */}
      <div className="bg-gray-800 p-4 rounded-lg flex flex-col justify-between">
        <div className="flex items-center">
          <div className="rounded-full bg-purple-500 bg-opacity-20 p-3 mr-4 flex-shrink-0">
            <ArrowUpCircle size={24} className="text-purple-500" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Ingresos del mes</p>
            <p className="text-xl sm:text-2xl font-bold">${estadisticas.totalMes.toFixed(2)}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Del 01 al {fechaHasta}</p>
      </div>

      {/* Promedio ingreso */}
      <div className="bg-gray-800 p-4 rounded-lg flex flex-col justify-between">
        <div className="flex items-center">
          <div className="rounded-full bg-orange-500 bg-opacity-20 p-3 mr-4 flex-shrink-0">
            <Users size={24} className="text-orange-500" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Promedio ingreso</p>
            <p className="text-xl sm:text-2xl font-bold">${estadisticas.promedioIngreso.toFixed(2)}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Del {fechaDesde} al {fechaHasta}</p>
      </div>

      {/* Egresos del mes */}
      <div className="bg-gray-800 p-4 rounded-lg flex flex-col justify-between">
        <div className="flex items-center">
          <div className="rounded-full bg-red-500 bg-opacity-20 p-3 mr-4 flex-shrink-0">
            <CreditCard size={24} className="text-red-500" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Egresos del mes</p>
            <p className="text-xl sm:text-2xl font-bold">${estadisticas.totalGastosMes.toFixed(2)}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Del 01 al {fechaHasta}</p>
      </div>
    </div>
  );
}
