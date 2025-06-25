import { format, parseISO } from 'date-fns';

interface Ingreso {
  caja: string;
  monto: number;
  metodo_pago: string;
  fecha: string;
}

export function prepararDatosPorMes(ingresos: Ingreso[]) {
  const datosPorMes: Record<string, any> = ingresos.reduce((acc, ingreso) => {
    const mes = format(parseISO(ingreso.fecha), 'yyyy-MM');
    if (!acc[mes]) acc[mes] = { mes, total: 0, contado: 0, tarjeta: 0, transferencia: 0 };
    acc[mes].total += ingreso.monto;

    const metodo = ingreso.metodo_pago;
    if (typeof acc[mes][metodo] !== 'number') acc[mes][metodo] = 0;
    acc[mes][metodo] += ingreso.monto;

    return acc;
  }, {} as Record<string, any>);

  return Object.values(datosPorMes);
}

export function prepararDatosPorCaja(movimientos: { caja: string; monto: number; tipo: 'ingreso' | 'gasto' }[]) {
  const agrupado: { [key: string]: { tipo: string; caja: string; total: number } } = {};

  for (const mov of movimientos) {
    const key = `${mov.tipo}-${mov.caja}`;
    if (!agrupado[key]) {
      agrupado[key] = {
        tipo: mov.tipo,
        caja: mov.caja,
        total: 0,
      };
    }
    agrupado[key].total += mov.monto;
  }

  const datos = Object.values(agrupado);

  const totalIngresos = datos.filter(d => d.tipo === 'ingreso').reduce((sum, d) => sum + d.total, 0);
  const totalGastos = datos.filter(d => d.tipo === 'gasto').reduce((sum, d) => sum + d.total, 0);

  return datos.map(d => ({
    ...d,
    porcentaje: d.tipo === 'ingreso'
      ? (d.total / totalIngresos) * 100 || 0
      : (d.total / totalGastos) * 100 || 0,
  }));
}

export function prepararDatosPorMetodo(ingresos: Ingreso[]) {
  const totales: Record<string, number> = ingresos.reduce((acc, ingreso) => {
    acc[ingreso.metodo_pago] = (acc[ingreso.metodo_pago] || 0) + ingreso.monto;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(totales).map(([name, value]) => ({ name, value }));
}
