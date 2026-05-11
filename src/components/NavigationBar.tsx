'use client';
import {
  LayoutDashboard, TrendingUp, TrendingDown,
  PlusCircle, MinusCircle, Bell, DollarSign, Banknote,
} from 'lucide-react';

type Vista = 'dashboard' | 'contador' | 'ingresos' | 'formulario' | 'gastos' | 'nuevo-gasto' | 'recordatorios';

interface NavItem {
  vista: Vista;
  label: string;
  labelShort: string;
  icon: React.ElementType;
  color: string;
  activeClass: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    vista: 'dashboard',
    label: 'Dashboard',
    labelShort: 'Inicio',
    icon: LayoutDashboard,
    color: 'text-blue-400',
    activeClass: 'bg-blue-600 text-white border-blue-500',
  },
  {
    vista: 'contador',
    label: 'Contar Caja',
    labelShort: 'Caja',
    icon: Banknote,
    color: 'text-emerald-400',
    activeClass: 'bg-emerald-800 text-white border-emerald-600',
  },
  {
    vista: 'ingresos',
    label: 'Ver Ingresos',
    labelShort: 'Ingresos',
    icon: TrendingUp,
    color: 'text-emerald-400',
    activeClass: 'bg-emerald-600 text-white border-emerald-500',
  },
  {
    vista: 'formulario',
    label: 'Nuevo Ingreso',
    labelShort: '+ Ingreso',
    icon: PlusCircle,
    color: 'text-emerald-400',
    activeClass: 'bg-emerald-700 text-white border-emerald-600',
  },
  {
    vista: 'gastos',
    label: 'Ver Egresos',
    labelShort: 'Egresos',
    icon: TrendingDown,
    color: 'text-red-400',
    activeClass: 'bg-red-600 text-white border-red-500',
  },
  {
    vista: 'nuevo-gasto',
    label: 'Nuevo Egreso',
    labelShort: '+ Egreso',
    icon: MinusCircle,
    color: 'text-red-400',
    activeClass: 'bg-red-700 text-white border-red-600',
  },
  {
    vista: 'recordatorios',
    label: 'Recordatorios',
    labelShort: 'Notas',
    icon: Bell,
    color: 'text-amber-400',
    activeClass: 'bg-amber-600 text-white border-amber-500',
  },
];

export default function NavigationBar({
  vistaActual,
  setVistaActual,
}: {
  vistaActual: string;
  setVistaActual: (vista: Vista) => void;
}) {
  return (
    <nav className="bg-gray-900 border-b border-gray-700/80 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="bg-emerald-500/15 p-1.5 rounded-lg">
              <DollarSign size={18} className="text-emerald-400" />
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-bold text-white tracking-tight">Recaudación</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Sistema de caja</p>
            </div>
          </div>

          {/* Nav items – scroll horizontal en mobile */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1 justify-end">
            {NAV_ITEMS.map(({ vista, label, labelShort, icon: Icon, color, activeClass }) => {
              const isActive = vistaActual === vista;
              return (
                <button
                  key={vista}
                  onClick={() => setVistaActual(vista)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
                    border transition-all duration-150 whitespace-nowrap flex-shrink-0
                    ${isActive
                      ? activeClass
                      : `bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-gray-800`
                    }
                  `}
                >
                  <Icon size={14} className={isActive ? 'text-white' : color} />
                  <span className="hidden md:inline">{label}</span>
                  <span className="md:hidden">{labelShort}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
