// Inicializar Supabase en el frontend
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iinbzpqjxpciivcomruk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpbmJ6cHFqeHBjaWl2Y29tcnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODY0MzMsImV4cCI6MjA3Nzg2MjQzM30.28XteWZXIqx1ZscSSwUND8x4YRn9B3ytNVfiHl-wY0s';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

document.addEventListener('DOMContentLoaded', async () => {
  // Manejar el token del reset password desde la URL
  const hash = window.location.hash.substring(1); // Remover el #
  console.log('Hash completo:', window.location.hash);
  console.log('Hash sin #:', hash);
  if (hash) {
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    console.log('Access token:', accessToken);
    console.log('Refresh token:', refreshToken);
    if (accessToken && refreshToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      if (error) {
        console.error('Error al establecer sesión:', error);
        alert('Error al verificar el enlace de reset.');
        return;
      }
      console.log('Sesión establecida:', data);
    } else {
      console.log('No se encontraron tokens en el hash');
    }
  } else {
    console.log('No hay hash en la URL');
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
    const { data, error } = await supabase.auth.updateUser({
      password: nuevaContrasena
    });

    if (error) {
      console.error('Error en updateUser:', error);
      alert('Error al cambiar la contraseña: ' + error.message);
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Cambiar Contraseña';
    } else {
      console.log('cambio correctamente contraseña');
      console.log('Respuesta de updateUser:', data);
      // Ocultar formulario y mostrar mensaje de éxito
      document.getElementById('formulario-cambiar-contrasena').style.display = 'none';
      document.getElementById('mensaje-exito').style.display = 'block';
    }
  });

  console.log('JS de cambiar contraseña cargado');
});