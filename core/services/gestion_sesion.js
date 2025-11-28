import { supabase } from './cliente_supabase.js';

/**
 * Módulo centralizado para gestión de sesión de usuario
 * Reutilizable en todas las pantallas de la aplicación
 */

// ========== VERIFICACIÓN DE SESIÓN ==========

/**
 * Obtiene la sesión actual del usuario
 * @returns {Promise<{session: object|null, user: object|null}>}
 */
export async function obtenerSesionActual() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Error al obtener sesión:', error);
            return { session: null, user: null };
        }

        return {
            session,
            user: session?.user || null
        };
    } catch (error) {
        console.error('Error inesperado al obtener sesión:', error);
        return { session: null, user: null };
    }
}

/**
 * Verifica si el usuario está autenticado
 * @returns {Promise<boolean>}
 */
export async function estaAutenticado() {
    const { session } = await obtenerSesionActual();
    return session !== null;
}

/**
 * Obtiene el usuario actual (con información completa)
 * @returns {Promise<object|null>}
 */
export async function obtenerUsuarioActual() {
    const { user } = await obtenerSesionActual();
    return user;
}

// ========== PROTECCIÓN DE RUTAS ==========

/**
 * Protege una página requiriendo autenticación
 * Redirige a login si no está autenticado
 * @param {string} urlLogin - URL de la página de login (por defecto: /view/login/iniciar_sesion.html)
 * @returns {Promise<object|null>} - Retorna el usuario si está autenticado, null si redirige
 */
export async function requerirAutenticacion(urlLogin = '/view/login/iniciar_sesion.html') {
    const { user, session } = await obtenerSesionActual();

    if (!session) {
        // Guardar la URL actual para redirigir después del login
        sessionStorage.setItem('redirect_after_login', window.location.pathname);
        window.location.href = urlLogin;
        return null;
    }

    return user;
}

/**
 * Redirige a usuarios autenticados (útil para páginas de login/registro)
 * @param {string} urlDestino - URL de destino (por defecto: /view/dashboard/dashboard_usuario.html)
 */
export async function redirigirSiAutenticado(urlDestino = '/view/dashboard/dashboard_usuario.html') {
    const { session } = await obtenerSesionActual();

    if (session) {
        window.location.href = urlDestino;
    }
}

// ========== GESTIÓN DE UI ==========

/**
 * Actualiza la UI según el estado de autenticación
 * Muestra/oculta elementos según si el usuario está logueado
 * @param {object} opciones - Configuración de elementos a mostrar/ocultar
 * @param {string[]} opciones.mostrarSiAutenticado - IDs de elementos a mostrar si está autenticado
 * @param {string[]} opciones.ocultarSiAutenticado - IDs de elementos a ocultar si está autenticado
 */
export async function actualizarUISegunSesion(opciones = {}) {
    const {
        mostrarSiAutenticado = [],
        ocultarSiAutenticado = []
    } = opciones;

    const autenticado = await estaAutenticado();

    // Mostrar elementos solo si está autenticado
    mostrarSiAutenticado.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.style.display = autenticado ? 'block' : 'none';
        }
    });

    // Ocultar elementos si está autenticado
    ocultarSiAutenticado.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.style.display = autenticado ? 'none' : 'block';
        }
    });
}

// ========== AUTENTICACIÓN ==========

/**
 * Inicia sesión con email y contraseña
 * @param {string} correo 
 * @param {string} contrasena 
 * @returns {Promise<{success: boolean, user: object|null, error: object|null}>}
 */
export async function iniciarSesion(correo, contrasena) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: correo,
            password: contrasena,
        });

        if (error) {
            return { success: false, user: null, error };
        }

        return { success: true, user: data.user, error: null };
    } catch (error) {
        return { success: false, user: null, error };
    }
}

/**
 * Cierra la sesión del usuario actual
 * @returns {Promise<{success: boolean, error: object|null}>}
 */
export async function cerrarSesion() {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            return { success: false, error };
        }

        // Limpiar storage local si es necesario
        sessionStorage.removeItem('redirect_after_login');

        return { success: true, error: null };
    } catch (error) {
        return { success: false, error };
    }
}

// ========== LISTENERS DE CAMBIO DE SESIÓN ==========

/**
 * Escucha cambios en el estado de autenticación
 * @param {function} callback - Función que se ejecuta cuando cambia el estado
 * @returns {object} - Suscripción que puede ser cancelada
 */
export function escucharCambiosSesion(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });

    return subscription;
}

// ========== TOKENS Y SEGURIDAD ==========

/**
 * Obtiene el access token actual (para llamadas a APIs protegidas)
 * @returns {Promise<string|null>}
 */
export async function obtenerAccessToken() {
    const { session } = await obtenerSesionActual();
    return session?.access_token || null;
}

/**
 * Refresca la sesión del usuario
 * @returns {Promise<{session: object|null, error: object|null}>}
 */
export async function refrescarSesion() {
    try {
        const { data, error } = await supabase.auth.refreshSession();

        if (error) {
            return { session: null, error };
        }

        return { session: data.session, error: null };
    } catch (error) {
        return { session: null, error };
    }
}
