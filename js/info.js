// ============================================
// SISTEMA DE INFORMACIÓN - GA NIME
// ============================================

let informaciones = [];

// ===== ICONOS POR TIPO =====
const ICONOS_TIPO = {
    'info': 'fa-circle-info',
    'noticia': 'fa-newspaper',
    'proximos': 'fa-clock',
    'comunicado': 'fa-bullhorn'
};

const COLORES_TIPO = {
    'info': '#7c3aed',
    'noticia': '#2ecc71',
    'proximos': '#3498db',
    'comunicado': '#f39c12'
};

// ===== ESTILOS PARA EL CONTENIDO =====
const ESTILOS_CONTENIDO = {
    'titulo': 'font-size: 18px; font-weight: 700; color: #7c3aed; margin: 12px 0 4px 0;',
    'subtitulo': 'font-size: 15px; font-weight: 600; color: #a78bfa; margin: 8px 0 4px 0;',
    'destacado': 'font-weight: 700; color: #7c3aed;',
    'verde': 'font-weight: 700; color: #2ecc71;',
    'azul': 'font-weight: 700; color: #3498db;',
    'blanco': 'font-weight: 700; color: #fff;',
    'naranja': 'font-weight: 700; color: #f59e0b;',
    'rojo': 'font-weight: 700; color: #e74c3c;',
    'rosa': 'font-weight: 700; color: #ec4899;',
    'amarillo': 'font-weight: 700; color: #fbbf24;',
    'whatsapp': 'font-weight: 700; color: #25D366;',
    'texto': 'margin: 6px 0; line-height: 1.6;',
    'viñeta': 'padding-left: 20px; margin: 4px 0; line-height: 1.6;',
    'important': 'font-weight: bold; color: #39b400;',
    'centrado': 'text-align: center; margin: 6px 0;',
    'grande': 'font-size: 20px; font-weight: 700; margin: 8px 0;',
    'gris': 'color: #6a5f8a; font-size: 13px; margin: 4px 0;',
    'separador': 'border-bottom: 1px solid #2a1f4a; margin: 12px 0; padding-bottom: 4px;'
};

// ===== RENDERIZAR CONTENIDO =====
function renderizarContenido(contenido, totalAnimes) {
    return contenido.map(item => {
        // Si es un string (texto plano o línea vacía)
        if (typeof item === 'string') {
            if (item.includes('📚 Total de animes:')) {
                return `<p style="margin:6px 0; font-weight: 700; color: #2ecc71;">📚 Total de animes: ${totalAnimes}</p>`;
            }
            if (item === '') return '<br>';
            if (item.startsWith('•') || item.startsWith('   •')) {
                return `<p style="padding-left:20px;margin:4px 0;line-height:1.6;">${item}</p>`;
            }
            return `<p style="margin:6px 0;line-height:1.6;">${item}</p>`;
        }
        
        // Si es un objeto con estilo y texto
        if (typeof item === 'object' && item.texto) {
            let texto = item.texto;
            
            // Reemplazar {total} si existe
            if (texto.includes('{total}')) {
                texto = texto.replace(/\{total\}/g, totalAnimes);
            }
            
            const estilo = ESTILOS_CONTENIDO[item.estilo] || ESTILOS_CONTENIDO.texto;
            return `<p style="${estilo}">${texto}</p>`;
        }
        
        return '';
    }).join('');
}

// ===== CARGAR INFO DESDE info.json =====
function cargarInfo() {
    return fetch('js/info.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('No se pudo cargar info.json');
            }
            return response.json();
        })
        .then(data => {
            informaciones = data;
            
            informaciones.forEach((info, index) => {
                info.id = `info_${index + 1}`;
            });
            
            cargarEstadoLectura();
            actualizarContadorNoLeidos();
            
            return informaciones;
        })
        .catch(() => {
            informaciones = [{
                id: 'info_1',
                fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }),
                titulo: 'GaNime - Catálogo de Animes',
                tipo: 'info',
                anclado: true,
                contenido: [
                    { estilo: 'centrado', texto: 'Bienvenido a <b>GaNime</b>' },
                    { estilo: 'texto', texto: 'Este es un catálogo de animes, series, OVAs y películas.' }
                ],
                leido: false
            }];
            guardarEstadoLectura();
            actualizarContadorNoLeidos();
            return informaciones;
        });
}

// ===== CARGAR ESTADO DE LECTURA =====
function cargarEstadoLectura() {
    try {
        const guardado = localStorage.getItem('ganime_informaciones_leidas');
        if (guardado) {
            const leidas = JSON.parse(guardado);
            informaciones.forEach(info => {
                if (leidas.includes(info.id)) {
                    info.leido = true;
                }
            });
        }
    } catch (e) {
        console.warn('Error cargando estado de lectura:', e);
    }
}

// ===== GUARDAR ESTADO DE LECTURA =====
function guardarEstadoLectura() {
    try {
        const leidas = informaciones
            .filter(info => info.leido)
            .map(info => info.id);
        localStorage.setItem('ganime_informaciones_leidas', JSON.stringify(leidas));
    } catch (e) {
        console.warn('Error guardando estado de lectura:', e);
    }
}

// ===== ACTUALIZAR CONTADOR DE NO LEÍDOS =====
function actualizarContadorNoLeidos() {
    const noLeidas = informaciones.filter(info => !info.leido).length;
    const badge = document.querySelector('.info-btn .notif-dot') || document.getElementById('infoBadge');
    
    let badgeElement = badge;
    if (!badgeElement) {
        const infoBtn = document.querySelector('.info-btn');
        if (infoBtn) {
            badgeElement = document.createElement('span');
            badgeElement.className = 'notif-dot';
            badgeElement.id = 'infoBadge';
            infoBtn.appendChild(badgeElement);
        }
    }
    
    if (badgeElement) {
        if (noLeidas > 0) {
            badgeElement.style.display = 'block';
            badgeElement.textContent = noLeidas;
            badgeElement.style.fontSize = '9px';
            badgeElement.style.width = '18px';
            badgeElement.style.height = '18px';
            badgeElement.style.borderRadius = '50%';
            badgeElement.style.background = '#ff4757';
            badgeElement.style.color = 'white';
            badgeElement.style.display = 'flex';
            badgeElement.style.alignItems = 'center';
            badgeElement.style.justifyContent = 'center';
            badgeElement.style.fontWeight = 'bold';
            badgeElement.style.border = '2px solid var(--bg)';
            badgeElement.style.top = '-4px';
            badgeElement.style.right = '-4px';
            badgeElement.style.position = 'absolute';
        } else {
            badgeElement.style.display = 'none';
        }
    }
}

// ===== OBTENER TOTAL DE ANIMES =====
function obtenerTotalAnimes() {
    try {
        const rawAnimes = window.catalogoRaw || [];
        const total = rawAnimes.filter(a => !a.ocultar).length;
        return total;
    } catch (e) {
        return 0;
    }
}

// ===== TOGGLE PANEL =====
function toggleInfo() {
    const panel = document.getElementById('infoPanel');
    const backdrop = document.getElementById('infoBackdrop');
    const isOpen = panel.classList.contains('active');
    
    if (isOpen) {
        cerrarInfo();
    } else {
        if (informaciones.length === 0) {
            cargarInfo().then(() => {
                renderizarInfo();
            });
        } else {
            renderizarInfo();
        }
        panel.classList.add('active');
        backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        marcarTodasComoLeidas();
    }
}

function cerrarInfo() {
    document.getElementById('infoPanel').classList.remove('active');
    document.getElementById('infoBackdrop').classList.remove('active');
    document.body.style.overflow = '';
}

// ===== MARCAR TODAS COMO LEÍDAS =====
function marcarTodasComoLeidas() {
    let cambiado = false;
    informaciones.forEach(info => {
        if (!info.leido) {
            info.leido = true;
            cambiado = true;
        }
    });
    
    if (cambiado) {
        guardarEstadoLectura();
        actualizarContadorNoLeidos();
        if (document.getElementById('infoPanel').classList.contains('active')) {
            renderizarInfo();
        }
    }
}

// ===== MARCAR UNA INFO COMO LEÍDA =====
function marcarComoLeida(id) {
    const info = informaciones.find(i => i.id === id);
    if (info && !info.leido) {
        info.leido = true;
        guardarEstadoLectura();
        actualizarContadorNoLeidos();
        if (document.getElementById('infoPanel').classList.contains('active')) {
            renderizarInfo();
        }
    }
}

// ===== RENDERIZAR INFORMACIONES =====
function renderizarInfo() {
    const container = document.getElementById('infoContent');
    
    if (!informaciones || informaciones.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px 0;color:var(--text3);">
                <i class="fas fa-info-circle" style="font-size:48px;opacity:0.3;display:block;margin-bottom:16px;"></i>
                <p>No hay informaciones disponibles</p>
            </div>
        `;
        return;
    }
    
    const totalAnimes = obtenerTotalAnimes();
    
    // 🔥 Separar ancladas y no ancladas
    const ancladas = informaciones.filter(info => info.anclado === true);
    const noAncladas = informaciones.filter(info => info.anclado !== true);
    
    // Ordenar cada grupo por fecha
    const ordenarPorFecha = (arr) => {
        return [...arr].sort((a, b) => {
            const fechaA = a.fecha ? new Date(a.fecha.split('/').reverse().join('-')) : new Date(0);
            const fechaB = b.fecha ? new Date(b.fecha.split('/').reverse().join('-')) : new Date(0);
            return fechaB - fechaA;
        });
    };
    
    const ancladasOrdenadas = ordenarPorFecha(ancladas);
    const noAncladasOrdenadas = ordenarPorFecha(noAncladas);
    
    // 🔥 Combinar: ancladas primero, luego el resto
    const ordenadas = [...ancladasOrdenadas, ...noAncladasOrdenadas];
    
    let html = `<h2 style="font-size:20px;font-weight:700;margin-bottom:16px;background:var(--text-tema);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Informaciones</h2>`;
    
    ordenadas.forEach((info) => {
        const icono = ICONOS_TIPO[info.tipo] || 'fa-info-circle';
        const color = COLORES_TIPO[info.tipo] || 'var(--morado)';
        
        const contenidoProcesado = renderizarContenido(info.contenido, totalAnimes);
        
        let etiquetaTipo = '';
        switch (info.tipo) {
            case 'info':
                etiquetaTipo = 'Información';
                break;
            case 'noticia':
                etiquetaTipo = 'Noticia';
                break;
            case 'proximos':
                etiquetaTipo = 'Próximamente';
                break;
            case 'comunicado':
                etiquetaTipo = 'Comunicado';
                break;
            default:
                etiquetaTipo = 'Información';
        }
        
        // 🔥 Si está anclada, agregar badge "Anclado"
        const badgeAnclado = info.anclado ? `<span style="background: #7c3aed; color: #fff; padding: 1px 10px; border-radius: 12px; font-size: 9px; font-weight: 700; margin-left: 8px; text-transform: uppercase;"><i class="fas fa-thumbtack"></i> Anclado</span>` : '';
        
        html += `
            <div class="info-card ${!info.leido ? 'info-no-leida' : ''}" id="info-card-${info.id}" style="border-left-color: ${color};">
                <div class="info-card-header" onclick="toggleInfoCard('${info.id}')">
                    <div class="info-card-titulo">
                        ${!info.leido ? '<span class="info-punto-no-leido">●</span>' : ''}
                        <span class="info-icono" style="color: ${color};"><i class="fas ${icono}"></i></span>
                        <span class="info-titulo">${info.titulo}${badgeAnclado}</span>
                        <span class="info-etiqueta" style="background: ${color}; color: #ffffff;">${etiquetaTipo}</span>
                    </div>
                    <div class="info-card-meta">
                        <span class="info-fecha">${info.fecha || ''}</span>
                        <span class="info-toggle-icon"><i class="fas fa-chevron-down"></i></span>
                    </div>
                </div>
                <div class="info-card-body" id="info-body-${info.id}" style="display: none;">
                    <div class="info-contenido">${contenidoProcesado}</div>
                    ${!info.leido ? `
                        <button class="btn-marcar-leido" onclick="event.stopPropagation(); marcarComoLeida('${info.id}')">
                            <i class="fas fa-check"></i> Marcar como leído
                        </button>
                    ` : `
                        <div class="info-leido-badge"><i class="fas fa-check-circle"></i> Leído</div>
                    `}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    if (ordenadas.length > 0) {
        const primera = document.getElementById(`info-body-${ordenadas[0].id}`);
        if (primera) {
            primera.style.display = 'block';
            const icon = document.querySelector(`#info-card-${ordenadas[0].id} .info-toggle-icon i`);
            if (icon) {
                icon.style.transform = 'rotate(180deg)';
            }
        }
    }
}

// ===== TOGGLE EXPANDIR/COLAPSAR =====
function toggleInfoCard(id) {
    const body = document.getElementById(`info-body-${id}`);
    if (body) {
        const isVisible = body.style.display !== 'none';
        body.style.display = isVisible ? 'none' : 'block';
        
        const icon = document.querySelector(`#info-card-${id} .info-toggle-icon i`);
        if (icon) {
            icon.style.transition = 'transform 0.3s ease';
            icon.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    }
}

// ===== EXCLAMACIÓN =====
function exclamacion() {
    toggleInfo();
}

// ===== INICIALIZAR =====
document.addEventListener('DOMContentLoaded', () => {
    cargarInfo().then(() => {
        actualizarContadorNoLeidos();
    });
});

// Exponer funciones
window.toggleInfo = toggleInfo;
window.cerrarInfo = cerrarInfo;
window.cargarInfo = cargarInfo;
window.marcarComoLeida = marcarComoLeida;
window.marcarTodasComoLeidas = marcarTodasComoLeidas;
window.toggleInfoCard = toggleInfoCard;
window.exclamacion = exclamacion;
window.actualizarContadorNoLeidos = actualizarContadorNoLeidos;