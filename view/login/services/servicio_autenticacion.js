import { supabase } from '../../../core/services/cliente_supabase.js';

/**
 * Inicia sesión de un usuario llamando a Supabase Auth.
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
 */
export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Solicita reset de contraseña (RESPETANDO TU LÓGICA ORIGINAL)
 */
export async function solicitarResetPassword(correo) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(correo, {
    redirectTo: window.location.origin + '/old/frontend/public/cambiar-contrasena.html', 
  });
  return { data, error };
}

/**
 * 🔥 REGISTRO MANUAL (ESTA ES LA QUE FALTABA) 🔥
 * 1. Crea la cuenta en Auth.
 * 2. Inserta manualmente los datos en la tabla 'usuarios'.
 */
export async function registrarUsuario(datos) {
    const {
        correo, contrasena, nombre, apellido, genero, fechaNacimiento,
        peso, altura, objetivos, nivelActividad, preferenciasEjercicio, dietaSaludable
    } = datos;

    // 1. Preparar datos (Unir nombre y limpiar arrays)
    const nombreCompleto = `${nombre} ${apellido}`.trim();
    // Convertimos el array de objetivos a texto (Ej: "ganar_musculo, perder_peso")
    const objetivosStr = Array.isArray(objetivos) ? objetivos.join(', ') : objetivos;

    console.log("1. Creando cuenta en Auth...", correo);

    // 2. CREAR CUENTA (Auth)
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: correo,
        password: contrasena
    });

    if (authError) return { data: null, error: authError };

    // 3. GUARDAR DATOS EN LA TABLA MANUALMENTE
    // Solo si el usuario se creó en Auth, procedemos a guardar su perfil
    if (authData?.user) {
        console.log("2. Guardando datos en tabla usuarios...");

        const { error: insertError } = await supabase
            .from('usuarios')
            .insert([
                {
                    id: authData.user.id, // Usamos el ID generado por Auth
                    correo: correo,
                    nombre_completo: nombreCompleto,
                    rol: 'usuario',
                    genero: genero,
                    // Si la fecha viene vacía, mandamos null
                    fecha_nacimiento: fechaNacimiento || null,
                    // Aseguramos que sean números
                    peso: parseFloat(peso) || 0,
                    altura: parseFloat(altura) || 0,
                    objetivos: objetivosStr
                    // Nota: No enviamos nivelActividad ni preferencias porque tu tabla 'usuarios' no tiene esas columnas
                }
            ]);

        if (insertError) {
            console.error("❌ Error guardando datos:", insertError);
            // Opcional: Podríamos borrar el usuario de Auth si falla la BD, 
            // pero por ahora devolvemos el error para que lo veas.
            return { data: null, error: new Error("Cuenta creada, pero error al guardar datos: " + insertError.message) };
        }
        
        console.log("✅ Perfil guardado correctamente.");
    }

    return { data: authData, error: null };
}