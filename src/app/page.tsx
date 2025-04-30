'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format, parseISO, subDays } from 'date-fns';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { AlertCircle, ArrowUpCircle, Download, DollarSign, TrendingUp, Users } from 'lucide-react';

// Constantes
const CAJAS = ['pia', 'claudio', 'flor', 'nacho', 'colon', 'clientes grandes'];
const METODOS_PAGO: Record<string, string[]> = {
  pia: ['contado', 'tarjeta'],
  claudio: ['contado', 'tarjeta'],
  flor: ['contado', 'transferencia', 'tarjeta'],
  nacho: ['contado', 'transferencia'],
  colon: ['contado', 'transferencia', 'tarjeta'],
  'clientes grandes': ['contado', 'transferencia', 'tarjeta'],
};
const UMBRAL_ALERTA = 50000000; // Montos mayores a esto mostrarán una alerta
const COLORES = {
  contado: '#10b981',
  tarjeta: '#3b82f6',
  transferencia: '#f59e0b',
  cajas: ['#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1']
};

// Tipos
type Ingreso = {
  id: string;
  caja: string;
  monto: number;
  metodo_pago: string;
  fecha: string;
  notas?: string;
};

type ResumenCaja = {
  caja: string;
  total: number;
  porcentaje: number;
};

type EstadisticasGenerales = {
  totalHoy: number;
  totalMes: number;
  totalSemana: number;
  totalIngresos: number;
  promedioIngreso: number;
};

export default function Dashboard() {
  // Estados
  const [caja, setCaja] = useState('');
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('');
  const [notas, setNotas] = useState('');
  const [desde, setDesde] = useState(() => {
    const fechaInicio = subDays(new Date(), 30);
    return format(fechaInicio, 'yyyy-MM-dd');
  });
  const [hasta, setHasta] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [montoEsAlto, setMontoEsAlto] = useState(false);
  const [vistaActual, setVistaActual] = useState<'dashboard' | 'ingresos' | 'formulario'>('dashboard');
  const [estadisticas, setEstadisticas] = useState<EstadisticasGenerales>({
    totalHoy: 0,
    totalMes: 0,
    totalSemana: 0,
    totalIngresos: 0,
    promedioIngreso: 0
  });

  // Funciones
  const cargarIngresos = async () => {
    let query = supabase.from('ingresos').select('*');

    if (desde) query = query.gte('fecha', desde);
    if (hasta) query = query.lte('fecha', hasta + 'T23:59:59');

    const { data } = await query.order('fecha', { ascending: false });
    if (data) setIngresos(data);
    calcularEstadisticas(data || []);
  };

  const calcularEstadisticas = (data: Ingreso[]) => {
    const hoy = format(new Date(), 'yyyy-MM-dd');
    const inicioSemana = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const inicioMes = format(new Date(), 'yyyy-MM-01');

    const totalHoy = data
      .filter(ingreso => ingreso.fecha.startsWith(hoy))
      .reduce((sum, ingreso) => sum + ingreso.monto, 0);

    const totalSemana = data
      .filter(ingreso => ingreso.fecha >= inicioSemana)
      .reduce((sum, ingreso) => sum + ingreso.monto, 0);

    const totalMes = data
      .filter(ingreso => ingreso.fecha >= inicioMes)
      .reduce((sum, ingreso) => sum + ingreso.monto, 0);

    const totalIngresos = data.length;
    const promedioIngreso = totalIngresos > 0 
      ? data.reduce((sum, ingreso) => sum + ingreso.monto, 0) / totalIngresos 
      : 0;

    setEstadisticas({
      totalHoy,
      totalMes,
      totalSemana,
      totalIngresos,
      promedioIngreso
    });
  };

  const validarMonto = (valor: string) => {
    setMonto(valor);
    setMontoEsAlto(parseFloat(valor) > UMBRAL_ALERTA);
  };

  const agregarIngreso = async () => {
    // Validaciones
    if (!caja) return alert('Selecciona una caja');
    if (!monto || parseFloat(monto) <= 0) return alert('Ingresa un monto válido');
    if (!metodo) return alert('Selecciona un método de pago');

    // Confirmación para montos altos
    if (montoEsAlto) {
      const confirmar = window.confirm(`El monto $${monto} es muy alto. ¿Está seguro que desea continuar?`);
      if (!confirmar) return;
    }

    const { error } = await supabase.from('ingresos').insert({
      caja,
      monto: parseFloat(monto),
      metodo_pago: metodo,
      notas: notas || null
    });

    if (!error) {
      resetearFormulario();
      cargarIngresos();
      alert('Ingreso guardado correctamente');
      setVistaActual('dashboard');
    } else {
      alert(`Error: ${error.message}`);
    }
  };

  const resetearFormulario = () => {
    setCaja('');
    setMonto('');
    setMetodo('');
    setNotas('');
    setMontoEsAlto(false);
  };

  const exportarExcel = () => {
    if (ingresos.length === 0) {
      return alert('No hay datos para exportar');
    }
    
    // Formato para Excel
    const datosExcel = ingresos.map(ingreso => ({
      Caja: ingreso.caja,
      Monto: ingreso.monto,
      'Método de Pago': ingreso.metodo_pago,
      Fecha: format(parseISO(ingreso.fecha), 'dd/MM/yyyy HH:mm'),
      Notas: ingreso.notas || ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ingresos');
    
    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 15 }, // Caja
      { wch: 12 }, // Monto
      { wch: 15 }, // Método de Pago
      { wch: 20 }, // Fecha
      { wch: 30 }, // Notas
    ];
    ws['!cols'] = colWidths;
    
    const blob = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([blob]), `ingresos_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  // Preparar datos para gráficos
  const prepararDatosPorMes = () => {
    const datosPorMes = ingresos.reduce((acc, ingreso) => {
      const mes = format(parseISO(ingreso.fecha), 'yyyy-MM');
      if (!acc[mes]) acc[mes] = { mes, total: 0, contado: 0, tarjeta: 0, transferencia: 0 };
      acc[mes].total += ingreso.monto;
      acc[mes][ingreso.metodo_pago] += ingreso.monto;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(datosPorMes).sort((a, b) => a.mes.localeCompare(b.mes));
  };

  const prepararDatosPorCaja = (): ResumenCaja[] => {
    const totalesPorCaja = ingresos.reduce((acc, ingreso) => {
      if (!acc[ingreso.caja]) acc[ingreso.caja] = 0;
      acc[ingreso.caja] += ingreso.monto;
      return acc;
    }, {} as Record<string, number>);

    const totalGeneral = Object.values(totalesPorCaja).reduce((sum, valor) => sum + valor, 0);

    return Object.entries(totalesPorCaja).map(([caja, total]) => ({
      caja,
      total,
      porcentaje: totalGeneral > 0 ? (total / totalGeneral) * 100 : 0
    }));
  };

  const prepararDatosPorMetodo = () => {
    const totalesPorMetodo = ingresos.reduce((acc, ingreso) => {
      if (!acc[ingreso.metodo_pago]) acc[ingreso.metodo_pago] = 0;
      acc[ingreso.metodo_pago] += ingreso.monto;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(totalesPorMetodo).map(([metodo, valor]) => ({
      name: metodo,
      value: valor
    }));
  };

  const datosPorMes = prepararDatosPorMes();
  const datosPorCaja = prepararDatosPorCaja();
  const datosPorMetodo = prepararDatosPorMetodo();

  // Efectos
  useEffect(() => {
    cargarIngresos();
  }, [desde, hasta]);

  // Renderizado
  return (
    <main className="bg-gray-900 min-h-screen text-white">
      {/* Barra de navegación */}
      <nav className="bg-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center">
          <DollarSign className="mr-2" size={24} />
          <h1 className="text-xl font-bold">Sistema de Ingresos</h1>
        </div>
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 rounded-lg ${vistaActual === 'dashboard' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            onClick={() => setVistaActual('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${vistaActual === 'ingresos' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            onClick={() => setVistaActual('ingresos')}
          >
            Ver Ingresos
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${vistaActual === 'formulario' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            onClick={() => setVistaActual('formulario')}
          >
            Nuevo Ingreso
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4">
        {/* Filtros de fecha */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex flex-col">
              <label className="text-sm text-gray-400">Desde</label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="bg-gray-700 p-2 rounded border border-gray-600 text-sm"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-400">Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="bg-gray-700 p-2 rounded border border-gray-600 text-sm"
              />
            </div>
          </div>
          <button
            className="bg-green-600 hover:bg-green-700 p-2 rounded flex items-center"
            onClick={exportarExcel}
          >
            <Download size={18} className="mr-2" />
            Exportar a Excel
          </button>
        </div>

        {vistaActual === 'dashboard' && (
          <div className="space-y-6">
            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg flex items-center">
                <div className="rounded-full bg-blue-500 bg-opacity-20 p-3 mr-4">
                  <DollarSign size={24} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Ingresos Hoy</p>
                  <p className="text-2xl font-bold">${estadisticas.totalHoy.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg flex items-center">
                <div className="rounded-full bg-green-500 bg-opacity-20 p-3 mr-4">
                  <TrendingUp size={24} className="text-green-500" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Ingresos Semana</p>
                  <p className="text-2xl font-bold">${estadisticas.totalSemana.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg flex items-center">
                <div className="rounded-full bg-purple-500 bg-opacity-20 p-3 mr-4">
                  <ArrowUpCircle size={24} className="text-purple-500" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Ingresos Mes</p>
                  <p className="text-2xl font-bold">${estadisticas.totalMes.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg flex items-center">
                <div className="rounded-full bg-orange-500 bg-opacity-20 p-3 mr-4">
                  <Users size={24} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Promedio Ingreso</p>
                  <p className="text-2xl font-bold">${estadisticas.promedioIngreso.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de barras mensual */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Ingresos por Mes</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosPorMes}>
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                        labelFormatter={(label) => `Mes: ${label}`}
                      />
                      <Legend />
                      <Bar dataKey="contado" name="Contado" fill={COLORES.contado} />
                      <Bar dataKey="tarjeta" name="Tarjeta" fill={COLORES.tarjeta} />
                      <Bar dataKey="transferencia" name="Transferencia" fill={COLORES.transferencia} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico de líneas tendencia */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Tendencia de Ingresos</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={datosPorMes}>
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                        labelFormatter={(label) => `Mes: ${label}`}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="total" name="Total" stroke="#ffffff" strokeWidth={2} />
                      <Line type="monotone" dataKey="contado" name="Contado" stroke={COLORES.contado} />
                      <Line type="monotone" dataKey="tarjeta" name="Tarjeta" stroke={COLORES.tarjeta} />
                      <Line type="monotone" dataKey="transferencia" name="Transferencia" stroke={COLORES.transferencia} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Gráficos adicionales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de pie por método de pago */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Distribución por Método de Pago</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={datosPorMetodo}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {datosPorMetodo.map((entry, index) => {
                          const color = entry.name === 'contado' 
                            ? COLORES.contado 
                            : entry.name === 'tarjeta' 
                              ? COLORES.tarjeta 
                              : COLORES.transferencia;
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Resumen por caja */}
              <div className="bg-gray-800 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Resumen por Caja</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {datosPorCaja.map((item, index) => (
                    <div key={item.caja} className="bg-gray-700 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">{item.caja}</span>
                        <span className="text-sm bg-gray-600 px-2 py-1 rounded">
                          {item.porcentaje.toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xl mt-2 font-bold">${item.total.toFixed(2)}</p>
                      <div className="mt-2 bg-gray-600 rounded-full h-2">
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            width: `${item.porcentaje}%`, 
                            backgroundColor: COLORES.cajas[index % COLORES.cajas.length] 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {vistaActual === 'ingresos' && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Listado de Ingresos</h2>
            {ingresos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-gray-700">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Caja</th>
                      <th className="px-4 py-3">Monto</th>
                      <th className="px-4 py-3">Método</th>
                      <th className="px-4 py-3">Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingresos.map((ingreso) => (
                      <tr key={ingreso.id} className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="px-4 py-3">{format(parseISO(ingreso.fecha), 'dd/MM/yyyy HH:mm')}</td>
                        <td className="px-4 py-3 capitalize">{ingreso.caja}</td>
                        <td className="px-4 py-3 font-medium">
                          ${ingreso.monto.toFixed(2)}
                          {ingreso.monto > UMBRAL_ALERTA && (
                            <span className="ml-2 text-red-500">
                              <AlertCircle size={16} className="inline" />
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 capitalize">{ingreso.metodo_pago}</td>
                        <td className="px-4 py-3 text-gray-400">{ingreso.notas || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-4 text-gray-400">No hay ingresos en el período seleccionado</p>
            )}
          </div>
        )}

        {vistaActual === 'formulario' && (
          <div className="bg-gray-800 p-6 rounded-lg max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-6">Registrar Nuevo Ingreso</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Caja</label>
                <select
                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50"
                  value={caja}
                  onChange={(e) => {
                    setCaja(e.target.value);
                    setMetodo('');
                  }}
                >
                  <option value="">Selecciona caja</option>
                  {CAJAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Monto</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={monto}
                    onChange={(e) => validarMonto(e.target.value)}
                    className={`w-full p-3 pl-8 bg-gray-700 rounded-lg border ${
                      montoEsAlto ? 'border-red-500' : 'border-gray-600'
                    } focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50`}
                  />
                  {montoEsAlto && (
                    <div className="mt-2 flex items-center text-red-500 text-sm">
                      <AlertCircle size={16} className="mr-1" />
                      Monto inusualmente alto. Por favor verifique antes de guardar.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Método de Pago</label>
                <select
                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50"
                  value={metodo}
                  onChange={(e) => setMetodo(e.target.value)}
                  disabled={!caja}
                >
                  <option value="">Selecciona método</option>
                  {caja &&
                    METODOS_PAGO[caja].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Notas (opcional)</label>
                <textarea
                  placeholder="Ingrese notas adicionales..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50 h-24"
                />
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                  onClick={agregarIngreso}
                >
                  <DollarSign size={18} className="mr-2" />
                  Guardar Ingreso
                </button>
                <button
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  onClick={resetearFormulario}
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}