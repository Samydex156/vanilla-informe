// js/main-estudiantes.js

document.addEventListener('DOMContentLoaded', async () => {
    const selectCurso = document.getElementById('select-curso');
    const selectModulo = document.getElementById('select-modulo');
    const formRegistro = document.getElementById('form-estudiante');
    const formEdicion = document.getElementById('form-edit');
    
    const editCurso = document.getElementById('edit-curso');
    const editModulo = document.getElementById('edit-modulo');

    // 1. Cargar la lista desde la VISTA corregida
    await cargarListaEstudiantes();

    // 2. Cargar cursos en el select de registro[cite: 12]
    try {
        const cursos = await getCursos();
        cursos.forEach(c => {
            selectCurso.add(new Option(c.nombre, c.id));
            editCurso.add(new Option(c.nombre, c.id)); // También al select de edición
        });
    } catch (e) { console.error("Error al cargar cursos:", e); }

    // 3. Filtro dinámico de módulos según curso seleccionado
    selectCurso.addEventListener('change', async () => {
        selectModulo.innerHTML = '<option value="">Cargando módulos...</option>';
        const modulos = await getModulosPorCurso(selectCurso.value);
        selectModulo.innerHTML = '<option value="">Seleccione módulo de inicio...</option>';
        modulos.forEach(m => selectModulo.add(new Option(m.nombre, m.id)));
    });

    editCurso.addEventListener('change', async () => {
        editModulo.innerHTML = '<option value="">Cargando módulos...</option>';
        const modulos = await getModulosPorCurso(editCurso.value);
        editModulo.innerHTML = '<option value="">Seleccione módulo...</option>';
        modulos.forEach(m => editModulo.add(new Option(m.nombre, m.id)));
    });

    // 4. Manejo de Registro de nuevos estudiantes[cite: 12, 16]
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = formRegistro.querySelector('button');
        btn.disabled = true;
        try {
            await registrarNuevoEstudiante(
                document.getElementById('nombre').value,
                selectCurso.value,
                selectModulo.value,
                document.getElementById('fecha-ingreso').value
            );
            location.reload();
        } catch (error) {
            alert('Error al registrar: ' + error.message);
            btn.disabled = false;
        }
    });

    // 5. Manejo de Edición (Modal)[cite: 16]
    formEdicion.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const nuevosDatos = {
                nombre: document.getElementById('edit-nombre').value,
                fecha: document.getElementById('edit-fecha').value,
                cursoId: editCurso.value,
                moduloId: editModulo.value
            };
            await updateEstudiante(
                document.getElementById('edit-estudiante-id').value,
                document.getElementById('edit-inscripcion-id').value,
                nuevosDatos
            );
            location.reload();
        } catch (error) { alert("Error al actualizar"); }
    });
});

async function cargarListaEstudiantes() {
    const tbody = document.querySelector('#tabla-estudiantes tbody');
    if (!tbody) return;

    // Consultamos la vista que centraliza asistencias y faltas[cite: 16]
    const { data: lista, error } = await supabaseClient
        .from('vista_estudiantes_resumen')
        .select('*');

    if (error) {
        console.error("Error en vista_estudiantes_resumen:", error);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Error al cargar datos: ${error.message}</td></tr>`;
        return;
    }

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay estudiantes registrados.</td></tr>';
        return;
    }

    // Ordenar por fecha de ingreso
    lista.sort((a, b) => new Date(a.fecha_ingreso) - new Date(b.fecha_ingreso));

    // Renderizado dinámico de la tabla[cite: 16]
    tbody.innerHTML = lista.map(reg => {
        const partes = reg.fecha_ingreso ? reg.fecha_ingreso.split('-') : [];
        const fechaFormateada = partes.length === 3 ? `${partes[2]}-${partes[1]}-${partes[0]}` : reg.fecha_ingreso;

        return `
        <tr>
            <td><strong>${reg.nombre_completo}</strong></td>
            <td><small>${reg.curso_nombre}</small></td>
            <td><span class="status-pill" style="background:#e2e8f0; color:#475569;">${reg.modulo_inicio_nombre}</span></td>
            <td>${fechaFormateada}</td>
            <td style="text-align:center; color:var(--success); font-weight:bold;">${reg.asistencias}</td>
            <td style="text-align:center; color:var(--danger); font-weight:bold;">${reg.faltas}</td>
            <td>
                <button class="btn" onclick="abrirEditar('${reg.estudiante_id}', '${reg.inscripcion_id}', '${reg.nombre_completo}', '${reg.fecha_ingreso}', '${reg.curso_id}', '${reg.modulo_inicio_id}')" style="background:#3b82f6; color:white; padding:4px 8px; cursor:pointer;">✎</button>
                <button class="btn" onclick="confirmarEliminar('${reg.estudiante_id}')" style="background:#ef4444; color:white; padding:4px 8px; cursor:pointer; margin-left:5px;">✕</button>
            </td>
        </tr>
        `;
    }).join('');

    // Lógica de filtrado en tiempo real
    const buscador = document.getElementById("buscador-general-estudiantes");
    if (buscador) {
        buscador.addEventListener("input", (e) => {
            const term = e.target.value.toLowerCase();
            const filas = tbody.querySelectorAll("tr");
            filas.forEach((fila) => {
                const nombre = fila.querySelector("strong")?.innerText.toLowerCase() || "";
                if (nombre.includes(term)) {
                    fila.style.display = "";
                } else {
                    fila.style.display = "none";
                }
            });
        });
        setTimeout(() => buscador.focus(), 100);
    }
}

// Funciones globales para botones de acción[cite: 16]
window.abrirEditar = async (estId, insId, nombre, fecha, cursoId, moduloId) => {
    document.getElementById('edit-estudiante-id').value = estId;
    document.getElementById('edit-inscripcion-id').value = insId;
    document.getElementById('edit-nombre').value = nombre;
    document.getElementById('edit-fecha').value = fecha;
    
    const editCurso = document.getElementById('edit-curso');
    const editModulo = document.getElementById('edit-modulo');
    
    editCurso.value = cursoId;
    
    // Cargar módulos del curso seleccionado antes de abrir el modal
    editModulo.innerHTML = '<option value="">Cargando módulos...</option>';
    const modulos = await getModulosPorCurso(cursoId);
    editModulo.innerHTML = '<option value="">Seleccione módulo...</option>';
    modulos.forEach(m => editModulo.add(new Option(m.nombre, m.id)));
    
    // Asignar el módulo inicial
    if (moduloId && moduloId !== 'null') {
        editModulo.value = moduloId;
    }
    
    document.getElementById('modal-edit').style.display = 'flex';
};

window.cerrarModal = () => document.getElementById('modal-edit').style.display = 'none';

window.confirmarEliminar = async (id) => {
    if (confirm("¿Estás seguro de eliminar a este estudiante? Se borrarán todas sus asistencias y notas.")) {
        try {
            await deleteEstudiante(id);
            location.reload();
        } catch (e) { alert("Error al eliminar"); }
    }
};