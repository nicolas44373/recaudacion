// components/PieChartMetodoPago.tsx
'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function PieChartMetodoPago({ datos }: { datos: any[] }) {
  const colores: Record<string, string> = {
    contado: '#10b981',
    tarjeta: '#3b82f6',
    transferencia: '#f59e0b'
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-8">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">Distribución por Método de Pago</h2>
      <div className="h-60 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={datos}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              innerRadius={0}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {datos.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colores[entry.name] || '#8884d8'} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, '']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}