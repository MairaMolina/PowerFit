// ====== CONFIGURACIÓN DE SUPABASE ======
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { aplicarAvatarHeader } from '../../shared/scripts/header_usuario.js';

const supabaseUrl = 'https://iinbzpqjxpciivcomruk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpbmJ6cHFqeHBjaWl2Y29tcnVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjI4NjQzMywiZXhwIjoyMDc3ODYyNDMzfQ.ZrgGyJUf50WzlIONM_t0-qmufnixDdgb8xUaAtsGpuI';
const supabase = createClient(supabaseUrl, supabaseKey);

// ====== VARIABLES GLOBALES ======
let usuarioActual = null;
let datosUsuario = null;

// ====== VERIFICAR SESIÓN AL CARGAR ======
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📱 Dashboard cargando...');
    await verificarSesion();
});

// ====== VERIFICAR SI HAY SESIÓN ACTIVA ======
async function verificarSesion() {
    try {
        console.log('🔍 PASO 1: Obteniendo sesión de Supabase...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('PASO 1 - Resultado:', { session: session ? 'EXISTE' : 'NULL', error });

        // Si hay error O no hay sesión, redirigir
        if (error) {
            console.error('❌ PASO 1 - Error:', error);
            window.location.replace('/view/login/iniciar_sesion.html');
            return;
        }

        if (!session) {
            console.warn('⚠️ PASO 1 - No hay sesión');
            window.location.replace('/view/login/iniciar_sesion.html');
            return;
        }

        console.log('✅ PASO 1 - Sesión válida para:', session.user.email);
        usuarioActual = session.user;

        // PASO 2: Cargar datos del usuario
        console.log('🔍 PASO 2: Cargando datos del usuario...');
        await cargarDatosUsuario();
        console.log('✅ PASO 2 - Datos cargados');

        aplicarAvatarHeader(); 
        console.log('✅ PASO 2.5 - Header actualizado');

        // PASO 3: Cargar dashboard
        console.log('🔍 PASO 3: Cargando dashboard...');
        await cargarDashboard();
        console.log('✅ PASO 3 - Dashboard cargado');

        // PASO 4: Inicializar eventos
        console.log('🔍 PASO 4: Inicializando eventos...');
        inicializarEventos();
        console.log('✅ PASO 4 - Eventos inicializados');

        console.log('🎉 TODO LISTO - Dashboard completamente cargado');

    } catch (error) {
        console.error('💥 ERROR CRÍTICO en verificarSesion:', error);
        console.error('Stack trace:', error.stack);
        // NO redirigir automáticamente para ver el error
        alert('Error al cargar dashboard. Revisa la consola (F12)');
    }
}

// ====== CARGAR DATOS DEL USUARIO DESDE LA BD ======
async function cargarDatosUsuario() {
    try {
        console.log('   → Buscando perfil en BD para usuario:', usuarioActual.email);

        // 1. Primero obtener el usuario de la tabla usuarios para el nombre y el ID
        const { data: usuarioData, error: usuarioError } = await supabase
            .from('usuarios')
            .select('nombre_completo, id')
            .eq('correo', usuarioActual.email)
            .single();

        let nombreCompleto = usuarioActual.email.split('@')[0];
        let usuarioId = null;

        if (!usuarioError && usuarioData) {
            nombreCompleto = usuarioData.nombre_completo || nombreCompleto;
            usuarioId = usuarioData.id;
            console.log('   ✅ Usuario encontrado, ID:', usuarioId);
        } else {
            console.warn('   ⚠️ Usuario no encontrado en tabla usuarios');
            datosUsuario = {
                id: null,
                nombre_completo: nombreCompleto,
                correo: usuarioActual.email,
                peso: null,
                altura: null
            };
            const nombreParaAvatar = usuarioActual.email.split('@')[0];
            localStorage.setItem('pf.avatar', JSON.stringify({
            nombre_completo: nombreParaAvatar,
            avatar_url: null
            }));
            console.log('   ✅ localStorage[pf.avatar] sincronizado (Caso Usuario no encontrado).');
        // 🚨 FIN PARCHE 🚨

        actualizarInformacionUsuario();
        return;
        }

        // 2. Consultar la tabla perfiles_usuario usando usuario_id
        const { data: perfilData, error: perfilError } = await supabase
            .from('perfiles_usuario')
            .select('*')
            .eq('usuario_id', usuarioId)  // Usar el ID de la tabla usuarios
            .single();

        console.log('   → Resultado perfil:', { 
            data: perfilData ? 'ENCONTRADO' : 'NULL', 
            error: perfilError,
            perfilData: perfilData
        });

        if (perfilError || !perfilData) {
            console.warn('   ⚠️ Perfil no encontrado, usando datos básicos');
            console.warn('   ⚠️ Error detallado:', perfilError);
            datosUsuario = {
                id: usuarioId,
                nombre_completo: nombreCompleto,
                correo: usuarioActual.email,
                peso: null,
                altura: null
            };
        } else {
            // Usar SOLO los datos de perfiles_usuario, pero mantener el nombre_completo para el saludo
            datosUsuario = {
                ...perfilData,
                id: usuarioId,  // Mantener el ID de usuarios
                nombre_completo: nombreCompleto,  // Mantener el nombre para el saludo
                correo: usuarioActual.email
            };
            console.log('   ✅ Perfil encontrado');
            localStorage.setItem('pf.avatar', JSON.stringify({
                                nombre_completo: nombreCompleto,
                                avatar_url: perfilData.avatar_url || null
                            }));
            console.log('   ✅ localStorage[pf.avatar] sincronizado con la BD.');
            console.log('   📊 Datos del perfil:', {
                peso: datosUsuario.peso,
                altura: datosUsuario.altura,
                tipoPeso: typeof datosUsuario.peso,
                tipoAltura: typeof datosUsuario.altura
            });
        }


        actualizarInformacionUsuario();

    } catch (error) {
        console.error('   💥 Error en cargarDatosUsuario:', error);
        // Usar datos mínimos
        datosUsuario = {
            id: null,
            nombre_completo: usuarioActual.email.split('@')[0],
            correo: usuarioActual.email,
            peso: null,
            altura: null
        };
        const nombreMinimo = usuarioActual.email.split('@')[0];
        localStorage.setItem('pf.avatar', JSON.stringify({
            nombre_completo: nombreMinimo,
            avatar_url: null
        }));

        actualizarInformacionUsuario();
    }
}

// ====== ACTUALIZAR INFORMACIÓN DEL USUARIO EN LA INTERFAZ ======
function actualizarInformacionUsuario() {
    try {
        const nombreCompleto = datosUsuario?.nombre_completo || 'Usuario';
        const iniciales = obtenerIniciales(nombreCompleto);

        const elem1 = document.getElementById('nombreUsuarioHeader');
        const elem2 = document.getElementById('nombreUsuario');
        const elem3 = document.getElementById('nombreUsuarioSaludo');
        const elem4 = document.getElementById('iniciales');

        if (elem1) elem1.textContent = nombreCompleto;
        if (elem2) elem2.textContent = nombreCompleto;
        if (elem3) elem3.textContent = nombreCompleto.split(' ')[0];
        if (elem4) elem4.textContent = iniciales;

        console.log('   ✅ Información de usuario actualizada en UI');
    } catch (error) {
        console.error('   💥 Error en actualizarInformacionUsuario:', error);
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

// ====== CARGAR TODO EL DASHBOARD ======
async function cargarDashboard() {
    try {
        console.log('   → Cargando componentes del dashboard...');
        
        await cargarEstadisticas();
        console.log('   ✓ Estadísticas cargadas');
        
        await cargarRutinasRecientes();
        console.log('   ✓ Rutinas recientes cargadas');
        
        await cargarRutinaActiva();
        console.log('   ✓ Rutina activa cargada');
        
        await cargarInformacionBasica();
        console.log('   ✓ Información básica cargada');

    } catch (error) {
        console.error('   💥 Error en cargarDashboard:', error);
        // No lanzar el error para que no pare todo
    }
}

// ====== CARGAR ESTADÍSTICAS ======
async function cargarEstadisticas() {
    try {
        document.getElementById('rachaActual').textContent = '0 días';
        document.getElementById('entrenamientosTotales').textContent = '0';
        document.getElementById('metaSemanal').textContent = '0/5';
        document.getElementById('progresoSemanal').style.width = '0%';
        document.getElementById('tiempoTotal').textContent = '0h';

        // Solo si tenemos ID de usuario
        if (datosUsuario?.id) {
            const { count: totalRutinas } = await supabase
                .from('rutinas')
                .select('*', { count: 'exact', head: true })
                .eq('usuario_id', datosUsuario.id);

            if (totalRutinas > 0) {
                document.getElementById('entrenamientosTotales').textContent = totalRutinas;
            }
        }
    } catch (error) {
        console.error('      Error en cargarEstadisticas:', error);
    }
}

// ====== CARGAR RUTINAS RECIENTES ======
async function cargarRutinasRecientes() {
    try {
        const lista = document.getElementById('listaEntrenamientosRecientes');

        // Si no hay ID, mostrar mensaje
        if (!datosUsuario?.id) {
            lista.innerHTML = `
                <div class="text-center py-4">
                    <p class="text-muted">Completa tu perfil para ver tus rutinas</p>
                </div>
            `;
            return;
        }

        const { data: rutinas, error } = await supabase
            .from('rutinas')
            .select('*')
            .eq('usuario_id', datosUsuario.id)
            .order('created_at', { ascending: false })
            .limit(3);

        if (error) {
            console.error('      Error al consultar rutinas:', error);
            throw error;
        }

        if (!rutinas || rutinas.length === 0) {
            lista.innerHTML = `
                <div class="text-center py-4 card-empty">
                    <p class="text-muted mb-2">Aún no tienes rutinas creadas</p>
                    <a href="/view/rutinas/explorar.html" class="btn btn-outline-primary btn-sm mt-1">Crear Rutina</a>
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
        console.error('      Error en cargarRutinasRecientes:', error);
        const lista = document.getElementById('listaEntrenamientosRecientes');
        lista.innerHTML = `<p class="text-muted">Error al cargar rutinas</p>`;
    }
}

// ====== CARGAR LOGROS ======
const listaLogros = document.getElementById('listaLogros');
if (listaLogros) {
    listaLogros.innerHTML = `
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
}

// ====== CARGAR RUTINA ACTIVA ======
async function cargarRutinaActiva() {
    try {
        if (!datosUsuario?.id) {
            mostrarSinRutina();
            return;
        }

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
        console.error('      Error en cargarRutinaActiva:', error);
        mostrarSinRutina();
    }
}

function mostrarSinRutina() {
    const lista = document.getElementById('listaEjerciciosHoy');
    if (lista) {
        lista.innerHTML = `
            <div class="text-center py-4 card-empty">
                <p class="text-muted">No tienes una rutina asignada</p>
                <a href="/view/rutinas/explorar.html" class="btn btn-outline-primary btn-sm mt-2">Crear Rutina</a>
            </div>
        `;
    }
    
    const tipoRutina = document.getElementById('tipoRutina');
    if (tipoRutina) tipoRutina.textContent = 'Sin rutina';
    
    const btnIniciar = document.getElementById('botonIniciarEntrenamiento');
    if (btnIniciar) btnIniciar.disabled = true;
}

function mostrarRutina(rutina) {
    const tipoRutina = document.getElementById('tipoRutina');
    if (tipoRutina) tipoRutina.textContent = rutina.tipo_cuerpo || 'Entrenamiento';

    const ejercicios = rutina.rutinas_ejercicios || [];
    const lista = document.getElementById('listaEjerciciosHoy');

    if (!lista) return;

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

    const btnIniciar = document.getElementById('botonIniciarEntrenamiento');
    if (btnIniciar) {
        btnIniciar.disabled = false;
        btnIniciar.onclick = () => {
            window.location.href = `/view/entrenamientos/sesion.html?rutina_id=${rutina.id}`;
        };
    }
}

// ====== CARGAR INFORMACIÓN BÁSICA ======
async function cargarInformacionBasica() {
    try {
        // DEBUG: Ver qué datos tenemos
        console.log('📊 cargar Informacion Basica - Datos del usuario:', {
            peso: datosUsuario?.peso,
            altura: datosUsuario?.altura,
            nombre: datosUsuario?.nombre_completo,
            todosLosDatos: datosUsuario
        });

        const pesoActual = document.getElementById('pesoActual');
        const metaPeso = document.getElementById('metaPeso');
        const nombreElem = document.getElementById('nombre');
        
        // Mostrar nombre en el saludo
        if (nombreElem && datosUsuario?.nombre_completo) {
            nombreElem.textContent = datosUsuario.nombre_completo.split(' ')[0];
        } else if (nombreElem) {
            nombreElem.textContent = 'Usuario';
        }
        
        // PESO: Mostrar peso actual del usuario
        // Verificar que peso no sea null, undefined, o 0
        if (datosUsuario?.peso != null && datosUsuario.peso > 0) {
            console.log('✅ Mostrando peso:', datosUsuario.peso);
            if (pesoActual) {
                pesoActual.textContent = `${datosUsuario.peso} kg`;
            }
            if (metaPeso) {
                metaPeso.textContent = 'Actualiza tu meta en el perfil';
            }
        } else {
            console.warn('⚠️ Peso no válido:', datosUsuario?.peso);
            if (pesoActual) pesoActual.textContent = '-- kg';
            if (metaPeso) metaPeso.textContent = 'Actualiza tu peso en tu perfil';
        }

        // Días de entrenamiento - simulado
        const diasEnt = document.getElementById('diasEntrenamiento');
        const rachaInfo = document.getElementById('rachaInfo');
        if (diasEnt) diasEnt.textContent = '0 / 7';
        if (rachaInfo) rachaInfo.textContent = 'Racha: 0 días seguidos';

        // Próximos entrenamientos - simulado
        const listaProximos = document.getElementById('listaProximosEntrenamientos');
        if (listaProximos) {
            listaProximos.innerHTML = `
                <div class="text-center py-3 card-empty">
                    <p class="text-muted">No tienes entrenamientos programados</p>
                </div>
            `;
        }

        // Medidas corporales - Solo Peso y Altura
        const listaMedidas = document.getElementById('listaMedidas');
        if (listaMedidas) {
            const medidas = [];
            
            // Peso - verificar que no sea null/0
            if (datosUsuario?.peso != null && datosUsuario.peso > 0) {
                console.log('✅ Agregando peso a medidas:', datosUsuario.peso);
                medidas.push(`
                    <div class="item-medida">
                        <span class="nombre-medida">Peso</span>
                        <span class="valor-medida">${datosUsuario.peso} kg</span>
                    </div>
                `);
            } else {
                console.warn('⚠️ Peso no válido para medidas:', datosUsuario?.peso);
            }
            
            // Altura - verificar que no sea null/0
            if (datosUsuario?.altura != null && datosUsuario.altura > 0) {
                console.log('✅ Agregando altura a medidas:', datosUsuario.altura);
                medidas.push(`
                    <div class="item-medida">
                        <span class="nombre-medida">Altura</span>
                        <span class="valor-medida">${datosUsuario.altura} cm</span>
                    </div>
                `);
            } else {
                console.warn('⚠️ Altura no válida para medidas:', datosUsuario?.altura);
            }
            
            // Calcular IMC si tiene peso y altura
            if (datosUsuario?.peso && datosUsuario?.altura) {
                const imc = calcularIMC(datosUsuario.peso, datosUsuario.altura);
                const categoriaIMC = obtenerCategoriaIMC(imc);

                const categoriaClass = {
                    'Bajo peso': 'imc-bajo',
                    'Normal': 'imc-normal',
                    'Sobrepeso': 'imc-sobre',
                    'Obesidad': 'imc-obeso'
                }[categoriaIMC] || '';

                medidas.push(`
                    <div class="item-medida">
                        <span class="nombre-medida">IMC</span>
                        <span class="valor-medida ${categoriaClass}">
                            ${imc} <small>(${categoriaIMC})</small>
                        </span>
                    </div>
                `);
                console.log('✅ IMC calculado:', imc);
            }
            
            if (medidas.length > 0) {
                listaMedidas.innerHTML = medidas.join('');
                console.log('✅ Medidas mostradas:', medidas.length, 'elementos');
            } else {
                console.warn('⚠️ No hay medidas para mostrar');
                listaMedidas.innerHTML = `
                    <div class="text-center py-3 card-empty">
                        <p class="text-muted">No hay medidas registradas</p>
                        <a href="../../view/perfil/perfil.html" class="btn btn-outline-primary btn-sm mt-2">
                            <i class="fas fa-edit"></i> Completar Perfil
                        </a>
                    </div>
                `;
            }
        }

    } catch (error) {
        console.error('Error en cargarInformacionBasica:', error);
    }
}

// ====== CALCULAR IMC ======
function calcularIMC(peso, altura) {
    // Altura debe estar en metros
    const alturaMetros = altura / 100;
    const imc = peso / (alturaMetros * alturaMetros);
    return imc.toFixed(1);
}

// ====== OBTENER CATEGORÍA DE IMC ======
function obtenerCategoriaIMC(imc) {
    if (imc < 18.5) return 'Bajo peso';
    if (imc < 25) return 'Normal';
    if (imc < 30) return 'Sobrepeso';
    return 'Obesidad';
}

// ====== INICIALIZAR EVENTOS ======
function inicializarEventos() {
    // Cerrar sesión
    const btnCerrarSesion = document.getElementById('botonCerrarSesion');
    
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', async (e) => {
            e.preventDefault();

            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                try {
                    console.log('🚪 Cerrando sesión...');
                    
                    const { error } = await supabase.auth.signOut();
                    if (error) throw error;

                    console.log('✅ Sesión cerrada');

                    // Redirigir
                    window.location.replace('/view/home/inicio.html');

                } catch (error) {
                    console.error('❌ Error al cerrar sesión:', error);
                    alert('Error al cerrar sesión');
                }
            }
        });
    }

    // Cambiar tema
    const btnTema = document.getElementById('botonTema');
    if (btnTema) {
        btnTema.addEventListener('click', () => {
            document.body.classList.toggle('tema-oscuro');

        const icono = btnTema.querySelector('i');
        // <CHANGE> Agregar referencia a los logos
        const logoLight = document.querySelector('.logo-light');
        const logoDark = document.querySelector('.logo-dark');

        if (document.body.classList.contains('tema-oscuro')) {
            if (icono) {
                icono.classList.remove('fa-moon');
                icono.classList.add('fa-sun');
            }
            // <CHANGE> Cambiar logos manualmente
            if (logoLight) logoLight.style.display = 'none';
            if (logoDark) logoDark.style.display = 'block';
            localStorage.setItem('tema', 'oscuro');
        } else {
            if (icono) {
                icono.classList.remove('fa-sun');
                icono.classList.add('fa-moon');
            }
            // <CHANGE> Cambiar logos manualmente
            if (logoLight) logoLight.style.display = 'block';
            if (logoDark) logoDark.style.display = 'none';
            localStorage.setItem('tema', 'claro');
        }
    });
    }

    // Cargar tema guardado
    const temaGuardado = localStorage.getItem('tema');
    if (temaGuardado === 'oscuro') {
        document.body.classList.add('tema-oscuro');
        const icono = document.querySelector('#botonTema i');
        if (icono) {
            icono.classList.remove('fa-moon');
            icono.classList.add('fa-sun');
        }
        // <CHANGE> Aplicar logos al cargar si el tema es oscuro
        const logoLight = document.querySelector('.logo-light');
        const logoDark = document.querySelector('.logo-dark');
        if (logoLight) logoLight.style.display = 'none';
        if (logoDark) logoDark.style.display = 'block';
    }
}