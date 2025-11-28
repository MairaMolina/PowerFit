// ====== CONFIGURACIÓN DE SUPABASE ======
import { supabase } from '../config/supabase.js';

// ====== VARIABLES GLOBALES ======
let usuarioActual = null;
let datosUsuario = null;

// ====== VERIFICAR SESIÓN AL CARGAR ======
document.addEventListener('DOMContentLoaded', async () => {
    await verificarSesion();
    inicializarEventos();
});

// ====== VERIFICAR SI HAY SESIÓN ACTIVA ======
async function verificarSesion() {
    try {
        // 1. Intenta obtener la sesión del localStorage (guardada por login)
        const sesionGuardada = localStorage.getItem('supabase.session');

        if (!sesionGuardada) {
            // Si no hay sesión en localStorage, redirigir a login
            window.location.href = '/iniciar_sesion.html';
            return;
        }

        // 2. Parsear la sesión guardada
        const session = JSON.parse(sesionGuardada);

        // 3. Validar que tenga los datos necesarios
        if (!session || !session.user || !session.access_token) {
            window.location.href = '/iniciar_sesion.html';
            return;
        }

        // 4. Establecer el usuario actual
        usuarioActual = session.user;

        // 5. Cargar datos del usuario
        await cargarDatosUsuario();

    } catch (error) {
        console.error('Error al verificar sesión:', error);
        window.location.href = '/iniciar_sesion.html';
    }
}

// ====== CARGAR DATOS DEL USUARIO DESDE LA BD ======
async function cargarDatosUsuario() {
    try {
        mostrarCargando();

        // Cargar datos básicos del usuario
        const { data: usuarioData, error: usuarioError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('correo', usuarioActual.email)
            .single();

        if (usuarioError) {
            console.log('Usuario no encontrado en tabla usuarios, usando datos de auth');
            // Si no existe en la tabla, usar datos básicos
            datosUsuario = {
                id: null,
                nombre_completo: usuarioActual.email.split('@')[0],
                correo: usuarioActual.email,
                genero: null,
                telefono: null,
                fecha_nacimiento: null,
                peso: null,
                altura: null,
                objetivos: null,
                foto_perfil: null
            };
        } else {
            // Usuario encontrado, usar sus datos
            datosUsuario = { ...usuarioData };

            // Intentar cargar datos adicionales del perfil (opcional)
            try {
                const { data: perfilData, error: perfilError } = await supabase
                    .from('perfiles_usuario')
                    .select('*')
                    .eq('usuario_id', usuarioData.id)
                    .single();

                if (!perfilError && perfilData) {
                    // Combinar datos del perfil
                    datosUsuario = { ...datosUsuario, ...perfilData };
                }
            } catch (perfilError) {
                console.log('Tabla perfiles_usuario no disponible');
            }
        }

        actualizarInformacionUsuario();
        ocultarMensajeError();

    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);

        // Fallback con datos básicos
        datosUsuario = {
            id: null,
            nombre_completo: usuarioActual.email.split('@')[0],
            correo: usuarioActual.email,
            genero: null,
            telefono: null,
            fecha_nacimiento: null,
            peso: null,
            altura: null,
            objetivos: null,
            foto_perfil: null
        };

        actualizarInformacionUsuario();
        ocultarMensajeError();
    }
}

// ====== ACTUALIZAR INFORMACIÓN DEL USUARIO EN LA INTERFAZ ======
function actualizarInformacionUsuario() {
    const nombreCompleto = datosUsuario?.nombre_completo || usuarioActual.email.split('@')[0];
    const iniciales = obtenerIniciales(nombreCompleto);

    // Actualizar header
    document.getElementById('nombreUsuario').textContent = nombreCompleto;
    document.getElementById('iniciales').textContent = iniciales;

    // Actualizar perfil principal
    document.getElementById('nombreCompletoPerfil').textContent = nombreCompleto;
    document.getElementById('correoPerfil').textContent = datosUsuario?.correo || usuarioActual.email;

    // Separar nombre y apellido
    const partesNombre = nombreCompleto.split(' ');
    const nombre = partesNombre[0] || '';
    const apellido = partesNombre.slice(1).join(' ') || '';

    document.getElementById('campoNombre').textContent = nombre || 'No especificado';
    document.getElementById('campoApellido').textContent = apellido || 'No especificado';
    document.getElementById('campoCorreo').textContent = datosUsuario?.correo || usuarioActual.email;
    document.getElementById('campoGenero').textContent = datosUsuario?.genero || 'No especificado';
    document.getElementById('campoTelefono').textContent = datosUsuario?.telefono || 'No especificado';

    // Calcular edad
    if (datosUsuario?.fecha_nacimiento) {
        const edad = calcularEdad(datosUsuario.fecha_nacimiento);
        document.getElementById('campoEdad').textContent = `${edad} años`;
    } else {
        document.getElementById('campoEdad').textContent = 'No especificada';
    }

    document.getElementById('campoTelefono').textContent = datosUsuario?.telefono || 'No especificado';

    document.getElementById('campoPeso').textContent = datosUsuario?.peso ? `${datosUsuario.peso} kg` : 'No especificado';
    document.getElementById('campoAltura').textContent = datosUsuario?.altura ? `${datosUsuario.altura} cm` : 'No especificada';

    // Mostrar objetivos como etiquetas
    const contenedorObjetivos = document.getElementById('campoObjetivos');
    const objetivos = datosUsuario?.objetivos ? datosUsuario.objetivos.split(',').map(obj => obj.trim()) : [];

    if (objetivos.length === 0) {
        contenedorObjetivos.innerHTML = '<span class="text-muted">No especificados</span>';
    } else {
        contenedorObjetivos.innerHTML = objetivos.map(objetivo => `
            <span class="badge bg-primary me-1 mb-1">${objetivo}</span>
        `).join('');
    }

    // Avatar
    actualizarAvatar(nombreCompleto);
}

// ====== ACTUALIZAR AVATAR ======
function actualizarAvatar(nombreCompleto) {
    const iniciales = obtenerIniciales(nombreCompleto);
    document.getElementById('inicialesGrandes').textContent = iniciales;

    if (datosUsuario?.foto_perfil) {
        // Si hay foto de perfil, mostrarla
        const img = document.getElementById('fotoPerfil');
        img.src = datosUsuario.foto_perfil;
        img.style.display = 'block';
        document.getElementById('avatarPredeterminado').style.display = 'none';
    } else {
        // Mostrar iniciales
        document.getElementById('fotoPerfil').style.display = 'none';
        document.getElementById('avatarPredeterminado').style.display = 'flex';
    }
}

// ====== OBTENER INICIALES DEL NOMBRE ======
function obtenerIniciales(nombre) {
    const palabras = nombre.trim().split(' ');
    if (palabras.length >= 2) {
        return (palabras[0][0] + palabras[1][0]).toUpperCase();
    }
    return palabras[0].substring(0, 2).toUpperCase();
}

// ====== CALCULAR EDAD ======
function calcularEdad(fechaNacimiento) {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }

    return edad;
}

// ====== MOSTRAR CARGANDO ======
function mostrarCargando() {
    const campos = [
        'campoNombre', 'campoApellido', 'campoCorreo', 'campoGenero',
        'campoTelefono', 'campoEdad', 'campoPeso', 'campoAltura', 'campoObjetivos'
    ];

    campos.forEach(id => {
        document.getElementById(id).textContent = 'Cargando...';
    });
}

// ====== MOSTRAR MENSAJE DE ERROR ======
function mostrarMensajeError(mensaje) {
    document.getElementById('textoError').textContent = mensaje;
    document.getElementById('mensajeError').style.display = 'block';
}

// ====== OCULTAR MENSAJE DE ERROR ======
function ocultarMensajeError() {
    document.getElementById('mensajeError').style.display = 'none';
}

// ====== LLENAR MODAL DE EDICIÓN ======
function llenarModalEdicion() {
    const nombreCompleto = datosUsuario?.nombre_completo || '';
    const partesNombre = nombreCompleto.split(' ');
    const nombre = partesNombre[0] || '';
    const apellido = partesNombre.slice(1).join(' ') || '';

    document.getElementById('inputNombre').value = nombre;
    document.getElementById('inputApellido').value = apellido;
    document.getElementById('inputCorreo').value = datosUsuario?.correo || usuarioActual.email;
    document.getElementById('inputGenero').value = datosUsuario?.genero || '';
    document.getElementById('inputTelefono').value = datosUsuario?.telefono || '';
    document.getElementById('inputFechaNacimiento').value = datosUsuario?.fecha_nacimiento ? datosUsuario.fecha_nacimiento.split('T')[0] : '';
    document.getElementById('inputPeso').value = datosUsuario?.peso || '';
    document.getElementById('inputAltura').value = datosUsuario?.altura || '';

    // Llenar checkboxes de objetivos
    const objetivosSeleccionados = datosUsuario?.objetivos ? datosUsuario.objetivos.split(',').map(obj => obj.trim()) : [];
    document.getElementById('objPerderPeso').checked = objetivosSeleccionados.includes('Perder peso');
    document.getElementById('objGanarMusculo').checked = objetivosSeleccionados.includes('Ganar masa muscular');
    document.getElementById('objTonificar').checked = objetivosSeleccionados.includes('Tonificar');
    document.getElementById('objMantener').checked = objetivosSeleccionados.includes('Mantener forma');
    document.getElementById('objResistencia').checked = objetivosSeleccionados.includes('Mejorar resistencia');

    // Actualizar vista previa
    actualizarVistaPreviaObjetivos();
}

// ====== VALIDAR FORMATO DE EMAIL ======
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// ====== VALIDAR FORMATO DE TELÉFONO ======
function validarTelefono(telefono) {
    if (!telefono || telefono.trim() === '') return true; // Permitir vacío

    // Formato básico: solo números, espacios, guiones, paréntesis, mínimo 7 dígitos
    const regex = /^[\d\s\-\(\)\+]{7,}$/;
    const soloNumeros = telefono.replace(/[\s\-\(\)\+]/g, '');
    return regex.test(telefono) && soloNumeros.length >= 7;
}

// ====== ACTUALIZAR VISTA PREVIA DE OBJETIVOS ======
function actualizarVistaPreviaObjetivos() {
    const contenedor = document.getElementById('vistaPreviaObjetivos');
    const objetivosSeleccionados = [];

    // Recopilar objetivos seleccionados
    if (document.getElementById('objPerderPeso').checked) objetivosSeleccionados.push('Perder peso');
    if (document.getElementById('objGanarMusculo').checked) objetivosSeleccionados.push('Ganar masa muscular');
    if (document.getElementById('objTonificar').checked) objetivosSeleccionados.push('Tonificar');
    if (document.getElementById('objMantener').checked) objetivosSeleccionados.push('Mantener forma');
    if (document.getElementById('objResistencia').checked) objetivosSeleccionados.push('Mejorar resistencia');

    if (objetivosSeleccionados.length === 0) {
        contenedor.innerHTML = '<small class="text-muted">Selecciona objetivos arriba para ver la vista previa</small>';
    } else {
        contenedor.innerHTML = objetivosSeleccionados.map(objetivo => `
            <span class="badge bg-primary me-1 mb-1">${objetivo}</span>
        `).join('');
    }
}

// ====== OBTENER OBJETIVOS SELECCIONADOS ======
function obtenerObjetivosSeleccionados() {
    const objetivos = [];

    if (document.getElementById('objPerderPeso').checked) objetivos.push('Perder peso');
    if (document.getElementById('objGanarMusculo').checked) objetivos.push('Ganar masa muscular');
    if (document.getElementById('objTonificar').checked) objetivos.push('Tonificar');
    if (document.getElementById('objMantener').checked) objetivos.push('Mantener forma');
    if (document.getElementById('objResistencia').checked) objetivos.push('Mejorar resistencia');

    return objetivos.join(', ');
}

// ====== VALIDAR CAMPOS DEL FORMULARIO ======
function validarFormulario() {
    const nombre = document.getElementById('inputNombre').value.trim();
    const apellido = document.getElementById('inputApellido').value.trim();
    const correo = document.getElementById('inputCorreo').value.trim();
    const telefono = document.getElementById('inputTelefono').value.trim();
    const peso = document.getElementById('inputPeso').value.trim();
    const altura = document.getElementById('inputAltura').value.trim();

    // Validar campos obligatorios no vacíos
    if (!nombre || !apellido || !correo) {
        alert('Nombre, apellido y correo electrónico son obligatorios.');
        return false;
    }

    // Validar formato de email
    if (!validarEmail(correo)) {
        alert('Por favor ingresa un correo electrónico válido.');
        return false;
    }

    // Validar teléfono si se ingresa
    if (telefono && !validarTelefono(telefono)) {
        alert('Por favor ingresa un número de teléfono válido (mínimo 7 dígitos).');
        return false;
    }

    // Validar peso si se ingresa
    if (peso) {
        const pesoNum = parseFloat(peso);
        if (isNaN(pesoNum) || pesoNum <= 0 || pesoNum > 500) {
            alert('El peso debe ser un número positivo entre 0.1 y 500 kg.');
            return false;
        }
    }

    // Validar altura si se ingresa
    if (altura) {
        const alturaNum = parseFloat(altura);
        if (isNaN(alturaNum) || alturaNum <= 0 || alturaNum > 300) {
            alert('La altura debe ser un número positivo entre 0.1 y 300 cm.');
            return false;
        }
    }

    return true;
}

// ====== VERIFICAR SI EMAIL YA EXISTE ======
async function verificarEmailUnico(email) {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('id')
            .eq('correo', email)
            .neq('correo', usuarioActual.email) // Excluir el email actual del usuario
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
        }

        return !data; // Si no hay data, el email está disponible
    } catch (error) {
        console.error('Error al verificar email:', error);
        return false; // En caso de error, asumir que no está disponible
    }
}

// ====== GUARDAR CAMBIOS DEL PERFIL ======
async function guardarCambiosPerfil() {
    if (!validarFormulario()) {
        return;
    }

    const nombre = document.getElementById('inputNombre').value.trim();
    const apellido = document.getElementById('inputApellido').value.trim();
    const correo = document.getElementById('inputCorreo').value.trim();
    const genero = document.getElementById('inputGenero').value;
    const fechaNacimiento = document.getElementById('inputFechaNacimiento').value;
    const telefono = document.getElementById('inputTelefono').value.trim();
    const peso = document.getElementById('inputPeso').value;
    const altura = document.getElementById('inputAltura').value;
    const objetivos = obtenerObjetivosSeleccionados();

    const nombreCompleto = `${nombre} ${apellido}`;

    // Verificar si el email cambió y si ya existe
    if (correo !== usuarioActual.email) {
        const emailDisponible = await verificarEmailUnico(correo);
        if (!emailDisponible) {
            alert('Este correo electrónico ya está registrado. Por favor usa otro.');
            return;
        }
    }

    try {
        // Preparar datos básicos
        const datosUsuarioActualizar = {
            nombre_completo: nombreCompleto,
            correo: correo,
            genero: genero || null,
            fecha_nacimiento: fechaNacimiento || null
        };

        console.log('Datos a guardar en usuarios:', datosUsuarioActualizar);

        let usuarioData, usuarioError;

        if (datosUsuario.id) {
            // Usuario existe, actualizar
            const result = await supabase
                .from('usuarios')
                .update(datosUsuarioActualizar)
                .eq('id', datosUsuario.id)
                .select();
            usuarioData = result.data;
            usuarioError = result.error;
        } else {
            // Usuario no existe, intentar insertar
            const result = await supabase
                .from('usuarios')
                .insert(datosUsuarioActualizar)
                .select();
            usuarioData = result.data;
            usuarioError = result.error;

            // Si insert falla por duplicado, intentar update
            if (usuarioError && usuarioError.code === '23505') {
                const updateResult = await supabase
                    .from('usuarios')
                    .update(datosUsuarioActualizar)
                    .eq('correo', usuarioActual.email)
                    .select();
                usuarioData = updateResult.data;
                usuarioError = updateResult.error;
            }
        }

        if (usuarioError) throw usuarioError;

        console.log('Datos guardados en usuarios:', usuarioData);

        // Actualizar el ID si se creó el usuario
        if (usuarioData && usuarioData[0]) {
            datosUsuario.id = usuarioData[0].id;
        }

        // Guardar datos adicionales en tabla perfiles_usuario
        const datosPerfilActualizar = {
            usuario_id: datosUsuario.id,
            telefono: telefono || null,
            peso: peso ? parseFloat(peso) : null,
            altura: altura ? parseFloat(altura) : null,
            objetivos: objetivos || null
        };

        console.log('Datos a guardar en perfiles_usuario:', datosPerfilActualizar);

        // Intentar insertar primero
        let perfilData, perfilError;
        try {
            const insertResult = await supabase
                .from('perfiles_usuario')
                .insert(datosPerfilActualizar)
                .select();

            perfilData = insertResult.data;
            perfilError = insertResult.error;
        } catch (insertError) {
            // Si falla por duplicado, intentar update
            const updateResult = await supabase
                .from('perfiles_usuario')
                .update({
                    telefono: telefono || null,
                    peso: peso ? parseFloat(peso) : null,
                    altura: altura ? parseFloat(altura) : null,
                    objetivos: objetivos || null
                })
                .eq('usuario_id', datosUsuario.id)
                .select();

            perfilData = updateResult.data;
            perfilError = updateResult.error;
        }

        if (perfilError) {
            console.error('Error al guardar datos de perfil:', perfilError);
            // No lanzamos error aquí porque los datos básicos ya se guardaron
        } else {
            console.log('Datos guardados en perfiles_usuario:', perfilData);
        }

        // Actualizar datos locales
        datosUsuario = {
            ...datosUsuario,
            ...datosUsuarioActualizar,
            ...datosPerfilActualizar
        };

        // Actualizar la interfaz
        actualizarInformacionUsuario();

        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarPerfil'));
        modal.hide();

        // Mostrar confirmación
        alert('Perfil actualizado exitosamente.');

    } catch (error) {
        console.error('Error al guardar cambios:', error);
        alert('Error al guardar los cambios. Por favor intenta nuevamente.');
    }
}

// ====== INICIALIZAR EVENTOS ======
function inicializarEventos() {
    // Cerrar sesión
    document.getElementById('botonCerrarSesion')?.addEventListener('click', async (e) => {
        e.preventDefault();

        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            try {
                // Limpiar la sesión del localStorage
                localStorage.removeItem('supabase.session');

                // Redirigir a inicio
                window.location.href = '/iniciar_sesion.html';
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
                alert('Error al cerrar sesión');
            }
        }
    });

    // Reintentar cargar datos
    document.getElementById('botonReintentar')?.addEventListener('click', async () => {
        await cargarDatosUsuario();
    });

    // Editar perfil - llenar modal cuando se abre
    document.getElementById('modalEditarPerfil')?.addEventListener('show.bs.modal', () => {
        llenarModalEdicion();
    });

    // Guardar cambios del perfil
    document.getElementById('botonGuardarPerfil')?.addEventListener('click', async () => {
        await guardarCambiosPerfil();
    });

    // Actualizar vista previa de objetivos cuando cambian los checkboxes
    const checkboxesObjetivos = ['objPerderPeso', 'objGanarMusculo', 'objTonificar', 'objMantener', 'objResistencia'];
    checkboxesObjetivos.forEach(id => {
        document.getElementById(id)?.addEventListener('change', actualizarVistaPreviaObjetivos);
    });

    // Cambiar tema
    document.getElementById('botonTema')?.addEventListener('click', () => {
        document.body.classList.toggle('tema-oscuro');

        const icono = document.querySelector('#botonTema i');
        if (document.body.classList.contains('tema-oscuro')) {
            icono.classList.remove('fa-moon');
            icono.classList.add('fa-sun');
            localStorage.setItem('tema', 'oscuro');
        } else {
            icono.classList.remove('fa-sun');
            icono.classList.add('fa-moon');
            localStorage.setItem('tema', 'claro');
        }
    });

    // Cargar tema guardado
    const temaGuardado = localStorage.getItem('tema');
    if (temaGuardado === 'oscuro') {
        document.body.classList.add('tema-oscuro');
        const icono = document.querySelector('#botonTema i');
        icono?.classList.remove('fa-moon');
        icono?.classList.add('fa-sun');
    }
}