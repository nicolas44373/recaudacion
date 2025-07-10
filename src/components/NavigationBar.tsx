'use client';
import { DollarSign, Bell } from 'lucide-react';

export default function NavigationBar({ vistaActual, setVistaActual }: { vistaActual: string; setVistaActual: (vista: any) => void }) {
  return (
    <nav className="bg-gradient-to-r from-pink-200 via-pink-100 to-rose-100 p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div className="flex items-center mb-6 sm:mb-0">
          <div className="bg-pink-300/30 backdrop-blur-sm p-3 rounded-xl mr-4">
            <DollarSign className="text-pink-800 drop-shadow-lg" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-pink-800 drop-shadow-lg tracking-wide">
            Sistema de Ingresos
          </h1>
        </div>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-2">
          <button
            className={`px-4 py-3 text-xs sm:text-sm rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
              vistaActual === 'dashboard' 
                ? 'bg-pink-600 text-white shadow-lg' 
                : 'bg-pink-300/30 text-pink-800 backdrop-blur-sm hover:bg-pink-400/40 hover:shadow-lg'
            }`}
            onClick={() => setVistaActual('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`px-4 py-3 text-xs sm:text-sm rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
              vistaActual === 'ingresos' 
                ? 'bg-pink-600 text-white shadow-lg' 
                : 'bg-pink-300/30 text-pink-800 backdrop-blur-sm hover:bg-pink-400/40 hover:shadow-lg'
            }`}
            onClick={() => setVistaActual('ingresos')}
          >
            Ver Ingresos
          </button>
          <button
            className={`px-4 py-3 text-xs sm:text-sm rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
              vistaActual === 'formulario' 
                ? 'bg-pink-600 text-white shadow-lg' 
                : 'bg-pink-300/30 text-pink-800 backdrop-blur-sm hover:bg-pink-400/40 hover:shadow-lg'
            }`}
            onClick={() => setVistaActual('formulario')}
          >
            Nuevo Ingreso
          </button>
          <button
            className={`px-4 py-3 text-xs sm:text-sm rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
              vistaActual === 'gastos' 
                ? 'bg-pink-600 text-white shadow-lg' 
                : 'bg-pink-300/30 text-pink-800 backdrop-blur-sm hover:bg-pink-400/40 hover:shadow-lg'
            }`}
            onClick={() => setVistaActual('gastos')}
          >
            Ver Egresos
          </button>
          <button
            className={`px-6 py-3 text-sm sm:text-base rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
              vistaActual === 'nuevo-gasto' 
? 'bg-pink-600 text-white shadow-lg' 
                : 'bg-pink-300/30 text-pink-800 backdrop-blur-sm hover:bg-pink-400/40 hover:shadow-lg'
            }`}
            onClick={() => setVistaActual('nuevo-gasto')}
          >
            Nuevo Egreso
          </button>
          <button
            className={`px-6 py-3 text-sm sm:text-base rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
              vistaActual === 'recordatorios' 
? 'bg-pink-600 text-white shadow-lg' 
                : 'bg-pink-300/30 text-pink-800 backdrop-blur-sm hover:bg-pink-400/40 hover:shadow-lg'
            }`}
            onClick={() => setVistaActual('recordatorios')}
          >
            <Bell className="inline mr-2" size={18} />
            Recordatorios
          </button>
        </div>
      </div>
    </nav>
  );
}