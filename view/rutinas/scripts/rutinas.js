import { supabase } from '../../../core/services/cliente_supabase.js';

// ============================================
// CÁLCULOS Y UTILIDADES
// ============================================

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

// ============================================
// GENERACIÓN DE RUTINAS PERSONALIZADAS
// ============================================

/**
 * Define las rutinas para pérdida de peso (IMC > 25)
 * Cardio bajo impacto + fuerza básica
 */
function getRutinasPerdidaPeso() {
    return [
        {
            id: 'perder_peso_1',
            objetivo: 'perder_peso',
            nombre: 'Cardio & Fuerza Básica',
            nivel: 1,
            icono: '🎯',
            descripcion: 'Programa inicial de pérdida de peso con cardio suave y ejercicios básicos de fuerza',
            duracion_minutos: 30,
            categorias: ['cardio', 'fuerza'],
            color: '#ff9800',
            ejercicios_cardio: {
                tipos: ['Caminar rápido', 'Bici estática', 'Elíptica'],
                frecuencia: '3 días/semana',
                duracion: '20 min',
                intensidad: 'Suave'
            },
            ejercicios_fuerza: {
                frecuencia: '2 días/semana',
                ejercicios: [
                    { nombre: 'Sentadillas sin peso', series: 2, repeticiones: 12 },
                    { nombre: 'Zancadas estáticas', series: 2, repeticiones: 12 },
                    { nombre: 'Flexiones en pared', series: 2, repeticiones: 12 },
                    { nombre: 'Remo con banda elástica', series: 2, repeticiones: 12 },
                    { nombre: 'Plancha frontal (rodillas)', series: 2, duracion: '20 seg' }
                ]
            }
        },
        {
            id: 'perder_peso_2',
            objetivo: 'perder_peso',
            nombre: 'Cardio & Fuerza Intermedio',
            nivel: 2,
            icono: '🎯',
            descripcion: 'Incremento de volumen e intensidad para continuar perdiendo peso',
            duracion_minutos: 35,
            categorias: ['cardio', 'fuerza'],
            color: '#ff9800',
            ejercicios_cardio: {
                tipos: ['Caminar rápido', 'Bici estática', 'Elíptica'],
                frecuencia: '3-4 días/semana',
                duracion: '25-30 min',
                intensidad: 'Moderada'
            },
            ejercicios_fuerza: {
                frecuencia: '3 días/semana',
                ejercicios: [
                    { nombre: 'Sentadillas sin peso', series: 3, repeticiones: 12 },
                    { nombre: 'Zancadas alternas', series: 3, repeticiones: 12 },
                    { nombre: 'Flexiones en mesa', series: 3, repeticiones: 12 },
                    { nombre: 'Remo con banda elástica', series: 3, repeticiones: 12 },
                    { nombre: 'Plancha frontal', series: 3, duracion: '30 seg' }
                ]
            }
        },
        {
            id: 'perder_peso_3',
            objetivo: 'perder_peso',
            nombre: 'Cardio & Fuerza Avanzado',
            nivel: 3,
            icono: '🎯',
            descripcion: 'Programa avanzado con mayor volumen y bloques de alta intensidad',
            duracion_minutos: 45,
            categorias: ['cardio', 'fuerza'],
            color: '#ff9800',
            ejercicios_cardio: {
                tipos: ['Caminar rápido', 'Bici estática', 'Elíptica', 'Intervalos'],
                frecuencia: '4-5 días/semana',
                duracion: '30-40 min',
                intensidad: 'Moderada-Alta (incluir bloques rápidos)'
            },
            ejercicios_fuerza: {
                frecuencia: '3 días/semana',
                ejercicios: [
                    { nombre: 'Sentadillas con peso', series: 3, repeticiones: 15 },
                    { nombre: 'Zancadas con peso', series: 3, repeticiones: 15 },
                    { nombre: 'Flexiones normales', series: 3, repeticiones: 15 },
                    { nombre: 'Remo con banda resistente', series: 3, repeticiones: 15 },
                    { nombre: 'Plancha frontal', series: 3, duracion: '45 seg' }
                ]
            }
        }
    ];
}

/**
 * Define las rutinas para ganancia muscular (IMC < 18.5 o preferencia 'fuerza')
 */
function getRutinasGananciaMusculo() {
    return [
        {
            id: 'ganar_musculo_1',
            objetivo: 'ganar_musculo',
            nombre: 'Fuerza Principiante',
            nivel: 1,
            icono: '💪',
            descripcion: 'Rutina de fuerza básica para desarrollar músculo desde cero',
            duracion_minutos: 35,
            categorias: ['fuerza'],
            color: '#2196f3',
            ejercicios_fuerza: {
                frecuencia: '2-3 días/semana',
                ejercicios: [
                    { nombre: 'Sentadilla sin peso', series: 2, repeticiones: '10-12' },
                    { nombre: 'Peso muerto rumano (mochila)', series: 2, repeticiones: '10-12' },
                    { nombre: 'Flexiones en rodillas', series: 2, repeticiones: '10-12' },
                    { nombre: 'Remo con banda elástica', series: 2, repeticiones: '10-12' },
                    { nombre: 'Press hombro con banda', series: 2, repeticiones: '10-12' }
                ]
            },
            cardio_complemento: {
                frecuencia: '1-2 días/semana',
                tipo: 'Caminar 20-30 min (opcional para salud)'
            }
        },
        {
            id: 'ganar_musculo_2',
            objetivo: 'ganar_musculo',
            nombre: 'Fuerza Intermedio',
            nivel: 2,
            icono: '💪',
            descripcion: 'Incremento de volumen y carga para hipertrofia muscular',
            duracion_minutos: 45,
            categorias: ['fuerza'],
            color: '#2196f3',
            ejercicios_fuerza: {
                frecuencia: '3 días/semana',
                ejercicios: [
                    { nombre: 'Sentadilla con mochila/mancuernas', series: 3, repeticiones: '8-12' },
                    { nombre: 'Peso muerto rumano con peso', series: 3, repeticiones: '8-12' },
                    { nombre: 'Flexiones normales', series: 3, repeticiones: '8-12' },
                    { nombre: 'Remo con mancuerna', series: 3, repeticiones: '8-12' },
                    { nombre: 'Press hombro con mancuernas', series: 3, repeticiones: '8-12' }
                ]
            },
            cardio_complemento: {
                frecuencia: '1-2 días/semana',
                tipo: 'Caminar 20-30 min'
            }
        },
        {
            id: 'ganar_musculo_3',
            objetivo: 'ganar_musculo',
            nombre: 'Fuerza Avanzado (Dividida)',
            nivel: 3,
            icono: '💪',
            descripcion: 'Rutina dividida tren superior/inferior con mayor volumen e intensidad',
            duracion_minutos: 50,
            categorias: ['fuerza'],
            color: '#2196f3',
            ejercicios_fuerza: {
                frecuencia: '4 días/semana (dividida)',
                estructura: 'Tren Superior / Tren Inferior',
                tren_superior: [
                    { nombre: 'Flexiones con peso', series: 4, repeticiones: '6-12' },
                    { nombre: 'Remo con mancuerna pesada', series: 4, repeticiones: '6-12' },
                    { nombre: 'Press hombro con carga', series: 4, repeticiones: '6-12' },
                    { nombre: 'Fondos en silla', series: 3, repeticiones: '8-12' }
                ],
                tren_inferior: [
                    { nombre: 'Sentadilla con peso elevado', series: 4, repeticiones: '6-12' },
                    { nombre: 'Peso muerto rumano pesado', series: 4, repeticiones: '6-12' },
                    { nombre: 'Zancadas con mancuernas', series: 3, repeticiones: '8-12' },
                    { nombre: 'Elevación gemelos', series: 3, repeticiones: '12-15' }
                ]
            },
            cardio_complemento: {
                frecuencia: '1 día/semana',
                tipo: 'Caminar 30 min'
            }
        }
    ];
}

/**
 * Define las rutinas para mejorar salud (sedentario o ligero)
 */
function getRutinasMejorarSalud() {
    return [
        {
            id: 'mejorar_salud_1',
            objetivo: 'mejorar_salud',
            nombre: 'Salud & Movimiento Básico',
            nivel: 1,
            icono: '❤️',
            descripcion: 'Programa inicial para activarte y mejorar tu salud general',
            duracion_minutos: 20,
            categorias: ['salud', 'movilidad'],
            color: '#4caf50',
            movimiento_diario: {
                objetivo: '6.000-8.000 pasos/día',
                actividades: ['Caminar', 'Subir escaleras', 'Paseos']
            },
            ejercicios_fuerza: {
                frecuencia: '2 días/semana',
                ejercicios: [
                    { nombre: 'Sentadilla a silla', series: 2, repeticiones: 12 },
                    { nombre: 'Elevación de talones', series: 2, repeticiones: 12 },
                    { nombre: 'Remo con banda ligera', series: 2, repeticiones: 12 },
                    { nombre: 'Flexiones en pared', series: 2, repeticiones: 12 }
                ]
            },
            movilidad: {
                frecuencia: '5-10 min diarios',
                areas: ['Cuello', 'Hombros', 'Espalda', 'Cadera']
            }
        },
        {
            id: 'mejorar_salud_2',
            objetivo: 'mejorar_salud',
            nombre: 'Salud & Movimiento Intermedio',
            nivel: 2,
            icono: '❤️',
            descripcion: 'Incremento de actividad diaria y ejercicios de fuerza',
            duracion_minutos: 30,
            categorias: ['salud', 'movilidad'],
            color: '#4caf50',
            movimiento_diario: {
                objetivo: '8.000-10.000 pasos/día',
                incremento: '+1.000 pasos respecto nivel anterior'
            },
            ejercicios_fuerza: {
                frecuencia: '2-3 días/semana',
                ejercicios: [
                    { nombre: 'Sentadilla completa', series: 3, repeticiones: 12 },
                    { nombre: 'Elevación de talones', series: 3, repeticiones: 15 },
                    { nombre: 'Remo con banda media', series: 3, repeticiones: 12 },
                    { nombre: 'Flexiones en mesa', series: 3, repeticiones: 12 }
                ]
            },
            movilidad: {
                frecuencia: '10-15 min diarios',
                areas: ['Cuello', 'Hombros', 'Espalda', 'Cadera', 'Tobillos']
            }
        },
        {
            id: 'mejorar_salud_3',
            objetivo: 'mejorar_salud',
            nombre: 'Salud & Movimiento Avanzado',
            nivel: 3,
            icono: '❤️',
            descripcion: 'Objetivo óptimo de movimiento diario y ejercicio regular',
            duracion_minutos: 35,
            categorias: ['salud', 'movilidad'],
            color: '#4caf50',
            movimiento_diario: {
                objetivo: '10.000+ pasos/día',
                actividades: ['Caminar rápido', 'Senderismo', 'Actividades recreativas']
            },
            ejercicios_fuerza: {
                frecuencia: '3 días/semana',
                ejercicios: [
                    { nombre: 'Sentadilla con peso ligero', series: 3, repeticiones: 15 },
                    { nombre: 'Zancadas', series: 3, repeticiones: 12 },
                    { nombre: 'Remo con banda fuerte', series: 3, repeticiones: 15 },
                    { nombre: 'Flexiones normales', series: 3, repeticiones: 12 }
                ]
            },
            movilidad: {
                frecuencia: '15 min diarios',
                areas: ['Movilidad completa del cuerpo']
            }
        }
    ];
}

/**
 * Define las rutinas para aumentar resistencia (preferencia cardio o sedentario)
 */
function getRutinasResistencia() {
    return [
        {
            id: 'resistencia_1',
            objetivo: 'resistencia',
            nombre: 'Resistencia - Base Aeróbica',
            nivel: 1,
            icono: '🏃',
            descripcion: 'Construcción de base aeróbica con cardio continuo moderado',
            duracion_minutos: 25,
            categorias: ['cardio', 'resistencia'],
            color: '#9c27b0',
            cardio_principal: {
                frecuencia: '3 días/semana',
                duracion: '20-30 min',
                intensidad: 'Suave (60-70% FC máx)',
                tipos: ['Caminar rápido', 'Trotar suave', 'Bici', 'Nadar']
            },
            progresion: {
                criterio: 'Aumentar 5-10 min cada 1-2 semanas',
                objetivo: 'Completar 30 min sin parar'
            }
        },
        {
            id: 'resistencia_2',
            objetivo: 'resistencia',
            nombre: 'Resistencia - Tiempo & Intensidad',
            nivel: 2,
            icono: '🏃',
            descripcion: 'Incremento de duración e introducción de intervalos suaves',
            duracion_minutos: 35,
            categorias: ['cardio', 'resistencia'],
            color: '#9c27b0',
            cardio_principal: {
                frecuencia: '3-4 días/semana',
                duracion: '30-40 min',
                intensidad: 'Moderada (70-75% FC máx)'
            },
            intervalos: {
                frecuencia: '1 día/semana',
                estructura: '3-5 bloques: 1 min rápido / 2-3 min suave',
                objetivo: 'Mejorar capacidad anaeróbica'
            },
            fuerza_complemento: {
                frecuencia: '2 días/semana',
                tipo: 'Circuito ligero de cuerpo completo'
            }
        },
        {
            id: 'resistencia_3',
            objetivo: 'resistencia',
            nombre: 'Resistencia - Intervalos Estructurados',
            nivel: 3,
            icono: '🏃',
            descripcion: 'Programa avanzado con intervalos de alta intensidad',
            duracion_minutos: 45,
            categorias: ['cardio', 'resistencia', 'hiit'],
            color: '#9c27b0',
            cardio_principal: {
                frecuencia: '4 días/semana',
                dias_suaves: '2 días: 40 min suave',
                dias_intervalos: '2 días: intervalos estructurados'
            },
            intervalos_avanzados: {
                estructura: '6-10 repeticiones: 1-2 min rápido / 1 min descanso activo',
                intensidad: '80-90% FC máx en bloques rápidos'
            },
            fuerza_complemento: {
                frecuencia: '2 días/semana',
                tipo: 'Fuerza funcional para prevención lesiones'
            }
        }
    ];
}

/**
 * Genera rutinas personalizadas basadas en el perfil del usuario
 * @param {object} perfil - Datos del perfil del usuario
 * @returns {array} Lista de rutinas recomendadas
 */
function generarRutinasPersonalizadas(perfil) {
    const rutinasRecomendadas = [];

    if (!perfil) return rutinasRecomendadas;

    const { peso, altura, nivel_actividad, preferencias_ejercicio } = perfil;

    // Calcular IMC
    const imc = calcularIMC(peso, altura);

    // Regla 1: Si IMC > 25 (Sobrepeso) → Rutinas de pérdida de peso + salud
    if (imc && imc > 25) {
        rutinasRecomendadas.push(...getRutinasPerdidaPeso());
        rutinasRecomendadas.push(...getRutinasMejorarSalud());
    }

    // Regla 2: Si IMC < 18.5 (Bajo peso) → Rutinas de ganancia muscular + salud
    if (imc && imc < 18.5) {
        rutinasRecomendadas.push(...getRutinasGananciaMusculo());
        rutinasRecomendadas.push(...getRutinasMejorarSalud());
    }

    // Regla 3: Si es "Sedentario" o "Ligero" → Salud + Resistencia
    if (nivel_actividad === 'sedentario' || nivel_actividad === 'ligero') {
        // Evitar duplicados
        const tieneSalud = rutinasRecomendadas.some(r => r.objetivo === 'mejorar_salud');
        if (!tieneSalud) {
            rutinasRecomendadas.push(...getRutinasMejorarSalud());
        }
        rutinasRecomendadas.push(...getRutinasResistencia());
    }

    // Regla 4: Si prefiere "Fuerza" → Rutinas de ganancia muscular
    if (preferencias_ejercicio && Array.isArray(preferencias_ejercicio)) {
        if (preferencias_ejercicio.includes('fuerza') || preferencias_ejercicio.includes('pesas')) {
            const tieneMusculo = rutinasRecomendadas.some(r => r.objetivo === 'ganar_musculo');
            if (!tieneMusculo) {
                rutinasRecomendadas.push(...getRutinasGananciaMusculo());
            }
        }

        // Regla 5: Si prefiere "Cardio" → Rutinas de resistencia + opcional pérdida peso
        if (preferencias_ejercicio.includes('cardio') || preferencias_ejercicio.includes('correr')) {
            const tieneResistencia = rutinasRecomendadas.some(r => r.objetivo === 'resistencia');
            if (!tieneResistencia) {
                rutinasRecomendadas.push(...getRutinasResistencia());
            }

            // Si además tiene IMC > 23, agregar pérdida de peso
            if (imc && imc > 23) {
                const tienePerdidaPeso = rutinasRecomendadas.some(r => r.objetivo === 'perder_peso');
                if (!tienePerdidaPeso) {
                    rutinasRecomendadas.push(...getRutinasPerdidaPeso());
                }
            }
        }
    }

    // Si no se generaron rutinas, dar recomendaciones generales
    if (rutinasRecomendadas.length === 0) {
        rutinasRecomendadas.push(...getRutinasMejorarSalud());
        rutinasRecomendadas.push(...getRutinasResistencia());
    }

    return rutinasRecomendadas;
}

// ============================================
// RENDERIZADO DE RUTINAS
// ============================================

/**
 * Renderiza una rutina individual en HTML
 */
function renderizarRutina(rutina) {
    // Crear badge de nivel
    const nivelBadge = `<span class="nivel-badge nivel-${rutina.nivel}">Nivel ${rutina.nivel}</span>`;

    // Tags de características
    let tags = '';
    rutina.categorias.forEach(cat => {
        const iconMap = {
            cardio: 'fa-heartbeat',
            fuerza: 'fa-dumbbell',
            salud: 'fa-heart',
            movilidad: 'fa-running',
            resistencia: 'fa-fire',
            hiit: 'fa-bolt'
        };
        tags += `<span class="tag"><i class="fas ${iconMap[cat] || 'fa-star'}"></i>${cat}</span>`;
    });

    // Renderizar ejercicios (depende del tipo de rutina)
    let ejerciciosHTML = '';

    if (rutina.ejercicios_cardio) {
        ejerciciosHTML += `
            <div class="mb-3">
                <h5><i class="fas fa-heartbeat"></i> Cardio</h5>
                <ul class="ejercicio-lista">
                    <li><i class="fas fa-check-circle"></i><strong>Tipos:</strong> ${rutina.ejercicios_cardio.tipos.join(', ')}</li>
                    <li><i class="fas fa-calendar-alt"></i><strong>Frecuencia:</strong> ${rutina.ejercicios_cardio.frecuencia}</li>
                    <li><i class="fas fa-clock"></i><strong>Duración:</strong> ${rutina.ejercicios_cardio.duracion}</li>
                    <li><i class="fas fa-tachometer-alt"></i><strong>Intensidad:</strong> ${rutina.ejercicios_cardio.intensidad}</li>
                </ul>
            </div>
        `;
    }

    if (rutina.ejercicios_fuerza) {
        ejerciciosHTML += `
            <div class="mb-3">
                <h5><i class="fas fa-dumbbell"></i> Fuerza (${rutina.ejercicios_fuerza.frecuencia})</h5>
                <ul class="ejercicio-lista">
                    ${rutina.ejercicios_fuerza.ejercicios.map(ej => {
            const detalle = ej.duracion
                ? `${ej.series} series x ${ej.duracion}`
                : `${ej.series} series x ${ej.repeticiones} reps`;
            return `<li><i class="fas fa-angle-right"></i>${ej.nombre}: ${detalle}</li>`;
        }).join('')}
                </ul>
            </div>
        `;
    }

    if (rutina.movimiento_diario) {
        ejerciciosHTML += `
            <div class="mb-3">
                <h5><i class="fas fa-walking"></i> Movimiento Diario</h5>
                <ul class="ejercicio-lista">
                    <li><i class="fas fa-bullseye"></i><strong>Objetivo:</strong> ${rutina.movimiento_diario.objetivo}</li>
                    ${rutina.movimiento_diario.actividades ? `<li><i class="fas fa-list"></i><strong>Actividades:</strong> ${rutina.movimiento_diario.actividades.join(', ')}</li>` : ''}
                    ${rutina.movimiento_diario.incremento ? `<li><i class="fas fa-chart-line"></i>${rutina.movimiento_diario.incremento}</li>` : ''}
                </ul>
            </div>
        `;
    }

    if (rutina.cardio_principal) {
        ejerciciosHTML += `
            <div class="mb-3">
                <h5><i class="fas fa-heartbeat"></i> Cardio Principal</h5>
                <ul class="ejercicio-lista">
                    <li><i class="fas fa-calendar-alt"></i><strong>Frecuencia:</strong> ${rutina.cardio_principal.frecuencia}</li>
                    ${rutina.cardio_principal.duracion ? `<li><i class="fas fa-clock"></i><strong>Duración:</strong> ${rutina.cardio_principal.duracion}</li>` : ''}
                    ${rutina.cardio_principal.intensidad ? `<li><i class="fas fa-tachometer-alt"></i><strong>Intensidad:</strong> ${rutina.cardio_principal.intensidad}</li>` : ''}
                    ${rutina.cardio_principal.tipos ? `<li><i class="fas fa-running"></i><strong>Tipos:</strong> ${rutina.cardio_principal.tipos.join(', ')}</li>` : ''}
                    ${rutina.cardio_principal.dias_suaves ? `<li><i class="fas fa-info-circle"></i>${rutina.cardio_principal.dias_suaves}</li>` : ''}
                    ${rutina.cardio_principal.dias_intervalos ? `<li><i class="fas fa-bolt"></i>${rutina.cardio_principal.dias_intervalos}</li>` : ''}
                </ul>
            </div>
        `;
    }

    if (rutina.intervalos) {
        ejerciciosHTML += `
            <div class="mb-3">
                <h5><i class="fas fa-bolt"></i> Intervalos</h5>
                <ul class="ejercicio-lista">
                    <li><i class="fas fa-calendar-alt"></i><strong>Frecuencia:</strong> ${rutina.intervalos.frecuencia}</li>
                    <li><i class="fas fa-list-ol"></i><strong>Estructura:</strong> ${rutina.intervalos.estructura}</li>
                    ${rutina.intervalos.objetivo ? `<li><i class="fas fa-bullseye"></i>${rutina.intervalos.objetivo}</li>` : ''}
                </ul>
            </div>
        `;
    }

    if (rutina.intervalos_avanzados) {
        ejerciciosHTML += `
            <div class="mb-3">
                <h5><i class="fas fa-fire"></i> Intervalos Avanzados</h5>
                <ul class="ejercicio-lista">
                    <li><i class="fas fa-list-ol"></i><strong>Estructura:</strong> ${rutina.intervalos_avanzados.estructura}</li>
                    <li><i class="fas fa-tachometer-alt"></i><strong>Intensidad:</strong> ${rutina.intervalos_avanzados.intensidad}</li>
                </ul>
            </div>
        `;
    }

    if (rutina.movilidad) {
        ejerciciosHTML += `
            <div class="mb-3">
                <h5><i class="fas fa-praying-hands"></i> Movilidad & Estiramientos</h5>
                <ul class="ejercicio-lista">
                    <li><i class="fas fa-clock"></i><strong>Frecuencia:</strong> ${rutina.movilidad.frecuencia}</li>
                    <li><i class="fas fa-list"></i><strong>Áreas:</strong> ${Array.isArray(rutina.movilidad.areas) ? rutina.movilidad.areas.join(', ') : rutina.movilidad.areas}</li>
                </ul>
            </div>
        `;
    }

    const rutinaHTML = `
        <div class="rutina-item" data-objetivo="${rutina.objetivo}" style="border-left: 4px solid ${rutina.color}">
            <div class="rutina-header">
                <div class="rutina-icon">${rutina.icono}</div>
                <div class="rutina-info">
                    <div class="rutina-titulo">
                        ${rutina.nombre}
                        ${nivelBadge}
                    </div>
                    <p class="rutina-descripcion">${rutina.descripcion}</p>
                    <div class="rutina-tags">
                        ${tags}
                    </div>
                </div>
            </div>

            <div class="ejercicios-detalle">
                ${ejerciciosHTML}
            </div>

            <div class="frecuencia-info">
                <div class="frecuencia-item">
                    <div class="valor">${rutina.duracion_minutos}'</div>
                    <div class="label">Duración aprox.</div>
                </div>
                <div class="frecuencia-item">
                    <div class="valor">Nivel ${rutina.nivel}</div>
                    <div class="label">Dificultad</div>
                </div>
            </div>
        </div>
    `;

    return rutinaHTML;
}

/**
 * Renderiza todas las rutinas personalizadas en la interfaz
 */
function renderizarRutinasPersonalizadas(rutinas) {
    const container = document.getElementById('listaRutinasPersonalizadas');
    if (!container) return;

    container.innerHTML = '';

    if (rutinas.length === 0) {
        container.innerHTML = '<p class="text-secondary text-center">No se pudieron generar rutinas. Completa tu perfil.</p>';
        return;
    }

    rutinas.forEach(rutina => {
        container.innerHTML += renderizarRutina(rutina);
    });

    // Actualizar contador de rutinas disponibles
    const contadorRutinas = document.getElementById('rutinasDisponibles');
    if (contadorRutinas) {
        contadorRutinas.textContent = rutinas.length;
    }
}

// ============================================
// FILTROS DE RUTINAS
// ============================================

function setupFiltros() {
    const botonesFiltro = document.querySelectorAll('.btn-filtro');

    botonesFiltro.forEach(boton => {
        boton.addEventListener('click', () => {
            // Remover active de todos
            botonesFiltro.forEach(b => b.classList.remove('active'));
            // Agregar active al clickeado
            boton.classList.add('active');

            const filtro = boton.getAttribute('data-filter');
            const rutinas = document.querySelectorAll('.rutina-item');

            rutinas.forEach(rutina => {
                if (filtro === 'todos') {
                    rutina.classList.remove('hidden');
                } else {
                    const objetivo = rutina.getAttribute('data-objetivo');
                    if (objetivo === filtro) {
                        rutina.classList.remove('hidden');
                    } else {
                        rutina.classList.add('hidden');
                    }
                }
            });
        });
    });
}

// ============================================
// CARGA DE LISTA DE RUTINAS
// ============================================

async function loadRoutineList(userId) {
    const listContainer = document.getElementById('listaRutinasPersonalizadas');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin"></i> Cargando rutinas...</div>';

    // Obtener perfil del usuario
    const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('peso, altura, nivel_actividad, preferencias_ejercicio')
        .eq('id', userId)
        .single();

    if (perfilError) {
        listContainer.innerHTML = `<p class="alert alert-warning">No se pudo cargar tu perfil. Por favor, completa tu información.</p>`;
        return;
    }

    // Generar rutinas personalizadas
    const rutinasPersonalizadas = generarRutinasPersonalizadas(perfil);
    renderizarRutinasPersonalizadas(rutinasPersonalizadas);

    // Configurar filtros
    setupFiltros();
}

// ============================================
// INICIALIZACIÓN
// ============================================

async function initializeApp() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Redirigir si no hay sesión
        window.location.href = '../login/iniciar_sesion.html';
        return;
    }

    // Cargar rutinas personalizadas
    await loadRoutineList(user.id);
}

document.addEventListener('DOMContentLoaded', initializeApp);
