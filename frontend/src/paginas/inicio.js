// Puedes agregar interacciones aquí más adelante
console.log('Inicio cargado correctamente');

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
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
