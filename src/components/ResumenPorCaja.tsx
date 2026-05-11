'use client';

const COLORES = ['#059669', '#2563eb', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#ea580c', '#4f46e5', '#0d9488', '#9333ea'];

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
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
      <div className="flex justify-between items-start mb-2 gap-2">
        <span className="text-xs font-semibold text-gray-700 leading-tight uppercase">{item.categoria}</span>
        <span className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-full text-gray-500 whitespace-nowrap flex-shrink-0">
          {item.porcentaje.toFixed(1)}%
        </span>
      </div>
      <p className={`text-base font-bold tabular-nums ${isIngreso ? 'text-emerald-600' : 'text-red-600'}`}>
        {fmt(item.total)}
      </p>
      <div className="mt-2 bg-gray-200 rounded-full h-1.5 overflow-hidden">
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
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Ingresos por Categoría</h2>
          <span className="text-xs text-emerald-600 font-semibold tabular-nums">{fmt(totalIngresos)}</span>
        </div>
        {topIngresos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topIngresos.map((item, i) => (
              <CategoriaCard key={`ing-${i}`} item={item} index={i} />
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-4">Sin ingresos en el período</p>
        )}
        {ingresos.length > 10 && (
          <p className="text-xs text-gray-400 mt-2 text-right">Mostrando top 10 de {ingresos.length} categorías</p>
        )}
      </div>

      {gastos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Egresos por Categoría</h2>
            <span className="text-xs text-red-600 font-semibold tabular-nums">{fmt(totalGastos)}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topGastos.map((item, i) => (
              <CategoriaCard key={`gas-${i}`} item={item} index={i} />
            ))}
          </div>
          {gastos.length > 10 && (
            <p className="text-xs text-gray-400 mt-2 text-right">Mostrando top 10 de {gastos.length} categorías</p>
          )}
        </div>
      )}
    </div>
  );
}
