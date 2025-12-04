import { supabase } from '../../../core/services/cliente_supabase.js';

/**
 * Registra un usuario nuevo en Supabase Auth y en las tablas de base de datos
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

    // Convertir valores numéricos y asegurar formatos correctos
    const pesoNumerico = peso ? parseFloat(peso) : null;
    const alturaNumerico = altura ? parseFloat(altura) : null;
    const nombreCompleto = `${nombre} ${apellido}`.trim();

    // PASO 1: Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: correo,
        password: contrasena
    });

    if (authError) {
        console.error('Error en Auth:', authError);
        return { data: null, error: authError };
    }

    // PASO 2: Insertar datos en tabla usuarios
    const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .insert({
            nombre_completo: nombreCompleto,
            correo: correo,
            genero: genero || null,
            fecha_nacimiento: fechaNacimiento || null,
            peso: pesoNumerico,
            altura: alturaNumerico,
            objetivos: objetivos && objetivos.length > 0 ? JSON.stringify(objetivos) : null
        })
        .select()
        .single();

    if (usuarioError) {
        console.error('Error insertando en usuarios:', usuarioError);
        return { data: null, error: usuarioError };
    }

    // PASO 3: Insertar datos en tabla perfiles_usuario
    const { data: perfilData, error: perfilError } = await supabase
        .from('perfiles_usuario')
        .insert({
            usuario_id: usuarioData.id,
            telefono: null,
            peso: pesoNumerico,
            altura: alturaNumerico,
            objetivos: objetivos && objetivos.length > 0 ? JSON.stringify(objetivos) : null
        });

    if (perfilError) {
        console.error('Error insertando en perfiles_usuario:', perfilError);
        return { data: null, error: perfilError };
    }

    return { data: { auth: authData, usuario: usuarioData, perfil: perfilData }, error: null };
}