import { supabase } from './supabase';

// Función para GUARDAR en la nube
export async function guardarEnNube(modulo: string, datos: any) {
  // 1. Verificamos si el usuario inició sesión
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  
  if (!user) return; // Si no hay usuario, no guarda en la nube

  // 2. Guarda o actualiza el JSON en Supabase
  const { error } = await supabase
    .from('user_sync')
    .upsert({ 
      user_id: user.id, 
      module_name: modulo, 
      payload: datos,
      updated_at: new Date().toISOString()
    });

  if (error) console.error(`Error guardando ${modulo} en la nube:`, error);
}

// Función para DESCARGAR de la nube
export async function cargarDeNube(modulo: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;
  
  if (!user) return null; // Si no hay usuario, retorna nulo

  const { data, error } = await supabase
    .from('user_sync')
    .select('payload')
    .eq('module_name', modulo)
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { 
    // PGRST116 significa "no se encontraron filas" (normal si está vacío)
    console.error(`Error cargando ${modulo} de la nube:`, error);
  }
  
  return data ? data.payload : null;
}