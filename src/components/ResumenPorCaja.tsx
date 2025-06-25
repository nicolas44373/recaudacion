'use client';

const coloresCaja = ['#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

export default function ResumenPorCaja({ datos }: { datos: any[] }) {
  const ingresos = datos.filter((item) => item.tipo === 'ingreso');
  const gastos = datos.filter((item) => item.tipo === 'gasto');

  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-8 space-y-8">
      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Resumen de Ingresos por Caja</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ingresos.map((item, index) => (
            <div key={`${item.caja}-${index}`} className="bg-gray-700 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium capitalize">{item.caja}</span>
                <span className="text-xs sm:text-sm bg-gray-600 px-2 py-1 rounded">
                  {item.porcentaje.toFixed(1)}%
                </span>
              </div>
              <p className="text-lg sm:text-xl mt-2 font-bold text-green-400">${item.total.toFixed(2)}</p>
              <div className="mt-2 bg-gray-600 rounded-full h-2">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${item.porcentaje}%`,
                    backgroundColor: coloresCaja[index % coloresCaja.length],
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {gastos.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Resumen de Gastos por Caja</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {gastos.map((item, index) => (
              <div key={`${item.caja}-${index}`} className="bg-gray-700 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium capitalize">{item.caja}</span>
                  <span className="text-xs sm:text-sm bg-gray-600 px-2 py-1 rounded">
                    {item.porcentaje.toFixed(1)}%
                  </span>
                </div>
                <p className="text-lg sm:text-xl mt-2 font-bold text-red-400">${item.total.toFixed(2)}</p>
                <div className="mt-2 bg-gray-600 rounded-full h-2">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${item.porcentaje}%`,
                      backgroundColor: coloresCaja[index % coloresCaja.length],
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
