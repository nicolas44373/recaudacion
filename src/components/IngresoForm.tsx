'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, DollarSign } from 'lucide-react';

const CATEGORIAS = [
  "INICIO DEL DIA", "CAJA MAYORISTA TM", "CAJA MAYORISTA TT", "CAJA MINORISTA TM", "CAJA MINORISTA TT",
  "CAJA COLON TM", "CAJA COLON TT", "CUENTA GALICIA JULITO", "CUENTA GALICIA ROCIO", "CUENTA MERCADO PAGO",
  "ANTICIPO DE CAJA MAYORISTA", "ANTICIPO DE CAJA MINORISTA", "ANTICIPO DE CAJA COLON", "COBRANZAS", "REPARTO",
  "TRANSFERENCIAS FINANCIERAS", "CHEQUES FINANCIEROS", "CHEQUES DE LEO FINANCISTA", "ELI PERSONAL","DEPOSITO EN CUENTA", "SOBRANTES", "PRESTAMOS","INGRESOS EXTRAS"
];

const METODOS_PAGO = ["Efectivo", "Transferencia", "Depósito","Tarjeta", "Cheque", "eCheq"];
const DENOMINACIONES = [10, 20, 50, 100, 200, 500, 1000, 2000, 10000, 20000];
const UMBRAL_ALERTA = 500000000;

export default function IngresoForm({ onSuccess }: { onSuccess: () => void }) {
  const [categoria, setCategoria] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [monto, setMonto] = useState('');
  const [notas, setNotas] = useState('');
  const [montoEsAlto, setMontoEsAlto] = useState(false);
  const [denominaciones, setDenominaciones] = useState<Record<number, number>>({});

  const validarMonto = (valor: string) => {
    setMonto(valor);
    setMontoEsAlto(parseFloat(valor) > UMBRAL_ALERTA);
  };

  const calcularTotalBilletes = () => {
    return DENOMINACIONES.reduce((acc, den) => acc + (denominaciones[den] || 0) * den, 0);
  };

  const resetearFormulario = () => {
    setCategoria('');
    setMetodoPago('');
    setMonto('');
    setNotas('');
    setMontoEsAlto(false);
    setDenominaciones({});
  };

  const agregarIngreso = async () => {
    if (!categoria) return alert('Selecciona una categoría');
    if (!metodoPago) return alert('Selecciona un método de pago');
    if (!monto || parseFloat(monto) <= 0) return alert('Ingresa un monto válido');

    if (montoEsAlto) {
      const confirmar = window.confirm(`El monto $${monto} es muy alto. ¿Está seguro que desea continuar?`);
      if (!confirmar) return;
    }

    const { error } = await supabase.from('ingresos').insert({
      metodo_pago: metodoPago,
      categoria: categoria,
      monto: parseFloat(monto),
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
          <label className="block text-sm font-medium text-gray-400 mb-1">Categoría</label>
          <select className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 text-sm" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Selecciona una categoría</option>
            {CATEGORIAS.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Método de Pago</label>
          <select className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 text-sm" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
            <option value="">Selecciona un método</option>
            {METODOS_PAGO.map((met) => <option key={met} value={met}>{met}</option>)}
          </select>
        </div>

        {metodoPago === 'Efectivo' && (
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Detalle de Billetes</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DENOMINACIONES.map((den) => (
                <div key={den} className="flex items-center space-x-2">
                  <label className="text-sm text-gray-200 w-16">${den}</label>
                  <input
                    type="number"
                    min={0}
                    value={denominaciones[den] || ''}
                    onChange={(e) =>
                      setDenominaciones({
                        ...denominaciones,
                        [den]: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full p-1 bg-gray-600 rounded text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="text-right mt-2 text-green-400 text-sm">
              Total calculado: ${calcularTotalBilletes().toLocaleString('es-AR')}
            </div>
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
              <AlertCircle size={16} className="mr-1" />
              <span>Monto inusualmente alto. Verifica antes de guardar.</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Notas (opcional)</label>
          <textarea placeholder="Notas adicionales..." value={notas} onChange={(e) => setNotas(e.target.value)} className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 text-sm h-24" />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center" onClick={agregarIngreso}>
            <DollarSign size={18} className="mr-2" /> Guardar Ingreso
          </button>
          <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium" onClick={resetearFormulario}>
            Limpiar
          </button>
        </div>
      </div>
    </div>
  );
}
