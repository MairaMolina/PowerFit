// Importamos la función de reset
import { solicitarResetPassword } from '../servicios/servicio_autenticacion.js';

document.addEventListener('DOMContentLoaded', () => {
  const formularioReset = document.getElementById('formulario-reset');
  const btnSubmit = formularioReset.querySelector('button[type="submit"]');

  formularioReset.addEventListener('submit', async (event) => {
    event.preventDefault();

    const correo = document.getElementById('correoElectronico').value;

    if (!correo) {
      alert("Por favor, ingresa tu correo electrónico.");
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Enviando...';

    const { data, error } = await solicitarResetPassword({ correo });

    if (error) {
      alert("Error al enviar el enlace: " + error.message);
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Enviar Enlace';
    } else {
      alert("Enlace de reset enviado a tu correo.");
      // Redirigir a iniciar sesión
      window.location.href = 'iniciar_sesion.html';
    }
  });
});