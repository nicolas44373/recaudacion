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
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Tendencia de Ingresos</h2>
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datos} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtYAxis} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ color: '#111827', fontWeight: 600 }}
              itemStyle={{ color: '#374151' }}
              formatter={(value: number, name: string) => [fmtTooltip(value), name]}
              labelFormatter={(label) => `Mes: ${label}`}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8, color: '#374151' }} />
            <Line type="monotone" dataKey="total" name="Total" stroke="#374151" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Efectivo" name="Efectivo" stroke="#059669" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="Tarjeta" name="Tarjeta" stroke="#2563eb" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="Transferencia" name="Transferencia" stroke="#d97706" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="Depósito" name="Depósito" stroke="#7c3aed" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="Cheque" name="Cheque" stroke="#db2777" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="eCheq" name="eCheq" stroke="#0891b2" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
