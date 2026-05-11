'use client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORES: Record<string, string> = {
  Efectivo: '#059669',
  Tarjeta: '#2563eb',
  Transferencia: '#d97706',
  'Depósito': '#7c3aed',
  Cheque: '#db2777',
  eCheq: '#0891b2',
};
const COLOR_DEFAULT = '#9ca3af';

const fmtTooltip = (value: number) =>
  value.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });

export default function PieChartMetodoPago({ datos }: { datos: any[] }) {
  const total = datos.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Distribución por Método de Pago</h2>
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
              contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ color: '#111827' }}
              formatter={(value: number, name: string) => [
                `${fmtTooltip(value)} (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`,
                name,
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              formatter={(value) => <span style={{ color: '#374151' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
