// components/BarChartMensual.tsx
'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORES = { contado: '#10b981', tarjeta: '#3b82f6', transferencia: '#f59e0b' };

export default function BarChartMensual({ datos }: { datos: any[] }) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-8">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">Ingresos por Mes</h2>
      <div className="h-60 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos}>
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, '']} labelFormatter={(label) => `Mes: ${label}`} />
            <Legend />
            <Bar dataKey="contado" name="Contado" fill={COLORES.contado} />
            <Bar dataKey="tarjeta" name="Tarjeta" fill={COLORES.tarjeta} />
            <Bar dataKey="transferencia" name="Transferencia" fill={COLORES.transferencia} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
