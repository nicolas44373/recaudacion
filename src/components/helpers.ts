import { format, parseISO } from 'date-fns';

interface Ingreso {
  categoria: string;
  monto: number;
  metodo_pago: string;
  fecha: string;
}

export function prepararDatosPorMes(ingresos: Ingreso[]) {
  const datosPorMes: Record<string, any> = ingresos.reduce((acc, ingreso) => {
    const mes = format(parseISO(ingreso.fecha), 'yyyy-MM');
    if (!acc[mes]) {
      acc[mes] = {
        mes,
        total: 0,
        Efectivo: 0,
        Tarjeta: 0,
        Transferencia: 0,
        'Depósito': 0,
        Cheque: 0,
        eCheq: 0,
      };
    }
    acc[mes].total += Number(ingreso.monto);
    const metodo = ingreso.metodo_pago;
    if (acc[mes][metodo] !== undefined) {
      acc[mes][metodo] += Number(ingreso.monto);
    } else {
      acc[mes][metodo] = Number(ingreso.monto);
    }
    return acc;
  }, {} as Record<string, any>);

  return Object.values(datosPorMes).sort((a, b) => a.mes.localeCompare(b.mes));
}

export function prepararDatosPorCaja(
  movimientos: { categoria: string; monto: number; tipo: 'ingreso' | 'gasto' }[]
) {
  const agrupado: Record<string, { tipo: string; categoria: string; total: number }> = {};

  for (const mov of movimientos) {
    const key = `${mov.tipo}-${mov.categoria}`;
    if (!agrupado[key]) {
      agrupado[key] = { tipo: mov.tipo, categoria: mov.categoria, total: 0 };
    }
    agrupado[key].total += Number(mov.monto);
  }

  const datos = Object.values(agrupado);
  const totalIngresos = datos.filter(d => d.tipo === 'ingreso').reduce((s, d) => s + d.total, 0);
  const totalGastos = datos.filter(d => d.tipo === 'gasto').reduce((s, d) => s + d.total, 0);

  return datos
    .map(d => ({
      ...d,
      porcentaje: d.tipo === 'ingreso'
        ? (d.total / totalIngresos) * 100 || 0
        : (d.total / totalGastos) * 100 || 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function prepararDatosPorMetodo(ingresos: Ingreso[]) {
  const totales: Record<string, number> = ingresos.reduce((acc, ingreso) => {
    acc[ingreso.metodo_pago] = (acc[ingreso.metodo_pago] || 0) + Number(ingreso.monto);
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(totales)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}
