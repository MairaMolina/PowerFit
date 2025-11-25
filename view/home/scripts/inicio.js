import { supabase } from '../../../core/services/cliente_supabase.js';

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {

  // --- Lógica de Sesión ---
  const linkRegistro = document.getElementById('link-registro');
  const linkLogin = document.getElementById('link-login');
  const linkLogout = document.getElementById('link-logout');
  const btnLogout = document.getElementById('btn-logout');

  // Verificar sesión actual
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    // Usuario logueado
    if (linkRegistro) linkRegistro.style.display = 'none';
    if (linkLogin) linkLogin.style.display = 'none';
    if (linkLogout) linkLogout.style.display = 'block';
    console.log('Usuario logueado:', session.user.email);
  } else {
    // Usuario no logueado
    if (linkRegistro) linkRegistro.style.display = 'block';
    if (linkLogin) linkLogin.style.display = 'block';
    if (linkLogout) linkLogout.style.display = 'none';
  }

  // Manejar Logout
  if (btnLogout) {
    btnLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión');
      } else {
        // Recargar página para actualizar UI
        window.location.reload();
      }
    });
  }

  // --- Funcionalidades Visuales Originales ---

  // Confirmar que el footer se cargó
  const footer = document.querySelector('footer');
  if (footer) {
    console.log('Footer cargado correctamente');
  }

  // Mostrar mensaje al pasar el mouse sobre botones
  const botones = document.querySelectorAll('.boton');
  botones.forEach(boton => {
    boton.addEventListener('mouseenter', () => {
      console.log(`Estás sobre el botón: ${boton.textContent}`);
    });
  });

  // Confirmar carga de imágenes
  const imagenes = document.querySelectorAll('img');
  imagenes.forEach(img => {
    img.addEventListener('load', () => {
      console.log(`Imagen cargada: ${img.src}`);
    });
  });

  // Scroll suave al inicio (opcional)
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});
