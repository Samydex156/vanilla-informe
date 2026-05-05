-- 1. Borramos la vista actual para evitar conflictos de estructura
DROP VIEW IF EXISTS vista_estudiantes_resumen;

-- 2. La creamos nuevamente con todas las columnas necesarias
CREATE VIEW vista_estudiantes_resumen AS
SELECT 
    i.id AS inscripcion_id,
    e.id AS estudiante_id,
    i.curso_id,                               -- Columna necesaria para filtrar en asistencias.html
    i.modulo_inicio_id,                       -- Columna necesaria para editar el módulo
    e.nombre_completo,
    c.nombre AS curso_nombre,
    COALESCE(m.nombre, 'Sin asignar') AS modulo_inicio_nombre,
    i.fecha_ingreso,
    i.estado,
    i.clases_asistidas AS asistencias,        -- Mapeado en asistencias.html[cite: 6]
    (SELECT COUNT(*) FROM asistencias a 
     WHERE a.inscripcion_id = i.id 
     AND a.estado = 'Falta') AS faltas        -- Mapeado en main-estudiantes.js[cite: 5, 6]
FROM inscripciones i
JOIN estudiantes e ON i.estudiante_id = e.id
LEFT JOIN cursos c ON i.curso_id = c.id
LEFT JOIN modulos m ON i.modulo_inicio_id = m.id;