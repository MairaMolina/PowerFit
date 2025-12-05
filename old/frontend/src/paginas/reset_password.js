// Importamos la función de reset
import { solicitarResetPassword } from '../../../../view/login/services/servicio_autenticacion.js';

document.addEventListener('DOMContentLoaded', () => {
    const formularioReset = document.getElementById('formulario-reset');
    const btnSubmit = formularioReset.querySelector('button[type="submit"]');

    formularioReset.addEventListener('submit', async (event) => {
        event.preventDefault();

        const correo = document.getElementById('correoElectronico').value;

        // 1. Validación: Campo vacío
        if (!correo) {
            Swal.fire({
                icon: 'warning',
                title: 'Campo vacío',
                text: 'Por favor, ingresa tu correo electrónico para continuar.',
                confirmButtonColor: '#3085d6'
            });
            return;
        }

        // Estado de carga (Visual en el botón)
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Enviando...';

        // Opcional: Mostrar un "Cargando..." de SweetAlert también
        // Swal.showLoading(); 

        try {
            // Nota: Aquí ya aplicamos la corrección de quitar las llaves {}
            const { data, error } = await solicitarResetPassword(correo);

            if (error) {
                // 2. Error: Algo salió mal en Supabase
                Swal.fire({
                    icon: 'error',
                    title: 'Error al enviar',
                    text: error.message || 'No se pudo enviar el correo. Verifica que sea correcto.',
                    confirmButtonColor: '#d33'
                });
                
                // Reactivar el botón para que intenten de nuevo
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Enviar Enlace';

            } else {
                // 3. Éxito: Todo salió bien
                await Swal.fire({
                    icon: 'success',
                    title: '¡Enlace enviado!',
                    text: 'Revisa tu bandeja de entrada (o la carpeta de Spam) para restablecer tu contraseña.',
                    timer: 3000, // Espera 3 segundos
                    showConfirmButton: false, // Oculta el botón para forzar la espera o lectura
                    timerProgressBar: true
                });

                // Redirigir a iniciar sesión después de que se cierre la alerta
                window.location.href = '/view/login/iniciar_sesion.html';
            }

        } catch (err) {
            // Error inesperado (ej. fallo de red)
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Ocurrió un error inesperado',
                text: 'Por favor intenta más tarde.'
            });
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Enviar Enlace';
        }
    });
});