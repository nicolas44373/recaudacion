// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format, subDays, parseISO } from 'date-fns';
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
import RecordatoriosPage from '@/components/recordatorio';
import {
  prepararDatosPorCaja,
  prepararDatosPorMes,
  prepararDatosPorMetodo,
} from '@/components/helpers';

export default function DashboardPage() {
  const [vistaActual, setVistaActual] = useState<'dashboard' | 'ingresos' | 'formulario' | 'gastos' | 'nuevo-gasto' | 'recordatorios'>('dashboard');
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
    egresosHoy: 0,
    dineroHoy: 0,
    totalTarjetaTransferencia: 0,
    dineroGlobalHoy: 0,
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
    const hastaDate = parseISO(hasta);
    const hoy = format(hastaDate, 'yyyy-MM-dd');
    const inicioSemana = format(subDays(hastaDate, 6), 'yyyy-MM-dd');
    const inicioMes = format(new Date(hastaDate.getFullYear(), hastaDate.getMonth(), 1), 'yyyy-MM-dd');

    const ingresosHoyEfectivo = ingresosData.filter(
      (ing) => ing.fecha.startsWith(hoy) && ing.metodo_pago === 'Efectivo'
    );

    const egresosHoyEfectivo = gastosData.filter(
      (g) => g.fecha.startsWith(hoy) && g.metodo_pago === 'Efectivo'
    );

    const totalHoy = ingresosHoyEfectivo.reduce((sum, ing) => sum + Number(ing.monto), 0);
    const egresosHoy = egresosHoyEfectivo.reduce((sum, g) => sum + Number(g.monto), 0);

    const totalSemana = ingresosData
      .filter((ing) => ing.fecha >= inicioSemana && ing.fecha <= hoy)
      .reduce((sum, ing) => sum + Number(ing.monto), 0);

    const totalMes = ingresosData
      .filter((ing) => ing.fecha >= inicioMes && ing.fecha <= hoy)
      .reduce((sum, ing) => sum + Number(ing.monto), 0);

    const totalIngresos = ingresosData.length;

    const promedioIngreso = totalIngresos > 0
      ? ingresosData.reduce((sum, ing) => sum + Number(ing.monto), 0) / totalIngresos
      : 0;

    const totalGastosMes = gastosData
      .filter((g) => g.fecha >= inicioMes && g.fecha <= hoy)
      .reduce((sum, g) => sum + Number(g.monto), 0);

    const tarjetaTransferenciaHoy = ingresosData
      .filter(
        (i) =>
          i.fecha.startsWith(hoy) &&
          (i.metodo_pago === 'Tarjeta' || i.metodo_pago === 'Transferencia')
      )
      .reduce((sum, i) => sum + Number(i.monto), 0);

    const dineroGlobalHoy = ingresosData
      .filter((i) => i.fecha.startsWith(hoy))
      .reduce((sum, i) => sum + Number(i.monto), 0);

    setEstadisticas({
      totalHoy,
      egresosHoy,
      dineroHoy: totalHoy - egresosHoy,
      totalSemana,
      totalMes,
      promedioIngreso,
      totalGastosMes,
      totalTarjetaTransferencia: tarjetaTransferenciaHoy,
      dineroGlobalHoy,
      totalIngresos,
    });
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
              <DashboardStats estadisticas={estadisticas} desde={desde} hasta={hasta} />
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

        {vistaActual === 'ingresos' && <IngresoTable ingresos={ingresos} />}

        {vistaActual === 'formulario' && <IngresoForm onSuccess={cargarIngresos} />}

        {vistaActual === 'gastos' && <GastoTable gastos={gastos} />}

        {vistaActual === 'nuevo-gasto' && <GastoForm onSuccess={cargarGastos} />}

        {vistaActual === 'recordatorios' && <RecordatoriosPage />}
      </div>
    </main>
  );
}
