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

export function prepararDatosPorCaja(ingresos: Ingreso[]) {
  const totales: Record<string, number> = ingresos.reduce((acc, ingreso) => {
    acc[ingreso.caja] = (acc[ingreso.caja] || 0) + ingreso.monto;
    return acc;
  }, {} as Record<string, number>);

  const totalGeneral = Object.values(totales).reduce((sum: number, v: number) => sum + v, 0);

  return Object.entries(totales).map(([caja, total]) => ({
    caja,
    total,
    porcentaje: totalGeneral ? (total / totalGeneral) * 100 : 0,
  }));
}

export function prepararDatosPorMetodo(ingresos: Ingreso[]) {
  const totales: Record<string, number> = ingresos.reduce((acc, ingreso) => {
    acc[ingreso.metodo_pago] = (acc[ingreso.metodo_pago] || 0) + ingreso.monto;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(totales).map(([name, value]) => ({ name, value }));
}
