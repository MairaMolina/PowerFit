// ====== CONFIGURACIÓN DE SUPABASE ======
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://iinbzpqjxpciivcomruk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpbmJ6cHFqeHBjaWl2Y29tcnVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI4NjQzMywiZXhwIjoyMDc3ODYyNDMzfQ.ZrgGyJUf50WzlIONM_t0-qmufnixDdgb8xUaAtsGpuI';
const supabase = createClient(supabaseUrl, supabaseKey);

// ====== LISTENER PARA GUARDAR SESIÓN EN LOCALSTORAGE ======
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Dashboard Supabase auth state change:', event, session ? 'session exists' : 'no session');
    if (session) {
        // Guardar la sesión en localStorage para que otras páginas puedan acceder
        localStorage.setItem('supabase.session', JSON.stringify(session));
        console.log('Dashboard: Session saved to localStorage');
    } else {
        // Limpiar localStorage cuando no hay sesión
        localStorage.removeItem('supabase.session');
        console.log('Dashboard: Session removed from localStorage');
    }
});

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
        console.log('Dashboard: Starting session verification...');

        // 1. Intenta obtener la sesión del localStorage (guardada por login)
        const sesionGuardada = localStorage.getItem('supabase.session');
        console.log('Dashboard: localStorage supabase.session:', sesionGuardada ? 'found' : 'not found');

        // Also check what Supabase has
        const { data: supabaseSession, error: supabaseError } = await supabase.auth.getSession();
        console.log('Dashboard: Supabase getSession - data:', supabaseSession, 'error:', supabaseError);

        if (!sesionGuardada) {
            console.log('Dashboard: No session in localStorage, checking Supabase session...');
            if (!supabaseSession.session) {
                console.log('Dashboard: No Supabase session either, redirecting to login');
                window.location.href = '/iniciar_sesion.html';
                return;
            } else {
                console.log('Dashboard: Using Supabase session instead');
                // Use Supabase session
                usuarioActual = supabaseSession.session.user;
                await cargarDatosUsuario();
                await cargarDashboard();
                return;
            }
        }

        // 2. Parsear la sesión guardada
        const session = JSON.parse(sesionGuardada);

        // 3. Validar que tenga los datos necesarios
        if (!session || !session.user || !session.access_token) {
            console.log('Dashboard: Session data invalid, redirecting to login');
            window.location.href = '/iniciar_sesion.html';
            return;
        }

        console.log('Dashboard: Session valid, user:', session.user.email);

        // 4. Establecer el usuario actual
        usuarioActual = session.user;

        // 5. Cargar datos del usuario y dashboard
        await cargarDatosUsuario();
        await cargarDashboard();

    } catch (error) {
        console.error('Error al verificar sesión:', error);
        window.location.href = '/iniciar_sesion.html';
    }
}

// ====== CARGAR DATOS DEL USUARIO DESDE LA BD ======
async function cargarDatosUsuario() {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('correo', usuarioActual.email)
            .single();

        if (error) throw error;

        datosUsuario = data;
        actualizarInformacionUsuario();

    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        // Si no existe, mostrar datos básicos del auth
        datosUsuario = {
            nombre_completo: usuarioActual.email.split('@')[0],
            correo: usuarioActual.email
        };
        actualizarInformacionUsuario();
    }
}

// ====== ACTUALIZAR INFORMACIÓN DEL USUARIO EN LA INTERFAZ ======
function actualizarInformacionUsuario() {
    const nombreCompleto = datosUsuario?.nombre_completo || usuarioActual.email.split('@')[0];
    const iniciales = obtenerIniciales(nombreCompleto);

    // Actualizar nombre en header
    document.getElementById('nombreUsuarioHeader').textContent = nombreCompleto;
    document.getElementById('nombreUsuario').textContent = nombreCompleto;
    document.getElementById('nombreUsuarioSaludo').textContent = nombreCompleto.split(' ')[0];

    // Actualizar iniciales
    document.getElementById('iniciales').textContent = iniciales;
}

// ====== OBTENER INICIALES DEL NOMBRE ======
function obtenerIniciales(nombre) {
    const palabras = nombre.trim().split(' ');
    if (palabras.length >= 2) {
        return (palabras[0][0] + palabras[1][0]).toUpperCase();
    }
    return palabras[0].substring(0, 2).toUpperCase();
}

// ====== CARGAR TODO EL DASHBOARD ======
async function cargarDashboard() {
    await Promise.all([
        cargarEstadisticas(),
        cargarRutinasRecientes(),
        cargarRutinaActiva(),
        cargarInformacionBasica()
    ]);
}

// ====== CARGAR ESTADÍSTICAS ======
async function cargarEstadisticas() {
    try {
        // Por ahora valores estáticos ya que no tienes tabla de entrenamientos completados
        // Estos se calcularían cuando implementes el seguimiento de entrenamientos

        document.getElementById('rachaActual').textContent = '0 días';
        document.getElementById('entrenamientosTotales').textContent = '0';
        document.getElementById('metaSemanal').textContent = '0/5';
        document.getElementById('progresoSemanal').style.width = '0%';
        document.getElementById('tiempoTotal').textContent = '0h';

        // Contar rutinas creadas por el usuario
        const { count: totalRutinas } = await supabase
            .from('rutinas')
            .select('*', { count: 'exact', head: true })
            .eq('usuario_id', datosUsuario.id);

        if (totalRutinas > 0) {
            document.getElementById('entrenamientosTotales').textContent = totalRutinas;
        }

    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// ====== CARGAR RUTINAS RECIENTES (CREADAS POR EL USUARIO) ======
async function cargarRutinasRecientes() {
    try {
        const { data: rutinas, error } = await supabase
            .from('rutinas')
            .select('*')
            .eq('usuario_id', datosUsuario.id)
            .order('created_at', { ascending: false })
            .limit(3);

        if (error) throw error;

        const lista = document.getElementById('listaEntrenamientosRecientes');

        if (!rutinas || rutinas.length === 0) {
            lista.innerHTML = `
                <div class="text-center py-4">
                    <p class="text-muted">Aún no tienes rutinas creadas</p>
                    <a href="/explorar-rutinas.html" class="btn btn-primary btn-sm mt-2">Crear Rutina</a>
                </div>
            `;
            return;
        }

        lista.innerHTML = rutinas.map(r => {
            const fecha = new Date(r.created_at);
            const diasAtras = Math.floor((new Date() - fecha) / (1000 * 60 * 60 * 24));

            let textoFecha = '';
            if (diasAtras === 0) textoFecha = 'Hoy';
            else if (diasAtras === 1) textoFecha = 'Ayer';
            else textoFecha = `Hace ${diasAtras} días`;

            return `
                <div class="item-entrenamiento">
                    <div class="icono-entrenamiento azul">
                        <i class="fas fa-dumbbell"></i>
                    </div>
                    <div class="info-entrenamiento">
                        <h4>${r.nombre}</h4>
                        <p>${textoFecha}</p>
                    </div>
                    <div class="detalles-entrenamiento">
                        <span class="duracion">${r.duracion_estimada || 'N/A'}</span>
                        <span class="calorias">${r.tipo_cuerpo || 'General'}</span>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error al cargar rutinas recientes:', error);
        document.getElementById('listaEntrenamientosRecientes').innerHTML = `
            <p class="text-danger">Error al cargar rutinas</p>
        `;
    }
}

// ====== CARGAR LOGROS (VALORES SIMULADOS) ======
document.getElementById('listaLogros').innerHTML = `
    <div class="col-md-6">
        <div class="item-logro">
            <div class="icono-logro amarillo">
                <i class="fas fa-award"></i>
            </div>
            <div class="info-logro">
                <h4>Bienvenido</h4>
                <p>Has creado tu cuenta en Power Fit</p>
            </div>
        </div>
    </div>
    <div class="col-md-6">
        <div class="item-logro">
            <div class="icono-logro azul">
                <i class="fas fa-dumbbell"></i>
            </div>
            <div class="info-logro">
                <h4>Primera Rutina</h4>
                <p>Crea tu primera rutina de ejercicios</p>
            </div>
        </div>
    </div>
`;

// ====== CARGAR RUTINA ACTIVA ======
async function cargarRutinaActiva() {
    try {
        // Buscar la rutina predeterminada del usuario
        const { data: rutinaActiva, error } = await supabase
            .from('rutinas')
            .select(`
                *,
                rutinas_ejercicios (
                    *,
                    ejercicios (*)
                )
            `)
            .eq('usuario_id', datosUsuario.id)
            .eq('es_predeterminada', true)
            .single();

        if (error || !rutinaActiva) {
            // Si no tiene rutina predeterminada, buscar la más reciente
            const { data: ultimaRutina } = await supabase
                .from('rutinas')
                .select(`
                    *,
                    rutinas_ejercicios (
                        *,
                        ejercicios (*)
                    )
                `)
                .eq('usuario_id', datosUsuario.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (!ultimaRutina) {
                mostrarSinRutina();
                return;
            }

            mostrarRutina(ultimaRutina);
            return;
        }

        mostrarRutina(rutinaActiva);

    } catch (error) {
        console.error('Error al cargar rutina activa:', error);
        mostrarSinRutina();
    }
}

function mostrarSinRutina() {
    document.getElementById('listaEjerciciosHoy').innerHTML = `
        <div class="text-center py-4">
            <p class="text-muted">No tienes una rutina asignada</p>
            <a href="/explorar-rutinas.html" class="btn btn-primary btn-sm mt-2">Crear Rutina</a>
        </div>
    `;
    document.getElementById('tipoRutina').textContent = 'Sin rutina';
    document.getElementById('botonIniciarEntrenamiento').disabled = true;
}

function mostrarRutina(rutina) {
    document.getElementById('tipoRutina').textContent = rutina.tipo_cuerpo || 'Entrenamiento';

    const ejercicios = rutina.rutinas_ejercicios || [];
    const lista = document.getElementById('listaEjerciciosHoy');

    if (ejercicios.length === 0) {
        lista.innerHTML = `
            <div class="text-center py-3">
                <p class="text-muted">Esta rutina no tiene ejercicios asignados</p>
            </div>
        `;
        return;
    }

    lista.innerHTML = ejercicios.slice(0, 3).map((re, index) => {
        const ejercicio = re.ejercicios;

        return `
            <div class="ejercicio-item">
                <div class="numero-ejercicio">${index + 1}</div>
                <div class="info-ejercicio">
                    <h4>${ejercicio.nombre}</h4>
                    <p>${re.series || 3} sets x ${re.repeticiones || 10} reps</p>
                </div>
                <span class="estado-ejercicio pendiente">Pendiente</span>
            </div>
        `;
    }).join('');

    // Botón de iniciar entrenamiento
    document.getElementById('botonIniciarEntrenamiento').onclick = () => {
        window.location.href = `/entrenamiento.html?rutina_id=${rutina.id}`;
    };
}

// ====== CARGAR INFORMACIÓN BÁSICA ======
async function cargarInformacionBasica() {
    try {
        // Peso - usar fecha_nacimiento como placeholder si no tienes campo de peso
        if (datosUsuario?.fecha_nacimiento) {
            const edad = calcularEdad(datosUsuario.fecha_nacimiento);
            document.getElementById('pesoActual').textContent = `${edad} años`;
            document.getElementById('metaPeso').textContent = 'Actualiza tu información';
        } else {
            document.getElementById('pesoActual').textContent = '-- kg';
            document.getElementById('metaPeso').textContent = 'Actualiza tu peso';
        }

        // Días de entrenamiento - simulado
        document.getElementById('diasEntrenamiento').textContent = '0 / 7';
        document.getElementById('rachaInfo').textContent = 'Racha: 0 días seguidos';

        // Próximos entrenamientos - simulado
        const listaProximos = document.getElementById('listaProximosEntrenamientos');
        listaProximos.innerHTML = `
            <div class="text-center py-3">
                <p class="text-muted">No tienes entrenamientos programados</p>
                <button class="btn btn-primary btn-sm mt-2" onclick="window.location.href='/mis-rutinas.html'">
                    Ver Mis Rutinas
                </button>
            </div>
        `;

        // Medidas corporales - simulado
        const listaMedidas = document.getElementById('listaMedidas');
        listaMedidas.innerHTML = `
            <div class="text-center py-3">
                <p class="text-muted">No hay medidas registradas</p>
                <small class="text-muted">Género: ${datosUsuario?.genero || 'No especificado'}</small>
            </div>
        `;

    } catch (error) {
        console.error('Error al cargar información básica:', error);
    }
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

// ====== GUARDAR MEDIDAS (SIMPLIFICADO) ======
document.getElementById('botonGuardarMedidas')?.addEventListener('click', async () => {
    alert('Funcionalidad de medidas en desarrollo. Necesitas crear una tabla "medidas_corporales" en Supabase.');
});

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