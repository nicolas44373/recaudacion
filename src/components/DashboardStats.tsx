'use client';
import React from 'react';
import { format, parseISO } from 'date-fns';
import {
  TrendingUp, TrendingDown, CreditCard,
  Banknote, ArrowUpCircle, Activity, BarChart2, Sun,
} from 'lucide-react';

interface Stats {
  totalHoy: number;
  totalSemana: number;
  totalMes: number;
  promedioIngreso: number;
  totalGastosMes: number;
  egresosHoy: number;
  dineroHoy: number;
  totalTarjetaTransferencia: number;
  dineroGlobalHoy: number;
  inicioDia: number;
}

interface Props {
  estadisticas: Stats;
  desde: string;
  hasta: string;
}

const fmt = (n: number) =>
  n.toLocaleString('es-AR', {
    style: 'currency', currency: 'ARS',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  });

interface SmallCardProps {
  label: string;
  value: number;
  icon: React.ReactElement;
  borderColor: string;
  valueColor: string;
  subtext?: string;
}
function SmallCard({ label, value, icon, borderColor, valueColor, subtext }: SmallCardProps) {
  return (
    <div className={`bg-white rounded-xl p-4 border-l-4 ${borderColor} flex flex-col justify-between shadow-sm border border-gray-200`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
        <div className="opacity-50">{icon}</div>
      </div>
      <p className={`text-xl font-bold tabular-nums ${valueColor}`}>{fmt(value)}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  );
}

function NetoCajaCard({ inicioDia, ingresosEf, egresosEf, neto, fecha }: {
  inicioDia: number; ingresosEf: number; egresosEf: number; neto: number; fecha: string;
}) {
  const positivo = neto >= 0;
  return (
    <div className={`rounded-2xl p-6 border shadow-sm col-span-1 ${positivo
      ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200'
      : 'bg-gradient-to-br from-red-50 to-white border-red-200'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <p className={`text-xs font-bold uppercase tracking-widest ${positivo ? 'text-emerald-600' : 'text-red-600'}`}>
          Neto en caja
        </p>
        <span className="text-xs text-gray-400">{fecha}</span>
      </div>

      <p className={`text-4xl font-extrabold tabular-nums mt-1 ${positivo ? 'text-emerald-700' : 'text-red-700'}`}>
        {fmt(neto)}
      </p>
      <p className="text-xs text-gray-400 mt-0.5 mb-4">Lo que debés tener en efectivo</p>

      <div className="border-t border-gray-200 pt-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Sun size={14} className="text-yellow-500" />
            <span className="text-gray-600">Apertura del día</span>
          </div>
          <span className="text-yellow-600 font-semibold tabular-nums">{fmt(inicioDia)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 font-bold text-base leading-none">+</span>
            <span className="text-gray-600">Ingresos efectivo</span>
          </div>
          <span className="text-emerald-600 font-semibold tabular-nums">{fmt(ingresosEf)}</span>
        </div>
        <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-bold text-base leading-none">−</span>
            <span className="text-gray-600">Egresos efectivo</span>
          </div>
          <span className="text-red-600 font-semibold tabular-nums">{fmt(egresosEf)}</span>
        </div>
        <div className={`flex items-center justify-between text-sm border-t-2 pt-2 font-bold ${positivo ? 'border-emerald-300' : 'border-red-300'}`}>
          <span className={positivo ? 'text-emerald-700' : 'text-red-700'}>=  Neto en caja</span>
          <span className={`tabular-nums ${positivo ? 'text-emerald-700' : 'text-red-700'}`}>{fmt(neto)}</span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardStats({ estadisticas, desde, hasta }: Props) {
  const {
    totalHoy, egresosHoy, dineroHoy, inicioDia,
    totalTarjetaTransferencia, dineroGlobalHoy,
    totalMes, totalGastosMes, totalSemana,
  } = estadisticas;

  const fechaDesde = format(parseISO(desde), 'dd/MM/yy');
  const fechaHasta = format(parseISO(hasta), 'dd/MM/yyyy');
  const balanceNeto = totalMes - totalGastosMes;

  return (
    <div className="space-y-6">

      <section>
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-3">
          Caja del día · {fechaHasta}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="sm:col-span-2 xl:col-span-2">
            <NetoCajaCard
              inicioDia={inicioDia}
              ingresosEf={totalHoy}
              egresosEf={egresosHoy}
              neto={dineroHoy}
              fecha={fechaHasta}
            />
          </div>

          <SmallCard
            label="Apertura del día"
            value={inicioDia}
            icon={<Sun size={18} className="text-yellow-500" />}
            borderColor="border-yellow-400"
            valueColor="text-yellow-600"
            subtext="INICIO DEL DIA registrado"
          />
          <SmallCard
            label="Ingresos efectivo"
            value={totalHoy}
            icon={<TrendingUp size={18} className="text-emerald-500" />}
            borderColor="border-emerald-500"
            valueColor="text-emerald-600"
            subtext="Sin apertura del día"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <SmallCard
            label="Egresos efectivo"
            value={egresosHoy}
            icon={<TrendingDown size={18} className="text-red-500" />}
            borderColor="border-red-500"
            valueColor="text-red-600"
            subtext="Gastos en efectivo del día"
          />
          <SmallCard
            label="Tarjeta + Transfer."
            value={totalTarjetaTransferencia}
            icon={<CreditCard size={18} className="text-blue-500" />}
            borderColor="border-blue-500"
            valueColor="text-blue-600"
            subtext="Sin efectivo ni apertura"
          />
          <SmallCard
            label="Global del día"
            value={dineroGlobalHoy}
            icon={<Banknote size={18} className="text-indigo-500" />}
            borderColor="border-indigo-500"
            valueColor="text-indigo-600"
            subtext="Todos los métodos (sin apertura)"
          />
        </div>
      </section>

      <section>
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-3">
          Período · {fechaDesde} → {fechaHasta}
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SmallCard
            label="Ingresos del mes"
            value={totalMes}
            icon={<ArrowUpCircle size={18} className="text-purple-500" />}
            borderColor="border-purple-500"
            valueColor="text-purple-600"
            subtext="Sin apertura del día"
          />
          <SmallCard
            label="Egresos del mes"
            value={totalGastosMes}
            icon={<TrendingDown size={18} className="text-red-500" />}
            borderColor="border-red-500"
            valueColor="text-red-600"
            subtext="Total de gastos"
          />
          <SmallCard
            label="Últ. 7 días"
            value={totalSemana}
            icon={<Activity size={18} className="text-orange-500" />}
            borderColor="border-orange-500"
            valueColor="text-orange-600"
            subtext={`Hasta ${fechaHasta}`}
          />

          <div className={`bg-white rounded-xl p-4 border-l-4 shadow-sm border border-gray-200 ${balanceNeto >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Balance neto</p>
              <BarChart2 size={18} className={`opacity-50 ${balanceNeto >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
            </div>
            <p className={`text-xl font-bold tabular-nums ${balanceNeto >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {fmt(balanceNeto)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Ingresos − Egresos del mes</p>
          </div>
        </div>
      </section>
    </div>
  );
}
