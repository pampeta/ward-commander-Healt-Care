import { supabase } from './supabase';

async function obtenerUsuarioActivo() {
  const { data: sessionData, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Error al obtener la sesión de Supabase:', error);
    throw new Error(`Error de autenticación: ${error.message}`);
  }

  return sessionData?.session?.user ?? null;
}

// Función para GUARDAR en la nube
export async function guardarEnNube(modulo: string, datos: any) {
  try {
    const user = await obtenerUsuarioActivo();

    if (!user) {
      console.warn('Sincronización pausada: no hay usuario logueado en Supabase. Inicia sesión antes de guardar en la nube.');
      return;
    }

    const { error } = await supabase
      .from('user_sync')
      .upsert(
        {
          user_id: user.id,
          module_name: modulo,
          payload: datos,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,module_name' }
      );

    if (error) {
      console.error(`Error Supabase guardando ${modulo}:`, error);

      if (error.message.includes('does not exist') || error.code === '42P01') {
        alert('⚠️ La tabla user_sync no existe en Supabase. Crea la tabla y asegúrate de que la política RLS permita escritura.');
      } else {
        alert(`⚠️ Error guardando en la nube: ${error.message}`);
      }
    }
  } catch (err) {
    console.error('Error inesperado en guardarEnNube:', err);
  }
}

// Función para DESCARGAR de la nube
export async function cargarDeNube(modulo: string) {
  try {
    const user = await obtenerUsuarioActivo();

    if (!user) {
      console.warn('Sincronización pausada: no hay usuario logueado en Supabase al cargar datos.');
      return null;
    }

    const { data, error } = await supabase
      .from('user_sync')
      .select('payload')
      .eq('module_name', modulo)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error(`Error Supabase cargando ${modulo}:`, error);

      if (error.message.includes('does not exist') || error.code === '42P01') {
        console.warn('La tabla user_sync no existe. Verifica la estructura de la base de datos de Supabase.');
      }

      return null;
    }

    return data ? data.payload : null;
  } catch (err) {
    console.error('Error inesperado en cargarDeNube:', err);
    return null;
  }
}