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

/**
* Controlador para solicitar reset de contraseña.
* Recibe correo desde req.body.
*/
export const solicitarResetPassword = async (req, res) => {
 try {
   const { correo } = req.body;

   if (!correo) {
     return res.status(400).json({ error: "Correo es obligatorio." });
   }

   const { data, error } = await supabase.auth.resetPasswordForEmail(correo, {
     redirectTo: 'http://localhost:3000/cambiar-contrasena' // URL de la página de cambio
   });

   if (error) {
     console.error('Error en Supabase (resetPassword):', error.message);
     return res.status(400).json({ error: error.message });
   }

   return res.status(200).json({ message: "Enlace de reset enviado al correo." });

 } catch (error) {
  console.error('Error en el controlador de reset password:', error.message);
  return res.status(500).json({ error: "Error interno del servidor." });
 }
};

/**
* Controlador para listar todos los usuarios (solo para admin/testing).
* Usa la service key para acceder a admin APIs.
*/
export const listarUsuarios = async (req, res) => {
try {
  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('Error al listar usuarios:', error.message);
    return res.status(500).json({ error: error.message });
  }

  // Mostrar en consola del servidor
  console.log('Usuarios en la base de datos:');
  data.users.forEach(user => {
    console.log(`ID: ${user.id}, Email: ${user.email}, Confirmado: ${user.email_confirmed_at ? 'Sí' : 'No'}, Creado: ${user.created_at}`);
  });

  return res.status(200).json({ message: "Usuarios listados en consola.", usuarios: data.users });

} catch (error) {
  console.error('Error en el controlador de listar usuarios:', error.message);
  return res.status(500).json({ error: "Error interno del servidor." });
}
};

/**
 * Controlador para cambiar contraseña de un usuario por email (solo para testing).
 */
export const cambiarContrasenaPorEmail = async (req, res) => {
  try {
    const { correo, nuevaContrasena } = req.body;

    if (!correo || !nuevaContrasena) {
      return res.status(400).json({ error: "Correo y nueva contraseña son obligatorios." });
    }

    // Primero, listar usuarios para encontrar el ID
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Error al listar usuarios:', listError.message);
      return res.status(500).json({ error: listError.message });
    }

    const user = usersData.users.find(u => u.email === correo);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    // Cambiar la contraseña
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: nuevaContrasena
    });

    if (error) {
      console.error('Error al cambiar contraseña:', error.message);
      return res.status(500).json({ error: error.message });
    }

    console.log(`Contraseña cambiada para ${correo}`);
    return res.status(200).json({ message: `Contraseña cambiada exitosamente para ${correo}.` });

  } catch (error) {
    console.error('Error en el controlador de cambiar contraseña:', error.message);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};