// src/components/GastoTable.tsx
'use client';

import { useState } from 'react';
import { AlertCircle, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';

const UMBRAL_ALERTA = 5000000;

const CATEGORIAS_GASTOS = [
  "CUENTA GALICIA JULITO",
  "CUENTA GALICIA ROCIO",
  "CUENTA MERCADO PAGO",
  "TRANSFERENCIAS FINANCIERAS",
  "CHEQUES FINANCIEROS",
  "CHEQUES DE LEO FINANCISTA",
  "SUELDOS FIJOS",
  "SUELDOS TEMPORALES",
  "LIMPIEZA",
  "BOLSAS",
  "DESAYUNO",
  "COMBUSTIBLE",
  "ROCIO PERSONAL",
  "JULITO PERSONAL",
  "LEO PERSONAL",
  "EPI PERSONAL",
  "CASA",
  "MARKETING",
  "SEGURIDAD",
  "ALMUERZO",
  "LIBRERIA",
  "HORAS EXTRA",
  "GASTOS EXTRA",
  "TAXI/UBER",
  "SUPER",
  "SERVICIOS",
  "PAGO TARJETA",
  "PAGO PROVEEDORES",
  "MUNICIPALES",
  "MANTENIMIENTO JURAMENTO",
  "MANTENIMIENTO COLON",
  "MANTENIMIENTO JUAN B JUSTO",
  "MANTENIMIENTO DE VEHICULOS",
  "ALQUILER",
  "IMPUESTOS",
  "COSTOS FINANCIEROS",
  "TARJETA",
  "PUERTOS DE FRIO",
  "LEO",
  "FINANCIERA",
  "DEPOSITO EN CUENTA"
];

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

export default function GastoTable({ gastos, onRefresh }: Props) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Gasto>>({});

  const startEditing = (g: Gasto) => {
    setEditingId(g.id);
    setFormData({
      fecha: g.fecha,
      categoria: g.categoria,
      monto: g.monto,
      metodo_pago: g.metodo_pago,
      notas: g.notas || ''
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleChange = (field: keyof Gasto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase
      .from('gastos')
      .update({
        fecha: formData.fecha,
        categoria: formData.categoria,
        monto: formData.monto,
        metodo_pago: formData.metodo_pago,
        notas: formData.notas
      })
      .eq('id', editingId);

    if (!error) {
      cancelEditing();
      onRefresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este gasto?')) {
      const { error } = await supabase
        .from('gastos')
        .delete()
        .eq('id', id);
      if (!error) onRefresh();
    }
  };

  const formatMonto = (m: number) =>
    m.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 });

  const gastosFiltrados = categoriaSeleccionada
    ? gastos.filter(g => g.categoria === categoriaSeleccionada)
    : gastos;

  return (
    <div className="bg-gray-800 p-6 rounded-lg mb-8 shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h2 className="text-xl font-semibold">Listado de Gastos</h2>
        <select
          className="bg-gray-700 border border-gray-600 text-sm rounded-lg px-3 py-2"
          value={categoriaSeleccionada}
          onChange={e => setCategoriaSeleccionada(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS_GASTOS.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {gastosFiltrados.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left border-separate border-spacing-y-2">
            <thead className="text-xs uppercase bg-gray-700 text-gray-300">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Fecha</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3">Notas</th>
                <th className="px-4 py-3 rounded-r-lg">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gastosFiltrados.map(gasto => (
                <tr key={gasto.id} className="bg-gray-700 hover:bg-gray-600 transition rounded-lg">
                  {editingId === gasto.id ? (
                    <>
                      <td className="px-4 py-3">
                        <input
                          type="datetime-local"
                          value={formData.fecha?.substring(0,16) ?? ''}
                          onChange={e => handleChange('fecha', new Date(e.target.value).toISOString())}
                          className="p-1 rounded text-black"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={formData.categoria}
                          onChange={e => handleChange('categoria', e.target.value)}
                          className="p-1 rounded text-black"
                        >
                          {CATEGORIAS_GASTOS.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
  type="text"
  inputMode="decimal"
  pattern="[0-9]*([\.,][0-9]+)?"
  value={formData.monto ?? ''}
  onChange={e => handleChange('monto', parseFloat(e.target.value))}
  className="p-1 rounded text-black w-full text-right appearance-none"
/>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={formData.metodo_pago ?? ''}
                          onChange={e => handleChange('metodo_pago', e.target.value)}
                          className="p-1 rounded text-black"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={formData.notas ?? ''}
                          onChange={e => handleChange('notas', e.target.value)}
                          className="p-1 rounded text-black w-full"
                        />
                      </td>
                      <td className="px-4 py-3 flex gap-2">
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
                      <td className="px-4 py-3 text-xs text-gray-300">
                        {format(parseISO(gasto.fecha), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="px-4 py-3 capitalize">{gasto.categoria}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatMonto(gasto.monto)}
                        {gasto.monto > UMBRAL_ALERTA && (
                          <AlertCircle size={14} className="inline text-red-500 ml-1" />
                        )}
                      </td>
                      <td className="px-4 py-3 capitalize text-blue-400 font-medium">{gasto.metodo_pago}</td>
                      <td className="px-4 py-3 text-gray-400">
                        {gasto.notas || <span className="italic text-gray-500">-</span>}
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button onClick={() => startEditing(gasto)} className="p-1 rounded hover:bg-gray-600">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(gasto.id)} className="p-1 rounded hover:bg-red-600">
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
        <p className="text-center py-4 text-gray-400">No hay gastos en esta categoría</p>
      )}
    </div>
  );
}
