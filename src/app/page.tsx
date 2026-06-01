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
import NotificacionesRecordatorios from '@/components/NotificacionesRecordatorios';
import ContadorBilletes from '@/components/ContadorBilletes';
import SistemaPagos from '@/components/SistemaPagos';
import {
  prepararDatosPorCaja,
  prepararDatosPorMes,
  prepararDatosPorMetodo,
} from '@/components/helpers';

const CATEGORIA_INICIO_DIA = 'INICIO DEL DIA';

export default function DashboardPage() {
  const [vistaActual, setVistaActual] = useState<'dashboard' | 'contador' | 'ingresos' | 'formulario' | 'gastos' | 'nuevo-gasto' | 'recordatorios' | 'pagos'>('dashboard');
  const [desde, setDesde] = useState(() => format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [hasta, setHasta] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [ingresos, setIngresos] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
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
    inicioDia: 0,
  });

  const calcularEstadisticas = (ingresosData: any[], gastosData: any[], fechaHasta: string) => {
    const hastaDate = parseISO(fechaHasta);
    const hoy = format(hastaDate, 'yyyy-MM-dd');
    const inicioSemana = format(subDays(hastaDate, 6), 'yyyy-MM-dd');
    const inicioMes = format(new Date(hastaDate.getFullYear(), hastaDate.getMonth(), 1), 'yyyy-MM-dd');

    // Separa INICIO DEL DIA del resto de ingresos
    const ingresosReales = ingresosData.filter(ing => ing.categoria !== CATEGORIA_INICIO_DIA);
    const inicioDiaHoy = ingresosData
      .filter(ing => ing.categoria === CATEGORIA_INICIO_DIA && ing.fecha.startsWith(hoy))
      .reduce((sum, ing) => sum + Number(ing.monto), 0);

    // Ingresos efectivo del día (sin INICIO DEL DIA)
    const totalHoy = ingresosReales
      .filter(ing => ing.fecha.startsWith(hoy) && ing.metodo_pago === 'Efectivo')
      .reduce((sum, ing) => sum + Number(ing.monto), 0);

    // Egresos efectivo del día
    const egresosHoy = gastosData
      .filter(g => g.fecha.substring(0, 10) === hoy && g.metodo_pago === 'Efectivo')
      .reduce((sum, g) => sum + Number(g.monto), 0);

    const totalSemana = ingresosReales
      .filter(ing => ing.fecha >= inicioSemana && ing.fecha <= hoy)
      .reduce((sum, ing) => sum + Number(ing.monto), 0);

    const totalMes = ingresosReales
      .filter(ing => ing.fecha >= inicioMes && ing.fecha <= hoy)
      .reduce((sum, ing) => sum + Number(ing.monto), 0);

    const totalIngresos = ingresosReales.length;
    const promedioIngreso = totalIngresos > 0
      ? ingresosReales.reduce((sum, ing) => sum + Number(ing.monto), 0) / totalIngresos
      : 0;

    const totalGastosMes = gastosData
      .filter(g => g.fecha.substring(0, 10) >= inicioMes && g.fecha.substring(0, 10) <= hoy)
      .reduce((sum, g) => sum + Number(g.monto), 0);

    const tarjetaTransferenciaHoy = ingresosReales
      .filter(i => i.fecha.startsWith(hoy) && (i.metodo_pago === 'Tarjeta' || i.metodo_pago === 'Transferencia'))
      .reduce((sum, i) => sum + Number(i.monto), 0);

    const dineroGlobalHoy = ingresosReales
      .filter(i => i.fecha.startsWith(hoy))
      .reduce((sum, i) => sum + Number(i.monto), 0);

    setEstadisticas({
      totalHoy,
      egresosHoy,
      // Neto en caja = apertura del día + ingresos efectivo - egresos efectivo
      dineroHoy: inicioDiaHoy + totalHoy - egresosHoy,
      totalSemana,
      totalMes,
      promedioIngreso,
      totalGastosMes,
      totalTarjetaTransferencia: tarjetaTransferenciaHoy,
      dineroGlobalHoy,
      totalIngresos,
      inicioDia: inicioDiaHoy,
    });
  };

  const cargarDatos = async (fechaDesde: string, fechaHasta: string) => {
    setCargando(true);
    const [resI, resG] = await Promise.all([
      // ingresos.fecha es tipo DATE → sin sufijo de hora
      supabase.from('ingresos').select('*')
        .gte('fecha', fechaDesde)
        .lte('fecha', fechaHasta)
        .order('fecha', { ascending: false }),
      // gastos.fecha es tipo TIMESTAMPTZ → con rango horario completo
      supabase.from('gastos').select('*')
        .gte('fecha', fechaDesde + 'T00:00:00')
        .lte('fecha', fechaHasta + 'T23:59:59')
        .order('fecha', { ascending: false }),
    ]);
    const ingData = resI.data ?? [];
    const gasData = resG.data ?? [];
    setIngresos(ingData);
    setGastos(gasData);
    calcularEstadisticas(ingData, gasData, fechaHasta);
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos(desde, hasta);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desde, hasta]);

  const refresh = () => cargarDatos(desde, hasta);

  // Excluye INICIO DEL DIA de gráficos y resumen por categoría
  const ingresosRealesParaGraficos = ingresos.filter(i => i.categoria !== CATEGORIA_INICIO_DIA);

  const movimientosConTipo = [
    ...ingresosRealesParaGraficos.map(i => ({ ...i, tipo: 'ingreso' as const })),
    ...gastos.map(g => ({ ...g, tipo: 'gasto' as const })),
  ];

  const datosPorMes = prepararDatosPorMes(ingresosRealesParaGraficos);
  const datosPorCaja = prepararDatosPorCaja(movimientosConTipo);
  const datosPorMetodo = prepararDatosPorMetodo(ingresosRealesParaGraficos);

  return (
    <main className="bg-gray-50 min-h-screen text-gray-900">
      <NavigationBar vistaActual={vistaActual} setVistaActual={setVistaActual} />

      {cargando && (
        <div className="fixed top-16 left-0 right-0 z-50">
          <div className="h-1 bg-emerald-500 animate-pulse" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {(vistaActual === 'dashboard' || vistaActual === 'ingresos' || vistaActual === 'gastos') && (
          <FiltroFechaExportar
            desde={desde}
            hasta={hasta}
            setDesde={setDesde}
            setHasta={setHasta}
            ingresos={ingresos}
            gastos={gastos}
            vistaActual={vistaActual}
          />
        )}

        {vistaActual === 'dashboard' && (
          <>
<NotificacionesRecordatorios />
            <DashboardStats estadisticas={estadisticas} desde={desde} hasta={hasta} />

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

        {vistaActual === 'ingresos' && <IngresoTable ingresos={ingresos} onRefresh={refresh} />}
        {vistaActual === 'formulario' && <IngresoForm onSuccess={refresh} />}
        {vistaActual === 'gastos' && <GastoTable gastos={gastos} onRefresh={refresh} />}
        {vistaActual === 'nuevo-gasto' && <GastoForm onSuccess={refresh} />}
        {vistaActual === 'contador' && <ContadorBilletes netoEfectivo={estadisticas.dineroHoy} />}
        {vistaActual === 'recordatorios' && <RecordatoriosPage />}
        {vistaActual === 'pagos' && <SistemaPagos onRefresh={refresh} />}
      </div>
    </main>
  );
}
