
import { supabase } from '../../../core/services/cliente_supabase.js';

/**
 * Inicia sesión de un usuario llamando a Supabase Auth.
 * @param {object} datosLogin - Objeto con { correo, contrasena }
 * @returns {object} - { data, error }
 */
export async function loginUsuario(datosLogin) {
  const { correo, contrasena } = datosLogin;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: correo,
    password: contrasena,
  });

  return { data, error };
}

/**
 * Cierra la sesión del usuario actual.
 * @returns {object} - { error }
 */
export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Solicita reset de contraseña llamando a Supabase.
 * @param {string} correo - Correo del usuario
 * @returns {object} - { data, error }
 */
export async function solicitarResetPassword(correo) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(correo, {
    redirectTo: window.location.origin + '/view/login/reset_password.html', // Ajusta según tu estructura
  });
  return { data, error };
}
