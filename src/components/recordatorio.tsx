import React, { useState, useEffect, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';

interface Recordatorio {
  id: string;
  titulo: string;
  descripcion: string | null;
  estado: 'pendiente' | 'completada';
  fecha_recordar: string | null;
  created_at: string;
  updated_at: string;
}

type FilterType = 'todos' | 'pendientes' | 'completadas';

export default function RecordatoriosPage() {
  const [recordatorios, setRecordatorios] = useState<Recordatorio[]>([]);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaRecordar, setFechaRecordar] = useState('');
  const [filtro, setFiltro] = useState<FilterType>('todos');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Obtener todos los recordatorios
  const fetchRecordatorios = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('recordatorios')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setRecordatorios(data as Recordatorio[]);
    } catch (err) {
      setError('Error al cargar recordatorios');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordatorios();
  }, []);

  // Agregar nuevo recordatorio
  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const newRec = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        fecha_recordar: fechaRecordar ? new Date(fechaRecordar).toISOString() : null,
      };

      const { error } = await supabase
        .from('recordatorios')
        .insert([newRec]);

      if (error) throw error;

      setTitulo('');
      setDescripcion('');
      setFechaRecordar('');
      await fetchRecordatorios();
    } catch (err) {
      setError('Error al agregar recordatorio');
      console.error('Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cambiar estado
  const toggleEstado = async (rec: Recordatorio) => {
    setError(null);
    const nuevoEstado = rec.estado === 'pendiente' ? 'completada' : 'pendiente';
    
    try {
      const { error } = await supabase
        .from('recordatorios')
        .update({ 
          estado: nuevoEstado, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', rec.id);

      if (error) throw error;
      await fetchRecordatorios();
    } catch (err) {
      setError('Error al actualizar recordatorio');
      console.error('Error:', err);
    }
  };

  // Eliminar recordatorio
  const eliminarRecordatorio = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este recordatorio?')) return;
    
    setError(null);
    
    try {
      const { error } = await supabase
        .from('recordatorios')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchRecordatorios();
    } catch (err) {
      setError('Error al eliminar recordatorio');
      console.error('Error:', err);
    }
  };

  // Filtrar recordatorios
  const recordatoriosFiltrados = recordatorios.filter(rec => {
    if (filtro === 'pendientes') return rec.estado === 'pendiente';
    if (filtro === 'completadas') return rec.estado === 'completada';
    return true;
  });

  // Verificar si un recordatorio está vencido
  const isVencido = (fechaRecordar: string | null): boolean => {
    if (!fechaRecordar) return false;
    return new Date(fechaRecordar) < new Date();
  };

  // Formatear fecha
  const formatearFecha = (fecha: string): string => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(fecha));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">📝 Recordatorios</h1>
          
          {/* Formulario */}
          <form onSubmit={handleAdd} className="space-y-4 mb-6">
            <div>
              <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                id="titulo"
                type="text"
                placeholder="¿Qué necesitas recordar?"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900 placeholder-gray-500"
                required
                maxLength={100}
              />
            </div>

            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                id="descripcion"
                placeholder="Agrega más detalles..."
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900 placeholder-gray-500 resize-none"
                rows={3}
                maxLength={500}
              />
            </div>

            <div>
              <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha y hora del recordatorio
              </label>
              <input
                id="fecha"
                type="datetime-local"
                value={fechaRecordar}
                onChange={e => setFechaRecordar(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !titulo.trim()}
              className="w-full px-6 py-3 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
            >
              {isSubmitting ? 'Agregando...' : '➕ Agregar recordatorio'}
            </button>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700">⚠️ {error}</p>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-3">
            {(['todos', 'pendientes', 'completadas'] as FilterType[]).map(tipo => (
              <button
                key={tipo}
                onClick={() => setFiltro(tipo)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  filtro === tipo
                    ? 'bg-blue-600 text-white shadow-md transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                }`}
              >
                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                {tipo === 'pendientes' && ` (${recordatorios.filter(r => r.estado === 'pendiente').length})`}
                {tipo === 'completadas' && ` (${recordatorios.filter(r => r.estado === 'completada').length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de recordatorios */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <p className="text-gray-500">Cargando recordatorios...</p>
            </div>
          ) : recordatoriosFiltrados.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <p className="text-gray-500 text-lg">
                {filtro === 'todos' ? '¡No tienes recordatorios!' : 
                 filtro === 'pendientes' ? 'No hay recordatorios pendientes' : 
                 'No hay recordatorios completados'}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {filtro === 'todos' && 'Agrega tu primer recordatorio arriba'}
              </p>
            </div>
          ) : (
            recordatoriosFiltrados.map(rec => (
              <div 
                key={rec.id} 
                className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${
                  rec.estado === 'completada' 
                    ? 'border-green-500 bg-green-50' 
                    : rec.fecha_recordar && isVencido(rec.fecha_recordar)
                    ? 'border-red-500 bg-red-50'
                    : 'border-blue-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className={`font-medium ${
                      rec.estado === 'completada' ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}>
                      {rec.titulo}
                      {rec.fecha_recordar && isVencido(rec.fecha_recordar) && rec.estado === 'pendiente' && (
                        <span className="ml-2 text-red-600 text-sm">⚠️ Vencido</span>
                      )}
                    </h3>
                    
                    {rec.descripcion && (
                      <p className={`text-sm mt-1 ${
                        rec.estado === 'completada' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {rec.descripcion}
                      </p>
                    )}
                    
                    {rec.fecha_recordar && (
                      <p className={`text-xs mt-2 ${
                        rec.estado === 'completada' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        📅 {formatearFecha(rec.fecha_recordar)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4 shrink-0">
                    <button
                      onClick={() => toggleEstado(rec)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                        rec.estado === 'pendiente'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                      }`}
                      title={rec.estado === 'pendiente' ? 'Marcar como completado' : 'Marcar como pendiente'}
                    >
                      {rec.estado === 'pendiente' ? '✓' : '↻'}
                    </button>
                    
                    <button
                      onClick={() => eliminarRecordatorio(rec.id)}
                      className="px-3 py-1.5 text-sm font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 border border-red-200"
                      title="Eliminar recordatorio"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Estadísticas */}
        {recordatorios.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
            <div className="text-center text-sm text-gray-600">
              Total: {recordatorios.length} | 
              Pendientes: {recordatorios.filter(r => r.estado === 'pendiente').length} | 
              Completadas: {recordatorios.filter(r => r.estado === 'completada').length}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}