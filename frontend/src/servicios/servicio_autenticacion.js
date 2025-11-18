// La URL del backend
const API_URL = 'http://localhost:3000/api';

/**
 * Registra un nuevo usuario llamando al backend.
 * @param {object} datosRegistro - Objeto con { correo, contrasena, nombreCompleto, genero }
 * @returns {object} - { data, error }
 */
export async function registrarUsuario(datosRegistro) {
  try {
    const response = await fetch(`${API_URL}/registro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datosRegistro),
    });

    const data = await response.json();

    if (!response.ok) {
      // Si el servidor respondió con un error (400, 500)
      // 'data.error' tendrá el mensaje que enviamos desde el controlador
      throw new Error(data.error || 'Error al registrar');
    }

    // El 'data' aquí es el { message, data } que enviamos
    // desde el controlador
    return { data: data.data, error: null };

  } catch (error) {
    console.error('Error en servicio de autenticación:', error.message);
    // Devolvemos el error en el formato que espera la página
    return { data: null, error: error };
  }
}

// ... (tu constante API_URL y tu función 'registrarUsuario' están aquí) ...

/**
 * Inicia sesión de un usuario llamando al backend.
 * @param {object} datosLogin - Objeto con { correo, contrasena }
 * @returns {object} - { data, error }
 */
export async function loginUsuario(datosLogin) {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datosLogin),
    });

    const data = await response.json();

    if (!response.ok) {
      // Si el servidor respondió con un error (401, 500)
      throw new Error(data.error || 'Error al iniciar sesión');
    }

    // 'data' es el { message, session } que enviamos
    return { data: data, error: null };

  } catch (error) {
    console.error('Error en servicio de autenticación (login):', error.message);
    return { data: null, error: error };
  }
}