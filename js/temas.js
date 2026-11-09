// ============================================
// SISTEMA DE TEMAS - GaNime
// ============================================

const TEMAS_DISPONIBLES = [
    'auto',
    'original',
    'claro',
    'oscuro',
    'primavera',
    'verano',
    'otono',
    'invierno',
    'halloween',
    'navidad',
    'fin-de-ano'
];

let temaSeleccionado = 'auto';
let particulasInterval = null;
let particulasActivas = false;

// Iconos para el logo según tema
const LOGO_ICONOS = {
    original: '⚡',
    claro: '✨',
    oscuro: '🌙',
    primavera: '🌸',
    verano: '☀️',
    otono: '🍂',
    invierno: '❄️',
    halloween: '🎃',
    navidad: '🎄',
    'fin-de-ano': '🏮'
};

const TEMAS_ICONOS = {
    original: { icono: 'fa-bolt', emojis: ['⚡', '💜', '✨'] },
    claro: { icono: 'fa-lightbulb', emojis: ['✨'] },
    oscuro: { icono: 'fa-moon', emojis: ['🌙', '⭐'] },
    primavera: { icono: 'fa-seedling', emojis: ['🌸','🌼'] },
    verano: { icono: 'fa-sun', emojis: ['☀️'] },
    otono: { icono: 'fa-leaf', emojis: ['🍂', '🍃', '🍁'] },
    invierno: { icono: 'fa-snowflake', emojis: ['❄️']},
    halloween: { icono: 'fa-ghost', emojis: ['🎃', '🕸️', '🕷️', '🦇','🕯️'] },
    navidad: { icono: 'fa-tree', emojis: ['🎄', '❄', '⛄', '🔔'] },
    'fin-de-ano': { icono: 'fa-fireworks', emojis: ['🎉','🐉', '🏮'] }
};

function aplicarTema(tema) {
    //console.log('🎨 Aplicando tema:', tema);
    
    // Quitar todas las clases de tema
    document.body.classList.remove(...TEMAS_DISPONIBLES.map(t => `tema-${t}`));
    
    // Aplicar la clase del tema seleccionado
    if (tema !== 'auto') {
        document.body.classList.add(`tema-${tema}`);
    } else {
        // Si es automático, detectar y aplicar
        const auto = detectarTemaAutomatico();
        document.body.classList.add(`tema-${auto}`);
        tema = auto;
    }
    
    temaSeleccionado = tema;
    localStorage.setItem('tema_preferido', tema);
    
    // Actualizar botones activos en el panel
    document.querySelectorAll('.tema-opcion').forEach(btn => {
        btn.classList.toggle('activo', btn.dataset.tema === tema);
    });

    // 🔥 ACTUALIZAR ICONO DEL LOGO
    const logoIcon = document.getElementById('logoIcon');
    if (logoIcon) {
        logoIcon.textContent = LOGO_ICONOS[tema] || '⚡';
    }

    // Actualizar partículas
    limpiarParticulas();
    crearParticulas(tema);    
}

function detectarTemaAutomatico() {
    const hoy = new Date();
    const mes = hoy.getMonth();
    const dia = hoy.getDate();
    
    // Fechas especiales
    if ((mes === 9 && dia === 31) || (mes === 10 && dia === 1)) return 'halloween';
    if ((mes === 11 && dia >= 24 && dia <= 25)) return 'navidad';
    if ((mes === 11 && dia === 31) || (mes === 0 && dia === 1)) return 'fin-de-ano';
    
    // Estaciones
    if (mes >= 2 && mes <= 4) return 'primavera';
    if (mes >= 5 && mes <= 7) return 'verano';
    if (mes >= 8 && mes <= 10) return 'otono';
    return 'invierno';
}

function cargarTemaPreferido() {
    const guardado = localStorage.getItem('tema_preferido');
    if (guardado && TEMAS_DISPONIBLES.includes(guardado)) {
        return guardado;
    }
    return 'auto';
}

function inicializarTema() {
    const preferido = cargarTemaPreferido();
    let tema = preferido;
    if (tema === 'auto') {
        tema = detectarTemaAutomatico();
    }
    aplicarTema(tema);
}

function toggleTemas() {
    const panel = document.getElementById('temasPanel');
    const backdrop = document.getElementById('temasBackdrop');
    const isOpen = panel.classList.contains('active');
    panel.classList.toggle('active');
    backdrop.classList.toggle('active');
    document.body.style.overflow = isOpen ? '' : 'hidden';
}

function cerrarTemas() {
    document.getElementById('temasPanel').classList.remove('active');
    document.getElementById('temasBackdrop').classList.remove('active');
    document.body.style.overflow = '';
}

function crearParticulas(tema) {
    limpiarParticulas();
    if (tema === 'auto') tema = detectarTemaAutomatico();

    const lista = TEMAS_ICONOS[tema]?.emojis || TEMAS_ICONOS.original.emojis;
    const numParticulas = 25;

    for (let i = 0; i < numParticulas; i++) {
        const el = document.createElement('div');
        el.className = 'particula';
        el.textContent = lista[Math.floor(Math.random() * lista.length)];
        el.style.left = Math.random() * 100 + '%';
        el.style.fontSize = (14 + Math.random() * 22) + 'px';
        el.style.animationDuration = (8 + Math.random() * 14) + 's';
        el.style.animationDelay = (Math.random() * 12) + 's';
        el.style.opacity = 0.15 + Math.random() * 0.35;
        document.body.appendChild(el);
    }
    particulasActivas = true;
}

function limpiarParticulas() {
    document.querySelectorAll('.particula').forEach(el => el.remove());
    particulasActivas = false;
    if (particulasInterval) {
        clearInterval(particulasInterval);
        particulasInterval = null;
    }
}

// ===== INICIALIZAR =====
document.addEventListener('DOMContentLoaded', () => {
    inicializarTema();
    
    // Click en opciones de tema
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.tema-opcion');
        if (btn) {
            const tema = btn.dataset.tema;
            if (tema === 'auto') {
                aplicarTema('auto');
            } else {
                aplicarTema(tema);
            }
            cerrarTemas();
        }
    });
});

// ===== EXPONER FUNCIONES GLOBALES =====
window.toggleTemas = toggleTemas;
window.cerrarTemas = cerrarTemas;
window.aplicarTema = aplicarTema;
window.detectarTemaAutomatico = detectarTemaAutomatico;
window.inicializarTema = inicializarTema;