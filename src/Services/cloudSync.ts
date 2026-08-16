import { supabase } from './supabase';

// Función para GUARDAR en la nube
export async function guardarEnNube(modulo: string, datos: any) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      console.warn("Sincronización pausada: No hay usuario logueado.");
      return; 
    }

    // Forzamos el upsert indicando exactamente cuáles son las llaves de conflicto
    const { error } = await supabase
      .from('user_sync')
      .upsert({ 
        user_id: user.id, 
        module_name: modulo, 
        payload: datos,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id,module_name' 
      });

    if (error) {
      console.error(`Error Supabase guardando ${modulo}:`, error);
      alert(`⚠️ Error guardando en la nube: ${error.message}`);
    }
  } catch (err) {
    console.error("Error inesperado en guardarEnNube:", err);
  }
}

// Función para DESCARGAR de la nube
export async function cargarDeNube(modulo: string) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_sync')
      .select('payload')
      .eq('module_name', modulo)
      .eq('user_id', user.id)
      .maybeSingle(); // maybeSingle() no tira error si la tabla está vacía

    if (error) {
      console.error(`Error Supabase cargando ${modulo}:`, error);
      return null;
    }
    
    return data ? data.payload : null;
  } catch (err) {
    console.error("Error inesperado en cargarDeNube:", err);
    return null;
  }
}