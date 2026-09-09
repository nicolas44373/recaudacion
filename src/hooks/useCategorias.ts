'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Categoria,
  TipoCategoria,
  categoriasDefault,
} from '@/lib/categorias';

interface UseCategorias {
  categorias: Categoria[];
  /** Nombres listos para el combobox, con respaldo a los valores por defecto. */
  nombres: string[];
  cargando: boolean;
  /** true cuando los nombres provienen del respaldo (tabla vacía / sin conexión). */
  usandoRespaldo: boolean;
  recargar: () => Promise<void>;
}

export function useCategorias(tipo?: TipoCategoria): UseCategorias {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    setCargando(true);
    let query = supabase
      .from('categorias')
      .select('*')
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true });
    if (tipo) query = query.eq('tipo', tipo);
    const { data, error } = await query;
    setCategorias(error || !data ? [] : (data as Categoria[]));
    setCargando(false);
  }, [tipo]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const usandoRespaldo = !cargando && categorias.length === 0;

  const nombres = categorias.length > 0
    ? categorias.map(c => c.nombre)
    : tipo
      ? categoriasDefault(tipo)
      : [...categoriasDefault('ingreso'), ...categoriasDefault('gasto')];

  return { categorias, nombres, cargando, usandoRespaldo, recargar };
}
