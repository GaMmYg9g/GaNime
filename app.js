// app.js - Versión que LEE automáticamente los archivos del CMS

// Variables globales
let allAnimes = [];
let allCategories = new Set();
let selectedCategory = 'todos';
let searchTerm = '';

// Carrito
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

// ⭐ MAGIA: Cargar TODOS los archivos de la carpeta content/animes/
async function cargarAnimes() {
    try {
        // En GitHub Pages, necesitamos listar los archivos
        const response = await fetch('content/animes/');
        // Como no podemos listar directorios directamente,
        // usamos una lista predefinida o un archivo índice
        
        // Opción recomendada: Crear un archivo index.json
        const indexResponse = await fetch('content/animes/index.json');
        const archivos = await indexResponse.json();
        
        let animes = [];
        
        for (let archivo of archivos) {
            const animeResponse = await fetch(`content/animes/${archivo}`);
            const animeData = await animeResponse.json();
            animes.push(animeData);
        }
        
        return animes;
    } catch (error) {
        console.log('Usando datos de respaldo:', error);
        return []; // Si falla, no muestra nada
    }
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    allAnimes = await cargarAnimes();
    
    if (allAnimes.length > 0) {
        allAnimes.forEach(anime => {
            anime.categorias?.forEach(cat => allCategories.add(cat));
        });
        
        renderCategories();
        renderAnimeList();
        updateCartUI();
    } else {
        animeList.innerHTML = '<div class="no-results"><i>📺</i><br>No hay animes aún. Agrega desde el panel de admin.</div>';
    }
});

// ⚠️ El RESTO de tu código (renderCategories, renderAnimeList, 
// createListItem, openModal, etc.) se queda IGUAL que antes
// Solo cambia la forma de CARGAR los datos