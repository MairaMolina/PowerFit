// 1. Importamos la NUEVA función de login
import { loginUsuario } from '../services/servicio_autenticacion.js';

/**
 * Muestra un mensaje en la interfaz de usuario
 * @param {string} mensaje - Mensaje a mostrar (puede contener HTML)
 * @param {string} tipo - 'error' o 'exito'
 */
function mostrarMensaje(mensaje, tipo = 'error') {
  const contenedor = document.getElementById('mensaje-contenedor');
  if (!contenedor) return;

  // Limpiar clases anteriores
  contenedor.className = '';
  contenedor.innerHTML = mensaje; // Usar innerHTML para soportar enlaces HTML

  // Agregar clase según el tipo
  if (tipo === 'exito') {
    contenedor.classList.add('mensaje-exito');
  } else {
    contenedor.classList.add('mensaje-error');
  }

  // Hacer scroll hacia el mensaje
  contenedor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Oculta el mensaje de la interfaz
 */
function ocultarMensaje() {
  const contenedor = document.getElementById('mensaje-contenedor');
  if (contenedor) {
    contenedor.className = 'mensaje-oculto';
    contenedor.innerHTML = '';
  }
}

/**
 * Procesa errores de Supabase y retorna mensajes amigables
 * @param {Object} error - Error de Supabase
 * @returns {string} Mensaje amigable para el usuario
 */
function procesarErrorSupabase(error) {
  if (!error) return 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.';

  const mensajesError = {
    'Invalid login credentials': 'Correo electrónico o contraseña incorrectos.',
    'Email not confirmed': 'Por favor, confirma tu correo electrónico antes de iniciar sesión.',
  };

  const errorMessage = error.message || '';

  for (const [key, value] of Object.entries(mensajesError)) {
    if (errorMessage.includes(key)) {
      return value;
    }
  }

  console.error('Error de login:', error);
  return 'No se pudo iniciar sesión. Por favor, verifica tus datos.';
}

document.addEventListener('DOMContentLoaded', () => {
  const formularioLogin = document.getElementById('formulario-login');
  const btnSubmit = document.getElementById('btn-iniciar-sesion');
  const toggleContrasena = document.getElementById('toggle-contrasena');
  const contrasenaInput = document.getElementById('contrasena');

  // Funcionalidad mostrar/ocultar contraseña
  if (toggleContrasena) {
    toggleContrasena.addEventListener('click', () => {
      const tipo = contrasenaInput.type === 'password' ? 'text' : 'password';
      contrasenaInput.type = tipo;
      toggleContrasena.classList.toggle('fa-eye');
      toggleContrasena.classList.toggle('fa-eye-slash');
    });
  }

  formularioLogin.addEventListener('submit', async (event) => {
    event.preventDefault();
    ocultarMensaje();

    // 2. Obtenemos los datos del formulario
    const correo = document.getElementById('correoElectronico').value.trim();
    const contrasena = document.getElementById('contrasena').value;

    if (!correo || !contrasena) {
      mostrarMensaje("Por favor, ingresa correo y contraseña.", "error");
      return;
    }

    // (Opcional: deshabilitar botón)
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Ingresando...';

    // 3.Llamamos al servicio
    const { data, error } = await loginUsuario({ correo, contrasena });

    if (error) {
      // 4. Si hay error, mostramos el mensaje real
      const mensajeAmigable = procesarErrorSupabase(error);
      mostrarMensaje(mensajeAmigable, "error");
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Iniciar Sesión';
    } else {
      // 5. ¡ÉXITO!
      mostrarMensaje("¡Bienvenido! Redirigiendo...", "exito");

      // Redirigimos al dashboard
      setTimeout(() => {
        window.location.href = '../../view/dashboard/dashboard_usuario.html';
      }, 800);
    }
  });
});