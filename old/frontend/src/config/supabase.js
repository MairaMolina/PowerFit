const supabaseUrl = 'https://iinbzpqjxpciivcomruk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpbmJ6cHFqeHBjaWl2Y29tcnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODY0MzMsImV4cCI6MjA3Nzg2MjQzM30.28XteWZXIqx1ZscSSwUND8x4YRn9B3ytNVfiHl-wY0s';

// URL de redirección para recuperación de contraseña}
export const REDIRECT_URL = 'http://localhost:3000/cambiar-contrasena';

// Crear cliente de Supabase con configuración de autenticación
const { createClient } = window.supabase;
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Habilitar auto-refresh de tokens en el cliente
    autoRefreshToken: true,
    // Persistir sesión en localStorage
    persistSession: true,
    // Detectar cambios de sesión (útil para múltiples tabs)
    detectSessionInUrl: true
  }
});

// Función auxiliar para solicitar reset de contraseña
export async function solicitarResetPassword(email) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: REDIRECT_URL,
  });
  
  return { data, error };
}

// Función auxiliar para actualizar contraseña
export async function actualizarPassword(nuevaContrasena) {
  const { data, error } = await supabase.auth.updateUser({
    password: nuevaContrasena
  });
  
  return { data, error };
}

// Función auxiliar para establecer sesión desde tokens de URL
export async function establecerSesionDesdeUrl() {
  const hash = window.location.hash.substring(1);
  
  if (!hash) {
    return { data: null, error: new Error('No se encontró token en la URL') };
  }
  
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  
  if (!accessToken || !refreshToken) {
    return { data: null, error: new Error('Tokens incompletos en la URL') };
  }
  
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken
  });
  
  return { data, error };
}
