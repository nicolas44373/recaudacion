'use client';
import { DollarSign, TrendingUp, ArrowUpCircle, Users, CreditCard } from 'lucide-react';

export default function DashboardStats({ estadisticas }: { estadisticas: any }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="bg-gray-800 p-4 rounded-lg flex items-center">
        <div className="rounded-full bg-blue-500 bg-opacity-20 p-3 mr-4 flex-shrink-0">
          <DollarSign size={24} className="text-blue-500" />
        </div>
        <div>
          <p className="text-gray-400 text-sm">Ingresos Hoy</p>
          <p className="text-xl sm:text-2xl font-bold">${estadisticas.totalHoy.toFixed(2)}</p>
        </div>
      </div>
      <div className="bg-gray-800 p-4 rounded-lg flex items-center">
        <div className="rounded-full bg-green-500 bg-opacity-20 p-3 mr-4 flex-shrink-0">
          <TrendingUp size={24} className="text-green-500" />
        </div>
        <div>
          <p className="text-gray-400 text-sm">Ingresos Semana</p>
          <p className="text-xl sm:text-2xl font-bold">${estadisticas.totalSemana.toFixed(2)}</p>
        </div>
      </div>
      <div className="bg-gray-800 p-4 rounded-lg flex items-center">
        <div className="rounded-full bg-purple-500 bg-opacity-20 p-3 mr-4 flex-shrink-0">
          <ArrowUpCircle size={24} className="text-purple-500" />
        </div>
        <div>
          <p className="text-gray-400 text-sm">Ingresos Mes</p>
          <p className="text-xl sm:text-2xl font-bold">${estadisticas.totalMes.toFixed(2)}</p>
        </div>
      </div>
      <div className="bg-gray-800 p-4 rounded-lg flex items-center">
        <div className="rounded-full bg-orange-500 bg-opacity-20 p-3 mr-4 flex-shrink-0">
          <Users size={24} className="text-orange-500" />
        </div>
        <div>
          <p className="text-gray-400 text-sm">Promedio Ingreso</p>
          <p className="text-xl sm:text-2xl font-bold">${estadisticas.promedioIngreso.toFixed(2)}</p>
        </div>
      </div>
      <div className="bg-gray-800 p-4 rounded-lg flex items-center">
        <div className="rounded-full bg-red-500 bg-opacity-20 p-3 mr-4 flex-shrink-0">
          <CreditCard size={24} className="text-red-500" />
        </div>
        <div>
          <p className="text-gray-400 text-sm">Gastos Mes</p>
          <p className="text-xl sm:text-2xl font-bold">${estadisticas.totalGastosMes.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
