// Funciones principales del frontend

// Cargar página específica
function cargarPagina(pagina) {
    window.currentPage = pagina;
    
    // Actualizar navegación activa
    actualizarNavegacionActiva(pagina);
    
    switch(pagina) {
        case 'inicio':
            cargarPaginaInicio();
            break;
        case 'productos':
            cargarPaginaProductos();
            break;
        case 'login':
            mostrarFormularioLogin();
            break;
        case 'register':
            mostrarFormularioRegistro();
            break;
        case 'admin':
            cargarPanelAdmin();
            break;
        case 'perfil':
            cargarPaginaPerfil();
            break;
        default:
            cargarPaginaInicio();
    }
}

// Actualizar navegación activa
function actualizarNavegacionActiva(paginaActiva) {
    // Remover clase active de todos los enlaces
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Agregar clase active al enlace correspondiente
    const activeLink = document.querySelector(`[onclick*="${paginaActiva}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Cargar página de inicio
function cargarPaginaInicio() {
    const contenido = `
        <div class="hero-section bg-primary text-white py-5 mb-4 rounded fade-in">
            <div class="container text-center">
                <h1 class="display-4 mb-4">
                    <i class="fas fa-store"></i> Bienvenido a Mi Supermercado
                </h1>
                <p class="lead mb-4">La mejor selección de productos para tu hogar</p>
                <button class="btn btn-light btn-lg" onclick="cargarPagina('productos')">
                    <i class="fas fa-box"></i> Ver Productos
                </button>
            </div>
        </div>

        <!-- Estadísticas rápidas -->
        <div class="row mb-4" id="statsSection">
            <!-- Se cargarán dinámicamente -->
        </div>

        <!-- Categorías Destacadas -->
        <div class="row mb-4">
            <div class="col-12">
                <h3 class="mb-3">
                    <i class="fas fa-star text-warning"></i> Categorías Populares
                </h3>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card h-100 shadow-sm cursor-pointer" onclick="filtrarPorCategoria('frutas')">
                    <div class="card-body text-center">
                        <i class="fas fa-apple-alt fa-3x text-success mb-3"></i>
                        <h5>Frutas y Verduras</h5>
                        <p class="text-muted">Productos frescos</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card h-100 shadow-sm cursor-pointer" onclick="filtrarPorCategoria('panaderia')">
                    <div class="card-body text-center">
                        <i class="fas fa-bread-slice fa-3x text-warning mb-3"></i>
                        <h5>Panadería</h5>
                        <p class="text-muted">Pan fresco diario</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card h-100 shadow-sm cursor-pointer" onclick="filtrarPorCategoria('lacteos')">
                    <div class="card-body text-center">
                        <i class="fas fa-cheese fa-3x text-primary mb-3"></i>
                        <h5>Lácteos</h5>
                        <p class="text-muted">Leche, queso, yogurt</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card h-100 shadow-sm cursor-pointer" onclick="filtrarPorCategoria('bebidas')">
                    <div class="card-body text-center">
                        <i class="fas fa-wine-bottle fa-3x text-danger mb-3"></i>
                        <h5>Bebidas</h5>
                        <p class="text-muted">Refrescos y jugos</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Productos destacados -->
        <div class="row mb-4">
            <div class="col-12">
                <h3 class="mb-3">
                    <i class="fas fa-fire text-danger"></i> Productos Destacados
                </h3>
            </div>
            <div class="col-12" id="productosDestacados">
                <div class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('contenidoPrincipal').innerHTML = contenido;
    
    // Cargar datos dinámicos
    cargarEstadisticasRapidas();
    cargarProductosDestacados();
}

// Cargar estadísticas rápidas para la página de inicio
async function cargarEstadisticasRapidas() {
    try {
        const stats = await DashboardAPI.obtenerEstadisticas();
        
        const statsHtml = `
            <div class="col-md-3 mb-3">
                <div class="stat-card text-center">
                    <i class="fas fa-box fa-2x mb-2"></i>
                    <div class="stat-number">${stats.totalProductos || 0}</div>
                    <div class="stat-label">Productos</div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="stat-card text-center">
                    <i class="fas fa-tags fa-2x mb-2"></i>
                    <div class="stat-number">${stats.totalCategorias || 0}</div>
                    <div class="stat-label">Categorías</div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="stat-card text-center">
                    <i class="fas fa-shopping-cart fa-2x mb-2"></i>
                    <div class="stat-number">${stats.ordenesHoy || 0}</div>
                    <div class="stat-label">Ventas Hoy</div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="stat-card text-center">
                    <i class="fas fa-users fa-2x mb-2"></i>
                    <div class="stat-number">${stats.totalClientes || 0}</div>
                    <div class="stat-label">Clientes</div>
                </div>
            </div>
        `;
        
        document.getElementById('statsSection').innerHTML = statsHtml;
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        // No mostrar error en la página de inicio para no interrumpir la experiencia
    }
}

// Cargar productos destacados
async function cargarProductosDestacados() {
    try {
        const response = await ProductosAPI.obtenerTodos({ limit: 4, page: 1 });
        
        if (response.productos && response.productos.length > 0) {
            const productosHtml = `
                <div class="row">
                    ${response.productos.map(producto => `
                        <div class="col-md-3 mb-3">
                            <div class="card product-card h-100">
                                <img src="${CONFIG.API_BASE_URL}${producto.imagenUrl || '/img/placeholder.jpg'}" 
                                     class="product-image" alt="${producto.nombre}"
                                     onerror="this.src='img/placeholder.jpg'">
                                <div class="card-body">
                                    <h6 class="card-title">${producto.nombre}</h6>
                                    <p class="product-price">${window.UTILS ? window.UTILS.formatPrice(producto.precioVenta) : '$' + producto.precioVenta}</p>
                                    <p class="product-stock ${producto.stockActual < 10 ? 'low-stock' : ''}">
                                        Stock: ${producto.stockActual}
                                    </p>
                                    <button class="btn btn-add-cart w-100" 
                                            onclick="agregarAlCarrito(${JSON.stringify(producto).replace(/"/g, '&quot;')})">
                                        <i class="fas fa-cart-plus"></i> Agregar
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            document.getElementById('productosDestacados').innerHTML = productosHtml;
        } else {
            document.getElementById('productosDestacados').innerHTML = `
                <div class="text-center text-muted">
                    <i class="fas fa-box-open fa-3x mb-3"></i>
                    <p>No hay productos disponibles</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error cargando productos destacados:', error);
        document.getElementById('productosDestacados').innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-exclamation-circle fa-3x mb-3"></i>
                <p>Error cargando productos</p>
            </div>
        `;
    }
}

// Filtrar por categoría (redirige a productos con filtro)
function filtrarPorCategoria(categoria) {
    cargarPagina('productos');
    // Después de un pequeño delay para que cargue la página
    setTimeout(() => {
        const filtroCategoria = document.getElementById('filtroCategoria');
        if (filtroCategoria) {
            filtroCategoria.value = categoria;
            filtrarProductos();
        }
    }, 500);
}

// Búsqueda de productos desde el navbar
function buscarProductos(event) {
    event.preventDefault();
    const termino = document.getElementById('searchInput').value.trim();
    
    if (!termino) {
        showToast('Ingresa un término de búsqueda', 'warning');
        return;
    }
    
    cargarPagina('productos');
    // Después de un pequeño delay para que cargue la página
    setTimeout(() => {
        const searchBox = document.getElementById('searchBox');
        if (searchBox) {
            searchBox.value = termino;
            filtrarProductos();
        }
        // Limpiar el campo de búsqueda del navbar
        document.getElementById('searchInput').value = '';
    }, 500);
}

// Cargar panel de administración
async function cargarPanelAdmin() {
    if (!window.currentUser || window.currentUser.rol !== 'admin') {
        showToast('No tienes permisos para acceder al panel de administración', 'danger');
        cargarPagina('inicio');
        return;
    }
    
    const contenido = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2><i class="fas fa-tachometer-alt"></i> Panel de Administración</h2>
            <span class="badge bg-success">Admin: ${window.currentUser.username}</span>
        </div>
        
        <!-- Pestañas del admin -->
        <ul class="nav nav-tabs mb-4" id="adminTabs">
            <li class="nav-item">
                <button class="nav-link active" onclick="cambiarTabAdmin('dashboard')">
                    <i class="fas fa-chart-bar"></i> Dashboard
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" onclick="cambiarTabAdmin('productos')">
                    <i class="fas fa-box"></i> Productos
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" onclick="cambiarTabAdmin('categorias')">
                    <i class="fas fa-tags"></i> Categorías
                </button>
            </li>
            <li class="nav-item">
                <button class="nav-link" onclick="cambiarTabAdmin('ordenes')">
                    <i class="fas fa-shopping-cart"></i> Órdenes
                </button>
            </li>
        </ul>
        
        <!-- Contenido del tab activo -->
        <div id="adminTabContent">
            <!-- Se carga dinámicamente -->
        </div>
    `;
    
    document.getElementById('contenidoPrincipal').innerHTML = contenido;
    cambiarTabAdmin('dashboard');
}

// Cambiar tab en el panel de administración
function cambiarTabAdmin(tab) {
    // Actualizar navegación
    document.querySelectorAll('#adminTabs .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`#adminTabs [onclick*="${tab}"]`).classList.add('active');
    
    // Cargar contenido del tab
    switch(tab) {
        case 'dashboard':
            cargarAdminDashboard();
            break;
        case 'productos':
            cargarAdminProductos();
            break;
        case 'categorias':
            cargarAdminCategorias();
            break;
        case 'ordenes':
            cargarAdminOrdenes();
            break;
    }
}

// Cargar dashboard del admin
async function cargarAdminDashboard() {
    try {
        const stats = await DashboardAPI.obtenerEstadisticas();
        
        const dashboardHtml = `
            <div class="row mb-4">
                <div class="col-md-3 mb-3">
                    <div class="admin-card p-3">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-box fa-3x text-primary me-3"></i>
                            <div>
                                <h3 class="mb-0">${stats.totalProductos || 0}</h3>
                                <p class="text-muted mb-0">Productos</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="admin-card p-3">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-shopping-cart fa-3x text-success me-3"></i>
                            <div>
                                <h3 class="mb-0">${stats.ordenesHoy || 0}</h3>
                                <p class="text-muted mb-0">Ventas Hoy</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="admin-card p-3">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-dollar-sign fa-3x text-warning me-3"></i>
                            <div>
                                <h3 class="mb-0">${window.UTILS ? window.UTILS.formatPrice(stats.ventasHoy || 0) : '$' + (stats.ventasHoy || 0)}</h3>
                                <p class="text-muted mb-0">Ingresos Hoy</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="admin-card p-3">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-exclamation-triangle fa-3x text-danger me-3"></i>
                            <div>
                                <h3 class="mb-0">${stats.productosStockBajo || 0}</h3>
                                <p class="text-muted mb-0">Stock Bajo</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-4">
                    <div class="admin-card p-3">
                        <h5><i class="fas fa-chart-line"></i> Ventas Recientes</h5>
                        <div id="ventasChart">
                            <canvas id="ventasChartCanvas" width="400" height="200"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 mb-4">
                    <div class="admin-card p-3">
                        <h5><i class="fas fa-exclamation-circle"></i> Productos con Stock Bajo</h5>
                        <div id="productosStockBajo">
                            <!-- Se carga dinámicamente -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('adminTabContent').innerHTML = dashboardHtml;
        
        // Cargar productos con stock bajo
        cargarProductosStockBajo();
        
    } catch (error) {
        console.error('Error cargando dashboard admin:', error);
        showToast('Error cargando dashboard', 'danger');
    }
}

// Funciones de utilidad
function showToast(message, type = 'info') {
    // Crear elemento toast
    const toastId = `toast_${Date.now()}`;
    const toastHtml = `
        <div class="toast align-items-center text-white bg-${type} border-0" id="${toastId}" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    // Crear contenedor si no existe
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    // Agregar toast
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Mostrar toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        delay: CONFIG.UI.TOAST_DURATION
    });
    toast.show();
    
    // Eliminar del DOM cuando se oculte
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Manejar cambios responsivos
function handleResponsiveChanges() {
    // Implementar cambios específicos para diferentes tamaños de pantalla
    const width = window.innerWidth;
    
    if (width < 768) {
        // Móvil
        document.body.classList.add('mobile-view');
        document.body.classList.remove('desktop-view');
    } else {
        // Desktop
        document.body.classList.add('desktop-view');
        document.body.classList.remove('mobile-view');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Cargar página inicial
    cargarPagina('inicio');
    
    // Configurar responsive
    handleResponsiveChanges();
    
    console.log('✅ Frontend inicializado correctamente');
});

window.cargarPagina = cargarPagina;
window.showToast = showToast;
window.filtrarPorCategoria = filtrarPorCategoria;
window.buscarProductos = buscarProductos;
