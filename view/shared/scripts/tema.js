// view/shared/scripts/tema.js
export function inicializarTema(botonId = 'botonTema') {
    const btnTema = document.getElementById(botonId);
    if (!btnTema) return;
  
    const icono = btnTema.querySelector('i');
  
    // Aplicar tema guardado al cargar
    const temaGuardado = localStorage.getItem('tema');
    if (temaGuardado === 'oscuro') {
      document.body.classList.add('tema-oscuro');
      if (icono) {
        icono.classList.remove('fa-moon');
        icono.classList.add('fa-sun');
      }
    }
  
    btnTema.addEventListener('click', () => {
      const oscuro = !document.body.classList.contains('tema-oscuro');
      document.body.classList.toggle('tema-oscuro', oscuro);
  
      if (icono) {
        if (oscuro) {
          icono.classList.remove('fa-moon');
          icono.classList.add('fa-sun');
        } else {
          icono.classList.remove('fa-sun');
          icono.classList.add('fa-moon');
        }
      }
  
      localStorage.setItem('tema', oscuro ? 'oscuro' : 'claro');
    });
  }