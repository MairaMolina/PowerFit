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
    
    document.getElementById('btnCrearRutina')?.addEventListener('click', () => {
        Swal.fire('Próximamente', 'Aquí abrirá el modal para crear rutinas', 'info');
    });
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

// 1. CARGAR EJERCICIOS (CORREGIDO)
async function cargarEjercicios() {
    const tbody = document.getElementById('tbodyEjercicios');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4"><div class="spinner-border text-primary"></div> Cargando...</td></tr>';

    try {
        const { data: ejercicios, error } = await supabase
            .from('ejercicios')
            .select('*')
            .order('id', { ascending: false }); // 🔥 CAMBIO: Ordenar por ID, no por created_at

        if (error) throw error;

        if (!ejercicios || ejercicios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay ejercicios registrados.</td></tr>';
            return;
        }

        tbody.innerHTML = ejercicios.map(e => {
            // Manejo de Arrays (Previene errores si viene null o texto)
            let musculos = 'General';
            if (e.musculos_trabajados) {
                if (Array.isArray(e.musculos_trabajados)) {
                    musculos = e.musculos_trabajados.join(', ');
                } else if (typeof e.musculos_trabajados === 'string') {
                    // Limpiar formato Postgres {Pecho,Espalda}
                    musculos = e.musculos_trabajados.replace(/{|}|"/g, '').replace(/,/g, ', ');
                }
            }

            let equipo = 'N/A';
            if (e.etiquetas) {
                 if (Array.isArray(e.etiquetas)) equipo = e.etiquetas.join(', ');
                 else if (typeof e.etiquetas === 'string') equipo = e.etiquetas.replace(/{|}|"/g, '').replace(/,/g, ', ');
            }

            // Imagen fallback
            const imagen = e.imagen_url 
                ? `<img src="${e.imagen_url}" class="img-tabla" alt="${e.nombre}">` 
                : `<div class="img-tabla d-flex align-items-center justify-content-center bg-light"><i class="fas fa-dumbbell text-muted"></i></div>`;

            return `
                <tr>
                    <td>${imagen}</td>
                    <td class="fw-bold">${e.nombre}</td>
                    <td><span class="badge bg-info text-dark">${musculos}</span></td>
                    <td><small>${equipo}</small></td>
                    <td>
                        <button class="btn-accion btn-borrar" onclick="window.eliminarEjercicio('${e.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error cargando ejercicios:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error visualizando datos (Revisa columnas).</td></tr>';
    }
}

// 2. GUARDAR (CREAR) EJERCICIO
async function guardarEjercicio() {
    const nombre = document.getElementById('nombreEjercicio').value;
    const musculo = document.getElementById('musculoEjercicio').value;
    const equipo = document.getElementById('equipoEjercicio').value;
    const imagen = document.getElementById('imagenEjercicio').value;
    const descripcion = document.getElementById('descEjercicio').value;

    if (!nombre || !musculo) {
        Swal.fire('Faltan datos', 'El nombre y el músculo son obligatorios.', 'warning');
        return;
    }

    // Preparar objeto para INSERT
    const nuevoEjercicio = {
        nombre: nombre,
        musculos_trabajados: [musculo], 
        etiquetas: [equipo],            
        imagen_url: imagen,
        descripcion: descripcion,
        explicacion_pasos: descripcion 
    };

    const { error } = await supabase.from('ejercicios').insert([nuevoEjercicio]);

    if (error) {
        console.error("Error guardando:", error);
        Swal.fire('Error', 'No se pudo guardar el ejercicio.', 'error');
    } else {
        Swal.fire('Guardado', 'Ejercicio agregado correctamente.', 'success');
        
        // Cerrar modal
        const modalEl = document.getElementById('modalEjercicio');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        // Recargar tabla y stats
        cargarEjercicios();
        cargarEstadisticasRapidas();
    }
}

// 3. ELIMINAR EJERCICIO (Global para onclick)
window.eliminarEjercicio = async (id) => {
    const result = await Swal.fire({
        title: '¿Eliminar ejercicio?',
        text: "No se podrá recuperar.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Sí, borrar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        const { error } = await supabase.from('ejercicios').delete().eq('id', id);
        
        if (error) {
            Swal.fire('Error', 'No se pudo borrar.', 'error');
        } else {
            Swal.fire('Eliminado', 'El ejercicio ha sido borrado.', 'success');
            cargarEjercicios();
            cargarEstadisticasRapidas();
        }
    }
};

// =======================================================
// 5. GESTIÓN DE RUTINAS
// =======================================================
async function cargarRutinas() {
    const tbody = document.getElementById('tbodyRutinas');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4"><div class="spinner-border text-primary"></div> Cargando...</td></tr>';

    try {
        // Consultamos la tabla 'rutinas' (tal cual tu imagen)
        const { data: rutinas, error } = await supabase
            .from('rutinas')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!rutinas || rutinas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay rutinas creadas.</td></tr>';
            return;
        }

        tbody.innerHTML = rutinas.map(r => {
            // Colores semánticos para el nivel
            let colorNivel = 'secondary';
            if (r.nivel === 'Principiante') colorNivel = 'success';
            if (r.nivel === 'Intermedio') colorNivel = 'warning';
            if (r.nivel === 'Avanzado') colorNivel = 'danger';

            return `
                <tr>
                    <td class="fw-bold">${r.nombre}</td>
                    <td><span class="badge bg-${colorNivel}">${r.nivel || 'General'}</span></td>
                    <td>${r.categoria || 'General'}</td>
                    <td><i class="far fa-clock"></i> ${r.duracion_minutos || 0} min</td>
                    <td>
                        <button class="btn-accion btn-editar"><i class="fas fa-edit"></i></button>
                        <button class="btn-accion btn-borrar"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error rutinas:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar rutinas.</td></tr>';
    }
}

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

