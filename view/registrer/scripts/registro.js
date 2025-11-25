// Importamos el servicio y los validadores
import { registrarUsuario } from '../services/servicio_autenticacion.js';
import { validarCorreo, validarRequisitosContrasena } from '../../../frontend/src/utilidades/validar_formulario.js';

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
  };

  // Buscar mensaje específico
  const errorMessage = error.message || '';

  for (const [key, value] of Object.entries(mensajesError)) {
    if (errorMessage.includes(key)) {
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
  const fechaMaxima = calcularFechaMaxima();

  if (inputFecha && typeof flatpickr !== 'undefined') {
    // Inicializar Flat pickr con configuración personalizada
    flatpickr(inputFecha, {
      locale: 'es', // Español
      dateFormat: 'Y-m-d', // Formato YYYY-MM-DD
      maxDate: fechaMaxima, // Restricción de 14 años
      defaultDate: null,
      allowInput: false, // No permitir entrada manual
      disableMobile: false, // Usar en móviles también
      monthSelectorType: 'dropdown', // Selector de mes tipo dropdown
      yearSelectorRange: 100, // Mostrar 100 años hacia atrás
      onChange: function (selectedDates, dateStr, instance) {
        // Trigger change event para validaciones
        inputFecha.dispatchEvent(new Event('change'));
      }
    });
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

  // --- Validación en Tiempo Real (CU-07) ---
  if (contrasenaInput && requisitosLista) {
    const mensajes = {
      longitud: "Mínimo 10 caracteres",
      mayuscula: "Al menos una mayúscula",
      minuscula: "Al menos una minúscula",
      numero: "Al menos un número",
      especial: "Al menos un carácter especial (!@#$)"
    };

    contrasenaInput.addEventListener('input', () => {
      const { requisitos } = validarRequisitosContrasena(contrasenaInput.value);
      requisitosLista.innerHTML = '';

      for (const [key, esCumplido] of Object.entries(requisitos)) {
        const li = document.createElement('li');
        li.textContent = mensajes[key];
        li.className = esCumplido ? 'cumplido' : 'no-cumplido';
        requisitosLista.appendChild(li);
      }
    });
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
      mostrarMensaje("Por favor, completa todos los campos del paso 1.", "error");
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
    const aceptaTerminos = document.getElementById("aceptarTerminos").checked;

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
        window.location.href = '../../login/iniciar_sesion.html';
      }, 2000);
    }
  });
});
