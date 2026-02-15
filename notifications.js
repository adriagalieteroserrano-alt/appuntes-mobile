/* =========================================
   SISTEMA DE NOTIFICACIONES (TOASTS)
   ========================================= */

function showToast(message, type = 'info') {
    // 1. Busca el contenedor en el HTML
    const container = document.getElementById('toast-container');
    
    // Si no existe (por seguridad), usa una alerta normal
    if (!container) return alert(message); 

    // 2. Crea la tarjeta
    const toast = document.createElement('div');
    toast.className = `toast ${type}`; // Añade clase 'success', 'error', etc.
    
    // Elige el icono
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error')   icon = '❌';
    if (type === 'warning') icon = '⚠️';

    // Rellena el contenido
    toast.innerHTML = `<span style="font-size:1.2rem">${icon}</span> <span>${message}</span>`;
    
    // 3. Añádelo a la pantalla
    container.appendChild(toast);

    // 4. Espera 3 segundos y quítalo
    setTimeout(() => {
        // Activa la animación de salida que ya tienes en tu CSS
        toast.style.animation = 'slideOut 0.3s forwards';
        
        // Cuando termine la animación, borra el elemento
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
}