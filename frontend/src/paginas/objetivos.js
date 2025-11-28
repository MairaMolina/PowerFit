import { supabase } from '../../../core/services/cliente_supabase.js';


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

// RENDERING Y LÓGICA DE CARGA

async function loadObjectiveList(userId) {
    const listContainer = document.getElementById('listaObjetivosSeguimiento');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin"></i> Cargando objetivos...</div>';

    // Consultar la tabla objetivos_seguimiento (la nueva tabla)
    const { data: objectives, error } = await supabase
        .from('objetivos_seguimiento')
        .select('*')
        .eq('user_id', userId)
        .order('fecha_limite', { ascending: true, nullsFirst: false });

    if (error) {
        listContainer.innerHTML = `<p class="alert alert-danger">Error al cargar objetivos: ${error.message}</p>`;
        return;
    }

    if (objectives.length === 0) {
        listContainer.innerHTML = '<p class="text-secondary text-center">¡Aún no tienes objetivos de seguimiento activos! Crea uno ahora.</p>';
        return;
    }

    listContainer.innerHTML = '';
    
    // Renderizar la lista
    objectives.forEach(obj => {
        const progreso = calcularProgreso(obj.tipo_objetivo, obj.valor_inicio, obj.meta_valor, obj.valor_actual);
        
        // Determinar etiquetas y unidades
        let unidad = '';
        let estado = 'En progreso';
        if (obj.tipo_objetivo === 'meta_peso') unidad = 'kg';
        if (obj.tipo_objetivo === 'frecuencia_semanal') { unidad = 'veces'; estado = 'Recurrente'; }
        if (progreso >= 100) estado = 'Completado';

        const objectiveItem = `
            <div class="objetivo-item">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <div>
                        <h5 class="text-capitalize">${obj.tipo_objetivo.replace(/_/g, ' ')}</h5>
                        <span class="meta-status">
                            ${obj.tipo_objetivo === 'meta_peso' || obj.tipo_objetivo === 'meta_fuerza' 
                                ? `${obj.valor_actual}${unidad} de ${obj.meta_valor}${unidad}` 
                                : `${obj.valor_actual} ${unidad} esta semana / Meta: ${obj.meta_valor} ${unidad}`}
                        </span>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-info">${estado}</span>
                    </div>
                </div>
                
                <div class="progreso-bar-contenedor">
                    <div class="progreso-bar" style="width: ${progreso}%">${progreso}%</div>
                </div>

                <div class="d-flex justify-content-between mt-2">
                    <small class="text-muted">Inicia: ${obj.fecha_inicio || 'N/A'}</small>
                    <small class="text-muted">${obj.fecha_limite ? 'Límite: ' + obj.fecha_limite : 'Sin límite'}</small>
                </div>
            </div>
        `;
        listContainer.innerHTML += objectiveItem;
    });
}



// LÓGICA DEL MODAL DE CREACIÓN

async function setupNewObjectiveForm(userId) {
    const modal = new bootstrap.Modal(document.getElementById('modalNuevoObjetivo'));
    const form = document.getElementById('formNuevoObjetivo');
    const tipoMetaSelect = document.getElementById('tipoMeta');
    const camposCondicionales = document.getElementById('camposCondicionales');
    const alerta = document.getElementById('alertaFormulario');
    
    // Precarga de datos de perfil
    const { data: profileData } = await supabase.from('perfiles').select('peso, altura, nivel_actividad').eq('id', userId).single();

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