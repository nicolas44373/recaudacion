'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

const fmtYAxis = (v: number) => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
};

const fmtTooltip = (value: number) =>
  value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

export default function LineChartTendencia({ datos }: { datos: any[] }) {
  return (
    <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-md">
      <h2 className="text-base font-semibold text-white mb-4">Tendencia de Ingresos</h2>
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datos} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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
            <Line type="monotone" dataKey="total" name="Total" stroke="#ffffff" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Efectivo" name="Efectivo" stroke="#10b981" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="Tarjeta" name="Tarjeta" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="Transferencia" name="Transferencia" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="Depósito" name="Depósito" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="Cheque" name="Cheque" stroke="#ec4899" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="eCheq" name="eCheq" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
