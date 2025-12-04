// Importamos el servicio y los validadores
import { registrarUsuario } from '../../registrer/services/servicio_autenticacion.js';
import { validarCorreo, validarRequisitosContrasena } from '../../../old/frontend/src/utilidades/validar_formulario.js';

/**
 * Muestra un mensaje en la interfaz de usuario
 * @param {string} mensaje - Mensaje a mostrar (puede contener HTML)
 * @param {string} tipo - 'error' o 'exito'
 */
function mostrarMensaje(mensaje, tipo = 'error') {
  const contenedor = document.getElementById('mensaje-contenedor');
  if (!contenedor) return;

  // Limpiar clases anteriores
  contenedor.className = '';
  contenedor.innerHTML = mensaje; // Usar innerHTML para soportar enlaces HTML

  // Agregar clase según el tipo
  if (tipo === 'exito') {
    contenedor.classList.add('mensaje-exito');
  } else {
    contenedor.classList.add('mensaje-error');
  }

  // Hacer scroll hacia el mensaje
  contenedor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Oculta el mensaje de la interfaz
 */
function ocultarMensaje() {
  const contenedor = document.getElementById('mensaje-contenedor');
  if (contenedor) {
    contenedor.className = 'mensaje-oculto';
    contenedor.innerHTML = '';
  }
}

/**
 * Procesa errores de Supabase y retorna mensajes amigables
 * @param {Object} error - Error de Supabase
 * @returns {string} Mensaje amigable para el usuario
 */
function procesarErrorSupabase(error) {
  if (!error) return 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.';

  // Mensajes amigables según el código de error
  const mensajesError = {
    'User already registered': 'Este correo electrónico ya está registrado. <a href="../../login/iniciar_sesion.html" style="color: #0077cc; font-weight: bold; text-decoration: underline;">Iniciar sesión aquí</a>',
    'Invalid email': 'El formato del correo electrónico no es válido.',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
    'Email rate limit exceeded': 'Has intentado registrarte muchas veces. Por favor, espera unos minutos.',
    'Signup disabled': 'El registro está temporalmente deshabilitado. Intenta más tarde.',
    'duplicate key': 'Este correo electrónico ya está registrado.',
    'permission denied': 'No tienes permisos para crear una cuenta. Contacta con soporte.',
  };

  // Buscar mensaje específico
  const errorMessage = error.message || error.toString() || '';
  const errorCode = error.code || '';

  for (const [key, value] of Object.entries(mensajesError)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase()) || errorCode.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // Si no hay un mensaje específico, mostrar uno genérico (sin detalles técnicos)
  console.error('Error de registro:', error); // Mantener en consola para debugging
  return 'No se pudo completar el registro. Por favor, verifica tus datos e intenta nuevamente.';
}

// LÓGICA DE RESTRICCIÓN DE EDAD (14 AÑOS)
function calcularFechaMaxima() {
  const edadMinima = 14;
  const hoy = new Date();

  // Retrocede la fecha 14 años
  hoy.setFullYear(hoy.getFullYear() - edadMinima);

  return hoy;
}

/**
 * Aplica la restricción visual al input type="date" usando Flatpickr
 */
function aplicarRestriccionDeEdad() {
  const inputFecha = document.getElementById('fechaNacimiento');
  const botonCalendario = document.getElementById('boton-calendario'); // Referencia al icono
  const fechaMaxima = calcularFechaMaxima();

  if (inputFecha && typeof flatpickr !== 'undefined') {
    
    const fp = flatpickr(inputFecha, {
      locale: 'es',
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: "d/m/Y",
      allowInput: true,
      clickOpens: false, 
      placeholder: "DD/MM/AAAA",
      maxDate: fechaMaxima,
      disableMobile: "true",
      closeOnSelect: true,
      
      // 🔥 LA SOLUCIÓN MÁGICA 🔥
      // Esto le dice a Flatpickr: "Si toco este elemento, NO hagas el auto-cierre"
      ignoredFocusElements: [botonCalendario], 

      onReady: function(selectedDates, dateStr, instance) {
        const inputVisual = instance.altInput;

        // --- TU LÓGICA DE MÁSCARA (SE MANTIENE IGUAL) ---
        inputVisual.addEventListener('input', function(e) {
          if (e.inputType === 'deleteContentBackward') return;
          let valor = this.value.replace(/\D/g, '');
          if (valor.length > 8) valor = valor.substring(0, 8);

          let dia = ''; let mes = ''; let anio = '';

          // Día
          if (valor.length >= 1) {
             dia = valor.substring(0, 2);
             if (dia.length === 2 && parseInt(dia) > 31) dia = "31";
             if (dia.length === 1 && parseInt(dia) > 3) dia = "0" + dia; 
          }
          // Mes
          if (valor.length >= 3) {
             mes = valor.substring(2, 4);
             if (mes.length === 2 && parseInt(mes) > 12) mes = "12";
             if (mes.length === 1 && parseInt(mes) > 1) mes = "0" + mes;
          }
          // Año
          if (valor.length >= 5) anio = valor.substring(4, 8);

          let valorFinal = dia;
          if (valor.length >= 3 || (dia.length === 2 && valor.length > 2)) valorFinal += '/' + mes;
          if (valor.length >= 5 || (mes.length === 2 && valor.length > 4)) valorFinal += '/' + anio;

          this.value = valorFinal;
        });
      },
      
      onChange: function (selectedDates, dateStr, instance) {
        inputFecha.dispatchEvent(new Event('change'));
      }
    });

    // Evento del icono para abrir/cerrar
    if (botonCalendario) {
        botonCalendario.addEventListener('click', (e) => {
            e.preventDefault(); 
            // Ya no necesitamos stopPropagation, usamos toggle() directo
            fp.toggle(); 
        });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const formulario = document.getElementById("formulario-registro");
  const contrasenaInput = document.getElementById('contrasena');
  const requisitosLista = document.getElementById('requisitos-contrasena-lista');

  // Elementos de pasos
  const paso1 = document.getElementById('paso-1');
  const paso2 = document.getElementById('paso-2');
  const btnSiguiente = document.getElementById('btn-siguiente');
  const btnAtras = document.getElementById('btn-atras');

  // Aplicar restricción de edad
  aplicarRestriccionDeEdad();

  // --- Funcionalidad de Mostrar/Ocultar Contraseña ---
  const toggleContrasena = document.getElementById('toggle-contrasena');
  const toggleConfirmar = document.getElementById('toggle-confirmar');
  const confirmarInput = document.getElementById('confirmarContrasena');

  if (toggleContrasena) {
    toggleContrasena.addEventListener('click', () => {
      const tipo = contrasenaInput.type === 'password' ? 'text' : 'password';
      contrasenaInput.type = tipo;
      toggleContrasena.classList.toggle('fa-eye');
      toggleContrasena.classList.toggle('fa-eye-slash');
    });
  }

  if (toggleConfirmar) {
    toggleConfirmar.addEventListener('click', () => {
      const tipo = confirmarInput.type === 'password' ? 'text' : 'password';
      confirmarInput.type = tipo;
      toggleConfirmar.classList.toggle('fa-eye');
      toggleConfirmar.classList.toggle('fa-eye-slash');
    });
  }

 const feedbackCoincidencia = document.getElementById('feedback-coincidencia');

  // Configuración de reglas
  const mensajes = {
      longitud: "Mínimo 10 caracteres",
      mayuscula: "Al menos una mayúscula",
      minuscula: "Al menos una minúscula",
      numero: "Al menos un número",
      especial: "Al menos un carácter especial (!@#$)"
  };

  // 1. Inicializar lista (oculta pero creada)
  const inicializarLista = () => {
      if (!requisitosLista) return;
      requisitosLista.innerHTML = '';
      for (const [key, texto] of Object.entries(mensajes)) {
          const li = document.createElement('li');
          li.id = `req-${key}`;
          // Estado inicial: Círculo vacío (fa-circle) y texto gris
          li.innerHTML = `<i class="far fa-circle"></i> ${texto}`;
          requisitosLista.appendChild(li);
      }
  };
  inicializarLista();

  // --- LÓGICA CAMPO CONTRASEÑA ---

  if (contrasenaInput) {
      // A. Mostrar lista apenas se pulsa (focus)
      contrasenaInput.addEventListener('focus', () => {
          requisitosLista.classList.add('mostrar-ayuda');
      });

      // B. Validar mientras escribe
      contrasenaInput.addEventListener('input', () => {
          const { requisitos } = validarRequisitosContrasena(contrasenaInput.value);

          for (const [key, esCumplido] of Object.entries(requisitos)) {
              if (mensajes[key]) {
                  const li = document.getElementById(`req-${key}`);
                  if (li) {
                      if (esCumplido) {
                          // CUMPLE: Chulito verde relleno
                          li.className = 'cumplido';
                          li.innerHTML = `<i class="fas fa-check-circle"></i> ${mensajes[key]}`;
                      } else {
                          // NO CUMPLE: Círculo vacío
                          li.className = '';
                          li.innerHTML = `<i class="far fa-circle"></i> ${mensajes[key]}`;
                      }
                  }
              }
          }
          
          // Si ya hay algo en confirmar, re-validar coincidencia
          if (confirmarInput.value.length > 0) validarCoincidencia();
      });
  }

  // --- LÓGICA CAMPO CONFIRMAR ---

  if (confirmarInput) {
      // A. Mostrar mensaje apenas se pulsa (focus)
      confirmarInput.addEventListener('focus', () => {
          feedbackCoincidencia.classList.add('mostrar-ayuda');
          validarCoincidencia(); // Validar inmediatamente por si ya había texto
      });

      // B. Validar mientras escribe
      confirmarInput.addEventListener('input', validarCoincidencia);
  }

  function validarCoincidencia() {
      const pass = contrasenaInput.value;
      const confirm = confirmarInput.value;

      // Si está vacío, no mostramos iconos feos, solo mensaje neutral o vacío
      if (confirm.length === 0) {
          feedbackCoincidencia.innerHTML = '';
          return;
      }

      if (pass === confirm) {
          // COINCIDEN: Chulito verde
          feedbackCoincidencia.innerHTML = '<i class="fas fa-check-circle"></i> Las contraseñas coinciden';
          feedbackCoincidencia.className = 'feedback-text texto-coincide mostrar-ayuda';
      } else {
          // NO COINCIDEN: Círculo con X (o solo texto rojo)
          feedbackCoincidencia.innerHTML = '<i class="fas fa-times-circle"></i> Las contraseñas no coinciden';
          feedbackCoincidencia.className = 'feedback-text texto-no-coincide mostrar-ayuda';
      }
  }

  // --- Navegación entre Pasos ---

  btnSiguiente.addEventListener('click', () => {
    ocultarMensaje();

    // Validar Paso 1
    const nombre = document.getElementById("nombreCompleto").value.trim();
    const apellido = document.getElementById("apellidoCompleto").value.trim();
    const genero = document.getElementById("genero").value;
    const fechaNacimiento = document.getElementById('fechaNacimiento').value;
    const correo = document.getElementById("correoElectronico").value.trim();
    const contrasena = document.getElementById("contrasena").value;
    const confirmar = document.getElementById("confirmarContrasena").value;

    if (!nombre || !apellido || !genero || !fechaNacimiento || !correo || !contrasena || !confirmar) {
      mostrarMensaje("Por favor, completa todos los campos.", "error");
      return;
    }

    // Validar Edad
    const fechaMaximaPermitida = calcularFechaMaxima();
    const fechaSeleccionada = new Date(fechaNacimiento);
    if (fechaSeleccionada > fechaMaximaPermitida) {
      mostrarMensaje("Debes tener al menos 14 años para registrarte en Power Fit.", "error");
      return;
    }

    // Validar Correo
    if (!validarCorreo(correo)) {
      mostrarMensaje("El formato del correo electrónico no es válido.", "error");
      return;
    }

    // Validar Contraseñas
    if (contrasena !== confirmar) {
      mostrarMensaje("Las contraseñas no coinciden.", "error");
      return;
    }

    const { esValida } = validarRequisitosContrasena(contrasena);
    if (!esValida) {
      mostrarMensaje("La contraseña no cumple con todos los requisitos de seguridad.", "error");
      return;
    }

    // Si todo ok, pasar al paso 2
    paso1.classList.add('paso-oculto');
    paso2.classList.remove('paso-oculto');
  });

  btnAtras.addEventListener('click', () => {
    ocultarMensaje();
    paso2.classList.add('paso-oculto');
    paso1.classList.remove('paso-oculto');
  });


  // --- Envío del Formulario ---
  formulario.addEventListener("submit", async (event) => {
    event.preventDefault();
    ocultarMensaje();

    // Recopilar datos Paso 1 (ya validados, pero los tomamos de nuevo)
    const nombre = document.getElementById("nombreCompleto").value.trim();
    const apellido = document.getElementById("apellidoCompleto").value.trim();
    const genero = document.getElementById("genero").value;
    const fechaNacimiento = document.getElementById('fechaNacimiento').value;
    const correo = document.getElementById("correoElectronico").value.trim();
    const contrasena = document.getElementById("contrasena").value;

    // Recopilar datos Paso 2
    const peso = document.getElementById('peso').value;
    const altura = document.getElementById('altura').value;
    const nivelActividad = document.getElementById('nivelActividad').value;
    const aceptaTerminos = document.getElementById("aceptarTerminos-paso1").checked;

    // Checkboxes y Radios
    const objetivos = Array.from(document.querySelectorAll('input[name="objetivos"]:checked')).map(cb => cb.value);
    const preferencias = Array.from(document.querySelectorAll('input[name="preferencias"]:checked')).map(cb => cb.value);
    const dietaRadio = document.querySelector('input[name="dietaSaludable"]:checked');
    const dietaSaludable = dietaRadio ? (dietaRadio.value === 'si') : null;

    // Validaciones Paso 2
    if (!peso || !altura || !nivelActividad) {
      mostrarMensaje("Por favor, completa la información física y nivel de actividad.", "error");
      return;
    }

    if (objetivos.length === 0) {
      mostrarMensaje("Selecciona al menos un objetivo.", "error");
      return;
    }

    if (preferencias.length === 0) {
      mostrarMensaje("Selecciona al menos una preferencia de ejercicio.", "error");
      return;
    }

    if (dietaSaludable === null) {
      mostrarMensaje("Indica si incluyes alimentos saludables en tu dieta.", "error");
      return;
    }

    if (!aceptaTerminos) {
      mostrarMensaje("Debes aceptar los términos y condiciones.", "error");
      return;
    }

    // Preparar objeto de datos
    const datosRegistro = {
      nombre,
      apellido,
      genero,
      fechaNacimiento,
      correo,
      contrasena,
      peso,
      altura,
      objetivos,
      nivelActividad,
      preferenciasEjercicio: preferencias,
      dietaSaludable
    };

    // Deshabilitar botón
    const btnSubmit = document.getElementById('btn-crear-cuenta');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Creando cuenta...';

    // Llamar al servicio
    const { data, error } = await registrarUsuario(datosRegistro);

    if (error) {
      const mensajeAmigable = procesarErrorSupabase(error);
      mostrarMensaje(mensajeAmigable, "error");
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Crear Cuenta';
    } else {
      mostrarMensaje("¡Cuenta creada con éxito! Redirigiendo al login...", "exito");
      formulario.reset();
      // Volver al paso 1 visualmente por si acaso
      paso2.classList.add('paso-oculto');
      paso1.classList.remove('paso-oculto');

      setTimeout(() => {
        window.location.href = '../../view/login/iniciar_sesion.html';
      }, 1000);
    }
  });
});
