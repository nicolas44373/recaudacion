// Nuevo componente: GastoForm.tsx
'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, MinusCircle } from 'lucide-react';

const METODOS_PAGO = ['efectivo', 'tarjeta', 'transferencia'];
const CATEGORIAS = ['insumos', 'servicios', 'sueldos', 'otros'];
const UMBRAL_ALERTA = 5000000;

export default function GastoForm({ onSuccess }: { onSuccess: () => void }) {
  const [categoria, setCategoria] = useState('');
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('');
  const [notas, setNotas] = useState('');
  const [montoEsAlto, setMontoEsAlto] = useState(false);

  const validarMonto = (valor: string) => {
    setMonto(valor);
    setMontoEsAlto(parseFloat(valor) > UMBRAL_ALERTA);
  };

  const resetearFormulario = () => {
    setCategoria('');
    setMonto('');
    setMetodo('');
    setNotas('');
    setMontoEsAlto(false);
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
          <label className="block text-sm font-medium text-gray-400 mb-1">Monto</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input type="number" placeholder="0.00" value={monto} onChange={(e) => validarMonto(e.target.value)} className={`w-full p-2 pl-8 bg-gray-700 rounded-lg border ${montoEsAlto ? 'border-red-500' : 'border-gray-600'}`} />
          </div>
          {montoEsAlto && (
            <div className="mt-2 flex items-center text-red-500 text-xs">
              <AlertCircle size={16} className="mr-1" /> Monto inusualmente alto. Verifica antes de guardar.
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Método de Pago</label>
          <select className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
            <option value="">Selecciona método</option>
            {METODOS_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
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
