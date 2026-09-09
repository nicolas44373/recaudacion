// Tipos de categoría. Las categorías viven exclusivamente en la tabla
// `categorias` de Supabase y se administran desde el apartado "Configuración".

export type TipoCategoria = 'ingreso' | 'gasto';

export interface Categoria {
  id: string;
  nombre: string;
  tipo: TipoCategoria;
  orden: number;
}
