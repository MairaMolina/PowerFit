// Importamos el cliente 'admin' de Supabase desde nuestra config
import { supabase } from '../config/db.js';

/**
 * Controlador para registrar un nuevo usuario.
 * Recibe los datos del formulario desde req.body.
 */
export const registrarUsuario = async (req, res) => {
  try {
    // 1. Sacamo slos datos del cuerpo de la solicitud
    const { nombreCompleto, genero, correo, contrasena } = req.body;

    // 2. Validamos que los datos básicos existan
    if (!correo || !contrasena || !nombreCompleto) {
      return res.status(400).json({ error: "Faltan campos obligatorios." });
    }

    // 3. Llamamos a Supabase (desde el backend)
    // Usamos la 'service_role' key, que tiene permisos de admin
    const { data, error } = await supabase.auth.signUp({
      email: correo,
      password: contrasena,
      options: {
        data: {
          // Estos datos van al 'raw_user_meta_data'
          // y nuestro Trigger los tomará de ahí.
          nombreCompleto: nombreCompleto,
          genero: genero,
        },
      },
    });

    // 4. Manejamos el error de Supabase
    if (error) {
      console.error('Error en Supabase:', error.message);
      return res.status(400).json({ error: error.message });
    }

    // 5. Respondemos con éxito
    // 201 significa "Recurso Creado"
    return res.status(201).json({ message: "Registro exitoso. Revisa tu correo.", data: data.user });

  } catch (error) {
    console.error('Error en el controlador de registro:', error.message);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};

/**
 * Controlador para iniciar sesión de un usuario.
 * Recibe correo y contraseña desde req.body.
 */
export const iniciarSesion = async (req, res) => {
  try {
    // 1. Sacamos los datos del cuerpo de la solicitud
    const { correo, contrasena } = req.body;

    // 2. Validamos que los datos existan
    if (!correo || !contrasena) {
      return res.status(400).json({ error: "Correo y contraseña son obligatorios." });
    }

    // 3. Llamamos a Supabase para iniciar sesión
    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo,
      password: contrasena,
    });

    // 4. Manejamos el error de Supabase (ej. credenciales incorrectas)
    if (error) {
      console.error('Error en Supabase (signIn):', error.message);
      // Damos un mensaje genérico por seguridad
      return res.status(401).json({ error: "Correo o contraseña incorrectos." });
    }

    // 5. Respondemos con éxito
    // Enviamos 'data.session' al frontend.
    // Esto incluye el access_token y los datos del usuario.
    return res.status(200).json({
      message: "Inicio de sesión exitoso.",
      session: data.session 
    });

  } catch (error) {
    console.error('Error en el controlador de inicio de sesión:', error.message);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};