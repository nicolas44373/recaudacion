'use client';

const COLORES = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#a855f7'];

const fmt = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 });

interface Item {
  tipo: string;
  categoria: string;
  total: number;
  porcentaje: number;
}

function CategoriaCard({ item, index }: { item: Item; index: number }) {
  const color = COLORES[index % COLORES.length];
  const isIngreso = item.tipo === 'ingreso';
  return (
    <div className="bg-gray-750 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors" style={{ borderColor: 'rgb(55 65 81)' }}>
      <div className="flex justify-between items-start mb-2 gap-2">
        <span className="text-xs font-semibold text-gray-300 leading-tight uppercase">{item.categoria}</span>
        <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full text-gray-400 whitespace-nowrap flex-shrink-0">
          {item.porcentaje.toFixed(1)}%
        </span>
      </div>
      <p className={`text-base font-bold tabular-nums ${isIngreso ? 'text-emerald-400' : 'text-red-400'}`}>
        {fmt(item.total)}
      </p>
      <div className="mt-2 bg-gray-700 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(item.porcentaje, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function ResumenPorCaja({ datos }: { datos: Item[] }) {
  const ingresos = datos.filter(d => d.tipo === 'ingreso');
  const gastos = datos.filter(d => d.tipo === 'gasto');

  const topIngresos = ingresos.slice(0, 10);
  const topGastos = gastos.slice(0, 10);

  const totalIngresos = ingresos.reduce((s, d) => s + d.total, 0);
  const totalGastos = gastos.reduce((s, d) => s + d.total, 0);

  return (
    <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-md space-y-6">
      {/* Ingresos por categoría */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Ingresos por Categoría</h2>
          <span className="text-xs text-emerald-400 font-semibold tabular-nums">{fmt(totalIngresos)}</span>
        </div>
        {topIngresos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topIngresos.map((item, i) => (
              <CategoriaCard key={`ing-${i}`} item={item} index={i} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-4">Sin ingresos en el período</p>
        )}
        {ingresos.length > 10 && (
          <p className="text-xs text-gray-500 mt-2 text-right">Mostrando top 10 de {ingresos.length} categorías</p>
        )}
      </div>

      {/* Gastos por categoría */}
      {gastos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Egresos por Categoría</h2>
            <span className="text-xs text-red-400 font-semibold tabular-nums">{fmt(totalGastos)}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topGastos.map((item, i) => (
              <CategoriaCard key={`gas-${i}`} item={item} index={i} />
            ))}
          </div>
          {gastos.length > 10 && (
            <p className="text-xs text-gray-500 mt-2 text-right">Mostrando top 10 de {gastos.length} categorías</p>
          )}
        </div>
      )}
    </div>
  );
}
