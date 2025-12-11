import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ====== CONFIGURACIÓN SUPABASE ======
const supabaseUrl = 'https://iinbzpqjxpciivcomruk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpbmJ6cHFqeHBjaWl2Y29tcnVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI4NjQzMywiZXhwIjoyMDc3ODYyNDMzfQ.ZrgGyJUf50WzlIONM_t0-qmufnixDdgb8xUaAtsGpuI'; 
const supabase = createClient(supabaseUrl, supabaseKey);

// ====== VARIABLES GLOBALES ======
let usuarioAdmin = null;

// ====== INICIALIZACIÓN ======
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Cargar tema guardado antes que nada para evitar "fleshazos"
    cargarTemaGuardado();
    
    // 2. Verificar seguridad
    await verificarAdmin();
    
    // 3. Inicializar listeners
    inicializarEventos();
});

// =======================================================
// 1. SEGURIDAD: VERIFICAR ROL DE ADMIN
// =======================================================
async function verificarAdmin() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            window.location.href = '../../view/login/iniciar_sesion.html';
            return;
        }

        // Consultamos el rol en la tabla 'usuarios'
        // Gracias a la política RLS que arreglamos, esto ya no da error.
        const { data: perfil, error: perfilError } = await supabase
            .from('usuarios')
            .select('rol')
            .eq('id', user.id)
            .single();

        if (perfilError || perfil?.rol !== 'admin') {
            await Swal.fire({
                icon: 'error',
                title: 'Acceso Denegado',
                text: 'No tienes permisos de administrador.',
                confirmButtonColor: '#d33',
                allowOutsideClick: false
            });
            window.location.href = '../../view/dashboard/dashboard_usuario.html';
        } else {
            console.log('✅ Admin autenticado:', user.email);
            usuarioAdmin = user;
            // Cargar dashboard inicial (Estadísticas rápidas)
            cargarEstadisticasRapidas();
        }

    } catch (err) {
        console.error('Error verificando admin:', err);
        window.location.href = '../../view/login/iniciar_sesion.html';
    }
}

// =======================================================
// 2. NAVEGACIÓN Y EVENTOS UI
// =======================================================
function inicializarEventos() {

    // Botón Menú Móvil (Toggle Sidebar)
    const btnMenu = document.getElementById('btnMenuMovil');
    const sidebar = document.querySelector('.sidebar');
    
    if (btnMenu) {
        btnMenu.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Cerrar sidebar al hacer click fuera (Opcional pero recomendado UX)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !btnMenu.contains(e.target) &&
            sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    });
    
    // Navegación Sidebar
    document.querySelectorAll('.item-menu').forEach(item => {
        item.addEventListener('click', (e) => {
            const seccion = item.dataset.seccion;
            
            // Si no tiene data-seccion, es el botón de salir
            if (!seccion) return; 

            e.preventDefault();

            // Activar clase visual
            document.querySelectorAll('.item-menu').forEach(i => i.classList.remove('activo'));
            item.classList.add('activo');

            // Mostrar sección correspondiente
            mostrarSeccion(seccion);
        });
    });

    // Botón Cerrar Sesión
    document.getElementById('botonCerrarSesion').addEventListener('click', cerrarSesionAdmin);

    // Botón Tema Oscuro
    document.getElementById('botonTema').addEventListener('click', alternarTema);
    
    // Botones de "Crear Nuevo Ejercicio" (Listeners globales)
    // Botón Nuevo Ejercicio
    const btnCrearEje = document.getElementById('btnCrearEjercicio');
    if (btnCrearEje) {
        btnCrearEje.addEventListener('click', () => {
            document.getElementById('formEjercicio').reset(); // Limpiar form
            document.getElementById('ejercicioId').value = ''; // Limpiar ID
            document.getElementById('tituloModalEjercicio').textContent = 'Nuevo Ejercicio';
            
            const modal = new bootstrap.Modal(document.getElementById('modalEjercicio'));
            modal.show();
        });
    }

    // Botón Guardar Ejercicio (Del Modal)
    document.getElementById('btnGuardarEjercicio').addEventListener('click', guardarEjercicio);
<<<<<<< Updated upstream
    
    document.getElementById('btnCrearRutina')?.addEventListener('click', () => {
        Swal.fire('Próximamente', 'Aquí abrirá el modal para crear rutinas', 'info');
    });
=======

    // Botón Nueva Rutina (Prepara y Abre Modal)
    const btnCrearRut = document.getElementById('btnCrearRutina');
    if (btnCrearRut) {
        btnCrearRut.addEventListener('click', async () => {
            document.getElementById('formRutina').reset();
            document.getElementById('rutinaId').value = '';
            document.getElementById('tituloModalRutina').textContent = 'Nueva Rutina Plantilla';
            
            await prepararModalRutina(); // Carga la lista de ejercicios
            
            new bootstrap.Modal(document.getElementById('modalRutina')).show();
        });
    }

    // Botón para Agregar Ejercicio a la tabla temporal
    document.getElementById('btnAgregarEjercicioALista')?.addEventListener('click', agregarEjercicioALista);

    // Botón Guardar Rutina Final
    document.getElementById('btnGuardarRutina')?.addEventListener('click', guardarRutina);
>>>>>>> Stashed changes
}

function mostrarSeccion(seccionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.seccion-admin').forEach(div => div.classList.add('d-none'));
    
    // Mostrar la elegida
    const seccionActiva = document.getElementById(`seccion-${seccionId}`);
    if (seccionActiva) seccionActiva.classList.remove('d-none');

    // Actualizar título y visibilidad
    const titulo = document.getElementById('tituloSeccion');
    
    // Si estamos en dashboard, ocultamos el título genérico porque ya hay tarjeta de bienvenida
    if (seccionId === 'dashboard') {
        titulo.classList.add('d-none');
        cargarEstadisticasRapidas();
    } else {
        titulo.classList.remove('d-none');
    }

    switch (seccionId) {
        case 'usuarios':
            titulo.textContent = 'Gestión de Usuarios';
            cargarUsuarios();
            break;
        case 'ejercicios':
            titulo.textContent = 'Catálogo de Ejercicios';
            cargarEjercicios();
            break;
        case 'rutinas':
            titulo.textContent = 'Rutinas Plantilla';
            cargarRutinas();
            break;
    }
}

// =======================================================
// 3. GESTIÓN DE USUARIOS (CRUD)
// =======================================================
async function cargarUsuarios() {
    const tbody = document.getElementById('tbodyUsuarios');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4"><div class="spinner-border text-primary"></div> Cargando usuarios...</td></tr>';

    try {
        const { data: usuarios, error } = await supabase
            .from('usuarios')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay usuarios registrados.</td></tr>';
            return;
        }

        // Renderizar tabla
        tbody.innerHTML = usuarios.map(u => {
            const fecha = new Date(u.created_at).toLocaleDateString('es-ES');
            const esAdmin = u.rol === 'admin';
            const badgeRol = esAdmin 
                ? '<span class="badge bg-danger">Admin</span>' 
                : '<span class="badge bg-primary">Usuario</span>';
            
            // Botón borrar (Protegemos al admin actual)
            const btnBorrar = (u.id === usuarioAdmin.id) 
                ? '<span class="text-muted small">Tu Cuenta</span>'
                : `<button class="btn-accion btn-borrar" onclick="window.eliminarUsuario('${u.id}', '${u.nombre_completo || 'Usuario'}')" title="Eliminar Usuario">
                     <i class="fas fa-trash"></i>
                   </button>`;

            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="avatar-tabla me-2" style="width:35px;height:35px;border-radius:50%;background:#e9ecef;display:flex;align-items:center;justify-content:center;font-weight:bold;color:#666;">
                                ${(u.nombre_completo || 'U').charAt(0).toUpperCase()}
                            </div>
                            <span class="fw-bold">${u.nombre_completo || 'Sin Nombre'}</span>
                        </div>
                    </td>
                    <td>${u.correo}</td>
                    <td>${badgeRol}</td>
                    <td>${fecha}</td>
                    <td>${btnBorrar}</td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error cargando usuarios:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar datos.</td></tr>';
    }
}

// Función Global para eliminar usuario TOTALMENTE
window.eliminarUsuario = async (id, nombre) => {
    // --- DEBUG: Ver qué ID estamos intentando borrar ---
    console.log("💀 INTENTO DE BORRADO - ID:", id); 
    console.log("💀 Tipo de dato:", typeof id);
    // --------------------------------------------------

    Swal.fire({
        title: '¿Eliminar usuario?',
        html: `Estás a punto de eliminar a <b>"${nombre}"</b>.<br>
               <span style="color:#d33; font-size:0.9em;">
               ⚠ Se borrará de la base de datos y del sistema de autenticación.
               </span>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, borrar todo',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                Swal.fire({
                    title: 'Borrando...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
                });

                // Llamada RPC
                const { error } = await supabase.rpc('eliminar_usuario_total', { 
                    id_a_borrar: id 
                });

                if (error) {
                    console.error("❌ Error RPC:", error); // Ver error real en consola
                    throw error;
                }

                await Swal.fire('Eliminado', 'Usuario borrado totalmente.', 'success');
                cargarUsuarios(); 
                cargarEstadisticasRapidas(); 

            } catch (error) {
                console.error('Catch Error:', error);
                Swal.fire('Error', 'Fallo al eliminar: ' + error.message, 'error');
            }
        }
    });
};

// =======================================================
// 4. GESTIÓN DE EJERCICIOS
// =======================================================

// =======================================================
// 4. GESTIÓN DE EJERCICIOS (CRUD COMPLETO)
// =======================================================

// A. CARGAR EJERCICIOS (READ)
async function cargarEjercicios() {
    const tbody = document.getElementById('tbodyEjercicios');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="spinner-border text-primary"></div> Cargando...</td></tr>';

    try {
        const { data: ejercicios, error } = await supabase
            .from('ejercicios')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        if (!ejercicios || ejercicios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay ejercicios registrados.</td></tr>';
            return;
        }

        tbody.innerHTML = ejercicios.map(e => {
            // Formatear Músculos (Array -> String)
            let musculos = 'General';
            if (e.musculos_trabajados) {
                musculos = Array.isArray(e.musculos_trabajados) 
                    ? e.musculos_trabajados.join(', ') 
                    : e.musculos_trabajados.replace(/{|}|"/g, '').replace(/,/g, ', ');
            }

            // Formatear Equipo
            let equipo = 'N/A';
            if (e.etiquetas) {
<<<<<<< Updated upstream
                 if (Array.isArray(e.etiquetas)) equipo = e.etiquetas.join(', ');
                 else if (typeof e.etiquetas === 'string') equipo = e.etiquetas.replace(/{|}|"/g, '').replace(/,/g, ', ');
            }

            // Imagen fallback
            const imagen = e.imagen_url 
                ? `<img src="${e.imagen_url}" class="img-tabla" alt="${e.nombre}">` 
=======
                equipo = Array.isArray(e.etiquetas) 
                    ? e.etiquetas.join(', ') 
                    : e.etiquetas.replace(/{|}|"/g, '').replace(/,/g, ', ');
            }

            // Imagen
            const imagen = e.imagen_url 
                ? `<img src="${e.imagen_url}" class="img-tabla" alt="img">` 
>>>>>>> Stashed changes
                : `<div class="img-tabla d-flex align-items-center justify-content-center bg-light"><i class="fas fa-dumbbell text-muted"></i></div>`;

            // Descripción truncada
            const descCorta = e.descripcion 
                ? (e.descripcion.length > 50 ? e.descripcion.substring(0, 50) + '...' : e.descripcion)
                : '<span class="text-muted small">Sin descripción</span>';

            return `
                <tr>
                    <td>${imagen}</td>
                    <td class="fw-bold">${e.nombre}</td>
                    <td><span class="badge bg-info text-dark text-wrap">${musculos}</span></td>
                    <td title="${e.descripcion || ''}">${descCorta}</td>
                    <td><small>${equipo}</small></td>
                    <td>
                        <button class="btn-accion btn-editar" onclick="window.editarEjercicio('${e.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-accion btn-borrar" onclick="window.eliminarEjercicio('${e.id}')" title="Borrar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar datos.</td></tr>';
    }
}

// B. ABRIR MODAL PARA EDITAR
window.editarEjercicio = async (id) => {
    try {
        const { data, error } = await supabase.from('ejercicios').select('*').eq('id', id).single();
        if (error) throw error;

        document.getElementById('ejercicioId').value = data.id;
        document.getElementById('nombreEjercicio').value = data.nombre;
        document.getElementById('imagenEjercicio').value = data.imagen_url || '';
        document.getElementById('descEjercicio').value = data.descripcion || '';
        // Usamos explicacion_pasos si existe, o instrucciones como fallback
        document.getElementById('instruccionesEjercicio').value = data.explicacion_pasos || data.instrucciones || '';

        // Seleccionar Equipo
        let equipoVal = 'Ninguno';
        if (data.etiquetas) {
             const etiquetas = Array.isArray(data.etiquetas) ? data.etiquetas : data.etiquetas.replace(/{|}|"/g, '').split(',');
             if (etiquetas.length > 0) equipoVal = etiquetas[0];
        }
        document.getElementById('equipoEjercicio').value = equipoVal;

        // Seleccionar Músculos (Multiple)
        const selectMusculos = document.getElementById('musculoEjercicio');
        for (let i = 0; i < selectMusculos.options.length; i++) selectMusculos.options[i].selected = false;
        
        if (data.musculos_trabajados) {
            const arrMusculos = Array.isArray(data.musculos_trabajados) 
                ? data.musculos_trabajados 
                : data.musculos_trabajados.replace(/{|}|"/g, '').split(',');
            
            for (let i = 0; i < selectMusculos.options.length; i++) {
                if (arrMusculos.includes(selectMusculos.options[i].value)) {
                    selectMusculos.options[i].selected = true;
                }
            }
        }

        document.getElementById('tituloModalEjercicio').textContent = 'Editar Ejercicio';
        const modal = new bootstrap.Modal(document.getElementById('modalEjercicio'));
        modal.show();

    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudieron cargar los datos.', 'error');
    }
};

// C. GUARDAR (CREAR O ACTUALIZAR)
async function guardarEjercicio() {
    const id = document.getElementById('ejercicioId').value;
    const nombre = document.getElementById('nombreEjercicio').value;
    const equipo = document.getElementById('equipoEjercicio').value;
    const imagen = document.getElementById('imagenEjercicio').value;
    const descripcion = document.getElementById('descEjercicio').value;
    const instrucciones = document.getElementById('instruccionesEjercicio').value;

    // Obtener valores múltiples del select
    const selectMusculos = document.getElementById('musculoEjercicio');
    const musculos = Array.from(selectMusculos.selectedOptions).map(o => o.value);

    if (!nombre || musculos.length === 0) {
        Swal.fire('Atención', 'Nombre y al menos un grupo muscular son obligatorios.', 'warning');
        return;
    }

    const datos = {
        nombre: nombre,
<<<<<<< Updated upstream
        musculos_trabajados: [musculo], 
        etiquetas: [equipo],            
        imagen_url: imagen,
        descripcion: descripcion,
        explicacion_pasos: descripcion 
=======
        musculos_trabajados: musculos, // Array
        etiquetas: [equipo],           // Array
        imagen_url: imagen,
        descripcion: descripcion,
        explicacion_pasos: instrucciones
>>>>>>> Stashed changes
    };

    let errorReq;
    
    if (id) {
        // UPDATE
        const { error } = await supabase.from('ejercicios').update(datos).eq('id', id);
        errorReq = error;
    } else {
<<<<<<< Updated upstream
        Swal.fire('Guardado', 'Ejercicio agregado correctamente.', 'success');
        
        // Cerrar modal
=======
        // INSERT
        const { error } = await supabase.from('ejercicios').insert([datos]);
        errorReq = error;
    }

    if (errorReq) {
        console.error(errorReq);
        Swal.fire('Error', 'No se pudo guardar: ' + errorReq.message, 'error');
    } else {
        Swal.fire('Guardado', 'Operación exitosa.', 'success');
        
>>>>>>> Stashed changes
        const modalEl = document.getElementById('modalEjercicio');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if(modal) modal.hide();

        cargarEjercicios();
        cargarEstadisticasRapidas();
    }
}

// D. ELIMINAR
window.eliminarEjercicio = async (id) => {
    const res = await Swal.fire({
        title: '¿Eliminar?',
        text: "No podrás recuperarlo.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Sí, borrar'
    });

    if (res.isConfirmed) {
        const { error } = await supabase.from('ejercicios').delete().eq('id', id);
<<<<<<< Updated upstream
        
=======
>>>>>>> Stashed changes
        if (error) {
            Swal.fire('Error', 'Fallo al borrar.', 'error');
        } else {
            Swal.fire('Eliminado', 'Ejercicio borrado.', 'success');
            cargarEjercicios();
            cargarEstadisticasRapidas();
        }
    }
};

// =======================================================
// 5. GESTIÓN DE RUTINAS (CON SWEETALERT2)
// =======================================================

let ejerciciosEnRutina = []; // Array temporal

// A. CARGAR RUTINAS
async function cargarRutinas() {
    const tbody = document.getElementById('tbodyRutinas');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="spinner-border text-primary"></div> Cargando...</td></tr>';

    const { data, error } = await supabase.from('rutinas').select('*').order('created_at', { ascending: false });

    if (error || !data.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay rutinas creadas.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(r => `
        <tr>
            <td class="fw-bold">${r.nombre}</td>
            <td><span class="badge bg-secondary">${r.nivel || '-'}</span></td>
            <td>${r.categoria || '-'}</td>
            <td>${r.duracion_minutos || 0} min</td>
            <td>
                <button class="btn-accion btn-editar" onclick="window.editarRutina('${r.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                <button class="btn-accion btn-borrar" onclick="window.eliminarRutina('${r.id}')" title="Eliminar"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

// B. PREPARAR MODAL
async function prepararModalRutina() {
    // Mostrar cargando mientras trae los ejercicios
    const select = document.getElementById('selectEjerciciosDisponibles');
    select.innerHTML = '<option value="">Cargando lista...</option>';
    select.disabled = true;

    const { data } = await supabase.from('ejercicios').select('id, nombre').order('nombre');
    
    select.innerHTML = '<option value="">Seleccionar ejercicio...</option>';
    select.disabled = false;
    
    if (data) {
        data.forEach(e => {
            const opt = document.createElement('option');
            opt.value = e.id;
            opt.textContent = e.nombre;
            select.appendChild(opt);
        });
    }
    ejerciciosEnRutina = [];
    renderizarTablaEjercicios();
}

// C. EDITAR RUTINA
window.editarRutina = async (id) => {
    try {
        // Alerta de carga
        Swal.fire({
            title: 'Cargando rutina...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        await prepararModalRutina();
        
        // 1. Datos Rutina
        const { data: r } = await supabase.from('rutinas').select('*').eq('id', id).single();
        document.getElementById('rutinaId').value = r.id;
        document.getElementById('nombreRutina').value = r.nombre;
        document.getElementById('categoriaRutina').value = r.categoria;
        document.getElementById('nivelRutina').value = r.nivel;
        document.getElementById('duracionRutina').value = r.duracion_minutos;
        document.getElementById('caloriasRutina').value = r.calorias_estimadas;
        document.getElementById('descRutina').value = r.descripcion;

        // 2. Datos Ejercicios
        const { data: rels } = await supabase
            .from('rutinas_ejercicios')
            .select('ejercicio_id, series, repeticiones, ejercicios(nombre)')
            .eq('rutina_id', id);

        if (rels) {
            ejerciciosEnRutina = rels.map(x => ({
                id: x.ejercicio_id,
                nombre: x.ejercicios.nombre,
                series: x.series,
                reps: x.repeticiones
            }));
            renderizarTablaEjercicios();
        }

        Swal.close(); // Cerrar alerta de carga
        document.getElementById('tituloModalRutina').textContent = 'Editar Rutina';
        new bootstrap.Modal(document.getElementById('modalRutina')).show();

    } catch (e) { 
        console.error(e);
        Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
    }
};

// D. LOGICA TABLA TEMPORAL
document.getElementById('btnAgregarEjercicioALista')?.addEventListener('click', () => {
    const select = document.getElementById('selectEjerciciosDisponibles');
    if (!select.value) return;

    ejerciciosEnRutina.push({
        id: select.value,
        nombre: select.options[select.selectedIndex].text,
        series: 3,
        reps: 12
    });
    renderizarTablaEjercicios();
    select.value = "";
    
    // Toast pequeño de éxito (opcional)
    const Toast = Swal.mixin({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 1500, timerProgressBar: true
    });
    Toast.fire({ icon: 'success', title: 'Ejercicio agregado' });
});

function renderizarTablaEjercicios() {
    const tbody = document.getElementById('listaEjerciciosSeleccionados');
    const msg = document.getElementById('mensajeSinEjercicios');
    tbody.innerHTML = '';
    
    if (ejerciciosEnRutina.length === 0) {
        msg.style.display = 'block';
    } else {
        msg.style.display = 'none';
        ejerciciosEnRutina.forEach((item, idx) => {
            tbody.innerHTML += `
                <tr>
                    <td>${item.nombre}</td>
                    <td><input type="number" class="form-control form-control-sm" value="${item.series}" onchange="window.actualizarEjercicio(${idx}, 'series', this.value)"></td>
                    <td><input type="number" class="form-control form-control-sm" value="${item.reps}" onchange="window.actualizarEjercicio(${idx}, 'reps', this.value)"></td>
                    <td class="text-center"><i class="fas fa-times text-danger" style="cursor:pointer" onclick="window.quitarEjercicio(${idx})"></i></td>
                </tr>
            `;
        });
    }
}

// Helpers globales para la tabla dinámica
window.actualizarEjercicio = (index, campo, valor) => {
    ejerciciosEnRutina[index][campo] = parseInt(valor);
};
window.quitarEjercicio = (index) => {
    ejerciciosEnRutina.splice(index, 1);
    renderizarTablaEjercicios();
};

// C. GUARDAR RUTINA
async function guardarRutina() {
    const id = document.getElementById('rutinaId').value;
    const nombre = document.getElementById('nombreRutina').value;

    if (!nombre || ejerciciosEnRutina.length === 0) {
        return Swal.fire('Faltan datos', 'El nombre y al menos 1 ejercicio son requeridos', 'warning');
    }

    // Alerta de carga
    Swal.fire({
        title: 'Guardando...',
        html: 'Por favor espera un momento',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    const { data: { user } } = await supabase.auth.getUser();

    const datosRutina = {
        user_id: user.id,
        nombre: nombre,
        descripcion: document.getElementById('descRutina').value,
        categoria: document.getElementById('categoriaRutina').value,
        nivel: document.getElementById('nivelRutina').value,
        duracion_minutos: parseInt(document.getElementById('duracionRutina').value) || 0,
        calorias_estimadas: parseInt(document.getElementById('caloriasRutina').value) || 0,
        numero_ejercicios: ejerciciosEnRutina.length,
        es_plantilla: true,
        contribuye_a: Array.from(document.getElementById('objetivosRutina').selectedOptions).map(o => o.value)
    };

    try {
        let rutinaIdFinal = id;

        // 1. Guardar Rutina
        if (id) {
            const { error } = await supabase.from('rutinas').update(datosRutina).eq('id', id);
            if (error) throw error;
        } else {
            const { data, error } = await supabase.from('rutinas').insert([datosRutina]).select();
            if (error) throw error;
            rutinaIdFinal = data[0].id;
        }

        // 2. Guardar Ejercicios
        await supabase.from('rutinas_ejercicios').delete().eq('rutina_id', rutinaIdFinal);

        if (ejerciciosEnRutina.length > 0) {
            const relacionesInsertar = ejerciciosEnRutina.map((item, index) => ({
                rutina_id: rutinaIdFinal,
                ejercicio_id: item.id,
                series: item.series,
                repeticiones: item.reps,
                orden: index + 1
            }));
            const { error: relError } = await supabase.from('rutinas_ejercicios').insert(relacionesInsertar);
            if (relError) throw relError;
        }

        // ÉXITO
        Swal.fire({
            icon: 'success',
            title: '¡Guardado!',
            text: 'La rutina ha sido guardada correctamente.',
            timer: 2000,
            showConfirmButton: false
        });
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalRutina'));
        if(modal) modal.hide();

        cargarRutinas();
        cargarEstadisticasRapidas();

    } catch (error) {
        console.error("❌ Error:", error);
        Swal.fire('Error', 'Fallo al guardar: ' + error.message, 'error');
    }
}

// F. ELIMINAR
window.eliminarRutina = async (id) => {
    const res = await Swal.fire({
        title: '¿Eliminar rutina?',
        text: "Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, borrar'
    });

    if (res.isConfirmed) {
        // Alerta de carga
        Swal.fire({ title: 'Borrando...', didOpen: () => Swal.showLoading() });

        const { error } = await supabase.from('rutinas').delete().eq('id', id);
        
        if (error) {
            Swal.fire('Error', 'No se pudo borrar.', 'error');
        } else {
            Swal.fire('Eliminado', 'Rutina borrada.', 'success');
            cargarRutinas();
            cargarEstadisticasRapidas();
        }
    }
};

// =======================================================
// 6. ESTADÍSTICAS RÁPIDAS (HERO)
// =======================================================
async function cargarEstadisticasRapidas() {
    try {
        // Conteo optimizado usando { count: 'exact', head: true }
        const { count: u } = await supabase.from('usuarios').select('*', { count: 'exact', head: true });
        const { count: e } = await supabase.from('ejercicios').select('*', { count: 'exact', head: true });
        const { count: r } = await supabase.from('rutinas').select('*', { count: 'exact', head: true });

        document.getElementById('statTotalUsuarios').textContent = u || 0;
        document.getElementById('statTotalEjercicios').textContent = e || 0;
        document.getElementById('statTotalRutinas').textContent = r || 0;
    } catch (e) {
        console.warn('Error cargando stats:', e);
    }
}

// =======================================================
// 7. UTILIDADES (Cerrar Sesión, Tema)
// =======================================================
function cerrarSesionAdmin(e) {
    e.preventDefault();
    Swal.fire({
        title: '¿Cerrar sesión?',
        text: "Saldrás del panel de administrador.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, salir'
    }).then(async (result) => {
        if (result.isConfirmed) {
            await supabase.auth.signOut();
            window.location.href = '../../view/home/inicio.html';
        }
    });
}

function alternarTema() {
    document.body.classList.toggle('tema-oscuro');
    const esOscuro = document.body.classList.contains('tema-oscuro');
    localStorage.setItem('temaAdmin', esOscuro ? 'oscuro' : 'claro');
    
    const icono = document.querySelector('#botonTema i');
    icono.className = esOscuro ? 'fas fa-sun' : 'fas fa-moon';
}

function cargarTemaGuardado() {
    const tema = localStorage.getItem('temaAdmin');
    if (tema === 'oscuro') {
        document.body.classList.add('tema-oscuro');
        const icono = document.querySelector('#botonTema i');
        if(icono) icono.className = 'fas fa-sun';
    }
}

