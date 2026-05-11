'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

const COLORES: Record<string, string> = {
  Efectivo: '#059669',
  Tarjeta: '#2563eb',
  Transferencia: '#d97706',
  'Depósito': '#7c3aed',
  Cheque: '#db2777',
  eCheq: '#0891b2',
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
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Ingresos por Mes</h2>
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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
            {Object.entries(COLORES).map(([metodo, color]) => (
              <Bar key={metodo} dataKey={metodo} name={metodo} fill={color} radius={[3, 3, 0, 0]} maxBarSize={30} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
