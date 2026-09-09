'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Categoria,
  TipoCategoria,
  categoriasDefault,
} from '@/lib/categorias';
import {
  AlertCircle, CheckCircle, X, Plus, Pencil, Trash2,
  Check, Settings, TrendingUp, TrendingDown, Download,
} from 'lucide-react';

const TABS: { tipo: TipoCategoria; label: string; icon: React.ElementType; accent: string; ring: string; btn: string }[] = [
  { tipo: 'ingreso', label: 'Categorías de Ingresos', icon: TrendingUp, accent: 'text-emerald-600', ring: 'focus:ring-emerald-500', btn: 'bg-emerald-600 hover:bg-emerald-700' },
  { tipo: 'gasto',   label: 'Categorías de Egresos',  icon: TrendingDown, accent: 'text-red-600',    ring: 'focus:ring-red-500',    btn: 'bg-red-600 hover:bg-red-700' },
];

export default function Configuracion() {
  const [tipo, setTipo] = useState<TipoCategoria>('ingreso');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [nueva, setNueva] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editValor, setEditValor] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [toast, setToast] = useState<{ tipo: 'ok' | 'err'; msg: string } | null>(null);

  const tab = TABS.find(t => t.tipo === tipo)!;

  const showToast = (t: 'ok' | 'err', msg: string) => {
    setToast({ tipo: t, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const cargar = useCallback(async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('tipo', tipo)
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true });
    if (error) {
      showToast('err', `No se pudieron cargar las categorías: ${error.message}`);
      setCategorias([]);
    } else {
      setCategorias((data as Categoria[]) ?? []);
    }
    setCargando(false);
  }, [tipo]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const nombresActuales = useMemo(
    () => new Set(categorias.map(c => c.nombre.trim().toUpperCase())),
    [categorias],
  );

  const agregar = async () => {
    const nombre = nueva.trim();
    if (!nombre) return;
    if (nombresActuales.has(nombre.toUpperCase())) {
      showToast('err', 'Esa categoría ya existe');
      return;
    }
    setOcupado(true);
    const orden = categorias.length ? Math.max(...categorias.map(c => c.orden)) + 1 : 0;
    const { error } = await supabase.from('categorias').insert({ nombre, tipo, orden });
    setOcupado(false);
    if (error) {
      showToast('err', `Error al agregar: ${error.message}`);
    } else {
      setNueva('');
      showToast('ok', 'Categoría agregada');
      cargar();
    }
  };

  const guardarEdicion = async (id: string) => {
    const nombre = editValor.trim();
    if (!nombre) return;
    if (nombresActuales.has(nombre.toUpperCase()) &&
        categorias.find(c => c.id === id)?.nombre.toUpperCase() !== nombre.toUpperCase()) {
      showToast('err', 'Esa categoría ya existe');
      return;
    }
    setOcupado(true);
    const { error } = await supabase.from('categorias').update({ nombre }).eq('id', id);
    setOcupado(false);
    if (error) {
      showToast('err', `Error al guardar: ${error.message}`);
    } else {
      setEditId(null);
      setEditValor('');
      showToast('ok', 'Categoría actualizada');
      cargar();
    }
  };

  const borrar = async (cat: Categoria) => {
    if (!confirm(`¿Borrar la categoría "${cat.nombre}"?\n\nLos movimientos ya registrados con esta categoría no se modifican.`)) return;
    setOcupado(true);
    const { error } = await supabase.from('categorias').delete().eq('id', cat.id);
    setOcupado(false);
    if (error) {
      showToast('err', `Error al borrar: ${error.message}`);
    } else {
      showToast('ok', 'Categoría borrada');
      cargar();
    }
  };

  const importarDefault = async () => {
    const faltantes = categoriasDefault(tipo).filter(
      n => !nombresActuales.has(n.toUpperCase()),
    );
    if (faltantes.length === 0) {
      showToast('ok', 'No hay categorías nuevas para importar');
      return;
    }
    if (!confirm(`Se agregarán ${faltantes.length} categorías predefinidas. ¿Continuar?`)) return;
    setOcupado(true);
    const base = categorias.length ? Math.max(...categorias.map(c => c.orden)) + 1 : 0;
    const filas = faltantes.map((nombre, i) => ({ nombre, tipo, orden: base + i }));
    const { error } = await supabase.from('categorias').insert(filas);
    setOcupado(false);
    if (error) {
      showToast('err', `Error al importar: ${error.message}`);
    } else {
      showToast('ok', `${faltantes.length} categorías importadas`);
      cargar();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-white text-sm font-medium ${toast.tipo === 'ok' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.tipo === 'ok' ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100"><X size={15} /></button>
        </div>
      )}

      {/* Encabezado */}
      <div className="rounded-xl p-5 border bg-white border-gray-200 flex items-center gap-4 shadow-sm">
        <div className="p-3 rounded-xl bg-gray-100">
          <Settings size={24} className="text-gray-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Configuración</h2>
          <p className="text-xs text-gray-500 mt-0.5">Administrá las categorías de ingresos y egresos</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(t => {
          const Icon = t.icon;
          const activo = t.tipo === tipo;
          return (
            <button
              key={t.tipo}
              onClick={() => { setTipo(t.tipo); setEditId(null); setNueva(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${activo
                ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              <Icon size={15} className={activo ? 'text-white' : t.accent} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Cuerpo */}
      <div className="rounded-xl border bg-white border-gray-200 p-5 space-y-4 shadow-sm">

        {/* Agregar nueva */}
        <div className="flex gap-2">
          <input
            type="text"
            value={nueva}
            onChange={e => setNueva(e.target.value.toUpperCase())}
            onKeyDown={e => { if (e.key === 'Enter') agregar(); }}
            placeholder="Nombre de la nueva categoría"
            className={`flex-1 p-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 ${tab.ring} hover:border-gray-400 transition-colors uppercase`}
          />
          <button
            onClick={agregar}
            disabled={ocupado || !nueva.trim()}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-white transition-all shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed ${tab.btn}`}
          >
            <Plus size={16} />
            Agregar
          </button>
        </div>

        {/* Lista */}
        {cargando ? (
          <p className="text-center py-10 text-gray-400 text-sm">Cargando categorías...</p>
        ) : categorias.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <p className="text-gray-400 text-sm">No hay categorías cargadas todavía.</p>
            <button
              onClick={importarDefault}
              disabled={ocupado}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <Download size={15} />
              Importar categorías predefinidas
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {categorias.length} categoría{categorias.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={importarDefault}
                disabled={ocupado}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                <Download size={13} />
                Importar predefinidas
              </button>
            </div>
            <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
              {categorias.map(cat => {
                const enEdicion = editId === cat.id;
                return (
                  <li key={cat.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                    {enEdicion ? (
                      <>
                        <input
                          type="text"
                          value={editValor}
                          onChange={e => setEditValor(e.target.value.toUpperCase())}
                          onKeyDown={e => {
                            if (e.key === 'Enter') guardarEdicion(cat.id);
                            if (e.key === 'Escape') { setEditId(null); setEditValor(''); }
                          }}
                          autoFocus
                          className={`flex-1 p-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 ${tab.ring} uppercase`}
                        />
                        <button
                          onClick={() => guardarEdicion(cat.id)}
                          disabled={ocupado}
                          className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                          title="Guardar"
                        >
                          <Check size={15} />
                        </button>
                        <button
                          onClick={() => { setEditId(null); setEditValor(''); }}
                          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                          title="Cancelar"
                        >
                          <X size={15} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium text-gray-800">{cat.nombre}</span>
                        <button
                          onClick={() => { setEditId(cat.id); setEditValor(cat.nombre); }}
                          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => borrar(cat)}
                          disabled={ocupado}
                          className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Borrar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <p className="text-xs text-gray-400 px-1">
        Los movimientos ya registrados conservan su categoría aunque la borres o la renombres acá.
      </p>
    </div>
  );
}
