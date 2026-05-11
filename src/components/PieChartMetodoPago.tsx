'use client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORES: Record<string, string> = {
  Efectivo: '#10b981',
  Tarjeta: '#3b82f6',
  Transferencia: '#f59e0b',
  'Depósito': '#8b5cf6',
  Cheque: '#ec4899',
  eCheq: '#06b6d4',
};
const COLOR_DEFAULT = '#6b7280';

const fmtTooltip = (value: number) =>
  value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

export default function PieChartMetodoPago({ datos }: { datos: any[] }) {
  const total = datos.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-md">
      <h2 className="text-base font-semibold text-white mb-4">Distribución por Método de Pago</h2>
      <div className="h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={datos}
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={45}
              dataKey="value"
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {datos.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={COLORES[entry.name] ?? COLOR_DEFAULT} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
              labelStyle={{ color: '#e5e7eb' }}
              formatter={(value: number, name: string) => [
                `${fmtTooltip(value)} (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`,
                name,
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              formatter={(value) => <span style={{ color: '#d1d5db' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
