'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, MinusCircle } from 'lucide-react';

const METODOS_PAGO = ["Efectivo", "Transferencia", "Depósito", "Cheque", "eCheq"];
const CATEGORIAS = [
  "CUENTA GALICIA JULITO", "CUENTA GALICIA ROCIO", "CUENTA MERCADO PAGO", "TRANSFERENCIAS FINANCIERAS",
  "CHEQUES FINANCIEROS", "CHEQUES DE LEO FINANCISTA", "SUELDOS FIJOS", "SUELDOS TEMPORALES",
  "LIMPIEZA", "BOLSAS", "DESAYUNO", "COMBUSTIBLE", "ROCIO PERSONAL", "JULITO PERSONAL", "LEO PERSONAL",
  "ELI PERSONAL", "CASA", "MARKETING", "SEGURIDAD", "ALMUERZO", "LIBRERIA", "HORAS EXTRA", "GASTOS EXTRA",
  "TAXI/UBER", "SUPER", "SERVICIOS", "PAGO TARJETA", "PAGO PROVEEDORES", "MUNICIPALES",
  "MANTENIMIENTO JURAMENTO", "MANTENIMIENTO COLON", "MANTENIMIENTO JUAN B JUSTO", "MANTENIMIENTO DE VEHICULOS",
  "ALQUILER", "IMPUESTOS", "COSTOS FINANCIEROS", "TARJETA", "PUERTOS DE FRIO", "LEO", "FINANCIERA",
  "DEPOSITO EN CUENTA", "HONORARIOS", "GASTOS EMPLEADOS"
];

const DENOMINACIONES = [10, 20, 50, 100, 200, 500, 1000, 2000, 10000, 20000];
const UMBRAL_ALERTA = 5000000;

export default function GastoForm({ onSuccess }: { onSuccess: () => void }) {
  const [categoria, setCategoria] = useState('');
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('');
  const [notas, setNotas] = useState('');
  const [montoEsAlto, setMontoEsAlto] = useState(false);
  const [billetes, setBilletes] = useState<Record<number, number>>({});

  const validarMonto = (valor: string) => {
    setMonto(valor);
    setMontoEsAlto(parseFloat(valor) > UMBRAL_ALERTA);
  };

  const calcularTotalBilletes = () => {
    return DENOMINACIONES.reduce((total, denom) => {
      const cantidad = billetes[denom] || 0;
      return total + denom * cantidad;
    }, 0);
  };

  const resetearFormulario = () => {
    setCategoria('');
    setMonto('');
    setMetodo('');
    setNotas('');
    setMontoEsAlto(false);
    setBilletes({});
  };

  const agregarGasto = async () => {
    if (!categoria) return alert('Selecciona una categoría');
    if (!monto || parseFloat(monto) <= 0) return alert('Ingresa un monto válido');
    if (!metodo) return alert('Selecciona un método de pago');

    if (montoEsAlto) {
      const confirmar = window.confirm(`El monto $${monto} es muy alto. ¿Está seguro que desea continuar?`);
      if (!confirmar) return;
    }

    const { error } = await supabase.from('gastos').insert({
      categoria,
      monto: parseFloat(monto),
      metodo_pago: metodo,
      notas: notas || null,
    });

    if (!error) {
      resetearFormulario();
      onSuccess();
      alert('Gasto guardado correctamente');
    } else {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg max-w-2xl mx-auto mb-8">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Registrar Nuevo Gasto</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Categoría</label>
          <select className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Selecciona categoría</option>
            {CATEGORIAS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Método de Pago</label>
          <select className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
            <option value="">Selecciona método</option>
            {METODOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {metodo === 'Efectivo' && (
          <div className="bg-gray-700 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-300 mb-2">Denominaciones</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DENOMINACIONES.map((denom) => (
                <div key={denom} className="flex items-center space-x-2">
                  <label className="text-gray-300 w-12">${denom}</label>
                  <input
                    type="number"
                    className="w-full p-1 rounded bg-gray-800 border border-gray-600 text-sm"
                    min="0"
                    value={billetes[denom] || ''}
                    onChange={(e) => setBilletes({ ...billetes, [denom]: parseInt(e.target.value) || 0 })}
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-400">Total calculado: <span className="text-green-400 font-semibold">${calcularTotalBilletes().toLocaleString()}</span></p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Monto</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input 
  type="text" 
  placeholder="0.00" 
  value={monto} 
  onChange={(e) => {
    // Solo permitir números y punto decimal
    const valor = e.target.value.replace(/[^0-9.]/g, '');
    validarMonto(valor);
  }} 
  className={`w-full p-2 pl-8 bg-gray-700 rounded-lg border ${montoEsAlto ? 'border-red-500' : 'border-gray-600'}`} 
/>
          </div>
          {montoEsAlto && (
            <div className="mt-2 flex items-center text-red-500 text-xs">
              <AlertCircle size={16} className="mr-1" /> Monto inusualmente alto. Verifica antes de guardar.
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Notas (opcional)</label>
          <textarea placeholder="Ingrese notas..." value={notas} onChange={(e) => setNotas(e.target.value)} className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 h-20" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium flex items-center justify-center" onClick={agregarGasto}>
            <MinusCircle size={18} className="mr-2" /> Guardar Gasto
          </button>
          <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg font-medium" onClick={resetearFormulario}>
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}
