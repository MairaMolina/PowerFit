import {
  actualizarUISegunSesion,
  cerrarSesion,
  obtenerUsuarioActual
} from '../../../core/services/gestion_sesion.js';

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {

  // --- Lógica de Sesión ---

  // Actualizar UI según estado de autenticación
  await actualizarUISegunSesion({
    mostrarSiAutenticado: ['link-logout'],
    ocultarSiAutenticado: ['link-registro', 'link-login']
  });

  // Obtener información del usuario si está logueado
  const usuario = await obtenerUsuarioActual();
  if (usuario) {
    console.log('Usuario logueado:', usuario.email);
  }

  // Manejar Logout
  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      const { success, error } = await cerrarSesion();
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
