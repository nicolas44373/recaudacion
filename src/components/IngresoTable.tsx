// src/components/IngresoTable.tsx
'use client';

import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { AlertCircle, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const UMBRAL_ALERTA = 50000000;
// Categorías de ejemplo; ajústalas según tu tabla
const CATEGORIAS_INGRESOS = [
  "INICIO DEL DIA", "CAJA MAYORISTA TM", "CAJA MAYORISTA TT", "CAJA MINORISTA TM", "CAJA MINORISTA TT",
  "CAJA COLON TM", "CAJA COLON TT", "CUENTA GALICIA JULITO", "CUENTA GALICIA ROCIO", "CUENTA MERCADO PAGO",
  "ANTICIPO DE CAJA MAYORISTA", "ANTICIPO DE CAJA MINORISTA", "ANTICIPO DE CAJA COLON", "COBRANZAS", "REPARTO",
  "TRANSFERENCIAS FINANCIERAS", "CHEQUES FINANCIEROS", "CHEQUES DE LEO FINANCISTA", "EPI PERSONAL","DEPOSITO EN CUENTA","SOBRANTES", "PRESTAMOS","INGRESOS EXTRAS"
];

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

export default function IngresoTable({ ingresos, onRefresh }: Props) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Ingreso>>({});

  const formatMonto = (m: number) =>
    m.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  const colorMetodo = (metodo: string) => {
    switch (metodo.toLowerCase()) {
      case 'contado': return 'text-green-400';
      case 'tarjeta': return 'text-blue-400';
      case 'transferencia': return 'text-yellow-400';
      default: return 'text-white';
    }
  };

  // Filtrado por categoría
  const ingresosFiltrados = categoriaSeleccionada
    ? ingresos.filter(i => i.categoria === categoriaSeleccionada)
    : ingresos;

  // Inicia edición inline
  const startEditing = (i: Ingreso) => {
    setEditingId(i.id);
    setFormData({
      monto: i.monto,
      metodo_pago: i.metodo_pago,
      fecha: i.fecha,
      notas: i.notas,
      categoria: i.categoria
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleChange = (field: keyof Ingreso, value: any) => {
    setFormData((prev: Partial<Ingreso>) => ({ ...prev, [field]: value }));
  };

  // Guarda cambios en Supabase
  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase
      .from('ingresos')
      .update({
        monto: formData.monto,
        metodo_pago: formData.metodo_pago,
        fecha: formData.fecha,
        notas: formData.notas,
        categoria: formData.categoria
      })
      .eq('id', editingId);
    if (!error) {
      cancelEditing();
      onRefresh();
    }
  };

  // Elimina registro
  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este ingreso?')) {
      const { error } = await supabase
        .from('ingresos')
        .delete()
        .eq('id', id);
      if (!error) onRefresh();
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg mb-8 shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <h2 className="text-xl font-semibold">Listado de Ingresos</h2>
        <select
          className="bg-gray-700 border border-gray-600 text-sm rounded-lg px-3 py-2"
          value={categoriaSeleccionada}
          onChange={e => setCategoriaSeleccionada(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS_INGRESOS.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      {ingresosFiltrados.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border-separate border-spacing-y-2">
            <thead className="text-xs uppercase bg-gray-700 text-gray-300">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3">Notas</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ingresosFiltrados.map(i => (
                <tr key={i.id} className="bg-gray-700 hover:bg-gray-600 rounded-lg transition">
                  {editingId === i.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          type="date"
                          value={formData.fecha?.substring(0,10) ?? ''}
                          onChange={e => handleChange('fecha', e.target.value)}
                          className="p-1 rounded text-black"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={formData.categoria ?? ''}
                          onChange={e => handleChange('categoria', e.target.value)}
                          className="p-1 rounded text-black"
                        >
                          <option value="">--</option>
                          {CATEGORIAS_INGRESOS.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*([\\.,][0-9]+)?"
                          value={formData.monto ?? ''}
                          onChange={e => handleChange('monto', parseFloat(e.target.value))}
                          className="p-1 rounded text-black w-full text-right appearance-none"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={formData.metodo_pago ?? ''}
                          onChange={e => handleChange('metodo_pago', e.target.value)}
                          className="p-1 rounded text-black"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={formData.notas ?? ''}
                          onChange={e => handleChange('notas', e.target.value)}
                          className="p-1 rounded text-black w-full"
                        />
                      </td>
                      <td className="px-4 py-2 flex gap-2">
                        <button onClick={saveEdit} className="p-1 rounded hover:bg-green-600">
                          <Save size={16} />
                        </button>
                        <button onClick={cancelEditing} className="p-1 rounded hover:bg-gray-600">
                          <X size={16} />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-xs text-gray-300">{format(parseISO(i.fecha), 'dd/MM/yyyy')}</td>
                      <td className="px-4 py-3 capitalize">{i.categoria || '-'}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatMonto(i.monto)}
                        {i.monto > UMBRAL_ALERTA && (
                          <AlertCircle size={14} className="inline text-red-500 ml-1" />
                        )}
                      </td>
                      <td className={`px-4 py-3 capitalize font-medium ${colorMetodo(i.metodo_pago)}`}>{i.metodo_pago}</td>
                      <td className="px-4 py-3 text-gray-400">{i.notas || <span className="italic text-gray-500">-</span>}</td>
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => startEditing(i)} className="p-1 rounded hover:bg-gray-600">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(i.id)} className="p-1 rounded hover:bg-red-600">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center py-4 text-gray-400">No hay ingresos para mostrar</p>
      )}
    </div>
  );
}
