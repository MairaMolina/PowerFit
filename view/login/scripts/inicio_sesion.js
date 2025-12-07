// 1. Importamos el servicio y el cliente
import { loginUsuario } from '../services/servicio_autenticacion.js';
import { supabase } from '../../../core/services/cliente_supabase.js';

// --- FUNCIONES DE UTILIDAD ---
function mostrarMensaje(mensaje, tipo = 'error') {
  const contenedor = document.getElementById('mensaje-contenedor');
  if (!contenedor) return;

  contenedor.className = '';
  contenedor.innerHTML = mensaje;

  if (tipo === 'exito') {
    contenedor.classList.add('mensaje-exito');
  } else {
    contenedor.classList.add('mensaje-error');
  }
  contenedor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  contenedor.classList.remove('mensaje-oculto');
}

function ocultarMensaje() {
  const contenedor = document.getElementById('mensaje-contenedor');
  if (contenedor) {
    contenedor.className = 'mensaje-oculto';
    contenedor.innerHTML = '';
  }
}

function procesarErrorSupabase(error) {
  if (!error) return 'Ha ocurrido un error inesperado.';
  const msg = error.message || '';
  if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (msg.includes('Email not confirmed')) return 'Por favor, confirma tu correo primero.';
  return 'No se pudo iniciar sesión. Verifica tus datos.';
}

// --- DOM LOAD ---
document.addEventListener('DOMContentLoaded', () => {
  const formularioLogin = document.getElementById('formulario-login');
  const btnSubmit = document.getElementById('btn-iniciar-sesion');
  
  // Toggle Contraseña
  const toggleContrasena = document.getElementById('toggle-contrasena');
  const contrasenaInput = document.getElementById('contrasena');
  if (toggleContrasena) {
    toggleContrasena.addEventListener('click', () => {
      const tipo = contrasenaInput.type === 'password' ? 'text' : 'password';
      contrasenaInput.type = tipo;
      toggleContrasena.classList.toggle('fa-eye');
      toggleContrasena.classList.toggle('fa-eye-slash');
    });
  }

  // --- SUBMIT DEL FORMULARIO ---
  formularioLogin.addEventListener('submit', async (event) => {
    event.preventDefault();
    ocultarMensaje();

    const correo = document.getElementById('correoElectronico').value.trim();
    const contrasena = document.getElementById('contrasena').value;

    if (!correo || !contrasena) {
      mostrarMensaje("Por favor, ingresa correo y contraseña.", "error");
      return;
    }

    // UI Carga
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Verificando...';

    // 1. INICIAR SESIÓN (AUTH)
    console.log('Login: Autenticando usuario...');
    const { data: authData, error: authError } = await loginUsuario({ correo, contrasena });

    if (authError) {
      console.error('Login: Error de Auth:', authError);
      mostrarMensaje(procesarErrorSupabase(authError), "error");
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Iniciar Sesión';
      return;
    }

    // 2. VERIFICAR ROL (BASE DE DATOS)
    try {
        console.log('Login: Éxito. Consultando rol para ID:', authData.user.id);
        
        // Consultamos la tabla 'usuarios' para ver el campo 'rol'
        const { data: usuarioData, error: rolError } = await supabase
            .from('usuarios')
            .select('rol')
            .eq('id', authData.user.id)
            .single();

        if (rolError) {
            // Si no tiene perfil o falla la consulta, asumimos usuario normal por seguridad
            console.warn('Login: No se pudo obtener rol, asumiendo usuario normal.', rolError);
            redirigirUsuario('usuario'); 
        } else {
            const rol = usuarioData.rol || 'usuario';
            console.log('Login: Rol detectado ->', rol);
            redirigirUsuario(rol);
        }

    } catch (err) {
        console.error('Login: Error inesperado validando rol:', err);
        // En caso de error grave, mandamos al dashboard normal
        redirigirUsuario('usuario');
    }
  });
});

/**
 * Redirige al usuario según su rol
 * @param {string} rol - 'admin' o 'usuario'
 */
function redirigirUsuario(rol) {
    mostrarMensaje(`¡Bienvenido! Ingresando como ${rol}...`, "exito");
    
    setTimeout(() => {
        if (rol === 'admin') {
            // 🔴 RUTA DEL ADMIN (Asegúrate que esta ruta exista)
            window.location.href = '../../view/admin/crud_admin.html'; 
        } else {
            // 🟢 RUTA DEL USUARIO NORMAL
            window.location.href = '../../view/dashboard/dashboard_usuario.html';
        }
    }, 1000);
}