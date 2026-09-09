'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Categoria, TipoCategoria } from '@/lib/categorias';

interface UseCategorias {
  categorias: Categoria[];
  /** Nombres listos para el combobox. */
  nombres: string[];
  cargando: boolean;
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

  return { categorias, nombres: categorias.map(c => c.nombre), cargando, recargar };
}
