import { establecerSesionDesdeUrl, actualizarPassword } from '../config/supabase.js';

// Esperar a que el DOM y Supabase CDN estén cargados
document.addEventListener('DOMContentLoaded', async () => {
  // Manejar el token del reset password desde la URL
  console.log('Iniciando proceso de cambio de contraseña...');
  console.log('Hash completo:', window.location.hash);
  
  const { data, error } = await establecerSesionDesdeUrl();
  
  if (error) {
    console.error('Error al establecer sesión:', error);
    alert('Error al verificar el enlace de reset. Por favor, solicita un nuevo enlace.');
    window.location.href = 'reset_password.html';
    return;
  }
  
  if (data) {
    console.log('Sesión establecida correctamente:', data);
  }

  const formulario = document.getElementById('formulario-cambiar-contrasena');
  const btnSubmit = document.getElementById('btn-cambiar-contrasena');

  // Event listener para el botón volver al login
  document.getElementById('btn-volver-login').addEventListener('click', () => {
    window.location.href = 'iniciar_sesion.html';
  });

  formulario.addEventListener('submit', async (event) => {
    event.preventDefault();
    console.log('Formulario enviado');

    const nuevaContrasena = document.getElementById('nuevaContrasena').value;
    const confirmarContrasena = document.getElementById('confirmarContrasena').value;
    console.log('Nueva contraseña:', nuevaContrasena);
    console.log('Confirmar contraseña:', confirmarContrasena);

    if (!nuevaContrasena || !confirmarContrasena) {
      alert('Por favor, ingresa ambas contraseñas.');
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Cambiando...';

    console.log('Intentando cambiar contraseña...');
    const { data, error } = await actualizarPassword(nuevaContrasena);

    if (error) {
      console.error('Error al cambiar contraseña:', error);
      alert('Error al cambiar la contraseña: ' + error.message);
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Cambiar Contraseña';
    } else {
      console.log('Contraseña cambiada correctamente');
      console.log('Respuesta:', data);
      // Ocultar formulario y mostrar mensaje de éxito
      document.getElementById('formulario-cambiar-contrasena').style.display = 'none';
      document.getElementById('mensaje-exito').style.display = 'block';
    }
  });

  console.log('JS de cambiar contraseña cargado');
});