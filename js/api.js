// js/api.js

/**
 * Obtiene la lista de todos los cursos registrados (Ofimática, Excel, etc.)
 */
async function getCursos() {
    const { data, error } = await supabaseClient
        .from('cursos')
        .select('*');
    
    if (error) {
        console.error("Error al obtener cursos:", error);
        return [];
    }
    return data;
}

/**
 * Obtiene los estudiantes activos de un curso específico 
 * incluyendo su progreso de clases.
 */
// js/api.js

async function getEstudiantesPorCurso(cursoId) {
    // Cambiamos la consulta para usar la VISTA de resumen
    const { data, error } = await supabaseClient
        .from('vista_estudiantes_resumen')
        .select('*')
        .eq('curso_id', cursoId); // Filtramos por el curso actual

    if (error) {
        console.error("Error al obtener estudiantes:", error);
        return [];
    }
    return data;
}

async function getModulosPorCurso(cursoId) {
    const { data, error } = await supabaseClient
        .from('modulos')
        .select('*')
        .eq('curso_id', cursoId)
        .order('orden', { ascending: true });
    return error ? [] : data;
}

async function registrarNuevoEstudiante(nombre, cursoId, moduloId, fecha) {
    // 1. Crear al estudiante
    const { data: estudiante, error: errEst } = await supabaseClient
        .from('estudiantes')
        .insert([{ nombre_completo: nombre }])
        .select()
        .single();

    if (errEst) throw errEst;

    // 2. Crear la inscripción vinculada
    const { error: errIns } = await supabaseClient
        .from('inscripciones')
        .insert([{
            estudiante_id: estudiante.id,
            curso_id: cursoId,
            modulo_inicio_id: moduloId,
            fecha_ingreso: fecha,
            estado: 'Activo'
        }]);

    if (errIns) throw errIns;
    return true;
}

// js/api.js

// EDITAR: Actualiza los datos del estudiante y su inscripción
async function updateEstudiante(estudianteId, inscripcionId, nuevosDatos) {
    // Actualizar nombre en la tabla estudiantes
    const { error: errEst } = await supabaseClient
        .from('estudiantes')
        .update({ nombre_completo: nuevosDatos.nombre })
        .eq('id', estudianteId);

    if (errEst) throw errEst;

    // Actualizar fecha y módulo en la tabla inscripciones
    const { error: errIns } = await supabaseClient
        .from('inscripciones')
        .update({ 
            curso_id: nuevosDatos.cursoId,
            modulo_inicio_id: nuevosDatos.moduloId,
            fecha_ingreso: nuevosDatos.fecha 
        })
        .eq('id', inscripcionId);

    if (errIns) throw errIns;
    return true;
}

// ELIMINAR: Borra al estudiante (la inscripción se borra por CASCADE)
async function deleteEstudiante(id) {
    const { error } = await supabaseClient
        .from('estudiantes')
        .delete()
        .eq('id', id);
    
    if (error) throw error;
    return true;
}

// js/api.js

/**
 * Registra la asistencia y aumenta el contador de clases del estudiante
 */
async function registrarAsistenciaCompleta(inscripcionId, hora, fecha) {
    // 1. Insertar el registro de asistencia
    const { error: errorAsistencia } = await supabaseClient
        .from('asistencias')
        .insert([{
            inscripcion_id: inscripcionId,
            fecha: fecha,
            hora_llegada: hora,
            estado: 'Presente' // Por defecto al presionar el botón
        }]);

    if (errorAsistencia) throw errorAsistencia;

    // 2. Obtener el valor actual de clases_asistidas para incrementarlo
    const { data: inscripcion } = await supabaseClient
        .from('inscripciones')
        .select('clases_asistidas')
        .eq('id', inscripcionId)
        .single();

    // 3. Actualizar el contador de clases asistidas
    const { error: errorProgreso } = await supabaseClient
        .from('inscripciones')
        .update({ clases_asistidas: (inscripcion.clases_asistidas || 0) + 1 })
        .eq('id', inscripcionId);

    if (errorProgreso) throw errorProgreso;

    return true;
}

/**
 * Registra una falta en la base de datos
 */
async function registrarFalta(inscripcionId, fecha) {
    const { error } = await supabaseClient
        .from('asistencias')
        .insert([{
            inscripcion_id: inscripcionId,
            fecha: fecha,
            estado: 'Falta'
        }]);

    if (error) throw error;
    return true;
}

// js/api.js (añadir al final)
// Calificaciones para ser promediadas
async function getNotasPorInscripcion(inscripcionId) {
    const { data, error } = await supabaseClient
        .from('calificaciones')
        .select('*')
        .eq('inscripcion_id', inscripcionId);
    
    return error ? [] : data;
}

// js/api.js[cite: 12]

async function guardarCalificacionesMasivas(inscripcionId, notas) {
    // Primero eliminamos las notas existentes para este estudiante para sobrescribirlas
    const { error: deleteError } = await supabaseClient
        .from('calificaciones')
        .delete()
        .eq('inscripcion_id', inscripcionId);

    if (deleteError) throw deleteError;

    // Si hay notas nuevas, las insertamos
    if (notas.length > 0) {
        const { error: insertError } = await supabaseClient
            .from('calificaciones')
            .insert(notas);

        if (insertError) throw insertError;
    }
    return true;
}

// js/api.js[cite: 12]
async function getHistorialAsistencias(cursoId) {
    // Traemos las asistencias vinculadas a las inscripciones de este curso
    const { data, error } = await supabaseClient
        .from('asistencias')
        .select(`
            fecha,
            estado,
            hora_llegada,
            inscripcion_id,
            inscripciones!inner(curso_id)
        `)
        .eq('inscripciones.curso_id', cursoId)
        .order('fecha', { ascending: true });

    if (error) return [];
    return data;
}