// ============================================
// SISTEMA DE NOTIFICACIONES SIMPLIFICADO
// ============================================

const NOTIF_KEY = 'ganime_notificaciones';
const ULTIMO_ANIME_KEY = 'ganime_ultimo_anime';
const CAPITULOS_KEY = 'ganime_capitulos_estado';
const ESTADO_ANIME_KEY = 'ganime_estado_animes';

// ===== CARGAR NOTIFICACIONES =====
function cargarNotificaciones() {
    const data = localStorage.getItem(NOTIF_KEY);
    if (data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            return [];
        }
    }
    return [];
}

// ===== GUARDAR NOTIFICACIONES (duran 2h) =====
function guardarNotificaciones(notifs) {
    const ahora = Date.now();
    const notifsFiltradas = notifs.filter(n => {
        return (ahora - n.fecha) < 2 * 60 * 60 * 1000;
    });
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifsFiltradas));
}

// ===== AÑADIR NOTIFICACIÓN =====
function agregarNotificacion(tipo, titulo, mensaje, extra = {}) {
    const notifs = cargarNotificaciones();
    notifs.unshift({
        id: Date.now() + Math.random(),
        tipo: tipo,
        titulo: titulo,
        mensaje: mensaje,
        extra: extra,
        fecha: Date.now(),
        leida: false
    });
    guardarNotificaciones(notifs);
    actualizarBadgeNotificaciones();
    
    mostrarNotificacionSuperior(titulo, mensaje, tipo, extra);
}

// ===== OBTENER COLOR Y FONDO DEL ANIME =====
function obtenerDatosAnime(nombre) {
    const rawAnimes = window.catalogoRaw || [];
    const anime = rawAnimes.find(a => a.nombre === nombre);
    return {
        color: anime?.color || '#7c3aed',
        cardBg: anime?.cardBg || '#14102a'
    };
}

// ===== MOSTRAR TOAST EMERGENTE =====
function mostrarNotificacionSuperior(titulo, mensaje, tipo, extra = {}) {
    let container = document.getElementById('notifContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notifContainer';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 10000;
            padding: 16px;
            pointer-events: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
        `;
        document.body.appendChild(container);
    }

    // 🔥 Extraer el nombre del anime del mensaje
    let nombreAnime = '';
    let mensajeSinNombre = mensaje;
    const match = mensaje.match(/"([^"]+)"/);
    if (match) {
        nombreAnime = match[1];
        mensajeSinNombre = mensaje.replace(`"${nombreAnime}"`, '');
        mensajeSinNombre = mensajeSinNombre.replace(/^[,\s]+/, '');
        if (mensajeSinNombre.length > 0) {
            mensajeSinNombre = mensajeSinNombre.charAt(0).toUpperCase() + mensajeSinNombre.slice(1);
        }
    }

    // 🔥 Obtener datos del anime
    const datosAnime = nombreAnime ? obtenerDatosAnime(nombreAnime) : { color: '#7c3aed', cardBg: '#14102a' };
    const colorAnime = datosAnime.color;
    const cardBg = datosAnime.cardBg;

    // 🔥 Colores por tipo de acción
    const coloresAccion = {
        'nueva': '#2ecc71',
        'eliminada': '#e74c3c',
        'capitulos': '#3498db',
        'completado': '#2ecc71',
        're-descarga': '#8b5cf6',
        'en-pausa': '#ff1f00'
    };
    const colorAccion = coloresAccion[tipo] || '#7c3aed';

    // 🔥 Iconos FontAwesome según tipo
    const iconos = {
        'nueva': 'fa-plus-circle',
        'eliminada': 'fa-trash',
        'capitulos': 'fa-arrow-up',
        'completado': 'fa-flag-checkered',
        're-descarga': 'fa-rotate',
        'en-pausa': 'fa-pause-circle'
    };
    const icono = iconos[tipo] || 'fa-bell';

    // 🔥 Títulos según tipo
    const titulos = {
        'nueva': 'Nuevo Anime Agregado',
        'eliminada': 'Anime Eliminado',
        'capitulos': 'Capítulos Actualizados',
        'completado': 'Anime Completado',
        're-descarga': 'Anime en Re-Descarga',
        'en-pausa': 'Anime Pausado por el momento'
    };
    const tituloFinal = titulos[tipo] || titulo;

    // 🔥 Mensaje final: todo en color del anime
    let mensajeFinal = mensajeSinNombre;
    if (nombreAnime) {
        mensajeFinal = `"${nombreAnime}" ${mensajeSinNombre}`;
    }

    const notif = document.createElement('div');
    notif.style.cssText = `
        background: ${cardBg};
        border: 1px solid ${colorAnime}33;
        border-radius: 12px;
        padding: 14px 18px;
        max-width: 420px;
        width: 100%;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        pointer-events: auto;
        animation: slideDownNotif 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        display: flex;
        align-items: center;
        gap: 14px;
        position: relative;
        overflow: hidden;
        cursor: default;
        touch-action: pan-y;
        transition: all 0.3s ease;
    `;

    notif.innerHTML = `
        <!-- IZQUIERDA: ICONO CON COLOR DE ACCIÓN -->
        <div style="flex-shrink:0;width:40px;height:40px;border-radius:50%;background:${colorAccion}22;display:flex;align-items:center;justify-content:center;color:${colorAccion};font-size:18px;border: 2px solid ${colorAccion}44;">
            <i class="fas ${icono}"></i>
        </div>
        
        <!-- DERECHA: TODO EL TEXTO EN COLOR DEL ANIME -->
        <div style="flex:1;min-width:0;">
            <div style="font-weight:700;font-size:14px;color:${colorAnime};">${tituloFinal}</div>
            <div style="font-size:13px;color:${colorAnime};margin-top:2px;line-height:1.4;opacity:0.9;">${mensajeFinal}</div>
            <div style="font-size:10px;color:${colorAnime};margin-top:4px;opacity:0.5;">${new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        
        <!-- BOTÓN CERRAR -->
        <button class="notif-close-btn" style="background:none;border:none;color:${colorAnime};cursor:pointer;font-size:16px;flex-shrink:0;padding:4px;opacity:0.4;transition:opacity 0.2s;">
            <i class="fas fa-times"></i>
        </button>
        
        <!-- BARRA DE PROGRESO -->
        <div style="position:absolute;bottom:0;left:0;height:3px;background:${colorAnime};border-radius:0 2px 2px 0;width:100%;animation:progressBar 4s linear forwards;"></div>
    `;

    // Botón cerrar
    const closeBtn = notif.querySelector('.notif-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            eliminarToast(notif);
        });
        closeBtn.addEventListener('mouseenter', function() {
            this.style.opacity = '1';
        });
        closeBtn.addEventListener('mouseleave', function() {
            this.style.opacity = '0.4';
        });
    }

    // Swipe para eliminar
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let isSwiped = false;

    notif.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        isSwiped = false;
        notif.style.transition = 'none';
    }, { passive: true });

    notif.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX;
        const diff = currentX - startX;
        if (diff > 0) {
            notif.style.transform = `translateX(${diff}px)`;
            notif.style.opacity = 1 - (diff / 300);
            isSwiped = true;
        }
    }, { passive: true });

    notif.addEventListener('touchend', () => {
        isDragging = false;
        const diff = currentX - startX;
        notif.style.transition = 'all 0.3s ease';
        if (diff > 150 && isSwiped) {
            eliminarToast(notif);
        } else {
            notif.style.transform = 'translateX(0)';
            notif.style.opacity = '1';
        }
        startX = 0;
        currentX = 0;
        isSwiped = false;
    }, { passive: true });

    // Ratón
    let mouseStartX = 0;
    let mouseCurrentX = 0;
    let isMouseDragging = false;
    let isMouseSwiped = false;

    notif.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) return;
        mouseStartX = e.clientX;
        isMouseDragging = true;
        isMouseSwiped = false;
        notif.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isMouseDragging) return;
        mouseCurrentX = e.clientX;
        const diff = mouseCurrentX - mouseStartX;
        if (diff > 0) {
            notif.style.transform = `translateX(${diff}px)`;
            notif.style.opacity = 1 - (diff / 300);
            isMouseSwiped = true;
        }
    });

    document.addEventListener('mouseup', () => {
        if (!isMouseDragging) return;
        isMouseDragging = false;
        const diff = mouseCurrentX - mouseStartX;
        notif.style.transition = 'all 0.3s ease';
        if (diff > 150 && isMouseSwiped) {
            eliminarToast(notif);
        } else {
            notif.style.transform = 'translateX(0)';
            notif.style.opacity = '1';
        }
        mouseStartX = 0;
        mouseCurrentX = 0;
        isMouseSwiped = false;
    });

    container.appendChild(notif);

    if (typeof reproducirSonido === 'function') {
        try { reproducirSonido('notificacion'); } catch (e) {}
    }

    setTimeout(() => {
        if (notif.parentElement) {
            eliminarToast(notif);
        }
    }, 4000);

    // Estilos si no existen
    if (!document.getElementById('notifStyles')) {
        const style = document.createElement('style');
        style.id = 'notifStyles';
        style.textContent = `
            @keyframes slideDownNotif {
                0% { opacity: 0; transform: translateY(-30px) scale(0.95); }
                100% { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes progressBar {
                0% { width: 100%; }
                100% { width: 0%; }
            }
        `;
        document.head.appendChild(style);
    }
}

// ===== ELIMINAR TOAST =====
function eliminarToast(element) {
    if (element && element.parentElement) {
        element.style.transition = 'all 0.3s ease';
        element.style.transform = 'translateX(400px)';
        element.style.opacity = '0';
        setTimeout(() => {
            if (element.parentElement) {
                element.remove();
            }
        }, 300);
    }
}

// ===== ACTUALIZAR BADGE =====
function actualizarBadgeNotificaciones() {
    const notifs = cargarNotificaciones();
    const noLeidas = notifs.filter(n => !n.leida).length;
    const dot = document.getElementById('notifDot');
    if (dot) {
        dot.style.display = noLeidas > 0 ? 'block' : 'none';
    }
}

// ===== TOGGLE PANEL =====
function toggleNotificaciones() {
    const panel = document.getElementById('notifPanel');
    const backdrop = document.getElementById('notifBackdrop');
    const isOpen = panel.classList.contains('active');
    
    if (isOpen) {
        cerrarNotificaciones();
    } else {
        panel.classList.add('active');
        backdrop.classList.add('active');
        renderizarNotificaciones();
        const notifs = cargarNotificaciones();
        notifs.forEach(n => n.leida = true);
        guardarNotificaciones(notifs);
        actualizarBadgeNotificaciones();
        document.body.style.overflow = 'hidden';
    }
}

function cerrarNotificaciones() {
    document.getElementById('notifPanel').classList.remove('active');
    document.getElementById('notifBackdrop').classList.remove('active');
    document.body.style.overflow = '';
}

// ===== RENDERIZAR NOTIFICACIONES EN EL PANEL =====
function renderizarNotificaciones() {
    const list = document.getElementById('notifList');
    const notifs = cargarNotificaciones();
    
    if (notifs.length === 0) {
        list.innerHTML = `<div class="notif-empty"><i class="fas fa-bell-slash"></i> No hay notificaciones</div>`;
        return;
    }
    
    // 🔥 Colores por tipo de acción
    const coloresAccion = {
        'nueva': '#2ecc71',
        'eliminada': '#e74c3c',
        'capitulos': '#3498db',
        'completado': '#2ecc71',
        're-descarga': '#8b5cf6'
    };
    const iconos = {
        'nueva': 'fa-plus-circle',
        'eliminada': 'fa-trash',
        'capitulos': 'fa-arrow-up',
        'completado': 'fa-flag-checkered',
        're-descarga': 'fa-rotate'
    };
    const titulos = {
        'nueva': 'Nuevo anime agregado',
        'eliminada': 'Anime eliminado',
        'capitulos': 'Capítulos actualizados',
        'completado': 'Anime completado',
        're-descarga': 'Serie en re-descarga'
    };
    
    let html = '';
    notifs.forEach((n) => {
        // 🔥 Extraer el nombre del anime
        let nombreAnime = '';
        let mensajeSinNombre = n.mensaje;
        const match = n.mensaje.match(/"([^"]+)"/);
        if (match) {
            nombreAnime = match[1];
            mensajeSinNombre = n.mensaje.replace(`"${nombreAnime}"`, '');
            mensajeSinNombre = mensajeSinNombre.replace(/^[,\s]+/, '');
            if (mensajeSinNombre.length > 0) {
                mensajeSinNombre = mensajeSinNombre.charAt(0).toUpperCase() + mensajeSinNombre.slice(1);
            }
        }
        
        // 🔥 Obtener datos del anime
        const datosAnime = nombreAnime ? obtenerDatosAnime(nombreAnime) : { color: '#7c3aed', cardBg: '#14102a' };
        const colorAnime = datosAnime.color;
        const cardBg = datosAnime.cardBg;
        
        // 🔥 Color de acción
        const colorAccion = coloresAccion[n.tipo] || '#7c3aed';
        const icono = iconos[n.tipo] || 'fa-bell';
        const tituloFinal = titulos[n.tipo] || n.titulo;
        
        // 🔥 Mensaje: todo en color del anime
        let mensajeFinal = mensajeSinNombre;
        if (nombreAnime) {
            mensajeFinal = `"${nombreAnime}" ${mensajeSinNombre}`;
        }
        
        const fecha = new Date(n.fecha);
        const hora = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const dia = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
        
        html += `
            <div class="notif-item notif-panel-item" style="border-left: 3px solid var(--text-tema); background: var(--bg-tema);">
                <!-- ICONO CON COLOR DE ACCIÓN -->
                <div class="notif-icon" style="color: ${colorAccion}; background: ${colorAccion}22; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 2px solid ${colorAccion}44; flex-shrink: 0; margin-top: 2px;">
                    <i class="fas ${icono}"></i>
                </div>
                <!-- TEXTO COMPLETO EN COLOR DEL ANIME -->
                <div class="notif-body">
                    <div class="notif-titulo" style="color: ${colorAnime};">${tituloFinal}</div>
                    <div class="notif-mensaje" style="color: ${colorAnime}; opacity: 0.9;">${mensajeFinal}</div>
                    <div class="notif-fecha" style="color: var(--text-tema); opacity: 0.5;">${dia} ${hora}</div>
                </div>
            </div>
        `;
    });
    
    list.innerHTML = html;
}

// ============================================
// DETECCIÓN DE CAMBIOS EN DATOS
// ============================================

function detectarCambios() {
    const rawAnimes = window.catalogoRaw || [];
    if (rawAnimes.length === 0) return;
    
    // Obtener animes VISIBLES (sin ocultar: true)
    const animesVisibles = rawAnimes.filter(a => !a.ocultar);
    if (animesVisibles.length === 0) {
        localStorage.removeItem(ULTIMO_ANIME_KEY);
        localStorage.removeItem(CAPITULOS_KEY);
        localStorage.removeItem(ESTADO_ANIME_KEY);
        return;
    }
    
    const nombresVisibles = animesVisibles.map(a => a.nombre);
    
    // ===== DETECTAR CAMBIOS EN EL ESTADO DE LOS ANIMES =====
    const estadoAnterior = localStorage.getItem(ESTADO_ANIME_KEY);
    let estadosAnteriores = estadoAnterior ? JSON.parse(estadoAnterior) : {};
    
    animesVisibles.forEach(anime => {
        const key = anime.nombre;
        const estadoActual = anime.estado || 'finalizada';
        
        if (!estadosAnteriores[key]) {
            estadosAnteriores[key] = estadoActual;
            return;
        }
        
        const estadoPrev = estadosAnteriores[key];
        
        // 🔥 Si cambió a "re-descarga"
        if (estadoPrev !== 're-descarga' && estadoActual === 're-descarga') {
            agregarNotificacion(
                're-descarga',
                `Serie en re-descarga`,
                `"${anime.nombre}" será re-descargada en una calidad más adecuada`,
                { nombre: anime.nombre, color: anime.color }
            );
        }
        
                // 🔥 Si cambió a "en-pausa"
        if (estadoPrev !== 'en-pausa' && estadoActual === 'en-pausa') {
            agregarNotificacion(
                'en-pausa',
                `Anime en Pausa`,
                `"${anime.nombre}" será Pausado por el momento. En INFORMACIONES encontrará más detalles.`,
                { nombre: anime.nombre, color: anime.color }
            );
        }
        
        // 🔥 Si cambió a "en-descarga" desde otro estado
        if (estadoActual === 'en-descarga' && estadoPrev !== 'en-descarga') {
            // Venía de re-descarga
            if (estadoPrev === 're-descarga') {
                agregarNotificacion(
                    'capitulos',
                    `Descarga iniciada`,
                    `"${anime.nombre}" - Comenzando la descarga de la nueva versión (0/${anime.capitulosTotales || '?'})`,
                    { nombre: anime.nombre, color: anime.color }
                );
            } 
            // Venía de incompleta
            else if (estadoPrev === 'incompleta') {
                const actuales = anime.capitulosActuales || 0;
                const totales = anime.capitulosTotales || '?';
                agregarNotificacion(
                    'capitulos',
                    `Descarga iniciada`,
                    `"${anime.nombre}" - Comenzando la descarga de los capítulos faltantes (${actuales}/${totales})`,
                    { nombre: anime.nombre, color: anime.color }
                );
            }
            
            // Venía de en-pausa
            else if (estadoPrev === 'en-pausa') {
                const actuales = anime.capitulosActuales || 0;
                const totales = anime.capitulosTotales || '?';
                agregarNotificacion(
                    'capitulos',
                    `Descarga iniciada`,
                    `"${anime.nombre}" - Se reanuda la descarga. Capítulos actuales (${actuales}/${totales})`,
                    { nombre: anime.nombre, color: anime.color }
                );
            }
            
            // Venía de finalizada (caso raro, pero por si acaso)
            else if (estadoPrev === 'finalizada') {
                agregarNotificacion(
                    'capitulos',
                    `Descarga iniciada`,
                    `"${anime.nombre}" - Comenzando la descarga (0/${anime.capitulosTotales || '?'})`,
                    { nombre: anime.nombre, color: anime.color }
                );
            }
        }
        
        estadosAnteriores[key] = estadoActual;
    });
    
    localStorage.setItem(ESTADO_ANIME_KEY, JSON.stringify(estadosAnteriores));
    
    // ===== DETECTAR CAMBIOS EN CAPÍTULOS (animes en emisión o descarga) =====
    const animesConEstado = animesVisibles.filter(a => 
        a.estado === 'en-emision' || a.estado === 'en-descarga'
    );
    
    const capitulosGuardados = localStorage.getItem(CAPITULOS_KEY);
    let capitulosAnteriores = capitulosGuardados ? JSON.parse(capitulosGuardados) : {};
    
    animesConEstado.forEach(anime => {
        const key = anime.nombre;
        const actuales = anime.capitulosActuales || 0;
        const totales = anime.capitulosTotales || null;
        
        if (!capitulosAnteriores[key]) {
            capitulosAnteriores[key] = {
                actuales: actuales,
                totales: totales
            };
            return;
        }
        
        const anterior = capitulosAnteriores[key];
        
        if (actuales > anterior.actuales) {
            const cantidad = actuales - anterior.actuales;
            
            agregarNotificacion(
                'capitulos',
                `Capítulos actualizados`,
                `"${anime.nombre}" - ${cantidad} nuevo${cantidad > 1 ? 's' : ''} capítulo${cantidad > 1 ? 's' : ''} (${actuales}/${totales || '?'})`,
                { nombre: anime.nombre, color: anime.color }
            );
        }
        
        if (totales && actuales >= totales && anterior.actuales < totales) {
            agregarNotificacion(
                'completado',
                `Anime completado`,
                `"${anime.nombre}" ya está completo (${totales} capítulos)`,
                { nombre: anime.nombre, color: anime.color }
            );
        }
        
        capitulosAnteriores[key] = {
            actuales: actuales,
            totales: totales
        };
    });
    
    Object.keys(capitulosAnteriores).forEach(key => {
        if (!nombresVisibles.includes(key)) {
            delete capitulosAnteriores[key];
        }
    });
    
    localStorage.setItem(CAPITULOS_KEY, JSON.stringify(capitulosAnteriores));
    
    // ===== DETECTAR ANIMES NUEVOS Y ELIMINADOS =====
    const ultimoGuardado = localStorage.getItem(ULTIMO_ANIME_KEY);
    let nombresAnteriores = ultimoGuardado ? JSON.parse(ultimoGuardado) : [];
    
    if (!nombresAnteriores || nombresAnteriores.length === 0) {
        localStorage.setItem(ULTIMO_ANIME_KEY, JSON.stringify(nombresVisibles));
        return;
    }
    
    const nuevosAnimes = nombresVisibles.filter(n => !nombresAnteriores.includes(n));
    
    nuevosAnimes.forEach(nombre => {
        const anime = rawAnimes.find(a => a.nombre === nombre);
        if (anime) {
            const tipo = anime.tipo || 'anime';
            agregarNotificacion(
                'nueva',
                `Nuevo ${tipo} agregado`,
                `"${nombre}" ya está disponible en el catálogo`,
                { nombre: nombre, color: anime.color }
            );
        }
    });
    
    const animesEliminados = nombresAnteriores.filter(n => !nombresVisibles.includes(n));
    
    animesEliminados.forEach(nombre => {
        const anime = rawAnimes.find(a => a.nombre === nombre);
        const tipo = anime?.tipo || 'anime';
        agregarNotificacion(
            'eliminada',
            `${tipo} eliminado`,
            `"${nombre}" ha sido removido del catálogo`,
            { nombre: nombre, color: anime?.color }
        );
    });
    
    localStorage.setItem(ULTIMO_ANIME_KEY, JSON.stringify(nombresVisibles));
}

// ============================================
// INICIALIZAR NOTIFICACIONES
// ============================================

function initNotificaciones() {

    setTimeout(() => {
        if (typeof window.catalogoRaw === 'undefined') {
            window.catalogoRaw = window.catalogoOriginal || [];
        }
        
        detectarCambios();
        actualizarBadgeNotificaciones();
        
        if (typeof window.renderizar === 'function') {
            window.renderizar();
        }
    }, 1000);
    
    setInterval(() => {
        detectarCambios();
        actualizarBadgeNotificaciones();
    }, 30000);
}

// Exponer funciones
window.toggleNotificaciones = toggleNotificaciones;
window.cerrarNotificaciones = cerrarNotificaciones;
window.agregarNotificacion = agregarNotificacion;
window.initNotificaciones = initNotificaciones;
window.detectarCambios = detectarCambios;
window.mostrarNotificacionSuperior = mostrarNotificacionSuperior;
window.obtenerDatosAnime = obtenerDatosAnime;
