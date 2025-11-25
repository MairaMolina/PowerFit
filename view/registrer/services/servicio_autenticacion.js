import { supabase } from '../../../core/services/cliente_supabase.js';

/**
 * Registra un usuario nuevo en Supabase Auth
 * @param {Object} datos - Objeto con nombre, apellido, correo, etc.
 */
export async function registrarUsuario(datos) {
    const {
        correo,
        contrasena,
        nombre,
        apellido,
        genero,
        fechaNacimiento,
        peso,
        altura,
        objetivos,
        nivelActividad,
        preferenciasEjercicio,
        dietaSaludable
    } = datos;

    const { data, error } = await supabase.auth.signUp({
        email: correo,
        password: contrasena,
        options: {
            data: {
                nombre: nombre,
                apellido: apellido,
                genero: genero,
                fecha_nacimiento: fechaNacimiento,
                peso: peso,
                altura: altura,
                objetivos: objetivos,
                nivel_actividad: nivelActividad,
                preferencias_ejercicio: preferenciasEjercicio,
                dieta_saludable: dietaSaludable
            }
        }
    });

    return { data, error };
}