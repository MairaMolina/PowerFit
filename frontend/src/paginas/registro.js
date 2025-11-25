// Importamos el servicio y los validadores
import { registrarUsuario } from '../servicios/servicio_autenticacion.js';
import { validarCorreo, validarRequisitosContrasena } from '../utilidades/validar_formulario.js';

// LÓGICA DE RESTRICCIÓN DE EDAD (14 AÑOS)
function calcularFechaMaxima() {
    const edadMinima = 14;
    const hoy = new Date();
    
    // Retrocede la fecha 14 años
    hoy.setFullYear(hoy.getFullYear() - edadMinima);
    
    // Formatear a YYYY-MM-DD
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0'); 
    const dia = String(hoy.getDate()).padStart(2, '0');
    
    return `${anio}-${mes}-${dia}`;
}

/**
 * Aplica la restricción visual al input type="date"
 */
function aplicarRestriccionDeEdad() {
    const inputFecha = document.getElementById('fechaNacimiento');
    const fechaMaxima = calcularFechaMaxima();

    if (inputFecha) {
        inputFecha.setAttribute('max', fechaMaxima);
        console.log(`Restricción de fecha aplicada: El usuario debe haber nacido antes o en ${fechaMaxima}`);
    }
}


document.addEventListener('DOMContentLoaded', () => {
  const formulario = document.getElementById("formulario-registro");
  const contrasenaInput = document.getElementById('contrasena');
  const requisitosLista = document.getElementById('requisitos-contrasena-lista'); // ¡Necesitas añadir esto al HTML!

  // --- Validación en Tiempo Real (CU-07) ---
  if (contrasenaInput && requisitosLista) {
    // Mapea los requisitos a los mensajes
    const mensajes = {
      longitud: "Mínimo 10 caracteres",
      mayuscula: "Al menos una mayúscula",
      minuscula: "Al menos una minúscula",
      numero: "Al menos un número",
      especial: "Al menos un carácter especial (!@#$)"
    };

    contrasenaInput.addEventListener('input', () => {
      const { requisitos } = validarRequisitosContrasena(contrasenaInput.value);
      requisitosLista.innerHTML = ''; // Limpia la lista

      for (const [key, esCumplido] of Object.entries(requisitos)) {
        const li = document.createElement('li');
        li.textContent = mensajes[key];
        // Asigna una clase 'cumplido' o 'no-cumplido' para el CSS
        li.className = esCumplido ? 'cumplido' : 'no-cumplido'; 
        requisitosLista.appendChild(li);
      }
    });
  }


  formulario.addEventListener("submit", async (event) => {
    event.preventDefault(); // Detiene el envío

    // 1. Obtenemos TODOS los valores
    const nombre = document.getElementById("nombreCompleto").value.trim();
    const apellido = document.getElementById("apellidoCompleto").value.trim();
    const genero = document.getElementById("genero").value;
    const fechaNacimiento = document.getElementById('fechaNacimiento').value;
    const correo = document.getElementById("correoElectronico").value.trim();
    const contrasena = document.getElementById("contrasena").value;
    const confirmar = document.getElementById("confirmarContrasena").value;
    const aceptaTerminos = document.getElementById("aceptarTerminos").checked;
    
    // Validación de campos vacíos
    if (!nombre || !apellido || !genero || !fechaNacimiento || !correo || !contrasena || !confirmar) {
    alert("Por favor, completa todos los campos.");
    return; // Detiene la ejecución
    }

    // Validación de Edad Mínima (Lógica de 14 años)
      const fechaMaximaPermitida = calcularFechaMaxima();
      if (fechaNacimiento > fechaMaximaPermitida) {
          alert("Debes tener al menos 14 años para registrarte en Power Fit.");
          return;
      }

    // Validar correo
    if (!validarCorreo(correo)) {
      alert("El formato del correo electrónico no es válido.");
      return; // Detiene la ejecución
    }
    
    // Validar coincidencia (Problema 3)
    if (contrasena !== confirmar) {
      alert("Las contraseñas no coinciden.");
      return; // Detiene la ejecución
    }

    // Validar fortaleza (Problema 2)
    const { esValida } = validarRequisitosContrasena(contrasena);
    if (!esValida) {
      alert("La contraseña no cumple con todos los requisitos de seguridad.");
      return; // Detiene la ejecución
    }

    // Validar términos
    if (!aceptaTerminos) {
      alert("Debes aceptar los términos y condiciones.");
      return; // Detiene la ejecución
    }
    

    // 2. Si todo es válido, preparamos los datos
    const datosRegistro = {
      nombre,
      apellido,
      genero,
      fechaNacimiento,
      correo,
      contrasena
    };

    // (Deshabilitar el botón para evitar doble clic)
    const btnSubmit = formulario.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Creando cuenta...';

    // 3. ¡Llamamos al servicio!
    const { data, error } = await registrarUsuario(datosRegistro);

    if (error) {
      alert("Error al crear la cuenta: " + error.message);
      // Habilitamos el botón otra vez si hay error
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Crear Cuenta';
    } else {
      alert("¡Cuenta creada con éxito!");
      formulario.reset();
      // Redirigir al login
      window.location.href = 'iniciar_sesion.html';
    }
  });
});