// Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(console.log);
    });
}

// Variables globales
let allAnimes = [];
let allCategories = new Set();
let selectedCategory = 'todos';
let searchTerm = '';
let cart = JSON.parse(localStorage.getItem('animeCart')) || [];

// Elementos DOM
const searchInput = document.getElementById('searchInput');
const categoriesList = document.getElementById('categoriesList');
const animeList = document.getElementById('animeList');
const contentTitle = document.getElementById('contentTitle');
const resultsCount = document.getElementById('resultsCount');
const modal = document.getElementById('animeModal');
const cartPanel = document.getElementById('cartPanel');
const cartOverlay = document.getElementById('cartOverlay');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const whatsappBtn = document.getElementById('whatsappBtn');
const closeCart = document.getElementById('closeCart');
const cartButton = document.getElementById('cartButton');

// Cargar animes desde los archivos del CMS
async function cargarAnimes() {
    try {
        // Primero intentamos cargar el índice
        const indexResponse = await fetch('content/anime/index.json');
        const archivos = await indexResponse.json();
        
        let animes = [];
        
        // Cargar cada archivo YAML
        for (let archivo of archivos) {
            try {
                const response = await fetch(`content/anime/${archivo}`);
                const texto = await response.text();
                
                // Convertir YAML a objeto (simple)
                const anime = convertirYAMLtoJSON(texto);
                if (anime) animes.push(anime);
            } catch (e) {
                console.log('Error cargando:', archivo);
            }
        }
        
        return animes;
    } catch (error) {
        console.log('No hay animes en el CMS, usando datos de respaldo');
        return [];
    }
}

// Convertir YAML básico a objeto (versión simple)
function convertirYAMLtoJSON(yaml) {
    try {
        const lines = yaml.split('\n');
        const obj = {};
        
        lines.forEach(line => {
            if (line.includes(':')) {
                const [key, value] = line.split(':').map(s => s.trim());
                if (value.startsWith('- ')) {
                    // Es una lista
                    obj[key] = value.split('- ').filter(v => v).map(v => v.trim());
                } else if (!isNaN(value)) {
                    // Es número
                    obj[key] = parseFloat(value);
                } else if (value === 'true' || value === 'false') {
                    // Es booleano
                    obj[key] = value === 'true';
                } else {
                    // Es string
                    obj[key] = value.replace(/"/g, '');
                }
            }
        });
        
        return obj;
    } catch (e) {
        return null;
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    allAnimes = await cargarAnimes();
    
    if (allAnimes.length === 0) {
        // Si no hay animes en CMS, mostramos mensaje
        animeList.innerHTML = '<div class="no-results"><i>📺</i><br>No hay animes aún.<br><small>Agrega desde el panel de administración</small></div>';
    } else {
        allAnimes.forEach(anime => {
            if (anime.categorias) {
                anime.categorias.forEach(cat => allCategories.add(cat));
            }
        });
        
        renderCategories();
        renderAnimeList();
    }
    
    updateCartUI();
});

function renderCategories() {
    const sortedCategories = Array.from(allCategories).sort();
    let html = `
        <span class="category-chip active" data-categoria="todos">Todos</span>
        <span class="category-chip special-category" data-categoria="recientes">🆕 Recientes</span>
        <span class="category-chip special-category" data-categoria="populares">⭐ Más Puntuadas</span>
    `;
    
    sortedCategories.forEach(categoria => {
        html += `<span class="category-chip" data-categoria="${categoria}">${categoria}</span>`;
    });
    
    categoriesList.innerHTML = html;

    document.querySelectorAll('.category-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            selectedCategory = chip.dataset.categoria;
            
            if (selectedCategory === 'todos') contentTitle.textContent = 'Todos los Animes';
            else if (selectedCategory === 'recientes') contentTitle.textContent = 'Animes Recientes';
            else if (selectedCategory === 'populares') contentTitle.textContent = 'Más Puntuados';
            else contentTitle.textContent = selectedCategory;
            
            renderAnimeList();
        });
    });
}

function renderAnimeList() {
    let animesFiltrados = [];

    if (selectedCategory === 'recientes') {
        animesFiltrados = [...allAnimes].reverse().slice(0, 5);
    } else if (selectedCategory === 'populares') {
        animesFiltrados = [...allAnimes].sort((a, b) => b.valoracion - a.valoracion).slice(0, 5);
    } else {
        animesFiltrados = allAnimes;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            animesFiltrados = animesFiltrados.filter(anime => 
                anime.nombre?.toLowerCase().includes(term) ||
                anime.categorias?.some(cat => cat.toLowerCase().includes(term))
            );
        }

        if (selectedCategory !== 'todos') {
            animesFiltrados = animesFiltrados.filter(anime => 
                anime.categorias?.includes(selectedCategory)
            );
        }
    }

    resultsCount.textContent = `${animesFiltrados.length} resultados`;

    // Agrupar por nombre
    const grouped = {};
    animesFiltrados.forEach(anime => {
        if (!grouped[anime.nombre]) grouped[anime.nombre] = [];
        grouped[anime.nombre].push(anime);
    });

    let html = '';
    Object.values(grouped).forEach(group => {
        group.sort((a, b) => a.temporadaActual - b.temporadaActual);
        group.forEach(anime => {
            html += createListItem(anime);
        });
    });

    animeList.innerHTML = html || '<div class="no-results"><i>🔍</i><br>No se encontraron animes</div>';

    // Event listeners
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const [nombre, temp] = btn.dataset.animeId.split('|');
            const anime = allAnimes.find(a => a.nombre === nombre && a.temporadaActual == temp);
            if (anime) toggleCartItem(anime);
        });
    });

    document.querySelectorAll('.anime-list-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('add-to-cart-btn')) {
                const [nombre, temp] = item.dataset.animeId.split('|');
                const anime = allAnimes.find(a => a.nombre === nombre && a.temporadaActual == temp);
                if (anime) openModal(anime);
            }
        });
    });
}

function createListItem(anime) {
    const rating = anime.valoracion || 0;
    const stars = getStars(rating);
    const animeId = `${anime.nombre}|${anime.temporadaActual}`;
    const isInCart = cart.some(item => item.nombre === anime.nombre && item.temporadaActual === anime.temporadaActual);
    
    return `
        <div class="anime-list-item" data-anime-id="${animeId}">
            <div class="list-color-bar" style="background-color: ${anime.color || '#9B59B6'}"></div>
            <div class="list-image">
                <img src="${anime.portada}" alt="${anime.nombre}" onerror="this.src='https://via.placeholder.com/50x70?text=No'">
            </div>
            <div class="list-info">
                <div class="list-title">${anime.nombre}</div>
                <div class="list-rating">
                    <span class="list-rating-number">${rating.toFixed(1)}</span>
                    <span class="list-stars">${stars}</span>
                </div>
            </div>
            <button class="add-to-cart-btn ${isInCart ? 'added' : ''}" data-anime-id="${animeId}">
                ${isInCart ? '✓' : '+'}
            </button>
            <div class="expand-icon">▶</div>
        </div>
    `;
}

function getStars(rating) {
    const starValue = rating / 2;
    const filled = Math.floor(starValue);
    const decimal = starValue % 1;
    let stars = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < filled) stars += '<span class="star filled">★</span>';
        else if (i === filled && decimal >= 0.25 && decimal < 0.75) stars += '<span class="star half-filled">★</span>';
        else if (i === filled && decimal >= 0.75) stars += '<span class="star filled">★</span>';
        else stars += '<span class="star">★</span>';
    }
    return stars;
}

function openModal(anime) {
    document.getElementById('modalImage').src = anime.portada;
    document.getElementById('modalTitle').textContent = anime.nombre;
    
    const cats = anime.categorias?.map(c => `<span class="modal-category-tag">${c}</span>`).join('') || '';
    document.getElementById('modalCategories').innerHTML = cats;
    
    document.getElementById('modalCurrentSeason').textContent = anime.temporadaActual || 1;
    document.getElementById('modalTotalSeasons').textContent = anime.temporadasTotales || 1;
    document.getElementById('modalDescription').textContent = anime.descripcion || 'Sin descripción';
    document.getElementById('modalSizePerEpisode').textContent = anime.tamañoPorCapitulo || 'N/A';
    document.getElementById('modalTotalSize').textContent = anime.tamañoTotal || 'N/A';
    document.getElementById('modalQuality').innerHTML = `<span class="modal-quality-badge">${anime.calidad || 'N/A'}</span>`;
    
    const rating = anime.valoracion || 0;
    document.getElementById('modalRating').textContent = rating.toFixed(1);
    document.getElementById('modalStars').innerHTML = getStars(rating);
    document.getElementById('modalDownload').href = anime.enlaceDescarga || '#';
    
    const isInCart = cart.some(item => item.nombre === anime.nombre && item.temporadaActual === anime.temporadaActual);
    const modalBtn = document.getElementById('modalAddBtn');
    modalBtn.innerHTML = isInCart ? '✓ En carrito' : '+ Agregar al carrito';
    modalBtn.classList.toggle('added', isInCart);
    
    modal.dataset.currentAnime = JSON.stringify(anime);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

window.closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
};

function toggleCartItem(anime) {
    const index = cart.findIndex(item => item.nombre === anime.nombre && item.temporadaActual === anime.temporadaActual);
    
    if (index === -1) {
        cart.push({
            nombre: anime.nombre,
            temporadaActual: anime.temporadaActual,
            temporadasTotales: anime.temporadasTotales,
            portada: anime.portada,
            color: anime.color,
            calidad: anime.calidad
        });
    } else {
        cart.splice(index, 1);
    }
    
    localStorage.setItem('animeCart', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    cartCount.textContent = cart.length;
    cartCount.style.display = cart.length > 0 ? 'flex' : 'none';
    cartTotal.textContent = cart.length;
    whatsappBtn.disabled = cart.length === 0;
    renderCartItems();
    
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        const [nombre, temp] = btn.dataset.animeId.split('|');
        const inCart = cart.some(item => item.nombre === nombre && item.temporadaActual == temp);
        btn.innerHTML = inCart ? '✓' : '+';
        btn.classList.toggle('added', inCart);
    });
}

function renderCartItems() {
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart"><i>🛒</i><p>Carrito vacío</p></div>';
        return;
    }
    
    let html = '';
    cart.forEach((item, i) => {
        html += `
            <div class="cart-item">
                <img src="${item.portada}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/50x70?text=No'">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.nombre}</div>
                    <div class="cart-item-season">Temp. ${item.temporadaActual}/${item.temporadasTotales}</div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${i})">✕</button>
            </div>
        `;
    });
    cartItems.innerHTML = html;
}

window.removeFromCart = (index) => {
    cart.splice(index, 1);
    localStorage.setItem('animeCart', JSON.stringify(cart));
    updateCartUI();
};

function sendWhatsApp() {
    if (cart.length === 0) return;
    
    let msg = "📋 *PEDIDO DE ANIMES* 📋\n\n";
    cart.forEach((item, i) => {
        msg += `${i+1}. *${item.nombre}* - Temp. ${item.temporadaActual}\n`;
    });
    msg += `\n📦 Total: ${cart.length} animes`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

// Event listeners
cartButton.addEventListener('click', () => {
    cartPanel.classList.add('open');
    cartOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
});

closeCart.addEventListener('click', () => {
    cartPanel.classList.remove('open');
    cartOverlay.classList.remove('show');
    document.body.style.overflow = 'auto';
});

cartOverlay.addEventListener('click', () => {
    cartPanel.classList.remove('open');
    cartOverlay.classList.remove('show');
    document.body.style.overflow = 'auto';
});

whatsappBtn.addEventListener('click', sendWhatsApp);

document.getElementById('modalAddBtn').addEventListener('click', function() {
    if (modal.dataset.currentAnime) {
        toggleCartItem(JSON.parse(modal.dataset.currentAnime));
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        cartPanel.classList.remove('open');
        cartOverlay.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    renderAnimeList();
});
