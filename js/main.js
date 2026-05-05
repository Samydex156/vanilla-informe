// js/main.js

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('course-list');
    
    // 1. Obtener los datos de la API
    const cursos = await getCursos();

    // 2. Limpiar el contenedor (por si acaso)
    container.innerHTML = '';

    // 3. Crear el HTML para cada curso
    cursos.forEach(curso => {
        const card = document.createElement('div');
        card.className = 'card';
        
        card.innerHTML = `
            <h3>${curso.nombre}</h3>
            <p><strong>Frecuencia:</strong> ${curso.frecuencia}</p>
            <p><strong>Duración:</strong> ${curso.total_sesiones} sesiones</p>
            <hr style="margin: 1rem 0; border: 0; border-top: 1px solid var(--border);">
            <button class="btn btn-primary" onclick="verDetalles('${curso.id}')">
                Gestionar Curso
            </button>
        `;
        
        container.appendChild(card);
    });
});

function verDetalles(id) {
    // Redirigimos a la página de asistencias pasando el ID del curso
    window.location.href = `asistencias.html?id=${id}`;
}