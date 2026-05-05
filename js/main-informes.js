// js/main-informes.js

document.addEventListener('DOMContentLoaded', async () => {
    const selectCurso = document.getElementById('select-curso-informe');
    try {
        const cursos = await getCursos();
        selectCurso.innerHTML = '<option value="">Seleccione...</option>';
        cursos.forEach(c => selectCurso.add(new Option(c.nombre, c.id)));
    } catch (e) {
        console.error("Error al cargar la lista de cursos:", e);
    }
});

window.cargarFiltroModulos = async function() {
    const cursoId = document.getElementById('select-curso-informe').value;
    const selectPeriodo = document.getElementById('select-periodo');
    
    selectPeriodo.innerHTML = '<option value="">Cargando módulos...</option>';

    if (!cursoId) {
        selectPeriodo.innerHTML = '<option value="">Seleccione un curso primero</option>';
        return;
    }

    try {
        const cursos = await getCursos();
        const cursoActual = cursos.find(c => c.id === cursoId);
        const modulos = await getModulosPorCurso(cursoId);

        selectPeriodo.innerHTML = '';

        if (cursoActual.nombre.toLowerCase().includes('ofim')) {
            selectPeriodo.innerHTML = `
                <option value="mes1">Mes 1: Word + PowerPoint</option>
                <option value="mes2">Mes 2: Excel + Publisher + IA</option>
            `;
        } else {
            modulos.forEach(m => {
                selectPeriodo.add(new Option(m.nombre, m.id));
            });
        }
    } catch (e) {
        console.error("Error cargando módulos", e);
        selectPeriodo.innerHTML = '<option value="">Error</option>';
    }
};

async function generarPrevisualizacion() {
    const cursoId = document.getElementById('select-curso-informe').value;
    const periodo = document.getElementById('select-periodo').value;
    
    if (!cursoId) return alert("Por favor, selecciona un curso primero.");

    const theadNotas = document.querySelector('#tabla-informe thead');
    const tbodyNotas = document.querySelector('#tabla-informe tbody');
    const theadAsis = document.querySelector('#tabla-asistencia-detallada thead');
    const tbodyAsis = document.querySelector('#tabla-asistencia-detallada tbody');

    try {
        const modulosTodo = await getModulosPorCurso(cursoId);
        let estudiantes = await getEstudiantesPorCurso(cursoId);
        const historial = await getHistorialAsistencias(cursoId);
        
        const cursos = await getCursos();
        const cursoActual = cursos.find(c => c.id === cursoId);
        const totalSesiones = cursoActual ? cursoActual.total_sesiones : 0;

        // Ordenar estudiantes por fecha_ingreso
        estudiantes.sort((a, b) => new Date(a.fecha_ingreso) - new Date(b.fecha_ingreso));

        let modulosReporte = [];
        let periodoTexto = "";

        if (cursoActual.nombre.toLowerCase().includes('ofim')) {
            if (periodo === 'mes1') {
                modulosReporte = modulosTodo.filter(m => ['Word', 'PowerPoint'].includes(m.nombre));
                periodoTexto = "Mes 1: Word + PowerPoint";
            } else if (periodo === 'mes2') {
                modulosReporte = modulosTodo.filter(m => ['Excel', 'Publisher', 'IA y Herramientas Web'].includes(m.nombre));
                periodoTexto = "Mes 2: Excel + Publisher + IA";
            }
        } else {
            // Para el curso de Excel (y otros futuros), el valor de periodo es el ID del módulo
            const mod = modulosTodo.find(m => m.id === periodo);
            if (mod) {
                modulosReporte = [mod];
                periodoTexto = mod.nombre;
            }
        }

        if (modulosReporte.length === 0) {
            return alert("No se encontraron módulos para el reporte.");
        }

        // --- CALCULO DE FECHAS DEL PERIODO ---
        const fechaInicioFiltro = document.getElementById('fecha-inicio-informe').value;
        const fechaFinFiltro = document.getElementById('fecha-fin-informe').value;

        const fechasClaseAll = [...new Set(historial.map(a => a.fecha))];
        
        // Crear la secuencia expandida de clases del curso (ej: [Word, Word, PowerPoint, PowerPoint, ...])
        let sequenceOfClasses = [];
        modulosTodo.forEach(m => {
            for (let i = 0; i < m.cantidad_clases; i++) {
                sequenceOfClasses.push(m.nombre);
            }
        });

        // Buscar una "clase ancla" cruzando las fechas con los ingresos de los estudiantes
        let anchorDateIndex = 0;
        let anchorSeqIndex = 0; // Por defecto asumimos que empieza en el primer módulo

        if (sequenceOfClasses.length > 0 && fechasClaseAll.length > 0) {
            for (let i = 0; i < fechasClaseAll.length; i++) {
                const date = fechasClaseAll[i];
                // Buscamos un estudiante que haya iniciado exactamente en esta fecha
                const estAncla = estudiantes.find(e => e.fecha_ingreso === date && e.modulo_inicio_nombre && e.modulo_inicio_nombre !== 'Sin asignar');
                if (estAncla) {
                    anchorDateIndex = i;
                    // Su fecha de ingreso es la clase 1 de su modulo_inicio_nombre
                    anchorSeqIndex = sequenceOfClasses.indexOf(estAncla.modulo_inicio_nombre);
                    if (anchorSeqIndex === -1) anchorSeqIndex = 0;
                    break;
                }
            }
        }

        // Calcular el índice de secuencia para la primerísima fecha de la base de datos
        let startSeqIndex = (anchorSeqIndex - anchorDateIndex) % sequenceOfClasses.length;
        if (startSeqIndex < 0) startSeqIndex += sequenceOfClasses.length;

        // Mapear todas las fechas cíclicamente a partir de esa posición inicial correcta
        let mapFechaModulo = {};
        for (let i = 0; i < fechasClaseAll.length; i++) {
            const seqIndex = (startSeqIndex + i) % sequenceOfClasses.length;
            mapFechaModulo[fechasClaseAll[i]] = sequenceOfClasses[seqIndex];
        }

        let fechasClase = fechasClaseAll.filter(f => {
            const modNombre = mapFechaModulo[f];
            return modulosReporte.some(m => m.nombre === modNombre);
        });

        if (fechaInicioFiltro) fechasClase = fechasClase.filter(f => f >= fechaInicioFiltro);
        if (fechaFinFiltro) fechasClase = fechasClase.filter(f => f <= fechaFinFiltro);

        // --- FILTRAR ESTUDIANTES ACTIVOS EN ESTE PERIODO ---
        if (fechasClase.length > 0) {
            const primerFecha = fechasClase[0];
            const ultimaFecha = fechasClase[fechasClase.length - 1];

            estudiantes = estudiantes.filter(est => {
                // Si su fecha de ingreso es posterior a la última clase del reporte, aún no era alumno
                if (est.fecha_ingreso > ultimaFecha) return false;

                // Contar cuántas clases tomó ANTES de la primera fecha de este reporte
                const clasesTomadasAntes = historial.filter(h => h.inscripcion_id === est.inscripcion_id && h.fecha < primerFecha).length;
                
                // Si antes de que empiece este mes ya había tomado todas sus sesiones, ya está graduado
                if (clasesTomadasAntes >= totalSesiones) return false;

                return true;
            });
        }

        // --- PÁGINA 1: NOTAS ---
        let h1 = `<tr><th rowspan="2">N°</th><th rowspan="2">Estudiante</th>`;
        let h2 = `<tr>`;
        modulosReporte.forEach(m => {
            h1 += `<th colspan="${m.cantidad_clases + 1}" style="border-left: 2px solid #ddd;">${m.nombre}</th>`;
            for(let i=1; i <= m.cantidad_clases; i++) h2 += `<th style="font-size:0.7rem;">P${i}</th>`;
            h2 += `<th style="background:#f1f5f9; font-size:0.7rem;">Ex.</th>`;
        });
        h1 += `<th colspan="3" style="border-left: 2px solid #ddd;">Promedios</th><th rowspan="2">Criterio</th></tr>`;
        h2 += `<th>Prac.</th><th>Ex.</th><th>Final</th></tr>`;
        theadNotas.innerHTML = h1 + h2;

        const filasNotas = await Promise.all(estudiantes.map(async (est, index) => {
            const notas = await getNotasPorInscripcion(est.inscripcion_id);
            let celdas = "";
            let sP = 0, cP = 0, sE = 0, cE = 0;

            modulosReporte.forEach(m => {
                for(let i=1; i <= m.cantidad_clases; i++) {
                    const n = notas.find(nota => nota.tipo === 'Práctica' && nota.modulo_id === m.id && nota.numero === i)?.nota;
                    if (n !== undefined) { sP += Number(n); cP++; }
                    celdas += `<td style="text-align:center;">${n !== undefined ? n : '-'}</td>`;
                }
                const ex = notas.find(nota => nota.tipo === 'Examen' && nota.modulo_id === m.id)?.nota;
                if (ex !== undefined) { sE += Number(ex); cE++; }
                celdas += `<td style="text-align:center; background:#f1f5f9;">${ex !== undefined ? ex : '-'}</td>`;
            });

            const promP = cP > 0 ? (sP / cP) : 0;
            const promE = cE > 0 ? (sE / cE) : 0;
            const promFinal = (promP + promE) / 2;
            const criterio = obtenerCriterio(promFinal);

            return `<tr><td>${index + 1}</td><td><strong>${est.nombre_completo}</strong></td>${celdas}<td style="text-align:center; border-left: 2px solid #ddd;">${promP.toFixed(0)}</td><td style="text-align:center;">${promE.toFixed(0)}</td><td style="text-align:center; background:#edf2f7;"><strong>${promFinal.toFixed(0)}</strong></td><td style="text-align:center;"><span class="status-pill">${criterio}</span></td></tr>`;
        }));
        tbodyNotas.innerHTML = filasNotas.join('');

        // --- PÁGINA 2: ASISTENCIA ---
        let headAsis = `<tr><th>N°</th><th>Estudiante</th><th style="font-size:0.75rem;">Ingreso</th><th style="font-size:0.75rem;">Inicio</th>`;
        fechasClase.forEach(fecha => {
            const d = new Date(fecha + 'T00:00:00');
            const modNombre = mapFechaModulo[fecha] || '-';
            const modAbbr = modNombre !== '-' ? modNombre.substring(0, 3).toUpperCase() : '-';
            const diaStr = d.getDate().toString().padStart(2, '0');
            const mesStr = (d.getMonth() + 1).toString().padStart(2, '0');
            headAsis += `<th style="font-size:0.65rem; text-align:center;">${diaStr}/${mesStr}<br><span style="font-size:0.5rem; color:#64748b; font-weight:normal;">${modAbbr}</span></th>`;
        });
        headAsis += `<th>Asist.</th><th>Faltas</th><th>Restantes</th></tr>`;
        theadAsis.innerHTML = headAsis;

        tbodyAsis.innerHTML = estudiantes.map((est, index) => {
            const partes = est.fecha_ingreso ? est.fecha_ingreso.split('-') : [];
            const fechaFormateada = partes.length === 3 ? `${partes[2]}-${partes[1]}-${partes[0]}` : est.fecha_ingreso;
            const moduloInicioStr = est.modulo_inicio_nombre && est.modulo_inicio_nombre !== 'Sin asignar' ? est.modulo_inicio_nombre : '-';

            let fila = `<tr><td>${index + 1}</td><td><strong>${est.nombre_completo}</strong></td><td style="font-size:0.75rem; text-align:center;">${fechaFormateada}</td><td style="font-size:0.7rem; text-align:center; color:#475569;">${moduloInicioStr}</td>`;
            
            fechasClase.forEach(fecha => {
                const reg = historial.find(h => h.inscripcion_id === est.inscripcion_id && h.fecha === fecha);
                let marca = "-";
                if (reg) {
                    if (reg.estado === 'Presente') { 
                        let horaStr = reg.hora_llegada ? reg.hora_llegada.slice(0, 5) : '';
                        if (horaStr) {
                            marca = `P<br><span style="font-size:0.55rem; color:#64748b; display:block; margin-top:-2px;">${horaStr}</span>`;
                        } else {
                            marca = "P";
                        }
                    }
                    else if (reg.estado === 'Falta') { marca = '<span style="color:red; font-weight:bold;">F</span>'; }
                }
                fila += `<td style="text-align:center; font-size:0.8rem; vertical-align: middle;">${marca}</td>`;
            });
            
            // Usar los valores globales de la base de datos para Asistencias y Faltas
            const globalP = est.asistencias || 0;
            const globalF = est.faltas || 0;
            const restantes = totalSesiones - (globalP + globalF);
            
            return fila + `<td style="text-align:center; font-weight:bold;">${globalP}</td><td style="text-align:center; color:red;">${globalF}</td><td style="text-align:center; font-weight:bold; color:#f59e0b;">${restantes}</td></tr>`;
        }).join('');

        // 3. TARJETA DE INFORMACIÓN MENSUAL
        let horasPorClase = 2; // Por defecto
        let horarioTexto = "Lunes, Miércoles y Viernes";
        
        if (cursoActual.frecuencia === 'Sábados') {
            horasPorClase = 4;
            horarioTexto = "09:00 a 13:00 Sábados";
        }
        
        if (cursoActual.nombre.toLowerCase().includes('excel')) {
            horasPorClase = 1.5;
            horarioTexto = "Lunes, Miércoles y Viernes"; // O el horario correspondiente de Excel
        }
        
        // Mostrar en la tarjeta solo las fechas filtradas para este reporte
        let infoHTML = `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 0.5rem; background: white;">
                <thead>
                    <tr>
                        <th style="border: 1px solid #cbd5e1; padding: 6px; background: #e2e8f0; text-align: left;">Módulo</th>
                        <th style="border: 1px solid #cbd5e1; padding: 6px; background: #e2e8f0; text-align: left;">Fechas de Avance</th>
                        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; background: #e2e8f0;">Clases</th>
                        <th style="border: 1px solid #cbd5e1; padding: 6px; text-align: center; background: #e2e8f0;">Horas</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let dateIndex = 0;
        let totalHorasMensual = 0;

        modulosReporte.forEach(m => {
            const clases = m.cantidad_clases;
            const fechasModulo = fechasClase.slice(dateIndex, dateIndex + clases);
            dateIndex += clases;
            
            const horasModulo = clases * horasPorClase;
            totalHorasMensual += horasModulo;

            const fechasFormateadas = fechasModulo.map(f => {
                const d = new Date(f + 'T00:00:00');
                return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
            }).join(', ');

            infoHTML += `
                <tr>
                    <td style="border: 1px solid #cbd5e1; padding: 6px;"><strong>${m.nombre}</strong></td>
                    <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 0.8rem; color: #475569;">${fechasFormateadas || 'Sin fechas'}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${clases}</td>
                    <td style="border: 1px solid #cbd5e1; padding: 6px; text-align: center;">${horasModulo} hrs</td>
                </tr>
            `;
        });

        infoHTML += `
                </tbody>
            </table>
            <div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold; margin-top: 10px;">
                <span style="font-size: 0.9rem;">Horario: <span style="color: var(--primary);">${horarioTexto}</span></span>
                <span style="font-size: 0.95rem;">Total Horas Mes: <span style="color: var(--success);">${totalHorasMensual} horas</span></span>
            </div>
        `;
        
        const infoCard = document.getElementById('tarjeta-info-curso');
        if (infoCard) infoCard.innerHTML = infoHTML;


        // 4. ACTUALIZACIÓN SEGURA DE TEXTOS (Evita el error de 'null')
        const cursoNombre = estudiantes[0]?.curso_nombre || "Cargando...";
        
        const elementos = {
            'reporte-curso-nombre': "Curso: " + cursoNombre,
            'asistencia-curso-nombre': "Curso: " + cursoNombre,
            'reporte-periodo-texto': periodoTexto,
            'asistencia-periodo-texto': periodoTexto,
            'reporte-fecha': new Date().toLocaleDateString()
        };

        for (const [id, valor] of Object.entries(elementos)) {
            const el = document.getElementById(id);
            if (el) el.innerText = valor; // Solo asigna si el elemento existe[cite: 27]
        }

        document.getElementById('reporte-area').style.display = 'block';
        document.getElementById('reporte-asistencia-area').style.display = 'block';

    } catch (error) {
        console.error("Error al generar el reporte:", error);
        alert("Hubo un problema al procesar los datos del reporte.");
    }
}