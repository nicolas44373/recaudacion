'use client';
import { DollarSign } from 'lucide-react';

export default function NavigationBar({ vistaActual, setVistaActual }: { vistaActual: string; setVistaActual: (vista: any) => void }) {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div className="flex items-center mb-4 sm:mb-0">
          <DollarSign className="mr-2" size={24} />
          <h1 className="text-xl font-bold">Sistema de Ingresos</h1>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
  <button
    className={`px-3 py-2 text-sm sm:text-base rounded-lg ${
      vistaActual === 'dashboard' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
    }`}
    onClick={() => setVistaActual('dashboard')}
  >
    Dashboard
  </button>
  <button
    className={`px-3 py-2 text-sm sm:text-base rounded-lg ${
      vistaActual === 'ingresos' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
    }`}
    onClick={() => setVistaActual('ingresos')}
  >
    Ver Ingresos
  </button>
  <button
    className={`px-3 py-2 text-sm sm:text-base rounded-lg ${
      vistaActual === 'formulario' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
    }`}
    onClick={() => setVistaActual('formulario')}
  >
    Nuevo Ingreso
  </button>
  <button
    className={`px-3 py-2 text-sm sm:text-base rounded-lg ${
      vistaActual === 'gastos' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
    }`}
    onClick={() => setVistaActual('gastos')}
  >
    Ver Egresos
  </button>
  <button
    className={`px-3 py-2 text-sm sm:text-base rounded-lg ${
      vistaActual === 'nuevo-gasto' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
    }`}
    onClick={() => setVistaActual('nuevo-gasto')}
  >
    Nuevo Egreso
  </button>
</div>

      </div>
    </nav>
  );
}
