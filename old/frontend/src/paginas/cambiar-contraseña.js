import { establecerSesionDesdeUrl, actualizarPassword } from '../config/supabase.js';

// --- FUNCIÓN DE AYUDA PARA VALIDAR ---
function validarRequisitosContrasena(password) {
    const requisitos = {
        longitud: password.length >= 10,
        mayuscula: /[A-Z]/.test(password),
        minuscula: /[a-z]/.test(password),
        numero: /[0-9]/.test(password),
        especial: /[!@#$]/.test(password) // Ajusta estos caracteres si necesitas más
    };
    // Devuelve true solo si TODAS las reglas son true
    const esValido = Object.values(requisitos).every(Boolean);
    return { requisitos, esValido };
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Iniciando script de cambio de contraseña...');

    // 1. Verificar Sesión (Supabase)
    const { data, error } = await establecerSesionDesdeUrl();

    if (error) {
        await Swal.fire({
            icon: 'error',
            title: 'Enlace caducado',
            text: 'Este enlace ya no es válido. Solicita uno nuevo.',
            allowOutsideClick: false
        });
        window.location.href = '/view/login/reset_password.html'; 
        return;
    }

    // --- REFERENCIAS AL DOM ---
    const form = document.getElementById('formulario-cambiar-contrasena');
    const btnSubmit = document.getElementById('btn-cambiar-contrasena');
    
    // Inputs
    const inputPass = document.getElementById('nuevaContrasena');
    const inputConfirm = document.getElementById('confirmarContrasena');
    
    // Iconos de Ojo
    const togglePass = document.getElementById('toggle-contrasena');
    const toggleConfirm = document.getElementById('toggle-confirmar');
    
    // Áreas de Feedback Visual
    const listaRequisitos = document.getElementById('lista-requisitos');
    const feedbackCoincidencia = document.getElementById('feedback-coincidencia');

    // Textos de reglas
    const mensajes = {
        longitud: "Mínimo 10 caracteres",
        mayuscula: "Al menos una mayúscula",
        minuscula: "Al menos una minúscula",
        numero: "Al menos un número",
        especial: "Al menos un carácter (!@#$)"
    };

    // --- 2. LÓGICA DE MOSTRAR/OCULTAR (OJITO) ---
    const alternarVisibilidad = (input, icono) => {
        const tipo = input.type === 'password' ? 'text' : 'password';
        input.type = tipo;
        // Cambia el icono de ojo abierto a cerrado (requiere FontAwesome)
        icono.classList.toggle('fa-eye');
        icono.classList.toggle('fa-eye-slash');
    };

    if (togglePass) togglePass.addEventListener('click', () => alternarVisibilidad(inputPass, togglePass));
    if (toggleConfirm) toggleConfirm.addEventListener('click', () => alternarVisibilidad(inputConfirm, toggleConfirm));

    // --- 3. LÓGICA DE VALIDACIÓN VISUAL (LISTA) ---
    
    // Crear la lista vacía al inicio
    const inicializarLista = () => {
        if (!listaRequisitos) return;
        listaRequisitos.innerHTML = '';
        for (const [key, texto] of Object.entries(mensajes)) {
            const li = document.createElement('li');
            li.id = `req-${key}`;
            li.innerHTML = `<i class="far fa-circle"></i> ${texto}`; // Círculo vacío
            listaRequisitos.appendChild(li);
        }
    };
    inicializarLista();

    // Evento al escribir en Contraseña
    if (inputPass) {
        inputPass.addEventListener('input', () => {
            const { requisitos } = validarRequisitosContrasena(inputPass.value);

            // Recorremos cada regla para pintar verde o gris
            for (const [key, cumple] of Object.entries(requisitos)) {
                const li = document.getElementById(`req-${key}`);
                if (li) {
                    if (cumple) {
                        li.className = 'req-cumplido'; // Clase CSS verde
                        li.innerHTML = `<i class="fas fa-check-circle"></i> ${mensajes[key]}`;
                    } else {
                        li.className = ''; // Gris normal
                        li.innerHTML = `<i class="far fa-circle"></i> ${mensajes[key]}`;
                    }
                }
            }
            // Si ya escribió en confirmar, re-validar si coinciden
            if (inputConfirm.value) validarCoincidencia();
        });

        // Mostrar lista al hacer click
        inputPass.addEventListener('focus', () => {
            if(listaRequisitos) listaRequisitos.style.display = 'block';
        });
    }

    // --- 4. LÓGICA DE COINCIDENCIA ---
    function validarCoincidencia() {
        const pass = inputPass.value;
        const confirm = inputConfirm.value;

        if (!feedbackCoincidencia) return;

        if (confirm.length === 0) {
            feedbackCoincidencia.innerHTML = '';
            return;
        }

        if (pass === confirm) {
            feedbackCoincidencia.innerHTML = '<span style="color:var(--success-color, #28a745);"><i class="fas fa-check-circle"></i> Las contraseñas coinciden</span>';
        } else {
            feedbackCoincidencia.innerHTML = '<span style="color:var(--error-color, #dc3545);"><i class="fas fa-times-circle"></i> No coinciden</span>';
        }
    }

    if (inputConfirm) {
        inputConfirm.addEventListener('input', validarCoincidencia);
        inputConfirm.addEventListener('focus', validarCoincidencia);
    }

    // --- 5. ENVÍO DEL FORMULARIO (SUBMIT) ---
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const password = inputPass.value;
        const confirm = inputConfirm.value;

        // A. Validar que no estén vacíos
        if (!password || !confirm) {
            Swal.fire({ icon: 'warning', title: 'Faltan datos', text: 'Completa ambos campos.' });
            return;
        }

        // B. Validar Coincidencia
        if (password !== confirm) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Las contraseñas no coinciden.' });
            return;
        }

        // C. Validar Reglas de Seguridad (¡Importante!)
        const { esValido } = validarRequisitosContrasena(password);
        if (!esValido) {
            Swal.fire({ 
                icon: 'warning', 
                title: 'Contraseña débil', 
                text: 'Tu contraseña no cumple con todos los requisitos de seguridad listados.' 
            });
            return;
        }

        // D. Enviar a Supabase
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Guardando...';

        try {
            const { error } = await actualizarPassword(password);

            if (error) throw error;

            await Swal.fire({
                icon: 'success',
                title: '¡Contraseña Actualizada!',
                text: 'Serás redirigido al inicio de sesión.',
                timer: 3000,
                timerProgressBar: true,
                showConfirmButton: false
            });

            window.location.href = '/view/login/iniciar_sesion.html';

        } catch (error) {
            console.error(error);
            Swal.fire({ 
                icon: 'error', 
                title: 'Error', 
                text: error.message || 'No se pudo actualizar la contraseña.' 
            });
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Cambiar Contraseña';
        }
    });
});