'use client';

import { useState } from 'react';
import { AlertCircle, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';

const UMBRAL_ALERTA = 5_000_000;

const CATEGORIAS_GASTOS = [
  'CUENTA GALICIA JULITO', 'CUENTA GALICIA ROCIO', 'CUENTA MERCADO PAGO', 'TRANSFERENCIAS FINANCIERAS',
  'CHEQUES FINANCIEROS', 'CHEQUES DE LEO FINANCISTA', 'SUELDOS FIJOS', 'SUELDOS TEMPORALES',
  'LIMPIEZA', 'BOLSAS', 'DESAYUNO', 'COMBUSTIBLE', 'ROCIO PERSONAL', 'JULITO PERSONAL', 'JULIO PERSONAL',
  'ELI PERSONAL', 'CASA', 'MARKETING', 'SEGURIDAD', 'ALMUERZO', 'LIBRERIA', 'HORAS EXTRA', 'GASTOS EXTRA',
  'TAXI/UBER', 'SUPER', 'SERVICIOS', 'PAGO TARJETA', 'PAGO PROVEEDORES', 'MUNICIPALES',
  'MANTENIMIENTO JURAMENTO', 'MANTENIMIENTO COLON', 'MANTENIMIENTO JUAN B JUSTO', 'MANTENIMIENTO DE VEHICULOS',
  'ALQUILER', 'IMPUESTOS', 'COSTOS FINANCIEROS', 'TARJETA', 'PUERTOS DE FRIO', 'LEO', 'FINANCIERA',
  'DEPOSITO EN CUENTA', 'HONORARIOS', 'GASTOS EMPLEADOS', 'PRODUCCION', 'FALTANTES', 'COMISIONES DE VENTA',
];

const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Depósito', 'Tarjeta', 'Cheque', 'eCheq'];

interface Gasto {
  id: string;
  fecha: string;
  categoria: string;
  monto: number;
  metodo_pago: string;
  notas: string | null;
}

interface Props {
  gastos: Gasto[];
  onRefresh: () => void;
}

const fmt = (m: number) =>
  m.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 });

const colorMetodo = (metodo: string) => {
  const m = metodo?.toLowerCase() ?? '';
  if (m === 'efectivo') return 'text-emerald-600';
  if (m === 'tarjeta') return 'text-blue-600';
  if (m === 'transferencia') return 'text-amber-600';
  if (m === 'cheque' || m === 'echeq') return 'text-purple-600';
  if (m === 'depósito') return 'text-cyan-600';
  return 'text-gray-600';
};

export default function GastoTable({ gastos, onRefresh }: Props) {
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [metodoPagoFiltro, setMetodoPagoFiltro] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Gasto>>({});

  const gastosFiltrados = gastos.filter(g => {
    const cat = categoriaFiltro ? g.categoria === categoriaFiltro : true;
    const met = metodoPagoFiltro ? g.metodo_pago === metodoPagoFiltro : true;
    return cat && met;
  });

  const totalGastos = gastosFiltrados.reduce((s, g) => s + Number(g.monto), 0);

  const startEditing = (g: Gasto) => {
    setEditingId(g.id);
    setFormData({ fecha: g.fecha, categoria: g.categoria, monto: g.monto, metodo_pago: g.metodo_pago, notas: g.notas || '' });
  };
  const cancelEditing = () => { setEditingId(null); setFormData({}); };
  const handleChange = (field: keyof Gasto, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase.from('gastos')
      .update({ fecha: formData.fecha, categoria: formData.categoria, monto: formData.monto, metodo_pago: formData.metodo_pago, notas: formData.notas })
      .eq('id', editingId);
    if (!error) { cancelEditing(); onRefresh(); }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este gasto?')) {
      const { error } = await supabase.from('gastos').delete().eq('id', id);
      if (!error) onRefresh();
    }
  };

  const inputCls = 'p-1.5 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 gap-3 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Listado de Egresos</h2>
          <p className="text-xs text-gray-400 mt-0.5">{gastosFiltrados.length} registros</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            className="bg-gray-50 border border-gray-300 text-sm text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            value={categoriaFiltro}
            onChange={e => setCategoriaFiltro(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {CATEGORIAS_GASTOS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className="bg-gray-50 border border-gray-300 text-sm text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            value={metodoPagoFiltro}
            onChange={e => setMetodoPagoFiltro(e.target.value)}
          >
            <option value="">Todos los métodos</option>
            {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Total */}
      <div className="flex gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-sm">
        <span className="text-gray-500">Total: <span className="font-semibold text-red-600">{fmt(totalGastos)}</span></span>
      </div>

      {gastosFiltrados.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-gray-400 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold">Categoría</th>
                <th className="px-4 py-3 text-right font-semibold">Monto</th>
                <th className="px-4 py-3 text-left font-semibold">Método</th>
                <th className="px-4 py-3 text-left font-semibold">Notas</th>
                <th className="px-4 py-3 text-left font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {gastosFiltrados.map(gasto => (
                <tr key={gasto.id} className="hover:bg-gray-50 transition-colors">
                  {editingId === gasto.id ? (
                    <>
                      <td className="px-4 py-2"><input type="datetime-local" value={formData.fecha?.substring(0, 16) ?? ''} onChange={e => handleChange('fecha', new Date(e.target.value).toISOString())} className={inputCls} /></td>
                      <td className="px-4 py-2">
                        <select value={formData.categoria ?? ''} onChange={e => handleChange('categoria', e.target.value)} className={inputCls}>
                          {CATEGORIAS_GASTOS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-right"><input type="number" value={formData.monto ?? ''} onChange={e => handleChange('monto', parseFloat(e.target.value))} className={`${inputCls} w-28 text-right`} /></td>
                      <td className="px-4 py-2">
                        <select value={formData.metodo_pago ?? ''} onChange={e => handleChange('metodo_pago', e.target.value)} className={inputCls}>
                          {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2"><input type="text" value={formData.notas ?? ''} onChange={e => handleChange('notas', e.target.value)} className={`${inputCls} w-full`} /></td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"><Save size={14} /></button>
                          <button onClick={cancelEditing} className="p-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"><X size={14} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{format(parseISO(gasto.fecha), 'dd/MM/yyyy HH:mm')}</td>
                      <td className="px-4 py-3 text-gray-900">{gasto.categoria}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-900">
                        {fmt(gasto.monto)}
                        {gasto.monto > UMBRAL_ALERTA && <AlertCircle size={12} className="inline text-red-500 ml-1" />}
                      </td>
                      <td className={`px-4 py-3 font-medium ${colorMetodo(gasto.metodo_pago)}`}>{gasto.metodo_pago}</td>
                      <td className="px-4 py-3 text-gray-700 text-xs font-bold max-w-xs truncate">{gasto.notas || <span className="italic font-normal text-gray-400">—</span>}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => startEditing(gasto)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"><Edit size={14} /></button>
                          <button onClick={() => handleDelete(gasto.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center py-10 text-gray-400">No hay egresos que coincidan con los filtros</p>
      )}
    </div>
  );
}
