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

// ─── Tarjeta pequeña genérica ───────────────────────────────────────────────
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
    <div className={`bg-gray-800 rounded-xl p-4 border-l-4 ${borderColor} flex flex-col justify-between shadow`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide leading-tight">{label}</p>
        <div className="opacity-60">{icon}</div>
      </div>
      <p className={`text-xl font-bold tabular-nums ${valueColor}`}>{fmt(value)}</p>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
}

// ─── Tarjeta "Neto en caja" destacada ───────────────────────────────────────
function NetoCajaCard({ inicioDia, ingresosEf, egresosEf, neto, fecha }: {
  inicioDia: number; ingresosEf: number; egresosEf: number; neto: number; fecha: string;
}) {
  const positivo = neto >= 0;
  return (
    <div className={`rounded-2xl p-6 border shadow-lg col-span-1 ${positivo
      ? 'bg-gradient-to-br from-emerald-950/60 to-gray-800 border-emerald-700/50'
      : 'bg-gradient-to-br from-red-950/60 to-gray-800 border-red-700/50'
    }`}>
      {/* Título */}
      <div className="flex items-center justify-between mb-1">
        <p className={`text-xs font-bold uppercase tracking-widest ${positivo ? 'text-emerald-400' : 'text-red-400'}`}>
          Neto en caja
        </p>
        <span className="text-xs text-gray-500">{fecha}</span>
      </div>

      {/* Número grande */}
      <p className={`text-4xl font-extrabold tabular-nums mt-1 ${positivo ? 'text-emerald-300' : 'text-red-300'}`}>
        {fmt(neto)}
      </p>
      <p className="text-xs text-gray-500 mt-0.5 mb-4">Lo que debés tener en efectivo</p>

      {/* Fórmula desglosada */}
      <div className="border-t border-gray-600/60 pt-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Sun size={14} className="text-yellow-400" />
            <span className="text-gray-400">Apertura del día</span>
          </div>
          <span className="text-yellow-300 font-semibold tabular-nums">{fmt(inicioDia)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold text-base leading-none">+</span>
            <span className="text-gray-400">Ingresos efectivo</span>
          </div>
          <span className="text-emerald-400 font-semibold tabular-nums">{fmt(ingresosEf)}</span>
        </div>
        <div className="flex items-center justify-between text-sm border-t border-gray-600/40 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-red-400 font-bold text-base leading-none">−</span>
            <span className="text-gray-400">Egresos efectivo</span>
          </div>
          <span className="text-red-400 font-semibold tabular-nums">{fmt(egresosEf)}</span>
        </div>
        <div className={`flex items-center justify-between text-sm border-t-2 pt-2 font-bold ${positivo ? 'border-emerald-600/60' : 'border-red-600/60'}`}>
          <span className={positivo ? 'text-emerald-300' : 'text-red-300'}>=  Neto en caja</span>
          <span className={`tabular-nums ${positivo ? 'text-emerald-300' : 'text-red-300'}`}>{fmt(neto)}</span>
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

      {/* ══════════════════════════════════════════════════════════
          SECCIÓN 1 — CAJA DEL DÍA
          ══════════════════════════════════════════════════════════ */}
      <section>
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-3">
          Caja del día · {fechaHasta}
        </h3>

        {/* Grid: neto grande (col-span-2) + 3 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          {/* Neto en caja — destaca siempre primero */}
          <div className="sm:col-span-2 xl:col-span-2">
            <NetoCajaCard
              inicioDia={inicioDia}
              ingresosEf={totalHoy}
              egresosEf={egresosHoy}
              neto={dineroHoy}
              fecha={fechaHasta}
            />
          </div>

          {/* Componentes individuales */}
          <SmallCard
            label="Apertura del día"
            value={inicioDia}
            icon={<Sun size={18} className="text-yellow-400" />}
            borderColor="border-yellow-500"
            valueColor="text-yellow-300"
            subtext="INICIO DEL DIA registrado"
          />
          <SmallCard
            label="Ingresos efectivo"
            value={totalHoy}
            icon={<TrendingUp size={18} className="text-emerald-400" />}
            borderColor="border-emerald-500"
            valueColor="text-emerald-400"
            subtext="Sin apertura del día"
          />
        </div>

        {/* Segunda sub-fila: egresos + tarjeta/transfer + global */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <SmallCard
            label="Egresos efectivo"
            value={egresosHoy}
            icon={<TrendingDown size={18} className="text-red-400" />}
            borderColor="border-red-500"
            valueColor="text-red-400"
            subtext="Gastos en efectivo del día"
          />
          <SmallCard
            label="Tarjeta + Transfer."
            value={totalTarjetaTransferencia}
            icon={<CreditCard size={18} className="text-blue-400" />}
            borderColor="border-blue-500"
            valueColor="text-blue-300"
            subtext="Sin efectivo ni apertura"
          />
          <SmallCard
            label="Global del día"
            value={dineroGlobalHoy}
            icon={<Banknote size={18} className="text-indigo-400" />}
            borderColor="border-indigo-500"
            valueColor="text-indigo-300"
            subtext="Todos los métodos (sin apertura)"
          />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECCIÓN 2 — ANÁLISIS DEL PERÍODO
          ══════════════════════════════════════════════════════════ */}
      <section>
        <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-3">
          Período · {fechaDesde} → {fechaHasta}
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SmallCard
            label="Ingresos del mes"
            value={totalMes}
            icon={<ArrowUpCircle size={18} className="text-purple-400" />}
            borderColor="border-purple-500"
            valueColor="text-purple-300"
            subtext="Sin apertura del día"
          />
          <SmallCard
            label="Egresos del mes"
            value={totalGastosMes}
            icon={<TrendingDown size={18} className="text-red-400" />}
            borderColor="border-red-600"
            valueColor="text-red-400"
            subtext="Total de gastos"
          />
          <SmallCard
            label="Últ. 7 días"
            value={totalSemana}
            icon={<Activity size={18} className="text-orange-400" />}
            borderColor="border-orange-500"
            valueColor="text-orange-300"
            subtext={`Hasta ${fechaHasta}`}
          />

          {/* Balance neto del período */}
          <div className={`bg-gray-800 rounded-xl p-4 border-l-4 shadow ${balanceNeto >= 0 ? 'border-emerald-600' : 'border-red-600'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Balance neto</p>
              <BarChart2 size={18} className={`opacity-60 ${balanceNeto >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
            </div>
            <p className={`text-xl font-bold tabular-nums ${balanceNeto >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {fmt(balanceNeto)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Ingresos − Egresos del mes</p>
          </div>
        </div>
      </section>
    </div>
  );
}
