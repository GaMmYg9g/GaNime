function ordenarPorSaga(arr) {
    return arr.sort((a, b) => {
        // 🔥 Usar sagaMadre para agrupar, si no existe usar saga
        const grupoA = a.sagaMadre || a.saga || a.nombre;
        const grupoB = b.sagaMadre || b.saga || b.nombre;
        
        // 🔥 Ordenar entre sagas madre (global)
        if (a.ordenSagaGlobal !== undefined && b.ordenSagaGlobal !== undefined) {
            if (a.ordenSagaGlobal !== b.ordenSagaGlobal) {
                return a.ordenSagaGlobal - b.ordenSagaGlobal;
            }
        }
        
        // Si los grupos son diferentes
        if (grupoA !== grupoB) {
            return grupoA.localeCompare(grupoB);
        }
        
        // 🔥 Orden dentro de la misma saga madre
        if (a.ordenSaga !== undefined && b.ordenSaga !== undefined) {
            if (a.ordenSaga !== b.ordenSaga) {
                return a.ordenSaga - b.ordenSaga;
            }
        }
        
        const añoA = a.año || 0;
        const añoB = b.año || 0;
        if (añoA !== añoB) {
            return añoA - añoB;
        }
        
        return a.nombre.localeCompare(b.nombre);
    });
}

let catalogo = ordenarPorSaga([...ANIMES]);
let catalogoOriginal = [...ANIMES];
window.catalogoRaw = [...ANIMES];
let carrito = [];
let modalIndex = -1;

// ===== REPRODUCTOR DE OPENINGS =====
let openingPlayer = null;
let openingActual = null;

function reproducirOpening(src) {
    if (openingPlayer) {
        openingPlayer.pause();
        openingPlayer.currentTime = 0;
    }
    
    if (!src) return;
    
    try {
        openingPlayer = new Audio(src);
        openingPlayer.volume = 0.3;
        openingPlayer.loop = true;
        openingPlayer.play().catch(() => {});
        openingActual = src;
    } catch (e) {}
}

function detenerOpening() {
    if (openingPlayer) {
        openingPlayer.pause();
        openingPlayer.currentTime = 0;
        openingPlayer = null;
        openingActual = null;
    }
}

// ============================================
// LAZY LOADING DE IMÁGENES
// ============================================

let lazyObserver = null;

function initLazyLoading() {
    if (!lazyObserver) {
        lazyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                        img.classList.add('loaded');
                    }
                    lazyObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '100px 0px',
            threshold: 0.01
        });
    }

    document.querySelectorAll('img[data-src]').forEach(img => {
        lazyObserver.observe(img);
    });
}

// ============================================
// OBTENER ESTADO Y CAPÍTULOS DEL ANIME
// ============================================

function obtenerEstadoAnime(item) {
    // Si es finalizada (no tiene estado o estado es finalizada)
    if (!item.estado || item.estado === 'finalizada') {
        return {
            estado: 'finalizada',
            label: 'Finalizada',
            capitulos: item.capitulos || '?',
            badgeColor: '#2ecc71',
            icono: 'fa-check-circle'
        };
    }
    
    // En Emisión
    if (item.estado === 'en-emision') {
        const totales = item.capitulosTotales;
        const actuales = item.capitulosActuales || 0;
        const mostrarTotal = totales ? totales : '?';
        const texto = `${actuales}/${mostrarTotal}`;
        
        if (totales && actuales && actuales >= totales) {
            return {
                estado: 'completado',
                label: 'Completado',
                capitulos: texto,
                badgeColor: '#2ecc71',
                icono: 'fa-flag-checkered'
            };
        }
        
        return {
            estado: 'en-emision',
            label: 'En Emisión',
            capitulos: texto,
            badgeColor: '#3498db',
            icono: 'fa-tv'
        };
    }
    
    // En Descarga
    if (item.estado === 'en-descarga') {
        const totales = item.capitulosTotales;
        const actuales = item.capitulosActuales || 0;
        const mostrarTotal = totales ? totales : '?';
        const texto = `${actuales}/${mostrarTotal}`;
        
        if (totales && actuales && actuales >= totales) {
            return {
                estado: 'completado',
                label: 'Completado',
                capitulos: texto,
                badgeColor: '#2ecc71',
                icono: 'fa-flag-checkered'
            };
        }
        
        return {
            estado: 'en-descarga',
            label: 'En Descarga',
            capitulos: texto,
            badgeColor: '#f39c12',
            icono: 'fa-download'
        };
    }
    
    // 🔥 NUEVO: Re-descarga
    if (item.estado === 're-descarga') {
        // Mostrar capítulos completos
        const texto = item.capitulos || item.capitulosTotales || '?';
        
        return {
            estado: 're-descarga',
            label: 'Re-descarga',
            capitulos: texto,
            badgeColor: '#8b5cf6',
            icono: 'fa-rotate'
        };
    }
    
        // 🔥 NUEVO: Pausa
    if (item.estado === 'en-pausa') {
        // Mostrar capítulos completos
        const texto = item.capitulos || item.capitulosTotales || '?';
        
        return {
            estado: 'en-pausa',
            label: 'En Pausa',
            capitulos: texto,
            badgeColor: '#ff1f00',
            icono: 'fa-pause-circle'
        };
    }
    
    // 🔥 NUEVO: Incompleta
    if (item.estado === 'incompleta') {
        const totales = item.capitulosTotales;
        const actuales = item.capitulosActuales || 0;
        const mostrarTotal = totales ? totales : '?';
        const texto = `${actuales}/${mostrarTotal}`;
        
        return {
            estado: 'incompleta',
            label: 'Incompleta',
            capitulos: texto,
            badgeColor: '#f97316',
            icono: 'fa-exclamation-triangle'
        };
    }
    
    return {
        estado: 'finalizada',
        label: 'Finalizada',
        capitulos: item.capitulos || '?',
        badgeColor: '#2ecc71',
        icono: 'fa-check-circle'
    };
}

// ============================================
// OBTENER INFO DE TEMPORADA/ARCO/PARTE
// ============================================

function obtenerInfoTemporada(item) {
    const tipo = item.tipo?.toLowerCase() || 'serie';
    
    // 🔥 Spin-off
    if (tipo === 'spin-off' || tipo === 'spin off') {
        return {
            label: 'Spin-off',
            actual: item.spinOffActual || 1,
            total: item.spinOffsTotales || 1,
            texto: (item.spinOffActual || 1) + '/' + (item.spinOffsTotales || 1),
            icono: 'fa-code-branch' // Rama
        };
    }
    
    // 🔥 OVA
    if (tipo === 'ova') {
        return {
            label: 'OVA',
            actual: item.ovaActual || 1,
            total: item.ovasTotales || 1,
            texto: (item.ovaActual || 1) + '/' + (item.ovasTotales || 1),
            icono: 'fa-compact-disc' // Disco
        };
    }
    
    // 🔥 ONA
    if (tipo === 'ona') {
        return {
            label: 'ONA',
            actual: item.onaActual || 1,
            total: item.onasTotales || 1,
            texto: (item.onaActual || 1) + '/' + (item.onasTotales || 1),
            icono: 'fa-globe' // Mundo
        };
    }
    
    // 🔥 Especial
    if (tipo === 'especial') {
        return {
            label: 'Especial',
            actual: item.especialActual || 1,
            total: item.especialesTotales || 1,
            texto: (item.especialActual || 1) + '/' + (item.especialesTotales || 1),
            icono: 'fa-star' // Estrella
        };
    }
    
    // 🔥 Película
    if (tipo === 'película' || tipo === 'pelicula') {
        return {
            label: 'Parte',
            actual: item.parteActual || 1,
            total: item.partesTotales || 1,
            texto: (item.parteActual || 1) + '/' + (item.partesTotales || 1),
            icono: 'fa-film' // Película
        };
    }
    
    // 🔥 Serie con arcos (Bleach, Naruto, etc.)
    if (item.arcosTotales || item.arcoActual) {
        return {
            label: 'Arco',
            actual: item.arcoActual || 1,
            total: item.arcosTotales || 1,
            texto: (item.arcoActual || 1) + '/' + (item.arcosTotales || 1),
            icono: 'fa-flag' // Bandera
        };
    }
    
    // 🔥 Serie con temporadas (por defecto)
    return {
        label: 'Temporada',
        actual: item.temporadaActual || 1,
        total: item.temporadasTotales || 1,
        texto: (item.temporadaActual || 1) + '/' + (item.temporadasTotales || 1),
        icono: 'fa-folder-open' // 📂 Carpeta (NUEVO)
    };
}

// ============================================
// BUSCADOR INTELIGENTE (ACTUALIZADO)
// ============================================

function buscarInteligente(item, query) {
    const s = query.toLowerCase().trim();
    if (!s) return true;
    
    const palabras = s.split(/\s+/);
    
    const todasLasPalabras = palabras.every(palabra => {
        const normalizada = palabra.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        // 🔥 Obtener TODOS los nombres (nombre, nombre2, nombre3, ...)
        const nombres = Object.keys(item)
            .filter(key => key.startsWith('nombre'))
            .map(key => item[key]?.toLowerCase() || '');
        
        const campos = [
            ...nombres,
            item.saga?.toLowerCase() || '',
            item.descripcion?.toLowerCase() || '',
            item.estudio?.toLowerCase() || '',
            item.creador?.toLowerCase() || '',
            item.tipo?.toLowerCase() || '',
            item.estado?.toLowerCase() || '',
            String(item.año || ''),
            ...(item.categorias || []).map(c => c.toLowerCase())
        ];
        
        const textoCompleto = campos.join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return textoCompleto.includes(normalizada) || 
               textoCompleto.includes(palabra);
    });
    
    return todasLasPalabras;
}

// ============================================
// MOSTRAR SUGERENCIAS (ACTUALIZADO)
// ============================================

function mostrarSugerencias(query) {
    const container = document.getElementById('searchSuggestions');
    const overlay = document.getElementById('searchOverlay');
    const s = query.toLowerCase().trim();
    
    if (s.length >= 1) {
        overlay.classList.add('active');
        document.getElementById('filtersContainer').style.display = 'none';
        document.getElementById('resultStats').style.display = 'none';
        document.getElementById('grid').style.display = 'none';
        document.getElementById('searchOverlayTitle').textContent = s.length < 2 ? 'Escribe algo relacionado con el anime...' : 'Buscando Anime...';
    } else {
        overlay.classList.remove('active');
        document.getElementById('filtersContainer').style.display = 'block';
        document.getElementById('resultStats').style.display = 'block';
        document.getElementById('grid').style.display = 'grid';
        container.innerHTML = '';
        return;
    }
    
    if (s.length < 2) {
        container.innerHTML = `
            <div class="suggestion-item no-results1">
                <i class="fas fa-search"></i> Escribe al menos 2 caracteres
            </div>
        `;
        return;
    }
    
    const resultados = catalogo.filter(item => buscarInteligente(item, s)).slice(0, );
    
    if (resultados.length === 0) {
        container.innerHTML = `
            <div class="suggestion-item no-results">
                <i class="fas fa-sad-tear"></i> No se encontraron resultados para "${query}"
            </div>
        `;
        return;
    }
    
    let html = '';
resultados.forEach(item => {
    const idx = catalogo.indexOf(item);
    let nombreDestacado = item.nombre;
    const regex = new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    nombreDestacado = nombreDestacado.replace(regex, match => `<strong>${match}</strong>`);

    // 🔥 Buscar el primer nombre alternativo que coincida con la búsqueda
    let nombreAlternativoCoincidente = '';
    const nombreKeys = Object.keys(item).filter(key => key.startsWith('nombre') && key !== 'nombre');
    for (const key of nombreKeys) {
        const valor = item[key];
        if (valor && typeof valor === 'string' && valor.toLowerCase().includes(s)) {
            nombreAlternativoCoincidente = valor;
            break;
        }
    }

    // Si se encontró un nombre alternativo, resaltar la parte que coincide
    let altHtml = '';
    if (nombreAlternativoCoincidente) {
        const altDestacado = nombreAlternativoCoincidente.replace(regex, match => `<span style="color: #a78bfa; font-weight: 600;">${match}</span>`);
        altHtml = `<div style="font-size:13px;color:var(--text2);margin-top:2px;">${altDestacado}</div>`;
    }

    const infoExtra = [];
    if (item.año) infoExtra.push(item.año);
    if (item.saga) infoExtra.push(item.saga);
    if (item.estadoo) infoExtra.puch(item.estado);
    if (item.tipo) infoExtra.push(item.tipo);

    const imgHtml = item.portada 
        ? `<img src="${item.portada}" alt="${item.nombre}" class="suggestion-img" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : `<div class="suggestion-img-placeholder"><i class="fas fa-film"></i></div>`;

    html += `
        <div class="suggestion-item" onclick="seleccionarSugerencia('${item.nombre.replace(/'/g, "\\'")}', ${idx})">
            ${imgHtml}
            <div class="suggestion-info">
                <span class="suggestion-name">${nombreDestacado}</span>
                ${altHtml}
                <span class="suggestion-details">${infoExtra.join(' · ')}</span>
            </div>
        </div>
    `;
});
    
    container.innerHTML = html;
}

function seleccionarSugerencia(nombre, idx) {
    document.getElementById('searchOverlay').classList.remove('active');
    document.getElementById('filtersContainer').style.display = 'block';
    document.getElementById('resultStats').style.display = 'block';
    document.getElementById('grid').style.display = 'grid';
    document.getElementById('searchSuggestions').innerHTML = '';
    
    document.getElementById('searchInput').value = nombre;
    document.getElementById('searchClear').style.display = 'flex';
    estadoFiltros.busqueda = nombre;
    
    renderizar();
    abrirModal(idx);
}

function limpiarBusqueda() {
    document.getElementById('searchInput').value = '';
    document.getElementById('searchOverlay').classList.remove('active');
    document.getElementById('filtersContainer').style.display = 'block';
    document.getElementById('resultStats').style.display = 'block';
    document.getElementById('grid').style.display = 'grid';
    document.getElementById('searchSuggestions').innerHTML = '';
    document.getElementById('searchClear').style.display = 'none';
    estadoFiltros.busqueda = '';
    renderizar();
}

// ============================================
// ESTADO DE FILTROS
// ============================================

let estadoFiltros = {
    tipo: 'todos',
    busqueda: '',
    orden: 'saga',
    modoRecientes: 'recientes'
};

function cargarCarrito() {
    const guardado = localStorage.getItem('carrito_ganime');
    if (guardado) {
        try {
            carrito = JSON.parse(guardado);
        } catch (e) {
            carrito = [];
        }
    } else {
        carrito = [];
    }
}

function guardarCarrito() {
    localStorage.setItem('carrito_ganime', JSON.stringify(carrito));
}

function estaEnCarrito(idx) {
    return carrito.some(c => c.idx === idx);
}

function getStars(val) {
    if (!val || val <= 0) return '☆☆☆☆☆';
    
    const totalStars = 5;
    const starValue = val / 2;
    const fullStars = Math.floor(starValue);
    const partialStar = starValue - fullStars;
    const emptyStars = totalStars - fullStars - (partialStar > 0 ? 1 : 0);
    
    let html = '';
    
    for (let i = 0; i < fullStars; i++) {
        html += `<span class="star-full">★</span>`;
    }
    
    if (partialStar > 0) {
        const percent = Math.round(partialStar * 100);
        html += `<span class="star-partial" style="background: linear-gradient(90deg, #fbbf24 ${percent}%, #4a4a5a ${percent}%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: inline-block;">★</span>`;
    }
    
    for (let i = 0; i < emptyStars; i++) {
        html += `<span class="star-empty">☆</span>`;
    }
    
    return html;
}

function ordenarPorRecientes(arr, modo = 'recientes') {
    const ordenOriginal = [...catalogoOriginal];
    
    if (modo === 'recientes') {
        return arr.sort((a, b) => {
            const idxA = ordenOriginal.indexOf(a);
            const idxB = ordenOriginal.indexOf(b);
            return idxB - idxA;
        });
    } else {
        return arr.sort((a, b) => {
            const idxA = ordenOriginal.indexOf(a);
            const idxB = ordenOriginal.indexOf(b);
            return idxA - idxB;
        });
    }
}

function ordenarAlfabeticamente(arr, reverse = false) {
    return arr.sort((a, b) => {
        const nombreA = a.nombre.toLowerCase();
        const nombreB = b.nombre.toLowerCase();
        
        const esSimboloA = /^[^a-z0-9]/.test(nombreA);
        const esSimboloB = /^[^a-z0-9]/.test(nombreB);
        const esNumeroA = /^[0-9]/.test(nombreA);
        const esNumeroB = /^[0-9]/.test(nombreB);
        
        if (esSimboloA && !esSimboloB) return reverse ? 1 : -1;
        if (!esSimboloA && esSimboloB) return reverse ? -1 : 1;
        if (esNumeroA && !esNumeroB) return reverse ? 1 : -1;
        if (!esNumeroA && esNumeroB) return reverse ? -1 : 1;
        
        return reverse ? nombreB.localeCompare(nombreA) : nombreA.localeCompare(nombreB);
    });
}

function ordenarPorFecha(arr, asc = true) {
    return arr.sort((a, b) => {
        const añoA = a.año || 0;
        const añoB = b.año || 0;
        if (añoA !== añoB) {
            return asc ? añoA - añoB : añoB - añoA;
        }
        return a.nombre.localeCompare(b.nombre);
    });
}

function ordenarPorPuntuacion(arr, desc = true) {
    return arr.sort((a, b) => {
        const valA = a.valoracion || 0;
        const valB = b.valoracion || 0;
        if (desc) {
            return valB - valA;
        } else {
            return valA - valB;
        }
    });
}

function aplicarFiltros(items) {
    let result = [...items];
    
    if (estadoFiltros.busqueda) {
        result = result.filter(item => buscarInteligente(item, estadoFiltros.busqueda));
    }
    
    if (estadoFiltros.tipo !== 'todos') {
        result = result.filter(i => i.tipo === estadoFiltros.tipo);
    }
    
    switch (estadoFiltros.orden) {
        case 'recientes':
            result = ordenarPorRecientes(result, estadoFiltros.modoRecientes);
            break;
        case 'az':
            result = ordenarAlfabeticamente(result, false);
            break;
        case 'za':
            result = ordenarAlfabeticamente(result, true);
            break;
        case 'fecha-asc':
            result = ordenarPorFecha(result, true);
            break;
        case 'fecha-desc':
            result = ordenarPorFecha(result, false);
            break;
        case 'puntuacion-desc':
            result = ordenarPorPuntuacion(result, true);
            break;
        case 'puntuacion-asc':
            result = ordenarPorPuntuacion(result, false);
            break;
        case 'saga':
        default:
            result = ordenarPorSaga(result);
            break;
    }
    
    return result;
}

function renderizar() {
    let items = aplicarFiltros(catalogo);
    
    // 🔥 Ocultar animes con ocultar: true
    items = items.filter(item => !item.ocultar);

    const grid = document.getElementById('grid');
    const resultStats = document.getElementById('resultStats');
    
    const totalItems = catalogo.filter(a => !a.ocultar).length;
    if (resultStats) {
        if (estadoFiltros.busqueda) {
            resultStats.textContent = `🔍 ${items.length} resultados de ${totalItems} animes`;
            resultStats.style.display = 'block';
        } else {
            resultStats.textContent = `📂 ${totalItems} animes en el catálogo`;
            resultStats.style.display = 'block';
        }
    }
    
    if (items.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--text3);"><i class="fas fa-search" style="font-size:40px;opacity:0.3;display:block;margin-bottom:16px;"></i><p>No se encontraron resultados</p></div>`;
        return;
    }

    let html = '';
    
    items.forEach((item, idx) => {
        const realIdx = catalogo.indexOf(item);
        const stars = getStars(item.valoracion);
        const tieneDescarga = item.enlaceDescarga && item.enlaceDescarga !== '#';
        const enCarrito = estaEnCarrito(realIdx);
        const colorAnime = item.color || '#7c3aed';
        const cardBg = item.cardBg || '#14102a';
        
        // 🔥 Obtener estado del anime
        const estadoInfo = obtenerEstadoAnime(item);
        
        // 🔥 Obtener info de temporada/arco/parte
        const infoTemp = obtenerInfoTemporada(item);
        
        html += `
            <div class="card" data-idx="${realIdx}" onclick="abrirModal(${realIdx})" style="--color-anime: ${colorAnime}; --card-bg: ${cardBg};">
                <div class="card-img" style="background: ${colorAnime}; background: linear-gradient(135deg, ${colorAnime}dd, ${colorAnime}55);">
                    ${item.portada ? `<img data-src="${item.portada}" alt="${item.nombre}" loading="lazy" onload="this.classList.add('loaded')" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
                    <i class="fas fa-film placeholder" style="${item.portada ? 'display:none;' : ''}"></i>
                    <!-- BADGE TIPO (arriba izquierda) -->
                    <span class="card-badge">${item.tipo || 'Serie'}</span>
                    <!-- BADGE ESTADO (arriba derecha) -->
                    <span class="card-estado-badge" style="position: absolute; top: 8px; right: 8px; background: ${estadoInfo.badgeColor}; color: #fff; padding: 2px 10px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; z-index: 3; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.15);">
                        <i class="fas ${estadoInfo.icono}" style="margin-right: 4px; font-size: 8px;"></i> ${estadoInfo.label}
                    </span>
                    <div class="card-rating"><span class="stars">${stars}</span> ${item.valoracion?.toFixed(1) || '?'}</div>
                </div>
                <div class="card-body" style="background: ${cardBg};">
                    <div class="card-title" style="color: ${colorAnime};">${item.nombre}</div>
                    <div class="card-meta">
                        <span class="card-tipo" style="background: ${colorAnime}; color: ${cardBg};">${item.tipo || 'Serie'}</span>
                        <span style="color: ${colorAnime};">${item.año}</span>
                    </div>
                    <div class="card-actions">
                        <button class="btn-pedir ${enCarrito ? 'btn-agregado' : ''}" onclick="event.stopPropagation(); agregarCarrito(${realIdx})">
                            <i class="fas ${enCarrito ? 'fa-check' : 'fa-cart-plus'}"></i> ${enCarrito ? 'Añadida' : 'Añadir'}
                        </button>
                        ${tieneDescarga ? `
                            <a href="${item.enlaceDescarga}" target="_blank" class="btn-descarga" onclick="event.stopPropagation();" style="color: ${colorAnime}; border-color: ${colorAnime};">
                                <i class="fas fa-download"></i>
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    grid.innerHTML = html;
    
    setTimeout(initLazyLoading, 50);
    
    const totalNumber = document.getElementById('totalNumber');
    if (totalNumber) totalNumber.textContent = catalogo.filter(a => !a.ocultar).length;
}

function filtrar() {
    const input = document.getElementById('searchInput');
    const valor = input.value;
    estadoFiltros.busqueda = valor;
    
    const clearBtn = document.getElementById('searchClear');
    if (clearBtn) {
        clearBtn.style.display = valor.length > 0 ? 'flex' : 'none';
    }
    
    mostrarSugerencias(valor);
    
    if (!valor || valor.length === 0) {
        renderizar();
    }
}

function resetearChips() {
    document.querySelectorAll('.filter-chip').forEach(c => {
        c.classList.remove('active');
        if (c.dataset.filter === 'recientes') {
            c.textContent = 'Recientes';
        }
        if (c.dataset.filter === 'orden') {
            c.textContent = 'Ordenar #-Z';
        }
        if (c.dataset.filter === 'fecha') {
            c.textContent = 'Año ↑';
        }
        if (c.dataset.filter === 'puntuacion') {
            c.textContent = '⭐ ↓';
        }
    });
    const todosChip = document.querySelector('.filter-chip[data-filter="todos"]');
    if (todosChip) todosChip.classList.add('active');
}

function handleChipClick(chip) {
    const filter = chip.dataset.filter;
    const value = chip.dataset.value;
    
    const isActive = chip.classList.contains('active');
    
    // ===== CHIPS CON MÚLTIPLES ESTADOS (Recientes, Orden, Fecha, Puntuación) =====
    if (filter === 'recientes' || filter === 'orden' || filter === 'fecha' || filter === 'puntuacion') {
        if (isActive) {
            // Cambiar al siguiente estado
            switch (filter) {
                case 'recientes':
                    if (estadoFiltros.modoRecientes === 'recientes') {
                        estadoFiltros.modoRecientes = 'antiguas';
                        chip.textContent = 'Antiguas';
                    } else {
                        estadoFiltros.modoRecientes = 'recientes';
                        chip.textContent = 'Recientes';
                    }
                    estadoFiltros.orden = 'recientes';
                    estadoFiltros.tipo = 'todos';
                    break;
                    
                case 'orden':
                    if (estadoFiltros.orden === 'az') {
                        estadoFiltros.orden = 'za';
                        chip.textContent = 'Z-#';
                    } else {
                        estadoFiltros.orden = 'az';
                        chip.textContent = 'Ordenar #-Z';
                    }
                    estadoFiltros.tipo = 'todos';
                    break;
                    
                case 'fecha':
                    if (estadoFiltros.orden === 'fecha-asc') {
                        estadoFiltros.orden = 'fecha-desc';
                        chip.textContent = 'Año ↓';
                    } else {
                        estadoFiltros.orden = 'fecha-asc';
                        chip.textContent = 'Año ↑';
                    }
                    estadoFiltros.tipo = 'todos';
                    break;
                    
                case 'puntuacion':
                    if (estadoFiltros.orden === 'puntuacion-desc') {
                        estadoFiltros.orden = 'puntuacion-asc';
                        chip.textContent = '⭐ ↑';
                    } else {
                        estadoFiltros.orden = 'puntuacion-desc';
                        chip.textContent = '⭐ ↓';
                    }
                    estadoFiltros.tipo = 'todos';
                    break;
            }
        } else {
            // Activar el chip
            resetearChips();
            chip.classList.add('active');
            
            switch (filter) {
                case 'recientes':
                    estadoFiltros.tipo = 'todos';
                    estadoFiltros.modoRecientes = 'recientes';
                    estadoFiltros.orden = 'recientes';
                    chip.textContent = 'Recientes';
                    break;
                    
                case 'orden':
                    estadoFiltros.tipo = 'todos';
                    estadoFiltros.orden = 'az';
                    chip.textContent = 'Ordenar #-Z';
                    break;
                    
                case 'fecha':
                    estadoFiltros.tipo = 'todos';
                    estadoFiltros.orden = 'fecha-asc';
                    chip.textContent = 'Año ↑';
                    break;
                    
                case 'puntuacion':
                    estadoFiltros.tipo = 'todos';
                    estadoFiltros.orden = 'puntuacion-desc';
                    chip.textContent = '⭐ ↓';
                    break;
            }
        }
        filtrar();
        return;
    }
    
    // ===== CHIPS DE TIPO (Series, Películas, OVAs, Especiales, ONAs) =====
    if (filter === 'tipo') {
        // Si el chip ya está activo, NO hacer nada (se mantiene el filtro)
        if (isActive) {
            return;
        }
        
        // Activar este chip y desactivar los demás
        resetearChips();
        chip.classList.add('active');
        estadoFiltros.tipo = value;
        estadoFiltros.orden = 'saga';
        estadoFiltros.modoRecientes = 'recientes';
        filtrar();
        return;
    }
    
    // ===== CHIP "TODOS" =====
    if (filter === 'todos') {
        resetearChips();
        chip.classList.add('active');
        estadoFiltros.tipo = 'todos';
        estadoFiltros.orden = 'saga';
        estadoFiltros.modoRecientes = 'recientes';
        filtrar();
        return;
    }
}

function initChips() {
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', function(e) {
            e.stopPropagation();
            handleChipClick(this);
        });
    });
}

function abrirModal(idx) {
    modalIndex = idx;
    const item = catalogo[idx];
    if (!item) return;

    if (item.opening) {
        reproducirOpening(item.opening);
    }

    const stars = getStars(item.valoracion);
    const generos = item.categorias ? item.categorias.map(g => `<span class="modal-genre">${g}</span>`).join('') : '';
    const tieneDescarga = item.enlaceDescarga && item.enlaceDescarga !== '#';
    const enCarrito = estaEnCarrito(idx);
    const colorAnime = item.color || '#7c3aed';
    const cardBg = item.cardBg || '#14102a';

    const tamañoPorCapitulo = item.tamañoPorCapitulo || '';
    const tamañoTotal = item.tamañoTotal || '';
    
    const tamañoPorCapituloHtml = tamañoPorCapitulo ? `
        <div class="modal-data-item">
            <span class="label">Peso capítulo</span>
            <span class="value">${tamañoPorCapitulo}</span>
        </div>
    ` : '';
    
    const tamañoTotalHtml = tamañoTotal ? `
        <div class="modal-data-item">
            <span class="label">Peso total</span>
            <span class="value">${tamañoTotal}</span>
        </div>
    ` : '';
    
    // 🔥 Obtener estado del anime
    const estadoInfo = obtenerEstadoAnime(item);
    
    // 🔥 Obtener info de temporada/arco/parte
    const infoTemp = obtenerInfoTemporada(item);

    document.getElementById('modalContent').innerHTML = `
        <div class="modal" style="--color-anime: ${colorAnime}; --card-bg: ${cardBg};">
            <button class="modal-close" onclick="cerrarModal()"><i class="fas fa-times"></i></button>
            
            <div class="modal-img" style="background: ${colorAnime}; background: linear-gradient(135deg, ${colorAnime}dd, ${colorAnime}55);">
                ${item.portada ? `<img data-src="${item.portada}" alt="${item.nombre}" onerror="this.style.display='none'">` : ''}
                <!-- BADGE DE ESTADO EN LA IMAGEN -->
                <span class="modal-estado-badge" style="position: absolute; bottom: 16px; left: 16px; background: ${estadoInfo.badgeColor}; color: #fff; padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; z-index: 3; backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.15);">
                    <i class="fas ${estadoInfo.icono}" style="margin-right: 6px;"></i> ${estadoInfo.label}
                </span>
            </div>
            
            <div class="modal-body-content" style="background: ${cardBg};">
                <h2 class="modal-title">${item.nombre}</h2>
                
                <div class="modal-badges-top">
                    <span class="modal-badge modal-badge-rating">
                        <span class="stars">${stars}</span>
                        <span class="score">${item.valoracion?.toFixed(1) || '?'}</span>
                    </span>
                    <span class="modal-badge">
                        <i class="fas fa-tag"></i> ${item.tipo || 'Serie'}
                    </span>
                    ${item.saga ? `<span class="modal-badge"><i class="fas fa-layer-group"></i> ${item.saga}</span>` : ''}
                    ${item.año ? `<span class="modal-badge"><i class="fas fa-calendar"></i> ${item.año}</span>` : ''}
                    <!-- 🔥 NUEVO: Badge de temporada/arco/parte -->
                    <span class="modal-badge" style="border-color: ${colorAnime};">
                        <i class="fas ${infoTemp.icono || 'fa-layer-group'}"></i> ${infoTemp.label}: ${infoTemp.texto}
                    </span>
                </div>
                
                <div class="modal-data-grid">
                    ${item.estudio ? `<div class="modal-data-item"><span class="label">Estudio</span><span class="value">${item.estudio}</span></div>` : ''}
                    ${item.capitulos || item.capitulosTotales ? `<div class="modal-data-item"><span class="label">Episodios</span><span class="value">${estadoInfo.capitulos}</span></div>` : ''}
                    ${item.duracion ? `<div class="modal-data-item"><span class="label">Duración</span><span class="value">${item.duracion}</span></div>` : ''}
                    ${item.creador ? `<div class="modal-data-item"><span class="label">Creador</span><span class="value">${item.creador}</span></div>` : ''}
                    ${item.audio ? `<div class="modal-data-item"><span class="label">Audio</span><span class="value">${item.audio}</span></div>` : ''}
                    ${item.subtitulos ? `<div class="modal-data-item"><span class="label">Subtítulos</span><span class="value">${item.subtitulos}</span></div>` : ''}
                    ${item.calidad ? `<div class="modal-data-item"><span class="label">Calidad</span><span class="value">${item.calidad}</span></div>` : ''}
                    ${tamañoPorCapituloHtml}
                    ${tamañoTotalHtml}
                </div>
                
                ${generos ? `<div class="modal-genres">${generos}</div>` : ''}
                
                <div class="modal-sinopsis">${item.descripcion || 'Sin descripción disponible.'}</div>
                
                <div class="modal-actions">
                    <button class="btn-pedir-modal ${enCarrito ? 'btn-agregado' : ''}" onclick="agregarCarrito(${idx});cerrarModal();">
                        <i class="fas ${enCarrito ? 'fa-check' : 'fa-cart-plus'}"></i> ${enCarrito ? 'Añadida' : 'Añadir'}
                    </button>
                    ${tieneDescarga ? `
                        <a href="${item.enlaceDescarga}" target="_blank" class="btn-descarga-modal">
                            <i class="fas fa-download"></i> Descargar
                        </a>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    const modalImg = document.querySelector('.modal-img img');
    if (modalImg && modalImg.dataset.src) {
        modalImg.src = modalImg.dataset.src;
        modalImg.removeAttribute('data-src');
        modalImg.classList.add('loaded');
    }

    document.getElementById('modalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
    detenerOpening();
    
    renderizar();
}

function agregarCarrito(idx) {
    const item = catalogo[idx];
    if (!item) return;
    
    const existente = carrito.find(c => c.idx === idx);
    if (existente) {
        toast(`${item.nombre} ya está en el carrito`);
        return;
    }
    
    const peso = item.tamañoTotal || '';
    
    let imgElement = document.querySelector(`.card[data-idx="${idx}"] .card-img img`);
    if (!imgElement) {
        imgElement = document.querySelector('.modal-img img');
    }
    
    if (imgElement) {
        const rect = imgElement.getBoundingClientRect();
        const flyer = document.createElement('img');
        flyer.src = imgElement.src;
        flyer.className = 'flying-item';
        flyer.style.left = rect.left + 'px';
        flyer.style.top = rect.top + 'px';
        flyer.style.width = rect.width + 'px';
        flyer.style.height = rect.height + 'px';
        document.body.appendChild(flyer);
        
        const cartBtn = document.querySelector('.cart-btn');
        const cartRect = cartBtn.getBoundingClientRect();
        
        const startX = rect.left;
        const startY = rect.top;
        const endX = cartRect.left + cartRect.width / 2 - 25;
        const endY = cartRect.top + cartRect.height / 2 - 35;
        
        const startW = rect.width;
        const startH = rect.height;
        const endW = 30;
        const endH = 42;
        
        const duration = 800;
        const startTime = performance.now();
        
        function animateFly(time) {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = t => t * t * (3 - 2 * t);
            const p = ease(progress);
            
            const x = startX + (endX - startX) * p;
            const y = startY + (endY - startY) * p - 120 * Math.sin(p * Math.PI);
            const w = startW + (endW - startW) * p;
            const h = startH + (endH - startH) * p;
            const rotation = 540 * p;
            
            flyer.style.left = x + 'px';
            flyer.style.top = y + 'px';
            flyer.style.width = w + 'px';
            flyer.style.height = h + 'px';
            flyer.style.transform = `rotate(${rotation}deg)`;
            flyer.style.opacity = 1 - p * 0.3;
            
            if (progress < 1) {
                requestAnimationFrame(animateFly);
            } else {
                flyer.remove();
                
                cartBtn.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                cartBtn.style.transform = 'scale(1.4)';
                cartBtn.style.boxShadow = '0 0 40px rgba(124, 58, 237, 0.6)';
                
                setTimeout(() => {
                    cartBtn.style.transform = 'scale(1)';
                    cartBtn.style.boxShadow = 'none';
                }, 400);
                
                for (let i = 0; i < 20; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'particle';
                    const angle = (i / 20) * Math.PI * 2 + Math.random() * 0.3;
                    const distance = 30 + Math.random() * 40;
                    const size = 4 + Math.random() * 8;
                    particle.style.left = (cartRect.left + cartRect.width / 2 + Math.cos(angle) * distance) + 'px';
                    particle.style.top = (cartRect.top + cartRect.height / 2 + Math.sin(angle) * distance) + 'px';
                    particle.style.width = size + 'px';
                    particle.style.height = size + 'px';
                    particle.style.background = ['#7c3aed', '#a78bfa', '#fbbf24', '#ff4757', '#ffffff'][Math.floor(Math.random() * 5)];
                    document.body.appendChild(particle);
                    setTimeout(() => particle.remove(), 700);
                }
                
                const badge = document.querySelector('.cart-badge');
                if (badge) {
                    badge.style.transition = 'transform 0.2s ease';
                    badge.style.transform = 'scale(1.5)';
                    badge.style.background = '#ff4757';
                    setTimeout(() => {
                        badge.style.transform = 'scale(1)';
                        badge.style.background = 'var(--morado)';
                    }, 300);
                }
            }
        }
        
        requestAnimationFrame(animateFly);
    }
    
    carrito.push({ 
        idx: idx, 
        nombre: item.nombre, 
        tipo: item.tipo || 'Serie',
        portada: item.portada || '',
        peso: peso
    });
    
    guardarCarrito();
    actualizarCarrito();
    renderizar();
    
    setTimeout(() => {
        toast(`${item.nombre} agregado al carrito`);
        if (typeof reproducirSonido === 'function') {
            reproducirSonido('agregar');
        }
    }, 400);
}

function quitarCarrito(id) {
    carrito = carrito.filter(c => c.idx !== id);
    guardarCarrito();
    actualizarCarrito();
    renderizar();
}

function eliminarCarrito(id) {
    const item = carrito.find(c => c.idx === id);
    if (!item) return;
    
    const cartItems = document.querySelectorAll('.cart-item');
    let targetElement = null;
    cartItems.forEach(el => {
        if (el.dataset.idx == id) {
            targetElement = el;
        }
    });
    
    if (targetElement) {
        const img = targetElement.querySelector('.cart-item-img');
        const rect = targetElement.getBoundingClientRect();
        
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        targetElement.style.transition = 'all 0.5s ease';
        targetElement.style.opacity = '0';
        targetElement.style.transform = 'scale(0.8)';
        
        for (let i = 0; i < 25; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            const angle = Math.random() * Math.PI * 2;
            const distance = 60 + Math.random() * 100;
            const size = 4 + Math.random() * 10;
            particle.style.left = (centerX + Math.cos(angle) * distance) + 'px';
            particle.style.top = (centerY + Math.sin(angle) * distance) + 'px';
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.background = ['#7c3aed', '#a78bfa', '#fbbf24', '#ff4757', '#e74c3c'][Math.floor(Math.random() * 5)];
            particle.style.animationDuration = (0.4 + Math.random() * 0.6) + 's';
            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 1000);
        }
        
        if (img) {
            const imgRect = img.getBoundingClientRect();
            const flyer = document.createElement('img');
            flyer.src = img.src;
            flyer.className = 'flying-item';
            flyer.style.left = imgRect.left + 'px';
            flyer.style.top = imgRect.top + 'px';
            flyer.style.width = imgRect.width + 'px';
            flyer.style.height = imgRect.height + 'px';
            document.body.appendChild(flyer);
            
            const endX = imgRect.left + (Math.random() - 0.5) * 200;
            const endY = imgRect.top - 200 - Math.random() * 200;
            
            const startTime = performance.now();
            const duration = 600;
            
            function animateRemove(time) {
                const elapsed = time - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const ease = t => t * t * (3 - 2 * t);
                const p = ease(progress);
                
                const x = imgRect.left + (endX - imgRect.left) * p;
                const y = imgRect.top + (endY - imgRect.top) * p - 100 * Math.sin(p * Math.PI);
                const rot = 360 * p;
                const sc = 1 - p * 0.5;
                
                flyer.style.left = x + 'px';
                flyer.style.top = y + 'px';
                flyer.style.transform = `scale(${sc}) rotate(${rot}deg)`;
                flyer.style.opacity = 1 - p;
                
                if (progress < 1) {
                    requestAnimationFrame(animateRemove);
                } else {
                    flyer.remove();
                }
            }
            requestAnimationFrame(animateRemove);
        }
        
        setTimeout(() => {
            carrito = carrito.filter(c => c.idx !== id);
            guardarCarrito();
            actualizarCarrito();
            renderizar();
            toast('Serie eliminada');
            if (typeof reproducirSonido === 'function') {
                reproducirSonido('eliminar');
            }
        }, 500);
        
    } else {
        carrito = carrito.filter(c => c.idx !== id);
        guardarCarrito();
        actualizarCarrito();
        renderizar();
        toast('Serie eliminada');
        if (typeof reproducirSonido === 'function') {
            reproducirSonido('eliminar');
        }
    }
}

function vaciarCarrito() {
    if (carrito.length === 0) {
        toast('El carrito ya está vacío');
        return;
    }
    
    const container = document.getElementById('cartItems');
    const items = container.querySelectorAll('.cart-item');
    
    const numParticles = 80;
    for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const angle = Math.random() * Math.PI * 2;
        const distance = 100 + Math.random() * 300;
        const size = 4 + Math.random() * 14;
        particle.style.left = (window.innerWidth / 2 + Math.cos(angle) * distance) + 'px';
        particle.style.top = (window.innerHeight / 2 + Math.sin(angle) * distance) + 'px';
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.background = ['#7c3aed', '#a78bfa', '#fbbf24', '#ff4757', '#e74c3c', '#ffffff', '#00ff88'][Math.floor(Math.random() * 7)];
        particle.style.animationDuration = (0.5 + Math.random() * 0.8) + 's';
        particle.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 1500);
    }
    
    items.forEach((el, i) => {
        setTimeout(() => {
            el.style.transition = 'all 0.4s ease';
            el.style.opacity = '0';
            el.style.transform = `translateX(${100 + i * 30}px) rotate(${i * 20}deg) scale(0.5)`;
        }, i * 80);
    });
    
    setTimeout(() => {
        carrito = [];
        guardarCarrito();
        actualizarCarrito();
        renderizar();
        toast('Carrito vaciado');
        if (typeof reproducirSonido === 'function') {
            reproducirSonido('vaciar');
        }
    }, 600 + items.length * 80);
}

function actualizarCarrito() {
    const total = carrito.length;
    const cartCount = document.getElementById('cartCount');
    if (cartCount) cartCount.textContent = total;
    
    let pesoTotal = 0;
    carrito.forEach(c => {
        if (c.peso) {
            const pesoNum = parseFloat(c.peso.replace(/[^0-9.,]/g, '').replace(',', '.'));
            if (!isNaN(pesoNum)) pesoTotal += pesoNum;
        }
    });
    const pesoTotalStr = pesoTotal > 0 ? `${pesoTotal.toFixed(2)} GB` : '0 GB';

    const container = document.getElementById('cartItems');
    if (!container) return;

    if (carrito.length === 0) {
        container.innerHTML = `<div class="cart-empty"><i class="fas fa-shopping-cart"></i><p>Sin pedidos</p></div>`;
        const pesoLine = document.getElementById('cartPesoLine');
        const pesoTotalEl = document.getElementById('cartPesoTotal');
        
        if (pesoLine) pesoLine.style.display = 'none';
        if (pesoTotalEl) pesoTotalEl.textContent = '0 GB';
        return;
    }

    container.innerHTML = carrito.map(c => {
        const item = catalogo[c.idx];
        const portada = item?.portada || '';
        const peso = c.peso || '';
        const pesoStr = peso ? ` · ${peso}` : '';
        return `
            <div class="cart-item" data-idx="${c.idx}" onclick="window.abrirModalDesdeCarrito(${c.idx})">
                <div class="cart-item-left">
                    ${portada ? `<img src="${portada}" alt="${c.nombre}" class="cart-item-img" onerror="this.style.display='none'">` : `<div class="cart-item-img-placeholder"><i class="fas fa-film"></i></div>`}
                    <div class="cart-item-info">
                        <div class="cart-item-name">${c.nombre}</div>
                        <div class="cart-item-type">${c.tipo} ${pesoStr}</div>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="event.stopPropagation(); window.eliminarCarrito(${c.idx})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
    
    const pesoLine = document.getElementById('cartPesoLine');
    const pesoTotalEl = document.getElementById('cartPesoTotal');
    
    if (pesoLine && pesoTotalEl) {
        pesoLine.style.display = 'flex';
        pesoTotalEl.textContent = pesoTotalStr;
    }
}

function abrirModalDesdeCarrito(idx) {
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('cartBackdrop').classList.remove('active');
    document.body.style.overflow = 'auto';
    abrirModal(idx);
}

function toggleCarrito() {
    document.getElementById('cartSidebar').classList.toggle('active');
    document.getElementById('cartBackdrop').classList.toggle('active');
    document.body.style.overflow = document.getElementById('cartSidebar').classList.contains('active') ? 'hidden' : 'auto';
}

function enviarWhatsApp() {
    if (carrito.length === 0) {
        toast('Sin pedidos');
        return;
    }
    
    let pesoTotal = 0;
    
    let msg = '=== PEDIDO - GaNime ===\n\n';
    
    carrito.forEach((c, i) => {
        const item = catalogo[c.idx];
        
        if (c.peso) {
            const pesoNum = parseFloat(c.peso.replace(/[^0-9.,]/g, '').replace(',', '.'));
            if (!isNaN(pesoNum)) pesoTotal += pesoNum;
        }
        
        msg += `${i+1}. ${c.nombre}\n`;
        msg += `   Tipo: ${c.tipo || 'Serie'}\n`;
        if (item?.saga) msg += `   Saga: ${item.saga}\n`;
        if (c.peso) msg += `   Peso: ${c.peso}\n`;
        msg += '\n';
    });
    
    const pesoTotalStr = pesoTotal > 0 ? `${pesoTotal.toFixed(2)} GB` : '0 GB';
    
    msg += '--- RESUMEN ---\n';
    msg += `Total de animes: ${carrito.length}\n`;
    msg += `Peso total: ${pesoTotalStr}\n\n`;
    msg += 'Gracias por tu pedido!';
    
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
    
    setTimeout(() => {
        carrito = [];
        guardarCarrito();
        actualizarCarrito();
        renderizar();
        toast('Pedido enviado. Carrito vaciado');
    }, 1000);
}

function toast(msg) {
    const el = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    el.classList.add('show');
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.classList.remove('show'), 2500);
}

window.recargarCatalogo = function() {
    catalogo = ordenarPorSaga([...ANIMES]);
    catalogoOriginal = [...ANIMES];
    window.catalogoRaw = [...ANIMES];
    renderizar();
};

// ============================================
// DOMContentLoaded - CORREGIDO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    cargarCarrito();
    actualizarCarrito();
    initChips();
    
    renderizar();
    
    window.catalogoRaw = catalogoOriginal || [];
    
    // 🔥 Conectar el buscador - con verificación de existencia
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filtrar);
    } else {
        console.warn('⚠️ Elemento #searchInput no encontrado');
    }
    
    if (typeof initNotificaciones === 'function') {
        initNotificaciones();
    }
    
    if (typeof cargarInfo === 'function') {
        cargarInfo();
    }
});

// ============================================
// EXPOSICIÓN DE FUNCIONES GLOBALES
// ============================================

window.filtrar = filtrar;
window.abrirModal = abrirModal;
window.abrirModalDesdeCarrito = abrirModalDesdeCarrito;
window.cerrarModal = cerrarModal;
window.agregarCarrito = agregarCarrito;
window.quitarCarrito = quitarCarrito;
window.eliminarCarrito = eliminarCarrito;
window.vaciarCarrito = vaciarCarrito;
window.toggleCarrito = toggleCarrito;
window.enviarWhatsApp = enviarWhatsApp;
window.toast = toast;
window.limpiarBusqueda = limpiarBusqueda;
window.seleccionarSugerencia = seleccionarSugerencia;
