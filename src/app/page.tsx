// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format, subDays } from 'date-fns';
import NavigationBar from '@/components/NavigationBar';
import FiltroFechaExportar from '@/components/FiltroFechaExportar';
import DashboardStats from '@/components/DashboardStats';
import BarChartMensual from '@/components/BarChartMensual';
import LineChartTendencia from '@/components/LineChartTendencia';
import PieChartMetodoPago from '@/components/PieChartMetodoPago';
import ResumenPorCaja from '@/components/ResumenPorCaja';
import IngresoTable from '@/components/IngresoTable';
import IngresoForm from '@/components/IngresoForm';
import GastoTable from '@/components/GastoTable';
import GastoForm from '@/components/GastoForm';
import {
  prepararDatosPorCaja,
  prepararDatosPorMes,
  prepararDatosPorMetodo,
} from '@/components/helpers';

export default function DashboardPage() {
  const [vistaActual, setVistaActual] = useState<'dashboard' | 'ingresos' | 'formulario' | 'gastos' | 'nuevo-gasto'>('dashboard');
  const [desde, setDesde] = useState(() => format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [hasta, setHasta] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [ingresos, setIngresos] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  const [estadisticas, setEstadisticas] = useState({
    totalHoy: 0,
    totalMes: 0,
    totalSemana: 0,
    totalIngresos: 0,
    promedioIngreso: 0,
    totalGastosMes: 0,
  });

  const cargarIngresos = async () => {
    let query = supabase.from('ingresos').select('*');
    if (desde) query = query.gte('fecha', desde);
    if (hasta) query = query.lte('fecha', hasta + 'T23:59:59');
    const { data } = await query.order('fecha', { ascending: false });
    if (data) {
      setIngresos(data);
      calcularEstadisticas(data, gastos);
    }
  };

  const cargarGastos = async () => {
    let query = supabase.from('gastos').select('*');
    if (desde) query = query.gte('fecha', desde);
    if (hasta) query = query.lte('fecha', hasta + 'T23:59:59');
    const { data } = await query.order('fecha', { ascending: false });
    if (data) {
      setGastos(data);
      calcularEstadisticas(ingresos, data);
    }
  };

  const calcularEstadisticas = (ingresosData: any[], gastosData: any[]) => {
    const hoy = format(new Date(), 'yyyy-MM-dd');
    const inicioSemana = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const inicioMes = format(new Date(), 'yyyy-MM-01');

    const totalHoy = ingresosData.filter((ing) => ing.fecha.startsWith(hoy)).reduce((sum, ing) => sum + ing.monto, 0);
    const totalSemana = ingresosData.filter((ing) => ing.fecha >= inicioSemana).reduce((sum, ing) => sum + ing.monto, 0);
    const totalMes = ingresosData.filter((ing) => ing.fecha >= inicioMes).reduce((sum, ing) => sum + ing.monto, 0);
    const totalIngresos = ingresosData.length;
    const promedioIngreso = totalIngresos > 0 ? ingresosData.reduce((sum, ing) => sum + ing.monto, 0) / totalIngresos : 0;

    const totalGastosMes = gastosData.filter((g) => g.fecha >= inicioMes).reduce((sum, g) => sum + g.monto, 0);

    setEstadisticas({ totalHoy, totalMes, totalSemana, totalIngresos, promedioIngreso, totalGastosMes });
  };

  useEffect(() => {
    cargarIngresos();
    cargarGastos();
  }, [desde, hasta]);

  const movimientosConTipo = [
    ...ingresos.map((i) => ({ ...i, tipo: 'ingreso' })),
    ...gastos.map((g) => ({ ...g, tipo: 'gasto' })),
  ];

  const datosPorMes = prepararDatosPorMes(ingresos);
  const datosPorCaja = prepararDatosPorCaja(movimientosConTipo);
  const datosPorMetodo = prepararDatosPorMetodo(ingresos);

  return (
    <main className="bg-gray-900 min-h-screen text-white">
      <NavigationBar vistaActual={vistaActual} setVistaActual={setVistaActual} />
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-8">
        <FiltroFechaExportar
          desde={desde}
          hasta={hasta}
          setDesde={setDesde}
          setHasta={setHasta}
          ingresos={ingresos}
        />

        {vistaActual === 'dashboard' && (
          <>
            <div className="mb-8">
              <DashboardStats estadisticas={estadisticas} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BarChartMensual datos={datosPorMes} />
              <LineChartTendencia datos={datosPorMes} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PieChartMetodoPago datos={datosPorMetodo} />
              <ResumenPorCaja datos={datosPorCaja} />
            </div>
          </>
        )}

        {vistaActual === 'ingresos' && (
          <IngresoTable ingresos={ingresos} />
        )}

        {vistaActual === 'formulario' && (
          <IngresoForm onSuccess={cargarIngresos} />
        )}

        {vistaActual === 'gastos' && (
          <GastoTable gastos={gastos} />
        )}

        {vistaActual === 'nuevo-gasto' && (
          <GastoForm onSuccess={cargarGastos} />
        )}
      </div>
    </main>
  );
}
