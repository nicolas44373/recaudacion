// components/IngresoForm.tsx
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, DollarSign } from 'lucide-react';

const CAJAS = ['pia', 'claudio', 'flor', 'nacho', 'colon', 'clientes grandes'];
const METODOS_PAGO: Record<string, string[]> = {
  pia: ['contado', 'tarjeta'],
  claudio: ['contado', 'tarjeta'],
  flor: ['contado', 'transferencia', 'tarjeta'],
  nacho: ['contado', 'transferencia'],
  colon: ['contado', 'transferencia', 'tarjeta'],
  'clientes grandes': ['contado', 'transferencia', 'tarjeta'],
};
const UMBRAL_ALERTA = 50000000;

export default function IngresoForm({ onSuccess }: { onSuccess: () => void }) {
  const [caja, setCaja] = useState('');
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('');
  const [notas, setNotas] = useState('');
  const [montoEsAlto, setMontoEsAlto] = useState(false);

  const validarMonto = (valor: string) => {
    setMonto(valor);
    setMontoEsAlto(parseFloat(valor) > UMBRAL_ALERTA);
  };

  const resetearFormulario = () => {
    setCaja('');
    setMonto('');
    setMetodo('');
    setNotas('');
    setMontoEsAlto(false);
  };

  const agregarIngreso = async () => {
    if (!caja) return alert('Selecciona una caja');
    if (!monto || parseFloat(monto) <= 0) return alert('Ingresa un monto válido');
    if (!metodo) return alert('Selecciona un método de pago');

    if (montoEsAlto) {
      const confirmar = window.confirm(`El monto $${monto} es muy alto. ¿Está seguro que desea continuar?`);
      if (!confirmar) return;
    }

    const { error } = await supabase.from('ingresos').insert({
      caja,
      monto: parseFloat(monto),
      metodo_pago: metodo,
      notas: notas || null,
    });

    if (!error) {
      resetearFormulario();
      onSuccess();
      alert('Ingreso guardado correctamente');
    } else {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg max-w-2xl mx-auto">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Registrar Nuevo Ingreso</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Caja</label>
          <select className="w-full p-2 sm:p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-red-500 text-sm sm:text-base" value={caja} onChange={(e) => { setCaja(e.target.value); setMetodo(''); }}>
            <option value="">Selecciona caja</option>
            {CAJAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Monto</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input type="number" placeholder="0.00" value={monto} onChange={(e) => validarMonto(e.target.value)} className={`w-full p-2 sm:p-3 pl-8 bg-gray-700 rounded-lg border ${montoEsAlto ? 'border-red-500' : 'border-gray-600'} text-sm sm:text-base`} />
          </div>
          {montoEsAlto && (
            <div className="mt-2 flex items-center text-red-500 text-xs sm:text-sm">
              <AlertCircle size={16} className="mr-1 flex-shrink-0" />
              <span>Monto inusualmente alto. Por favor verifique antes de guardar.</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Método de Pago</label>
          <select className="w-full p-2 sm:p-3 bg-gray-700 rounded-lg border border-gray-600 text-sm sm:text-base" value={metodo} onChange={(e) => setMetodo(e.target.value)} disabled={!caja}>
            <option value="">Selecciona método</option>
            {caja && METODOS_PAGO[caja].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Notas (opcional)</label>
          <textarea placeholder="Ingrese notas adicionales..." value={notas} onChange={(e) => setNotas(e.target.value)} className="w-full p-2 sm:p-3 bg-gray-700 rounded-lg border border-gray-600 h-20 sm:h-24 text-sm sm:text-base" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 pt-4">
          <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 sm:py-3 px-4 rounded-lg font-medium flex items-center justify-center" onClick={agregarIngreso}>
            <DollarSign size={18} className="mr-2" /> Guardar Ingreso
          </button>
          <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 sm:py-3 px-4 rounded-lg font-medium" onClick={resetearFormulario}>
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}