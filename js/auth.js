// js/auth.js

document.addEventListener("DOMContentLoaded", () => {
    // Usamos sessionStorage para que la sesión expire al cerrar la pestaña
    const isAuth = sessionStorage.getItem('sgra_auth');
    if (isAuth === 'true') return; // Ya está autorizado

    // Si no está autorizado, creamos la pantalla de bloqueo
    crearPantallaBloqueo();
});

function crearPantallaBloqueo() {
    const overlay = document.createElement('div');
    overlay.id = 'auth-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = '#0f172a'; // Fondo oscuro moderno
    overlay.style.zIndex = '999999';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';

    overlay.innerHTML = `
        <div style="background: white; padding: 3rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; max-width: 400px; width: 90%;">
            <h2 style="margin-bottom: 0.5rem; color: #1e293b;">Acceso Privado</h2>
            <p style="color: #64748b; margin-bottom: 1.5rem;">Por favor, ingresa el código de acceso para continuar al sistema.</p>
            
            <input type="password" id="pin-input" placeholder="Código Secreto" style="width: 100%; padding: 12px; margin-bottom: 1rem; border: 2px solid #cbd5e1; border-radius: 6px; font-size: 1.2rem; text-align: center; box-sizing: border-box;" autofocus>
            
            <button id="btn-login" class="btn btn-primary" style="width: 100%; padding: 12px; font-size: 1.1rem;">Desbloquear</button>
            
            <p id="pin-error" style="color: #ef4444; font-weight: bold; margin-top: 1rem; display: none;">Código incorrecto. Intenta de nuevo.</p>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden'; // Bloquear el scroll

    const btnLogin = document.getElementById('btn-login');
    const pinInput = document.getElementById('pin-input');

    // Permitir presionar Enter para ingresar
    pinInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnLogin.click();
    });

    btnLogin.addEventListener('click', async () => {
        const pin = pinInput.value.trim();
        if (!pin) return;

        // Deshabilitar botón mientras consulta
        btnLogin.innerText = 'Verificando...';
        btnLogin.disabled = true;

        try {
            // Llamamos a la función segura en Supabase (RPC)
            const { data: esValido, error } = await supabaseClient.rpc('verificar_pin', { pin_ingresado: pin });

            if (error) {
                console.error(error);
                alert('Error de conexión al verificar el código.');
                btnLogin.innerText = 'Desbloquear';
                btnLogin.disabled = false;
                return;
            }

            if (esValido) {
                // Código correcto
                sessionStorage.setItem('sgra_auth', 'true');
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    overlay.remove();
                    document.body.style.overflow = 'auto'; // Restaurar scroll
                }, 500);
            } else {
                // Código incorrecto
                document.getElementById('pin-error').style.display = 'block';
                pinInput.value = '';
                pinInput.focus();
                btnLogin.innerText = 'Desbloquear';
                btnLogin.disabled = false;
            }
        } catch (err) {
            console.error("Error al autenticar", err);
            btnLogin.innerText = 'Desbloquear';
            btnLogin.disabled = false;
        }
    });
}
