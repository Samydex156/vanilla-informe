// js/core.js

/**
 * Calcula el estado visual (semáforo) basado en el progreso.
 */
// js/core.js

/**
 * Calcula el estado visual (semáforo) basado en sesiones transcurridas (P + F)
 */
function obtenerInfoProgreso(clasesAsistidas, faltas, totalSesiones) {
    // El progreso real es la suma de ambos
    const sesionesPasadas = clasesAsistidas + faltas;
    const restantes = totalSesiones - sesionesPasadas;
    
    let color = 'status-active';
    let texto = 'Activo';

    if (restantes <= 0) {
        color = 'status-finished';
        texto = 'Finalizado';
    } else if (restantes <= 2) {
        color = 'status-warning';
        texto = 'Por Terminar';
    }

    return { color, texto, restantes, sesionesPasadas };
}

/**
 * Estima la fecha de finalización basándose en la frecuencia.
 */
function calcularFechaFin(fechaInicio, frecuencia, totalSesiones) {
    const fecha = new Date(fechaInicio);
    let sesionesContadas = 0;

    // Iteramos día por día hasta cumplir las sesiones totales
    while (sesionesContadas < totalSesiones - 1) {
        fecha.setDate(fecha.getDate() + 1);
        const diaSemana = fecha.getDay(); // 0: Dom, 1: Lun, 6: Sáb

        if (frecuencia === 'Sábados' && diaSemana === 6) {
            sesionesContadas++;
        } else if (frecuencia === 'L-M-V' && [1, 3, 5].includes(diaSemana)) {
            sesionesContadas++;
        }
    }
    return fecha.toLocaleDateString();
}

// js/core.js (añadir al final)

/**
 * Convierte un promedio numérico en una etiqueta cualitativa del instituto
 */
function obtenerCriterio(promedio) {
    if (promedio >= 90) return "Excelente";
    if (promedio >= 75) return "Óptimo";
    if (promedio >= 61) return "Bueno";
    if (promedio >= 40) return "Deficiente";
    return "Malo";
}