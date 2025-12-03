import { supabase } from '../../../core/services/cliente_supabase.js';
import { inicializarTema } from '../../shared/scripts/tema.js';
import { aplicarAvatarHeader } from '../../shared/scripts/header_usuario.js';

// DATOS Y CÁLCULOS

/**
 * Calcula el progreso en porcentaje.
 * @param {string} tipoObjetivo - El tipo de objetivo ('meta_peso', 'frecuencia_semanal', etc.)
 * @param {number} valorInicio - Valor al inicio.
 * @param {number} valorMeta - Valor deseado.
 * @param {number} valorActual - Valor medido actualmente.
 * @returns {number} Porcentaje de progreso (0 a 100).
 */
function calcularProgreso(tipoObjetivo, valorInicio, valorMeta, valorActual) {
    if (valorMeta === valorInicio) return valorActual >= valorMeta ? 100 : 0;

    let progreso = 0;

    switch (tipoObjetivo) {
        case 'frecuencia_semanal':
            // Progreso basado en el conteo de sesiones completadas vs. la meta
            progreso = (valorActual / valorMeta) * 100;
            break;

        case 'meta_peso':
        case 'meta_fuerza':
            // Progreso basado en la diferencia (meta de resultado)
            const rangoTotal = Math.abs(valorMeta - valorInicio);
            const avance = Math.abs(valorActual - valorInicio);

            if (rangoTotal === 0) {
                progreso = avance >= 0 ? 100 : 0;
            } else {
                progreso = (avance / rangoTotal) * 100;
            }
            break;

        default:
            progreso = 0;
    }

    // esto es para asegurarse de que el progreso esté entre 0 y 100
    return Math.max(0, Math.min(100, Math.round(progreso)));
}

// RECOMENDACIÓN DE OBJETIVOS PERSONALIZADOS

/**
 * Calcula el IMC (Índice de Masa Corporal)
 * @param {number} peso - Peso en kg
 * @param {number} altura - Altura en cm
 * @returns {number} IMC calculado
 */
function calcularIMC(peso, altura) {
    if (!peso || !altura || altura === 0) return null;
    const alturaMetros = altura / 100;
    return peso / (alturaMetros * alturaMetros);
}

/**
 * Genera objetivos personalizados basados en el perfil del usuario
 * @param {object} perfil - Datos del perfil del usuario
 * @returns {array} Lista de objetivos recomendados
 */
function generarObjetivosPersonalizados(perfil) {
    const objetivosRecomendados = [];

    if (!perfil) return objetivosRecomendados;

    const { peso, altura, nivel_actividad, preferencias_ejercicio } = perfil;

    // Calcular IMC
    const imc = calcularIMC(peso, altura);

    // Regla 1: Si IMC > 25 (Sobrepeso)
    if (imc && imc > 25) {
        objetivosRecomendados.push({
            icono: '🎯',
            nombre: 'Perder peso',
            razon: `Tu IMC actual es ${imc.toFixed(1)} (Sobrepeso)`,
            color: '#ff9800'
        });
        objetivosRecomendados.push({
            icono: '💪',
            nombre: 'Mejorar salud',
            razon: 'Recomendado para tu perfil',
            color: '#4caf50'
        });
    }

    // Regla 2: Si IMC < 18.5 (Bajo peso)
    if (imc && imc < 18.5) {
        objetivosRecomendados.push({
            icono: '💪',
            nombre: 'Ganar músculo',
            razon: `Tu IMC actual es ${imc.toFixed(1)} (Bajo peso)`,
            color: '#2196f3'
        });
        objetivosRecomendados.push({
            icono: '❤️',
            nombre: 'Mejorar salud',
            razon: 'Recomendado para tu perfil',
            color: '#4caf50'
        });
    }

    // Regla 3: Si es "Sedentario" o "Ligero"
    if (nivel_actividad === 'sedentario' || nivel_actividad === 'ligero') {
        // Evitar duplicados
        if (!objetivosRecomendados.find(obj => obj.nombre === 'Mejorar salud')) {
            objetivosRecomendados.push({
                icono: '❤️',
                nombre: 'Mejorar salud',
                razon: `Tu nivel de actividad es ${nivel_actividad}`,
                color: '#4caf50'
            });
        }
        objetivosRecomendados.push({
            icono: '🏃',
            nombre: 'Aumentar resistencia',
            razon: 'Ideal para incrementar tu actividad física',
            color: '#9c27b0'
        });
    }

    // Regla 4: Si prefiere "Fuerza"
    if (preferencias_ejercicio && Array.isArray(preferencias_ejercicio)) {
        if (preferencias_ejercicio.includes('fuerza') || preferencias_ejercicio.includes('pesas')) {
            if (!objetivosRecomendados.find(obj => obj.nombre === 'Ganar músculo')) {
                objetivosRecomendados.push({
                    icono: '💪',
                    nombre: 'Ganar músculo',
                    razon: 'Basado en tu preferencia por ejercicios de fuerza',
                    color: '#2196f3'
                });
            }
        }

        // Regla 5: Si prefiere "Cardio"
        if (preferencias_ejercicio.includes('cardio') || preferencias_ejercicio.includes('correr')) {
            if (!objetivosRecomendados.find(obj => obj.nombre === 'Aumentar resistencia')) {
                objetivosRecomendados.push({
                    icono: '🏃',
                    nombre: 'Aumentar resistencia',
                    razon: 'Basado en tu preferencia por ejercicios cardiovasculares',
                    color: '#9c27b0'
                });
            }
            if (!objetivosRecomendados.find(obj => obj.nombre === 'Perder peso') && imc && imc > 23) {
                objetivosRecomendados.push({
                    icono: '🎯',
                    nombre: 'Perder peso',
                    razon: 'El cardio ayuda con la pérdida de peso',
                    color: '#ff9800'
                });
            }
        }
    }

    // Si no se generaron objetivos, dar recomendaciones generales
    if (objetivosRecomendados.length === 0) {
        objetivosRecomendados.push({
            icono: '❤️',
            nombre: 'Mejorar salud',
            razon: 'Objetivo general para mantener bienestar',
            color: '#4caf50'
        });
        objetivosRecomendados.push({
            icono: '🏃',
            nombre: 'Aumentar resistencia',
            razon: 'Recomendado para todos los niveles',
            color: '#9c27b0'
        });
    }

    return objetivosRecomendados;
}

/**
 * Renderiza los objetivos personalizados en la interfaz
 * @param {array} objetivos - Lista de objetivos recomendados
 */
function renderizarObjetivosPersonalizados(objetivos) {
    const container = document.getElementById('listaObjetivosSeguimiento');
    if (!container) return;

    container.innerHTML = '';

    if (objetivos.length === 0) {
        container.innerHTML = '<p class="text-secondary text-center">No se pudieron generar recomendaciones. Completa tu perfil.</p>';
        return;
    }

    objetivos.forEach(objetivo => {
        const objetivoHTML = `
            <div class="objetivo-item" style="border-left: 4px solid ${objetivo.color}">
                <div class="d-flex align-items-start mb-2">
                    <div style="font-size: 2rem; margin-right: 1rem;">${objetivo.icono}</div>
                    <div class="flex-grow-1">
                        <h5 class="mb-1">${objetivo.nombre}</h5>
                        <p class="text-muted mb-0" style="font-size: 0.9rem;">
                            <i class="fas fa-info-circle"></i> ${objetivo.razon}
                        </p>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += objetivoHTML;
    });
}

// RENDERING Y LÓGICA DE CARGA

async function loadObjectiveList(userId) {
    const listContainer = document.getElementById('listaObjetivosSeguimiento');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin"></i> Cargando objetivos...</div>';

    // Obtener perfil del usuario
    const { data: perfil, error: perfilError } = await supabase
        .from('perfiles_usuario')
        .select('peso, altura, nivel_actividad, preferencias_ejercicio')
        .eq('usuario_id', userId)
        .single();

    if (perfilError) {
        listContainer.innerHTML = `<p class="alert alert-warning">No se pudo cargar tu perfil. Por favor, completa tu información.</p>`;
        return;
    }

    // Generar objetivos personalizados
    const objetivosPersonalizados = generarObjetivosPersonalizados(perfil);
    renderizarObjetivosPersonalizados(objetivosPersonalizados);
}



// LÓGICA DEL MODAL DE CREACIÓN

async function setupNewObjectiveForm(userId) {
    const modal = new bootstrap.Modal(document.getElementById('modalNuevoObjetivo'));
    const form = document.getElementById('formNuevoObjetivo');
    const tipoMetaSelect = document.getElementById('tipoMeta');
    const camposCondicionales = document.getElementById('camposCondicionales');
    const alerta = document.getElementById('alertaFormulario');

    // Precarga de datos de perfil
    const { data: profileData } = await supabase
        .from('perfiles_usuario')
        .select('peso, altura, nivel_actividad')
        .eq('usuario_id', userId)
        .single();

    // Lógica para mostrar/ocultar campos condicionales
    tipoMetaSelect.addEventListener('change', () => {
        const tipo = tipoMetaSelect.value;
        camposCondicionales.innerHTML = ''; // Limpiar campos

        if (tipo === 'meta_peso') {
            const pesoActual = profileData?.peso || '70';
            camposCondicionales.innerHTML = `
                <div class="mb-3">
                    <label for="valorInicio" class="form-label">Peso Actual / Valor de Inicio (kg)</label>
                    <input type="number" id="valorInicio" class="form-control" step="0.1" value="${pesoActual}" required>
                </div>
            `;
        } else if (tipo === 'frecuencia_semanal') {
            camposCondicionales.innerHTML = `
                <div class="mb-3">
                    <label for="frecuenciaSemanal" class="form-label">Frecuencia Semanal (Veces)</label>
                    <input type="number" id="frecuenciaSemanal" class="form-control" min="1" max="7" required>
                    <div class="form-text">Ej: 3 (Meta: 3 entrenamientos por semana)</div>
                </div>
            `;
        }
    });

    // Abrir modal
    document.getElementById('btnNuevoObjetivo').addEventListener('click', () => {
        form.reset();
        alerta.classList.add('d-none');
        camposCondicionales.innerHTML = '';
        modal.show();
    });

    // Manejar el submit del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        alerta.classList.add('d-none');

        const tipo = tipoMetaSelect.value;
        const metaValor = parseFloat(document.getElementById('metaValor').value);
        const fechaLimite = document.getElementById('fechaLimite').value;

        let valorInicio = null;
        let frecuenciaSemanal = null;
        let esRecurrente = false;

        // Recolección de datos condicionales
        if (tipo === 'meta_peso' || tipo === 'meta_fuerza') {
            valorInicio = parseFloat(document.getElementById('valorInicio')?.value || profileData?.peso);
            esRecurrente = false;
        } else if (tipo === 'frecuencia_semanal') {
            frecuenciaSemanal = parseInt(document.getElementById('frecuenciaSemanal').value);
            valorInicio = 0; // El conteo siempre empieza en 0
            esRecurrente = true;
        }

        // Validación de campos
        if (!tipo || isNaN(metaValor) || (tipo !== 'frecuencia_semanal' && isNaN(valorInicio))) {
            alerta.textContent = 'Por favor, completa todos los campos requeridos.';
            alerta.classList.remove('d-none');
            return;
        }

        // Crear el objeto a insertar en objetivos_seguimiento
        const newObjective = {
            user_id: userId,
            tipo_objetivo: tipo,
            meta_valor: metaValor,
            valor_inicio: valorInicio,
            valor_actual: valorInicio || 0, // Si es recurrente inicia en 0, si es de peso inicia en valorInicio
            es_recurrente: esRecurrente,
            frecuencia_semanal: frecuenciaSemanal,
            fecha_limite: fechaLimite || null
        };

        // INSERTAR EN SUPABASE
        const { error } = await supabase.from('objetivos_seguimiento').insert([newObjective]);

        if (error) {
            alerta.textContent = `Error al guardar: ${error.message}`;
            alerta.classList.remove('d-none');
            return;
        }

        // Éxito
        modal.hide();
        // Recargar la lista para mostrar el nuevo objetivo
        loadObjectiveList(userId);
    });
}


// INICIALIZACIÓN
async function initializeApp() {
    const { data: { user } } = await supabase.auth.getUser();
    inicializarTema();
    aplicarAvatarHeader();

    if (!user) {
        // Redirigir si no hay sesión
        window.location.href = '../login/iniciar_sesion.html';
        return;
    }

    // Iniciar la carga de la lista y configurar el formulario
    await Promise.all([
        loadObjectiveList(user.id),
        setupNewObjectiveForm(user.id)
    ]);
}

document.addEventListener('DOMContentLoaded', initializeApp);