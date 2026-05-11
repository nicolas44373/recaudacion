'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

const COLORES: Record<string, string> = {
  Efectivo: '#10b981',
  Tarjeta: '#3b82f6',
  Transferencia: '#f59e0b',
  'Depósito': '#8b5cf6',
  Cheque: '#ec4899',
  eCheq: '#06b6d4',
};

const fmtYAxis = (v: number) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
};

const fmtTooltip = (value: number) =>
  value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

export default function BarChartMensual({ datos }: { datos: any[] }) {
  return (
    <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-md">
      <h2 className="text-base font-semibold text-white mb-4">Ingresos por Mes</h2>
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtYAxis} tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
              labelStyle={{ color: '#e5e7eb', fontWeight: 600 }}
              itemStyle={{ color: '#d1d5db' }}
              formatter={(value: number, name: string) => [fmtTooltip(value), name]}
              labelFormatter={(label) => `Mes: ${label}`}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            {Object.entries(COLORES).map(([metodo, color]) => (
              <Bar key={metodo} dataKey={metodo} name={metodo} fill={color} radius={[3, 3, 0, 0]} maxBarSize={30} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
