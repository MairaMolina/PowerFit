// 1. Importamos la NUEVA función de login
import { loginUsuario } from '../servicios/servicio_autenticacion.js';

document.addEventListener('DOMContentLoaded', () => {
  const formularioLogin = document.getElementById('formulario-login'); // Asegúrate que tu <form> tenga este ID
  const btnSubmit = formularioLogin.querySelector('button[type="submit"]');

  formularioLogin.addEventListener('submit', async (event) => {
    event.preventDefault();

    // 2. Obtenemos los datos del formulario
    const correo = document.getElementById('correoElectronico').value; // Asume ID 'correoElectronico'
    const contrasena = document.getElementById('contrasena').value; // Asume ID 'contrasena'

    if (!correo || !contrasena) {
      alert("Por favor, ingresa correo y contraseña.");
      return;
    }

    // (Opcional: deshabilitar botón)
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Ingresando...';

    // 3.Llamamos al servicio
    const { data, error } = await loginUsuario({ correo, contrasena });

    if (error) {
      // 4. Si hay error, mostramos el mensaje real
      alert("Error al iniciar sesión: " + error.message);
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Iniciar Sesión';
    } else {
      // 5. ¡ÉXITO!
      alert("¡Bienvenido!");

      // Guardamos la sesión en localStorage para que el usuario
      // siga conectado en otras páginas.
      localStorage.setItem('supabase.session', JSON.stringify(data.session));

      // Redirigimos al perfil
      window.location.href = 'dashboard_usuario.html'; // O tu página de dashboard
    }
  });
});