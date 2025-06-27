'use client';
import React from 'react';
import { format, parseISO } from 'date-fns';
import {
  DollarSign,
  TrendingUp,
  ArrowUpCircle,
  Users,
  CreditCard,
  Wallet,
  Banknote,
} from 'lucide-react';

interface DashboardStatsProps {
  estadisticas: {
    totalHoy: number;
    totalSemana: number;
    totalMes: number;
    promedioIngreso: number;
    totalGastosMes: number;
    egresosHoy: number;
    dineroHoy: number;
    totalTarjetaTransferencia: number;
    dineroGlobalHoy: number;
  };
  desde: string;
  hasta: string;
}

interface StatCardProps {
  icon: React.ReactElement;
  label: string;
  value: number;
  subtext: string;
}

function StatCard({ icon, label, value, subtext }: StatCardProps) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center">
        <div className="rounded-full bg-opacity-20 p-3 mr-4 flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-xl sm:text-2xl font-bold">${value.toFixed(2)}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">{subtext}</p>
    </div>
  );
}

export default function DashboardStats({ estadisticas, desde, hasta }: DashboardStatsProps) {
  const fechaDesde = format(parseISO(desde), 'dd/MM/yyyy');
  const fechaHasta = format(parseISO(hasta), 'dd/MM/yyyy');
  const hoy = fechaHasta;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <StatCard
        icon={<DollarSign size={24} className="text-blue-500" />}
        label="Ingresos del día"
        value={estadisticas.totalHoy}
        subtext={`Día: ${hoy}`}
      />
      <StatCard
        icon={<CreditCard size={24} className="text-red-500" />}
        label="Egresos del día"
        value={estadisticas.egresosHoy}
        subtext={`Día: ${hoy}`}
      />
      <StatCard
        icon={<Wallet size={24} className="text-teal-500" />}
        label="Dinero del día"
        value={estadisticas.dineroHoy}
        subtext={`Día: ${hoy}`}
      />
      <StatCard
        icon={<CreditCard size={24} className="text-indigo-500" />}
        label="Tarjeta y Transferencia"
        value={estadisticas.totalTarjetaTransferencia}
        subtext={`Día: ${hoy}`}
      />
      <StatCard
        icon={<Banknote size={24} className="text-emerald-500" />}
        label="Dinero global del día"
        value={estadisticas.dineroGlobalHoy}
        subtext={`Día: ${hoy}`}
      />
      <StatCard
        icon={<ArrowUpCircle size={24} className="text-purple-500" />}
        label="Ingresos del mes"
        value={estadisticas.totalMes}
        subtext={`Del 01 al ${fechaHasta}`}
      />
      <StatCard
        icon={<TrendingUp size={24} className="text-green-500" />}
        label="Ingresos últimos 7 días"
        value={estadisticas.totalSemana}
        subtext={`Hasta: ${fechaHasta}`}
      />
      <StatCard
        icon={<Users size={24} className="text-orange-500" />}
        label="Promedio ingreso"
        value={estadisticas.promedioIngreso}
        subtext={`Del ${fechaDesde} al ${fechaHasta}`}
      />
      <StatCard
        icon={<CreditCard size={24} className="text-red-500" />}
        label="Egresos del mes"
        value={estadisticas.totalGastosMes}
        subtext={`Del 01 al ${fechaHasta}`}
      />
    </div>
  );
}
