// components/LineChartTendencia.tsx
'use client';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function LineChartTendencia({ datos }: { datos: any[] }) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-8">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">Tendencia de Ingresos</h2>
      <div className="h-60 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datos}>
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, '']} labelFormatter={(label) => `Mes: ${label}`} />
            <Legend />
            <Line type="monotone" dataKey="total" name="Total" stroke="#ffffff" strokeWidth={2} />
            <Line type="monotone" dataKey="contado" name="Contado" stroke="#10b981" />
            <Line type="monotone" dataKey="tarjeta" name="Tarjeta" stroke="#3b82f6" />
            <Line type="monotone" dataKey="transferencia" name="Transferencia" stroke="#f59e0b" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}