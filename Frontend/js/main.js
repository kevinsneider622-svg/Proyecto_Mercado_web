import { CONFIG, UTILS, showToast, initializeApp as initializeConfig } from './config.js';
import { auth } from './auth.js';
import { productos as ProductosAPI } from './api.js';
import { dashboard as DashboardAPI } from './api.js';
import dashboardManager from './dashboard.js';

// ============================================
// VARIABLES GLOBALES
// ============================================

let currentPage = 'inicio';
let currentUser = null;

// ============================================
// FUNCIONES PRINCIPALES DE NAVEGACIÓN
// ============================================

/**
 * Cargar página específica
 */
export function cargarPagina(pagina) {
    currentPage = pagina;
    
    // Actualizar navegación activa
    actualizarNavegacionActiva(pagina);
    
    // Actualizar título de la página
    document.title = `${CONFIG.app.NAME} - ${UTILS.capitalize(pagina)}`;
    
    switch(pagina) {
        case 'inicio':
            cargarPaginaInicio();
            break;
        case 'productos':
            cargarPaginaProductos();
            break;
        case 'login':
            auth.mostrarFormularioLogin();
            break;
        case 'register':
            auth.mostrarFormularioRegistro();
            break;
        case 'admin':
            cargarPanelAdmin();
            break;
        case 'perfil':
            cargarPaginaPerfil();
            break;
        case 'carrito':
            cargarPaginaCarrito();
            break;
        default:
            cargarPaginaInicio();
    }
    
    // Scroll al inicio
    window.scrollTo(0, 0);
}

/**
 * Actualizar navegación activa
 */
function actualizarNavegacionActiva(paginaActiva) {
    // Remover clase active de todos los enlaces
    document.querySelectorAll('.navbar-nav .nav-link, .nav-tabs .nav-link').forEach(link => {
        link.classList.remove('active');
        link.setAttribute('aria-current', 'false');
    });
    
    // Agregar clase active al enlace correspondiente
    const activeLink = document.querySelector(`[data-page="${paginaActiva}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
        activeLink.setAttribute('aria-current', 'page');
    }
}

// ============================================
// PÁGINA DE INICIO
// ============================================

/**
 * Cargar página de inicio
 */
async function cargarPaginaInicio() {
    const contenido = `
        <!-- Hero Section -->
        <section class="hero-section bg-gradient-primary text-white py-5 mb-4 rounded fade-in">
            <div class="container text-center">
                <h1 class="display-4 mb-4">
                    <i class="fas fa-store me-3"></i>${CONFIG.app.NAME}
                </h1>
                <p class="lead mb-4">${CONFIG.app.DESCRIPTION}</p>
                <div class="d-flex gap-3 justify-content-center flex-wrap">
                    <button class="btn btn-light btn-lg" onclick="main.cargarPagina('productos')">
                        <i class="fas fa-box me-2"></i>Ver Productos
                    </button>
                    <button class="btn btn-outline-light btn-lg" onclick="main.explorarCategorias()">
                        <i class="fas fa-tags me-2"></i>Explorar Categorías
                    </button>
                </div>
            </div>
        </section>

        <!-- Estadísticas Rápidas -->
        <section class="mb-5">
            <div class="row" id="statsSection">
                <div class="col-12 text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando estadísticas...</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- Categorías Destacadas -->
        <section class="mb-5">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="h4 mb-0">
                    <i class="fas fa-star text-warning me-2"></i>Categorías Populares
                </h2>
                <button class="btn btn-outline-primary btn-sm" onclick="main.verTodasCategorias()">
                    Ver Todas <i class="fas fa-arrow-right ms-1"></i>
                </button>
            </div>
            <div class="row" id="categoriasDestacadas">
                <!-- Categorías se cargarán dinámicamente -->
            </div>
        </section>

        <!-- Productos Destacados -->
        <section class="mb-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="h4 mb-0">
                    <i class="fas fa-fire text-danger me-2"></i>Productos Destacados
                </h2>
                <button class="btn btn-outline-primary btn-sm" onclick="main.cargarPagina('productos')">
                    Ver Todos <i class="fas fa-arrow-right ms-1"></i>
                </button>
            </div>
            <div class="row" id="productosDestacados">
                <div class="col-12 text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando productos...</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- Banner Promocional -->
        <section class="mb-4">
            <div class="card bg-dark text-white promo-banner">
                <div class="card-body text-center p-5">
                    <h3 class="card-title">🎉 Ofertas Especiales</h3>
                    <p class="card-text">Descuentos exclusivos en productos seleccionados</p>
                    <button class="btn btn-warning btn-lg" onclick="main.cargarPagina('productos')">
                        <i class="fas fa-bolt me-2"></i>Ver Ofertas
                    </button>
                </div>
            </div>
        </section>
    `;
    
    document.getElementById('contenidoPrincipal').innerHTML = contenido;
    
    // Cargar datos dinámicos
    await Promise.all([
        cargarEstadisticasRapidas(),
        cargarCategoriasDestacadas(),
        cargarProductosDestacados()
    ]);
}

/**
 * Cargar estadísticas rápidas para la página de inicio
 */
async function cargarEstadisticasRapidas() {
    try {
        const resultado = await DashboardAPI.getEstadisticas();
        
        if (resultado.success) {
            const stats = resultado.data.estadisticas;
            const statsHtml = `
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card stat-card border-left-primary shadow h-100">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                        Productos
                                    </div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800">
                                        ${stats.totalProductos || 0}
                                    </div>
                                    <div class="text-xs text-muted mt-1">
                                        <i class="fas fa-${stats.productosStockBajo > 0 ? 'exclamation-triangle text-warning' : 'check-circle text-success'} me-1"></i>
                                        ${stats.productosStockBajo || 0} con stock bajo
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-boxes fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card stat-card border-left-success shadow h-100">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                                        Categorías
                                    </div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800">
                                        ${stats.totalCategorias || 0}
                                    </div>
                                    <div class="text-xs text-muted mt-1">
                                        <i class="fas fa-tags text-success me-1"></i>
                                        Diversidad de productos
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-tags fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card stat-card border-left-info shadow h-100">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                                        Ventas Hoy
                                    </div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800">
                                        ${stats.ordenesHoy || 0}
                                    </div>
                                    <div class="text-xs text-muted mt-1">
                                        <i class="fas fa-dollar-sign text-info me-1"></i>
                                        ${UTILS.formatPrice(stats.ventasHoy || 0)}
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-shopping-cart fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card stat-card border-left-warning shadow h-100">
                        <div class="card-body">
                            <div class="row no-gutters align-items-center">
                                <div class="col mr-2">
                                    <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                        Clientes
                                    </div>
                                    <div class="h5 mb-0 font-weight-bold text-gray-800">
                                        ${stats.totalClientes || 0}
                                    </div>
                                    <div class="text-xs text-muted mt-1">
                                        <i class="fas fa-user-plus text-warning me-1"></i>
                                        Base de clientes
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <i class="fas fa-users fa-2x text-gray-300"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('statsSection').innerHTML = statsHtml;
        } else {
            throw new Error(resultado.error);
        }
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
        document.getElementById('statsSection').innerHTML = `
            <div class="col-12">
                <div class="alert alert-warning text-center">
                    <i class="fas fa-chart-bar me-2"></i>
                    Las estadísticas no están disponibles temporalmente
                </div>
            </div>
        `;
    }
}

/**
 * Cargar categorías destacadas
 */
async function cargarCategoriasDestacadas() {
    try {
        // Por ahora usamos categorías predefinidas del config
        const categorias = Object.entries(CONFIG.categories).slice(0, 4);
        
        const categoriasHtml = categorias.map(([key, nombre]) => `
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card categoria-card h-100 shadow-sm cursor-pointer" 
                     onclick="main.filtrarPorCategoria('${key}')">
                    <div class="card-body text-center p-4">
                        <div class="categoria-icon mb-3">
                            <i class="fas fa-${this.getCategoriaIcon(key)} fa-3x text-primary"></i>
                        </div>
                        <h5 class="categoria-nombre">${nombre}</h5>
                        <p class="text-muted small">Explorar productos</p>
                    </div>
                </div>
            </div>
        `).join('');
        
        document.getElementById('categoriasDestacadas').innerHTML = categoriasHtml;
        
    } catch (error) {
        console.error('❌ Error cargando categorías:', error);
        document.getElementById('categoriasDestacadas').innerHTML = `
            <div class="col-12 text-center text-muted">
                <i class="fas fa-tags fa-3x mb-3"></i>
                <p>No se pudieron cargar las categorías</p>
            </div>
        `;
    }
}

/**
 * Cargar productos destacados
 */
async function cargarProductosDestacados() {
    try {
        const resultado = await ProductosAPI.getDestacados();
        
        if (resultado.success && resultado.data.productos.length > 0) {
            const productosHtml = resultado.data.productos.map(producto => `
                <div class="col-xl-3 col-lg-4 col-md-6 mb-4">
                    <div class="card product-card h-100 shadow-sm">
                        <div class="product-image-container">
                            <img src="${producto.imagenUrl || '/img/placeholder-product.jpg'}" 
                                 class="product-image" 
                                 alt="${producto.nombre}"
                                 onerror="this.src='/img/placeholder-product.jpg'">
                            ${producto.stockActual < 10 ? `
                                <span class="badge bg-warning position-absolute top-0 start-0 m-2">
                                    <i class="fas fa-exclamation-circle me-1"></i>Stock Bajo
                                </span>
                            ` : ''}
                        </div>
                        <div class="card-body d-flex flex-column">
                            <h6 class="product-name">${producto.nombre}</h6>
                            <p class="product-description text-muted small flex-grow-1">
                                ${producto.descripcion || 'Producto de calidad'}
                            </p>
                            <div class="product-info">
                                <div class="product-price">${UTILS.formatPrice(producto.precioVenta)}</div>
                                <div class="product-stock ${producto.stockActual < 5 ? 'text-danger' : producto.stockActual < 10 ? 'text-warning' : 'text-success'}">
                                    <small>
                                        <i class="fas fa-box me-1"></i>
                                        ${producto.stockActual} en stock
                                    </small>
                                </div>
                            </div>
                            <button class="btn btn-primary mt-2 w-100" 
                                    onclick="main.agregarAlCarrito(${producto.id})"
                                    ${producto.stockActual === 0 ? 'disabled' : ''}>
                                <i class="fas fa-cart-plus me-2"></i>
                                ${producto.stockActual === 0 ? 'Agotado' : 'Agregar al Carrito'}
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            
            document.getElementById('productosDestacados').innerHTML = productosHtml;
        } else {
            document.getElementById('productosDestacados').innerHTML = `
                <div class="col-12 text-center text-muted py-5">
                    <i class="fas fa-box-open fa-3x mb-3"></i>
                    <h5>No hay productos destacados</h5>
                    <p class="mb-0">Pronto agregaremos nuevos productos</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('❌ Error cargando productos destacados:', error);
        document.getElementById('productosDestacados').innerHTML = `
            <div class="col-12 text-center text-muted py-5">
                <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
                <h5>Error cargando productos</h5>
                <p class="mb-0">Intenta recargar la página</p>
            </div>
        `;
    }
}

// ============================================
// PANEL DE ADMINISTRACIÓN
// ============================================

/**
 * Cargar panel de administración
 */
async function cargarPanelAdmin() {
    if (!auth.estaAutenticado() || !auth.esAdministrador()) {
        showToast('No tienes permisos para acceder al panel de administración', 'danger');
        cargarPagina('inicio');
        return;
    }
    
    const contenido = `
        <div class="container-fluid px-4">
            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 class="h3 mb-1 text-gray-800">
                        <i class="fas fa-tachometer-alt me-2"></i>Panel de Administración
                    </h1>
                    <p class="text-muted mb-0">Gestión completa del supermercado</p>
                </div>
                <div class="d-flex gap-2 align-items-center">
                    <span class="badge bg-success fs-6">
                        <i class="fas fa-user-shield me-1"></i>Administrador
                    </span>
                    <button class="btn btn-outline-primary btn-sm" onclick="dashboard.actualizar()">
                        <i class="fas fa-sync-alt me-1"></i>Actualizar
                    </button>
                </div>
            </div>

            <!-- Dashboard Stats -->
            <div id="adminDashboard">
                <!-- Se carga dinámicamente por el dashboard manager -->
            </div>
        </div>
    `;
    
    document.getElementById('contenidoPrincipal').innerHTML = contenido;
    
    // Cargar dashboard de administración
    await dashboardManager.cargarDashboard();
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

/**
 * Obtener ícono para categoría
 */
function getCategoriaIcon(categoriaKey) {
    const iconos = {
        'FRUTAS': 'apple-alt',
        'LACTEOS': 'cheese',
        'CARNES': 'drumstick-bite',
        'PANADERIA': 'bread-slice',
        'BEBIDAS': 'wine-bottle',
        'LIMPIEZA': 'spray-can',
        'CUIDADO_PERSONAL': 'soap',
        'DESPENSA': 'shopping-basket',
        'CONGELADOS': 'snowflake',
        'MASCOTAS': 'paw'
    };
    return iconos[categoriaKey] || 'tag';
}

/**
 * Filtrar por categoría (redirige a productos con filtro)
 */
export function filtrarPorCategoria(categoria) {
    cargarPagina('productos');
    // El filtro se aplicará cuando cargue la página de productos
    sessionStorage.setItem('filtroCategoria', categoria);
}

/**
 * Búsqueda de productos desde el navbar
 */
export function buscarProductos(event) {
    if (event) event.preventDefault();
    
    const searchInput = document.getElementById('searchInput');
    const termino = searchInput?.value.trim();
    
    if (!termino) {
        showToast('Ingresa un término de búsqueda', 'warning');
        return;
    }
    
    cargarPagina('productos');
    sessionStorage.setItem('terminoBusqueda', termino);
    
    // Limpiar el campo de búsqueda
    if (searchInput) {
        searchInput.value = '';
    }
}

/**
 * Explorar todas las categorías
 */
export function explorarCategorias() {
    showToast('Navegando a todas las categorías', 'info');
    cargarPagina('productos');
    sessionStorage.setItem('mostrarTodasCategorias', 'true');
}

/**
 * Ver todas las categorías
 */
export function verTodasCategorias() {
    explorarCategorias();
}

/**
 * Agregar producto al carrito
 */
export function agregarAlCarrito(productoId) {
    // Implementación básica - puedes expandir esto
    showToast('Producto agregado al carrito', 'success');
    
    // Aquí integrarías con tu módulo de carrito
    console.log(`Agregando producto ${productoId} al carrito`);
}

// ============================================
// MANEJO RESPONSIVE
// ============================================

/**
 * Manejar cambios responsivos
 */
function handleResponsiveChanges() {
    const width = window.innerWidth;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 992;
    
    document.body.classList.toggle('mobile-view', isMobile);
    document.body.classList.toggle('tablet-view', isTablet);
    document.body.classList.toggle('desktop-view', !isMobile && !isTablet);
    
    // Ajustes específicos para móvil
    if (isMobile) {
        // Puedes agregar ajustes específicos aquí
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

/**
 * Inicializar aplicación principal
 */
export function initializeMainApp() {
    console.log('🚀 Inicializando aplicación principal...');
    
    // Configurar event listeners globales
    setupGlobalEventListeners();
    
    // Verificar autenticación
    auth.verificarAutenticacion().then(autenticado => {
        if (autenticado) {
            currentUser = auth.getCurrentUser();
            actualizarUIUsuario();
        }
    });
    
    // Cargar página inicial
    const urlParams = new URLSearchParams(window.location.search);
    const pagina = urlParams.get('page') || 'inicio';
    cargarPagina(pagina);
    
    console.log('✅ Aplicación principal inicializada');
}

/**
 * Configurar event listeners globales
 */
function setupGlobalEventListeners() {
    // Manejar errores de red
    window.addEventListener('online', () => {
        showToast('✅ Conexión restaurada', 'success');
    });
    
    window.addEventListener('offline', () => {
        showToast('⚠️ Trabajando sin conexión', 'warning');
    });
    
    // Manejar cambios de tamaño de pantalla
    window.addEventListener('resize', UTILS.debounce(() => {
        handleResponsiveChanges();
    }, CONFIG.ui.DEBOUNCE_DELAY));
    
    // Manejar tecla Escape para cerrar modales
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modales = document.querySelectorAll('.modal.show');
            modales.forEach(modal => {
                const modalInstance = bootstrap.Modal.getInstance(modal);
                if (modalInstance) {
                    modalInstance.hide();
                }
            });
        }
    });
}

/**
 * Actualizar UI según estado del usuario
 */
function actualizarUIUsuario() {
    const authElements = document.querySelectorAll('[data-auth]');
    const userElements = document.querySelectorAll('[data-user]');
    const adminElements = document.querySelectorAll('[data-admin]');
    
    if (auth.estaAutenticado()) {
        // Mostrar elementos para usuarios autenticados
        authElements.forEach(el => {
            if (el.dataset.auth === 'true') el.style.display = '';
            if (el.dataset.auth === 'false') el.style.display = 'none';
        });
        
        // Actualizar información del usuario
        userElements.forEach(el => {
            const field = el.dataset.user;
            if (currentUser && currentUser[field]) {
                el.textContent = currentUser[field];
            }
        });
        
        // Mostrar elementos de admin si corresponde
        if (auth.esAdministrador()) {
            adminElements.forEach(el => el.style.display = '');
        } else {
            adminElements.forEach(el => el.style.display = 'none');
        }
        
    } else {
        // Mostrar elementos para usuarios no autenticados
        authElements.forEach(el => {
            if (el.dataset.auth === 'true') el.style.display = 'none';
            if (el.dataset.auth === 'false') el.style.display = '';
        });
        
        userElements.forEach(el => el.textContent = '');
        adminElements.forEach(el => el.style.display = 'none');
    }
}

// ============================================
// INICIALIZACIÓN AUTOMÁTICA
// ============================================

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMainApp);
} else {
    initializeMainApp();
}

// ============================================
// EXPORTACIONES Y GLOBALES
// ============================================

// Exportar funciones principales
export default {
    cargarPagina,
    filtrarPorCategoria,
    buscarProductos,
    explorarCategorias,
    verTodasCategorias,
    agregarAlCarrito,
    initializeMainApp
};

// Exponer globalmente para retrocompatibilidad
window.main = {
    cargarPagina,
    filtrarPorCategoria,
    buscarProductos,
    explorarCategorias,
    verTodasCategorias,
    agregarAlCarrito
};