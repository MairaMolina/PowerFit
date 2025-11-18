// Importamos el servicio y los validadores
import { registrarUsuario } from '../servicios/servicio_autenticacion.js';
import { validarCorreo, validarRequisitosContrasena } from '../utilidades/validar_formulario.js';

document.addEventListener('DOMContentLoaded', () => {
  const formulario = document.getElementById("formulario-registro");
  const contrasenaInput = document.getElementById('contrasena');
  const requisitosLista = document.getElementById('requisitos-contrasena-lista'); // ¡Necesitas añadir esto al HTML!

  // --- ARREGLO PARA PROBLEMA 2: Validación en Tiempo Real (CU-07) ---
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
  // --- FIN ARREGLO PROBLEMA 2 ---

  formulario.addEventListener("submit", async (event) => {
    event.preventDefault(); // Detiene el envío

    // 1. Obtenemos TODOS los valores
    const nombreCompleto = document.getElementById("nombreCompleto").value.trim();
    const genero = document.getElementById("genero").value;
    const correo = document.getElementById("correoElectronico").value.trim();
    const contrasena = document.getElementById("contrasena").value;
    const confirmar = document.getElementById("confirmarContrasena").value;
    const aceptaTerminos = document.getElementById("aceptarTerminos").checked;
    
    // --- ARREGLO PARA PROBLEMAS 1 y 3: Validaciones ANTES de enviar ---
    
    // Validar campos vacíos (esto previene el error del backend)
    if (!nombreCompleto || !genero || !correo) {
        alert("Por favor, completa todos los campos.");
        return; // Detiene la ejecución
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
    
    // --- FIN ARREGLO ---

    // 2. Si todo es válido, preparamos los datos
    const datosRegistro = {
      nombreCompleto,
      genero,
      correo,
      contrasena
    };

    // (Opcional: Deshabilitar el botón para evitar doble clic)
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
      alert("¡Cuenta creada con éxito! Revisa tu correo para confirmar.");
      formulario.reset();
      // Opcional: Redirigir al login
      // window.location.href = 'iniciar_sesion.html';
    }
  });
});