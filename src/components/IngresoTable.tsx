'use client';

import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { AlertCircle, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const CATEGORIA_INICIO_DIA = 'INICIO DEL DIA';
const UMBRAL_ALERTA = 50_000_000;

const CATEGORIAS_INGRESOS = [
  'INICIO DEL DIA', 'CAJA MAYORISTA TM', 'CAJA MAYORISTA TT', 'CAJA MINORISTA TM', 'CAJA MINORISTA TT',
  'CAJA COLON TM', 'CAJA COLON TT', 'CUENTA GALICIA JULITO', 'CUENTA GALICIA ROCIO', 'CUENTA MERCADO PAGO',
  'ANTICIPO DE CAJA MAYORISTA', 'ANTICIPO DE CAJA MINORISTA', 'ANTICIPO DE CAJA COLON', 'COBRANZAS', 'REPARTO',
  'TRANSFERENCIAS FINANCIERAS', 'CHEQUES FINANCIEROS', 'CHEQUES DE LEO FINANCISTA', 'ELI PERSONAL',
  'DEPOSITO EN CUENTA', 'SOBRANTES', 'PRESTAMOS', 'INGRESOS EXTRAS',
];

const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Depósito', 'Tarjeta', 'Cheque', 'eCheq'];

interface Ingreso {
  id: string;
  monto: number;
  metodo_pago: string;
  fecha: string;
  notas: string | null;
  categoria: string | null;
}

interface Props {
  ingresos: Ingreso[];
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

export default function IngresoTable({ ingresos, onRefresh }: Props) {
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [metodoPagoFiltro, setMetodoPagoFiltro] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Ingreso>>({});

  const ingresosFiltrados = ingresos.filter(i => {
    const cat = categoriaFiltro ? i.categoria === categoriaFiltro : true;
    const met = metodoPagoFiltro ? i.metodo_pago === metodoPagoFiltro : true;
    return cat && met;
  });

  const totalBruto = ingresosFiltrados.reduce((s, i) => s + Number(i.monto), 0);
  const totalReal = ingresosFiltrados.filter(i => i.categoria !== CATEGORIA_INICIO_DIA).reduce((s, i) => s + Number(i.monto), 0);
  const totalInicioDia = ingresosFiltrados.filter(i => i.categoria === CATEGORIA_INICIO_DIA).reduce((s, i) => s + Number(i.monto), 0);

  const startEditing = (i: Ingreso) => {
    setEditingId(i.id);
    setFormData({ monto: i.monto, metodo_pago: i.metodo_pago, fecha: i.fecha, notas: i.notas, categoria: i.categoria });
  };
  const cancelEditing = () => { setEditingId(null); setFormData({}); };
  const handleChange = (field: keyof Ingreso, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase.from('ingresos')
      .update({ monto: formData.monto, metodo_pago: formData.metodo_pago, fecha: formData.fecha, notas: formData.notas, categoria: formData.categoria })
      .eq('id', editingId);
    if (!error) { cancelEditing(); onRefresh(); }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este ingreso?')) {
      const { error } = await supabase.from('ingresos').delete().eq('id', id);
      if (!error) onRefresh();
    }
  };

  const inputCls = 'p-1.5 rounded-lg bg-white border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 gap-3 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Listado de Ingresos</h2>
          <p className="text-xs text-gray-400 mt-0.5">{ingresosFiltrados.length} registros</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            className="bg-gray-50 border border-gray-300 text-sm text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={categoriaFiltro}
            onChange={e => setCategoriaFiltro(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {CATEGORIAS_INGRESOS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            className="bg-gray-50 border border-gray-300 text-sm text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={metodoPagoFiltro}
            onChange={e => setMetodoPagoFiltro(e.target.value)}
          >
            <option value="">Todos los métodos</option>
            {METODOS_PAGO.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Totales */}
      <div className="flex flex-wrap gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-sm">
        <span className="text-gray-500">Total bruto: <span className="font-semibold text-gray-900">{fmt(totalBruto)}</span></span>
        {totalInicioDia > 0 && (
          <span className="text-gray-500">Inicio del día: <span className="font-semibold text-yellow-600">{fmt(totalInicioDia)}</span></span>
        )}
        <span className="text-gray-500">Total real: <span className="font-semibold text-emerald-600">{fmt(totalReal)}</span></span>
      </div>

      {ingresosFiltrados.length > 0 ? (
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
              {ingresosFiltrados.map(i => {
                const esInicio = i.categoria === CATEGORIA_INICIO_DIA;
                return (
                  <tr key={i.id} className={`hover:bg-gray-50 transition-colors ${esInicio ? 'opacity-60' : ''}`}>
                    {editingId === i.id ? (
                      <>
                        <td className="px-4 py-2"><input type="date" value={formData.fecha?.substring(0, 10) ?? ''} onChange={e => handleChange('fecha', e.target.value)} className={inputCls} /></td>
                        <td className="px-4 py-2">
                          <select value={formData.categoria ?? ''} onChange={e => handleChange('categoria', e.target.value)} className={inputCls}>
                            {CATEGORIAS_INGRESOS.map(c => <option key={c} value={c}>{c}</option>)}
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
                        <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{format(parseISO(i.fecha), 'dd/MM/yyyy')}</td>
                        <td className="px-4 py-3">
                          {esInicio ? (
                            <span className="inline-flex items-center gap-1.5 text-yellow-600">
                              <span className="text-xs bg-yellow-50 border border-yellow-200 px-1.5 py-0.5 rounded">APERTURA</span>
                            </span>
                          ) : (
                            <span className="text-gray-900">{i.categoria || '—'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">
                          <span className={esInicio ? 'text-yellow-600' : 'text-gray-900'}>{fmt(i.monto)}</span>
                          {i.monto > UMBRAL_ALERTA && <AlertCircle size={12} className="inline text-red-500 ml-1" />}
                        </td>
                        <td className={`px-4 py-3 font-medium ${colorMetodo(i.metodo_pago)}`}>{i.metodo_pago}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{i.notas || <span className="italic">—</span>}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => startEditing(i)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"><Edit size={14} /></button>
                            <button onClick={() => handleDelete(i.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center py-10 text-gray-400">No hay ingresos que coincidan con los filtros</p>
      )}
    </div>
  );
}
