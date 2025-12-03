// view/shared/scripts/header_usuario.js
export function aplicarAvatarHeader() {
    const raw = localStorage.getItem('pf.avatar');
    if (!raw) return;
  
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }
  
    const nombreCompleto = data.nombre_completo || 'Usuario';
    const iniciales = nombreCompleto.trim().split(' ')
      .map(p => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  
    const img = document.getElementById('fotoPerfilHeader');
    const spanIni = document.getElementById('inicialesHeader');
    const spanNombre = document.getElementById('nombreUsuario');
  
    if (spanNombre) spanNombre.textContent = nombreCompleto;
  
    if (data.avatar_url && img) {
      img.src = data.avatar_url;
      img.style.display = 'block';
      if (spanIni) spanIni.style.display = 'none';
    } else {
      if (img) img.style.display = 'none';
      if (spanIni) {
        spanIni.style.display = 'block';
        spanIni.textContent = iniciales;
      }
    }
  }