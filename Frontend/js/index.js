    // ============================================
    // VARIABLES GLOBALES
    // ============================================

    window.cart = window.cart || [];
    window.currentUser = null;
    let configReady = false;
    let carouselInitialized = false;
    let datosOriginalesPerfil = {};

    // ============================================
    // ESPERAR A QUE CONFIG ESTÉ LISTO
    // ============================================

    window.addEventListener('configLoaded', () => {
    console.log('✅ CONFIG listo para usar');
    configReady = true;
    });

    // ============================================
    // FUNCIONES DE NAVEGACIÓN
    // ============================================

    function cargarPagina(pagina) {
    console.log('📄 Cargando página:', pagina);

    switch(pagina) {
        case 'inicio':
            cargarInicio();
            break;
        case 'productos':
            cargarProductos();
            break;
        case 'ofertas':
            cargarOfertas();
            break;
        case 'categorias':
            cargarCategorias();  
            break; 
        default:
            cargarInicio();
    }
    }

    // ============================================
    // FUNCIÓN FETCH MEJORADA
    // ============================================

    async function fetchAPI(endpoint, options = {}) {
    // Esperar a que CONFIG esté listo
    if (!configReady || !window.CONFIG?.api?.baseUrl) {
        console.log('⏳ Esperando CONFIG...');
        await new Promise(resolve => {
            const checkConfig = setInterval(() => {
                if (window.CONFIG?.api?.baseUrl) {
                    clearInterval(checkConfig);
                    configReady = true;
                    resolve();
                }
            }, 50);
        });
    }

    const url = `${window.CONFIG.api.baseUrl}${endpoint}`;
    console.log('🌐 Fetch:', url);

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers
            }
        });
        
        console.log('📊 Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            throw new Error('Respuesta no es JSON');
        }
        
        const data = await response.json();
        console.log('✅ Data:', data);
        return data;
        
    } catch (error) {
        console.error(`❌ Error en ${endpoint}:`, error);
        throw error;
    }
    }

    // ============================================
    // FUNCIONES DE PÁGINAS
    // ============================================

    async function cargarInicio() {
    console.log('🏠 Cargando inicio...');

    const contenedor = document.getElementById('contenidoPrincipal');
    if (!contenedor) {
        console.error('❌ Contenedor no encontrado');
        return;
    }

    contenedor.innerHTML = `
        <!-- CARRUSEL DE OFERTAS -->
        <div id="ofertasCarousel" class="carousel slide hero-carousel" data-bs-ride="carousel">
            <div class="carousel-indicators">
                <button type="button" data-bs-target="#ofertasCarousel" data-bs-slide-to="0" class="active"></button>
                <button type="button" data-bs-target="#ofertasCarousel" data-bs-slide-to="1"></button>
                <button type="button" data-bs-target="#ofertasCarousel" data-bs-slide-to="2"></button>
            </div>
            <div class="carousel-inner">
                <div class="carousel-item active">
                    <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80" class="d-block w-100" alt="Oferta 1">
                    <div class="carousel-caption">
                        <h3>¡Ofertas Especiales!</h3>
                        <p>Hasta 50% de descuento en productos seleccionados</p>
                        <button class="btn btn-light btn-lg" onclick="cargarPagina('ofertas')">
                            Ver Ofertas
                        </button>
                    </div>
                </div>
                <div class="carousel-item">
                    <img src="https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80" class="d-block w-100" alt="Oferta 2">
                    <div class="carousel-caption">
                        <h3>Frutas Frescas</h3>
                        <p>Lo mejor de la temporada directamente a tu hogar</p>
                        <button class="btn btn-light btn-lg" onclick="filtrarPorCategoria('FRUTAS')">
                            Comprar Ahora
                        </button>
                    </div>
                </div>
                <div class="carousel-item">
                    <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80" class="d-block w-100" alt="Oferta 3">
                    <div class="carousel-caption">
                        <h3>Despensa Básica</h3>
                        <p>Todos los productos esenciales al mejor precio</p>
                        <button class="btn btn-light btn-lg" onclick="filtrarPorCategoria('DESPENSA')">
                            Explorar
                        </button>
                    </div>
                </div>
            </div>
            <button class="carousel-control-prev" type="button" data-bs-target="#ofertasCarousel" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Anterior</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#ofertasCarousel" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Siguiente</span>
            </button>
        </div>

        <!-- SECCIÓN DE CATEGORÍAS -->
        <section class="categorias-section">
            <div class="container">
                <div class="section-title">
                    <h2>Nuestras Categorías</h2>
                    <p>Explora nuestros productos por categoría</p>
                </div>
                <div class="categorias-grid">
                    <div class="categoria-card" onclick="filtrarPorCategoria('FRUTAS')">
                        <div class="categoria-nombre">
                            <i class="fas fa-apple-alt me-2"></i>Frutas y Verduras
                        </div>
                        <div class="categoria-descripcion">Frescas y de temporada</div>
                    </div>
                    <div class="categoria-card" onclick="filtrarPorCategoria('LACTEOS')">
                        <div class="categoria-nombre">
                            <i class="fas fa-cheese me-2"></i>Lácteos y Huevos
                        </div>
                        <div class="categoria-descripcion">La mejor calidad</div>
                    </div>
                    <div class="categoria-card" onclick="filtrarPorCategoria('CARNES')">
                        <div class="categoria-nombre">
                            <i class="fas fa-drumstick-bite me-2"></i>Carnes y Pescados
                        </div>
                        <div class="categoria-descripcion">Frescos y seleccionados</div>
                    </div>
                    <div class="categoria-card" onclick="filtrarPorCategoria('PANADERIA')">
                        <div class="categoria-nombre">
                            <i class="fas fa-bread-slice me-2"></i>Panadería
                        </div>
                        <div class="categoria-descripcion">Recién horneado</div>
                    </div>
                    <div class="categoria-card" onclick="filtrarPorCategoria('BEBIDAS')">
                        <div class="categoria-nombre">
                            <i class="fas fa-wine-bottle me-2"></i>Bebidas
                        </div>
                        <div class="categoria-descripcion">Refrescantes y naturales</div>
                    </div>
                    <div class="categoria-card" onclick="filtrarPorCategoria('DESPENSA')">
                        <div class="categoria-nombre">
                            <i class="fas fa-utensils me-2"></i>Despensa
                        </div>
                        <div class="categoria-descripcion">Productos básicos</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- PRODUCTOS DESTACADOS -->
        <div class="container mb-5">
            <h2 class="text-center mb-4">Productos Destacados</h2>
            <div id="productosDestacados" class="row g-4">
                <div class="loading-spinner">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Inicializar carrusel si no está inicializado
    if (!carouselInitialized) {
        const carousel = new bootstrap.Carousel(document.getElementById('ofertasCarousel'));
        carouselInitialized = true;
    }

    try {
        const data = await fetchAPI('/api/productos/destacados');
        
        if (data.success && data.productos) {
            mostrarProductosDestacados(data.productos);
        } else {
            throw new Error('Formato de respuesta inválido');
        }
    } catch (error) {
        console.error('❌ Error:', error);
        document.getElementById('productosDestacados').innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    No se pudieron cargar los productos
                </div>
                <button class="btn btn-primary mt-2" onclick="cargarInicio()">
                    <i class="fas fa-redo me-1"></i> Reintentar
                </button>
            </div>
        `;
    }
    }

    function cargarCategorias() {
    const contenedor = document.getElementById('contenidoPrincipal');
    contenedor.innerHTML = `
        <section class="categorias-section">
            <div class="container">
                <div class="section-title">
                    <h2>Todas las Categorías</h2>
                    <p>Selecciona una categoría para ver sus productos</p>
                </div>
                <div class="categorias-grid">
                    <div class="categoria-card" onclick="filtrarPorCategoria('FRUTAS')">
                        <div class="categoria-nombre">
                            <i class="fas fa-apple-alt me-2"></i>Frutas y Verduras
                        </div>
                        <div class="categoria-descripcion">Productos frescos de temporada</div>
                    </div>
                    <div class="categoria-card" onclick="filtrarPorCategoria('LACTEOS')">
                        <div class="categoria-nombre">
                            <i class="fas fa-cheese me-2"></i>Lácteos y Huevos
                        </div>
                        <div class="categoria-descripcion">Leche, queso, yogurt y más</div>
                    </div>
                    <div class="categoria-card" onclick="filtrarPorCategoria('CARNES')">
                        <div class="categoria-nombre">
                            <i class="fas fa-drumstick-bite me-2"></i>Carnes y Pescados
                        </div>
                        <div class="categoria-descripcion">Cortes frescos y mariscos</div>
                    </div>
                    <div class="categoria-card" onclick="filtrarPorCategoria('PANADERIA')">
                        <div class="categoria-nombre">
                            <i class="fas fa-bread-slice me-2"></i>Panadería
                        </div>
                        <div class="categoria-descripcion">Pan, pasteles y repostería</div>
                    </div>
                    <div class="categoria-card" onclick="filtrarPorCategoria('BEBIDAS')">
                        <div class="categoria-nombre">
                            <i class="fas fa-wine-bottle me-2"></i>Bebidas
                        </div>
                        <div class="categoria-descripcion">Jugos, refrescos y más</div>
                    </div>
                    <div class="categoria-card" onclick="filtrarPorCategoria('DESPENSA')">
                        <div class="categoria-nombre">
                            <i class="fas fa-utensils me-2"></i>Despensa
                        </div>
                        <div class="categoria-descripcion">Productos básicos y enlatados</div>
                    </div>
                </div>
            </div>
        </section>
    `;
    }

    // ============================================
    // FILTRADO POR CATEGORÍA - VERSIÓN CORREGIDA
    // ============================================

    async function filtrarPorCategoria(categoriaKey) {
    console.log('🔍 Filtrando por categoría:', categoriaKey);

    // ✅ CAMBIO 1: Verificar que el contenedor exista
    const contenedor = document.getElementById('contenidoPrincipal');

    if (!contenedor) {
    console.error('❌ No se encontró el contenedor principal');
    showToast('Error: Contenedor no encontrado', 'danger');
    return;
    }

    // Mapeo de nombres de botones a IDs en BD
    const mapeoCategoria = {
    'FRUTAS': { id: 1, nombre: 'Frutas y Verduras', icon: 'fa-apple-alt' },
    'LACTEOS': { id: 4, nombre: 'Lácteos y Huevos', icon: 'fa-cheese' },
    'PANADERIA': { id: 2, nombre: 'Panadería', icon: 'fa-bread-slice' },
    'BEBIDAS': { id: 3, nombre: 'Bebidas', icon: 'fa-wine-bottle' },
    'DESPENSA': { id: 6, nombre: 'Despensa', icon: 'fa-utensils' } // Solo si existe en tu BD
    };

    const categoria = mapeoCategoria[categoriaKey];

    if (!categoria) {
    console.error('❌ Categoría no encontrada:', categoriaKey);
    showToast('Categoría no encontrada', 'warning');
    return;
    }

    console.log('✅ Categoría seleccionada:', categoria);

    // ✅ CAMBIO 2: Mostrar loading inmediatamente
    contenedor.innerHTML = `
    <div class="container mt-4 mb-5">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>
                <i class="fas ${categoria.icon} me-2"></i>
                ${categoria.nombre}
            </h2>
            <button class="btn btn-outline-secondary" onclick="cargarProductos()">
                <i class="fas fa-arrow-left me-1"></i> Volver
            </button>
        </div>
        
        <!-- Filtros de categoría -->
        <div class="mb-4">
            <div class="btn-group flex-wrap" role="group">
                <button class="btn btn-outline-primary" onclick="cargarProductos()">
                    <i class="fas fa-th me-1"></i>Todos
                </button>
                <button class="btn ${categoriaKey === 'FRUTAS' ? 'btn-primary' : 'btn-outline-primary'}" 
                        onclick="filtrarPorCategoria('FRUTAS')">
                    <i class="fas fa-apple-alt me-1"></i>Frutas
                </button>
                <button class="btn ${categoriaKey === 'LACTEOS' ? 'btn-primary' : 'btn-outline-primary'}" 
                        onclick="filtrarPorCategoria('LACTEOS')">
                    <i class="fas fa-cheese me-1"></i>Lácteos
                </button>
                <button class="btn ${categoriaKey === 'PANADERIA' ? 'btn-primary' : 'btn-outline-primary'}" 
                        onclick="filtrarPorCategoria('PANADERIA')">
                    <i class="fas fa-bread-slice me-1"></i>Panadería
                </button>
                <button class="btn ${categoriaKey === 'BEBIDAS' ? 'btn-primary' : 'btn-outline-primary'}" 
                        onclick="filtrarPorCategoria('BEBIDAS')">
                    <i class="fas fa-wine-bottle me-1"></i>Bebidas
                </button>
            </div>
        </div>
        
        <div id="productosCategoria" class="row g-4">
            <div class="col-12">
                <div class="loading-spinner">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando productos...</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    try {
    console.log(`📡 Solicitando productos de categoría ID: ${categoria.id}`);

    // ✅ CAMBIO 3: Llamar al endpoint correcto
    const data = await fetchAPI(`/api/productos/categoria/${categoria.id}`);

    console.log('📦 Respuesta del servidor:', data);

    // ✅ CAMBIO 4: Verificar que productosCategoria aún exista
    const productosCategoriaDiv = document.getElementById('productosCategoria');

    if (!productosCategoriaDiv) {
        console.error('❌ El div productosCategoria desapareció');
        return;
    }

    if (data.success && data.productos && data.productos.length > 0) {
        console.log(`✅ ${data.productos.length} productos encontrados`);
        mostrarProductosCategoria(data.productos, categoria.nombre);
    } else {
        console.log('⚠️ No hay productos en esta categoría');
        productosCategoriaDiv.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-box-open fa-4x text-muted mb-3"></i>
                <h4>No hay productos disponibles</h4>
                <p class="text-muted">Esta categoría no tiene productos en este momento</p>
                <button class="btn btn-primary mt-3" onclick="cargarProductos()">
                    <i class="fas fa-arrow-left me-1"></i> Ver todos los productos
                </button>
            </div>
        `;
    }

    } catch (error) {
    console.error('❌ Error completo:', error);

    const productosCategoriaDiv = document.getElementById('productosCategoria');
    if (productosCategoriaDiv) {
        productosCategoriaDiv.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Error al cargar productos</strong><br>
                    ${error.message}
                </div>
                <button class="btn btn-primary mt-2" onclick="cargarProductos()">
                    <i class="fas fa-arrow-left me-1"></i> Volver a todos los productos
                </button>
            </div>
        `;
    }

    showToast('Error al cargar productos de la categoría', 'danger');
    }
    }

    function mostrarProductosCategoria(productos, categoriaNombre) {
    console.log('🎨 Mostrando productos de categoría:', categoriaNombre);
    console.log('📦 Productos recibidos:', productos.length);

    const container = document.getElementById('productosCategoria');

    if (!container) {
    console.error('❌ Contenedor productosCategoria no encontrado');
    return;
    }

    if (!productos || productos.length === 0) {
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <i class="fas fa-box-open fa-4x text-muted mb-3"></i>
            <h4>No hay productos en esta categoría</h4>
            <p class="text-muted">Prueba con otra categoría</p>
        </div>
    `;
    return;
    }

    const baseUrl = window.location.origin;

    container.innerHTML = productos.map(producto => {
    let imagenUrl;
    if (producto.imagenUrl) {
        if (producto.imagenUrl.startsWith('http')) {
            imagenUrl = producto.imagenUrl;
        } else if (producto.imagenUrl.startsWith('/')) {
            imagenUrl = `${baseUrl}${producto.imagenUrl}`;
        } else {
            imagenUrl = `${baseUrl}/uploads/productos/${producto.imagenUrl}`;
        }
    } else {
        imagenUrl = `${baseUrl}/uploads/productos/default.jpg`;
    }

    return `
    <div class="col-md-3 col-sm-6">
        <div class="card product-card h-100">
            <div class="product-badge">${categoriaNombre}</div>
            <img src="${imagenUrl}" 
                    class="card-img-top product-img" 
                    alt="${producto.nombre}"
                    onerror="this.src='https://via.placeholder.com/300?text=Sin+Imagen'">
            <div class="card-body d-flex flex-column">
                <h6 class="card-title">${producto.nombre}</h6>
                ${producto.descripcion ? `
                    <p class="card-text small flex-grow-1 text-muted">
                        ${producto.descripcion}
                    </p>
                ` : ''}
                <p class="card-text small text-muted mb-2">
                    Stock: <strong>${producto.stockActual || 0}</strong>
                </p>
                <div class="mt-auto">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="price fs-6">$${Number(producto.precioVenta).toLocaleString()}</span>
                    </div>
                    
                    <div class="input-group input-group-sm mb-2">
                        <button class="btn btn-outline-secondary" type="button" 
                                onclick="cambiarCantidad('cantidad-${producto.id}', -1, ${producto.stockActual})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" 
                                id="cantidad-${producto.id}" 
                                class="form-control text-center" 
                                value="1" 
                                min="1" 
                                max="${producto.stockActual}"
                                onchange="validarCantidad(this, ${producto.stockActual})"
                                onkeyup="validarCantidad(this, ${producto.stockActual})">
                        <button class="btn btn-outline-secondary" type="button" 
                                onclick="cambiarCantidad('cantidad-${producto.id}', 1, ${producto.stockActual})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    
                    <button class="btn btn-sm btn-primary w-100" 
                            onclick='agregarConCantidad(${JSON.stringify(producto).replace(/'/g, "\\'")})'>
                        <i class="fas fa-cart-plus"></i> Agregar
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;
    }).join('');

    console.log('✅ Productos renderizados correctamente');
    }

    // ============================================
    // FUNCIÓN DE BÚSQUEDA
    // ============================================

    /**
     * Busca productos por nombre o descripción
     * @param {Event} event - Evento del formulario
     */
    async function buscarProductos(event) {
    event.preventDefault(); // Evitar que el form recargue la página

    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();

    console.log('🔍 Buscando:', query);

    // Validar que haya texto
    if (!query || query.length < 2) {
    showToast('Escribe al menos 2 caracteres para buscar', 'warning');
    return;
    }

    const contenedor = document.getElementById('contenidoPrincipal');

    // Mostrar interfaz de búsqueda
    contenedor.innerHTML = `
    <div class="container mt-4 mb-5">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2>
                    <i class="fas fa-search me-2"></i>
                    Resultados de búsqueda
                </h2>
                <p class="text-muted mb-0">Buscando: "<strong>${query}</strong>"</p>
            </div>
            <button class="btn btn-outline-secondary" onclick="cargarProductos(); document.getElementById('searchInput').value = '';">
                <i class="fas fa-times me-1"></i> Limpiar búsqueda
            </button>
        </div>
        
        <div id="resultadosBusqueda" class="row g-4">
            <div class="col-12">
                <div class="loading-spinner">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Buscando...</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    try {
    // Llamar al endpoint de búsqueda
    const data = await fetchAPI(`/api/productos/buscar?q=${encodeURIComponent(query)}`);

    console.log('📦 Resultados encontrados:', data);

    const resultadosDiv = document.getElementById('resultadosBusqueda');

    if (!resultadosDiv) {
        console.error('❌ Div de resultados no encontrado');
        return;
    }

    if (data.success && data.productos && data.productos.length > 0) {
        console.log(`✅ ${data.productos.length} productos encontrados`);
        mostrarResultadosBusqueda(data.productos, query);
    } else {
        // No se encontraron resultados
        resultadosDiv.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-search fa-4x text-muted mb-3"></i>
                <h4>No se encontraron resultados</h4>
                <p class="text-muted">
                    No hay productos que coincidan con "<strong>${query}</strong>"
                </p>
                <button class="btn btn-primary mt-3" onclick="cargarProductos(); document.getElementById('searchInput').value = '';">
                    <i class="fas fa-arrow-left me-1"></i> Ver todos los productos
                </button>
            </div>
        `;
    }

    } catch (error) {
    console.error('❌ Error en búsqueda:', error);

    const resultadosDiv = document.getElementById('resultadosBusqueda');
    if (resultadosDiv) {
        resultadosDiv.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Error al buscar productos</strong><br>
                    ${error.message}
                </div>
                <button class="btn btn-primary mt-2" onclick="cargarProductos()">
                    <i class="fas fa-arrow-left me-1"></i> Volver a productos
                </button>
            </div>
        `;
    }

    showToast('Error al realizar la búsqueda', 'danger');
    }
    }

    /**
     * Muestra los resultados de la búsqueda
     * @param {Array} productos - Array de productos encontrados
     * @param {string} query - Término de búsqueda
     */
    function mostrarResultadosBusqueda(productos, query) {
    console.log('🎨 Mostrando resultados de búsqueda');

    const container = document.getElementById('resultadosBusqueda');

    if (!container) {
    console.error('❌ Contenedor de resultados no encontrado');
    return;
    }

    if (!productos || productos.length === 0) {
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <i class="fas fa-search fa-4x text-muted mb-3"></i>
            <h4>No se encontraron resultados</h4>
            <p class="text-muted">Intenta con otros términos de búsqueda</p>
        </div>
    `;
    return;
    }

    const baseUrl = window.location.origin;

    // Resaltar el término de búsqueda en los resultados
    const highlightQuery = (text) => {
    if (!text || !query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
    };

    container.innerHTML = `
    <div class="col-12 mb-3">
        <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            Se encontraron <strong>${productos.length}</strong> producto${productos.length !== 1 ? 's' : ''}
        </div>
    </div>
    ${productos.map(producto => {
        let imagenUrl;
        if (producto.imagenUrl) {
            if (producto.imagenUrl.startsWith('http')) {
                imagenUrl = producto.imagenUrl;
            } else if (producto.imagenUrl.startsWith('/')) {
                imagenUrl = `${baseUrl}${producto.imagenUrl}`;
            } else {
                imagenUrl = `${baseUrl}/uploads/productos/${producto.imagenUrl}`;
            }
        } else {
            imagenUrl = `${baseUrl}/uploads/productos/default.jpg`;
        }

        return `
        <div class="col-md-3 col-sm-6">
            <div class="card product-card h-100">
                <img src="${imagenUrl}" 
                        class="card-img-top product-img" 
                        alt="${producto.nombre}"
                        onerror="this.src='https://via.placeholder.com/300?text=Sin+Imagen'">
                <div class="card-body d-flex flex-column">
                    <h6 class="card-title">${highlightQuery(producto.nombre)}</h6>
                    ${producto.descripcion ? `
                        <p class="card-text small flex-grow-1 text-muted">
                            ${highlightQuery(producto.descripcion)}
                        </p>
                    ` : ''}
                    <p class="card-text small text-muted mb-2">
                        Stock: <strong>${producto.stockActual || 0}</strong>
                    </p>
                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="price fs-6">$${Number(producto.precioVenta).toLocaleString()}</span>
                        </div>
                        
                        <div class="input-group input-group-sm mb-2">
                            <button class="btn btn-outline-secondary" type="button" 
                                    onclick="cambiarCantidad('cantidad-${producto.id}', -1, ${producto.stockActual})">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" 
                                    id="cantidad-${producto.id}" 
                                    class="form-control text-center" 
                                    value="1" 
                                    min="1" 
                                    max="${producto.stockActual}"
                                    onchange="validarCantidad(this, ${producto.stockActual})"
                                    onkeyup="validarCantidad(this, ${producto.stockActual})">
                            <button class="btn btn-outline-secondary" type="button" 
                                    onclick="cambiarCantidad('cantidad-${producto.id}', 1, ${producto.stockActual})">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        
                        <button class="btn btn-sm btn-primary w-100" 
                                onclick='agregarConCantidad(${JSON.stringify(producto).replace(/'/g, "\\'")})'>
                            <i class="fas fa-cart-plus"></i> Agregar
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('')}
    `;

    console.log('✅ Resultados renderizados correctamente');
    }

    /**
     * Búsqueda en tiempo real (opcional)
     */
    function inicializarBusquedaTiempoReal() {
    const searchInput = document.getElementById('searchInput');

    if (!searchInput) return;

    let timeoutId;

    searchInput.addEventListener('input', function() {
    clearTimeout(timeoutId);

    const query = this.value.trim();

    // Solo buscar si hay más de 2 caracteres
    if (query.length >= 3) {
        timeoutId = setTimeout(() => {
            // Crear un evento sintético para reutilizar buscarProductos
            const fakeEvent = new Event('submit');
            buscarProductos(fakeEvent);
        }, 500); // Esperar 500ms después de que el usuario deje de escribir
    }
    });
    }

    async function cargarProductos() {
    const contenedor = document.getElementById('contenidoPrincipal');
    contenedor.innerHTML = `
        <div class="container mt-4 mb-5">
            <h2 class="mb-4">Todos los Productos</h2>
            <div id="productosLista" class="row g-4">
                <div class="loading-spinner">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    try {
        console.log('Cargando todos los productos...');
        const data = await fetchAPI('/api/productos');
        console.log('✅ Productos recibidos:', data);
        
        if (data.success && data.productos) {
            mostrarListaProductos(data.productos);
        } else {
            throw new Error('Formato de respuesta inválido');
        }
    } catch (error) {
        console.error('❌ Error cargando productos:', error);
        document.getElementById('productosLista').innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Error al cargar los productos: ${error.message}
                </div>
                <button class="btn btn-outline-primary mt-2" onclick="cargarProductos()">
                    <i class="fas fa-redo me-1"></i> Reintentar
                </button>
            </div>
        `;
    }
    }

    async function cargarOfertas() {
    const contenedor = document.getElementById('contenidoPrincipal');
    contenedor.innerHTML = `
        <div class="container mt-4 mb-5">
            <h2 class="mb-4">Productos en Oferta</h2>
            <div id="productosOfertas" class="row g-4">
                <div class="loading-spinner">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    try {
        console.log('Cargando productos en oferta...');
        const data = await fetchAPI('/api/productos/ofertas');
        
        if (data.success && data.productos) {
            mostrarProductosOfertas(data.productos);
        } else {
            throw new Error('Formato de respuesta inválido');
        }
    } catch (error) {
        console.error('❌ Error cargando ofertas:', error);
        document.getElementById('productosOfertas').innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    No hay productos en oferta en este momento
                </div>
            </div>
        `;
    }
    }

    // ============================================
    // FUNCIONES PARA MOSTRAR PRODUCTOS
    // ============================================

    function mostrarProductosDestacados(productos) {
    const container = document.getElementById('productosDestacados');

    if (!productos || productos.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p>No hay productos disponibles</p></div>';
        return;
    }

    const baseUrl = window.location.origin;

    container.innerHTML = productos.map(producto => {
        let imagenUrl;
        if (producto.imagenUrl) {
            if (producto.imagenUrl.startsWith('http')) {
                imagenUrl = producto.imagenUrl;
            } else if (producto.imagenUrl.startsWith('/')) {
                imagenUrl = `${baseUrl}${producto.imagenUrl}`;
            } else {
                imagenUrl = `${baseUrl}/uploads/productos/${producto.imagenUrl}`;
            }
        } else {
            imagenUrl = `${baseUrl}/uploads/productos/default.jpg`;
        }

        return `
        <div class="col-md-4">
            <div class="card product-card h-100">
                <img src="${imagenUrl}" 
                        class="card-img-top product-img" 
                        alt="${producto.nombre}"
                        onerror="this.src='https://via.placeholder.com/300?text=Sin+Imagen'">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${producto.nombre}</h5>
                    <p class="card-text flex-grow-1 small text-muted">
                        Stock disponible: <strong>${producto.stockActual || 0}</strong> unidades
                    </p>
                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="price">$${Number(producto.precioVenta).toLocaleString()}</span>
                        </div>
                        
                        <div class="input-group mb-2">
                            <button class="btn btn-outline-secondary" type="button" 
                                    onclick="cambiarCantidad('cantidad-${producto.id}', -1, ${producto.stockActual})">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" 
                                    id="cantidad-${producto.id}" 
                                    class="form-control text-center" 
                                    value="1" 
                                    min="1" 
                                    max="${producto.stockActual}"
                                    onchange="validarCantidad(this, ${producto.stockActual})"
                                    onkeyup="validarCantidad(this, ${producto.stockActual})">
                            <button class="btn btn-outline-secondary" type="button" 
                                    onclick="cambiarCantidad('cantidad-${producto.id}', 1, ${producto.stockActual})">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        
                        <button class="btn btn-primary w-100" 
                                onclick='agregarConCantidad(${JSON.stringify(producto).replace(/'/g, "\\'")})'>
                            <i class="fas fa-cart-plus me-1"></i> Agregar al Carrito
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
    }

    function mostrarListaProductos(productos) {
    console.log('📦 Productos recibidos:', productos);
    const container = document.getElementById('productosLista');

    if (!productos || !Array.isArray(productos)) {
        console.error('❌ productos no es un array válido:', productos);
        container.innerHTML = '<div class="col-12 text-center alert alert-danger">Error: Datos de productos inválidos</div>';
        return;
    }

    if (productos.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p>No hay productos disponibles</p></div>';
        return;
    }

    const baseUrl = window.location.origin;

    container.innerHTML = productos.map(producto => {
        let imagenUrl;
        if (producto.imagenUrl) {
            if (producto.imagenUrl.startsWith('http')) {
                imagenUrl = producto.imagenUrl;
            } else if (producto.imagenUrl.startsWith('/')) {
                imagenUrl = `${baseUrl}${producto.imagenUrl}`;
            } else {
                imagenUrl = `${baseUrl}/uploads/productos/${producto.imagenUrl}`;
            }
        } else {
            imagenUrl = `${baseUrl}/uploads/productos/default.jpg`;
        }

        return `
        <div class="col-md-3">
            <div class="card product-card h-100">
                <img src="${imagenUrl}" 
                        class="card-img-top product-img" 
                        alt="${producto.nombre}"
                        onerror="this.src='https://via.placeholder.com/300?text=Sin+Imagen'">
                <div class="card-body d-flex flex-column">
                    <h6 class="card-title">${producto.nombre}</h6>
                    <p class="card-text small flex-grow-1 text-muted">
                        Stock: <strong>${producto.stockActual || 0}</strong>
                    </p>
                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="price fs-6">$${Number(producto.precioVenta).toLocaleString()}</span>
                        </div>
                        
                        <div class="input-group input-group-sm mb-2">
                            <button class="btn btn-outline-secondary" type="button" 
                                    onclick="cambiarCantidad('cantidad-${producto.id}', -1, ${producto.stockActual})">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" 
                                    id="cantidad-${producto.id}" 
                                    class="form-control text-center" 
                                    value="1" 
                                    min="1" 
                                    max="${producto.stockActual}"
                                    onchange="validarCantidad(this, ${producto.stockActual})"
                                    onkeyup="validarCantidad(this, ${producto.stockActual})">
                            <button class="btn btn-outline-secondary" type="button" 
                                    onclick="cambiarCantidad('cantidad-${producto.id}', 1, ${producto.stockActual})">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        
                        <button class="btn btn-sm btn-primary w-100" 
                                onclick='agregarConCantidad(${JSON.stringify(producto).replace(/'/g, "\\'")})'>
                            <i class="fas fa-cart-plus"></i> Agregar
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
    }

    function mostrarProductosOfertas(productos) {
    const container = document.getElementById('productosOfertas');

    if (!productos || productos.length === 0) {
        container.innerHTML = '<div class="col-12 text-center"><p>No hay productos en oferta en este momento</p></div>';
        return;
    }

    const baseUrl = window.location.origin;

    container.innerHTML = productos.map(producto => {
        let imagenUrl;
        if (producto.imagenUrl) {
            if (producto.imagenUrl.startsWith('http')) {
                imagenUrl = producto.imagenUrl;
            } else if (producto.imagenUrl.startsWith('/')) {
                imagenUrl = `${baseUrl}${producto.imagenUrl}`;
            } else {
                imagenUrl = `${baseUrl}/uploads/productos/${producto.imagenUrl}`;
            }
        } else {
            imagenUrl = `${baseUrl}/uploads/productos/default.jpg`;
        }

        // Calcular descuento si hay precio anterior
        const descuento = producto.precioAnterior ? 
            Math.round(((producto.precioAnterior - producto.precioVenta) / producto.precioAnterior) * 100) : 0;

        return `
        <div class="col-md-4">
            <div class="card product-card h-100">
                ${descuento > 0 ? `
                    <div class="badge-oferta">
                        -${descuento}%
                    </div>
                ` : ''}
                <img src="${imagenUrl}" 
                        class="card-img-top product-img" 
                        alt="${producto.nombre}"
                        onerror="this.src='https://via.placeholder.com/300?text=Sin+Imagen'">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${producto.nombre}</h5>
                    <p class="card-text flex-grow-1 small text-muted">
                        Stock disponible: <strong>${producto.stockActual || 0}</strong> unidades
                    </p>
                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <span class="price">$${Number(producto.precioVenta).toLocaleString()}</span>
                            ${producto.precioAnterior ? `
                                <span class="text-muted text-decoration-line-through small">
                                    $${Number(producto.precioAnterior).toLocaleString()}
                                </span>
                            ` : ''}
                        </div>
                        
                        <div class="input-group mb-2">
                            <button class="btn btn-outline-secondary" type="button" 
                                    onclick="cambiarCantidad('cantidad-${producto.id}', -1, ${producto.stockActual})">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input type="number" 
                                    id="cantidad-${producto.id}" 
                                    class="form-control text-center" 
                                    value="1" 
                                    min="1" 
                                    max="${producto.stockActual}"
                                    onchange="validarCantidad(this, ${producto.stockActual})"
                                    onkeyup="validarCantidad(this, ${producto.stockActual})">
                            <button class="btn btn-outline-secondary" type="button" 
                                    onclick="cambiarCantidad('cantidad-${producto.id}', 1, ${producto.stockActual})">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        
                        <button class="btn btn-primary w-100" 
                                onclick='agregarConCantidad(${JSON.stringify(producto).replace(/'/g, "\\'")})'>
                            <i class="fas fa-cart-plus me-1"></i> Agregar al Carrito
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
    }

    // ============================================
    // FUNCIONES DE CANTIDAD
    // ============================================

    function cambiarCantidad(inputId, cambio, stockMax) {
    const input = document.getElementById(inputId);
    if (!input) return;

    let cantidad = parseInt(input.value) || 1;
    cantidad += cambio;

    // Validar límites
    if (cantidad < 1) cantidad = 1;
    if (cantidad > stockMax) {
        cantidad = stockMax;
        showToast(`Stock máximo: ${stockMax} unidades`, 'warning');
    }

    input.value = cantidad;
    }

    function validarCantidad(input, stockMax) {
    let cantidad = parseInt(input.value) || 1;

    if (cantidad < 1) {
        cantidad = 1;
        showToast('La cantidad mínima es 1', 'warning');
    }

    if (cantidad > stockMax) {
        cantidad = stockMax;
        showToast(`Stock máximo: ${stockMax} unidades`, 'warning');
    }

    input.value = cantidad;
    }

    function agregarConCantidad(producto) {
    const input = document.getElementById(`cantidad-${producto.id}`);
    const cantidad = parseInt(input.value) || 1;

    // Validar stock
    if (cantidad > producto.stockActual) {
        showToast(`Solo hay ${producto.stockActual} unidades disponibles`, 'warning');
        return;
    }

    // Agregar al carrito con la cantidad seleccionada
    agregarAlCarrito(producto, cantidad);

    // Resetear el input a 1
    input.value = 1;
    }

    // ============================================
    // FUNCIONES DEL CARRITO 
    // ============================================


    function modificarCantidadCarrito(id, cambio) {
    console.log('🔄 Modificando cantidad:', { id, cambio });

    const itemIndex = cart.findIndex(item => item.id === id);
    if (itemIndex !== -1) {
    const item = cart[itemIndex];
    const nuevaCantidad = item.cantidad + cambio;

    // Validar límites
    if (nuevaCantidad < 1) {
        eliminarDelCarrito(id);
        return;
    }

    if (nuevaCantidad > item.stock) {
        showToast(`No hay suficiente stock. Máximo: ${item.stock} unidades`, 'warning');
        return;
    }

    item.cantidad = nuevaCantidad;
    guardarCarrito();
    actualizarContadorCarrito();
    mostrarCarrito(); // Refrescar la vista del carrito

    // Efecto visual
    const cartCount = document.getElementById('carritoCount');
    if (cartCount) {
        cartCount.classList.add('cart-count-updated');
        setTimeout(() => {
            cartCount.classList.remove('cart-count-updated');
        }, 500);
    }
    }
    }

    function eliminarDelCarrito(id) {
    console.log('🗑️ Eliminando producto:', id);

    // Encontrar el producto para mostrar mensaje
    const producto = cart.find(item => item.id === id);

    cart = cart.filter(item => item.id !== id);
    guardarCarrito();
    actualizarContadorCarrito();
    mostrarCarrito(); // Refrescar la vista del carrito

    if (producto) {
    showToast(`${producto.nombre} eliminado del carrito`, 'info');
    }
    }

    function actualizarContadorCarrito() {
    const counter = document.getElementById('carritoCount');
    if (counter) {
    const total = cart.reduce((sum, item) => sum + item.cantidad, 0);
    counter.textContent = total;
    counter.style.display = total > 0 ? 'inline' : 'none';

    // Efecto visual cuando se actualiza
    if (total > 0) {
        counter.classList.add('cart-count-updated');
        setTimeout(() => {
            counter.classList.remove('cart-count-updated');
        }, 500);
    }
    }
    }

    function guardarCarrito() {
    try {
    localStorage.setItem('supermercado_cart', JSON.stringify(cart));
    console.log('💾 Carrito guardado:', cart);
    } catch (error) {
    console.error('Error guardando carrito:', error);
    showToast('Error al guardar el carrito', 'danger');
    }
    }

    // Función para agregar productos al carrito (también corregida)
    function agregarAlCarrito(producto) {
    try {
    console.log('🛒 Agregando producto:', producto);

    if (!producto || !producto.id) {
        showToast('Producto inválido', 'danger');
        return;
    }

    const input = document.getElementById(`cantidad-${producto.id}`);
    const cantidad = input ? parseInt(input.value) || 1 : 1;

    // Validar stock
    if (cantidad > producto.stockActual) {
        showToast(`Solo hay ${producto.stockActual} unidades disponibles`, 'warning');
        return;
    }

    // Buscar si el producto ya está en el carrito
    const existenteIndex = cart.findIndex(item => item.id === producto.id);

    if (existenteIndex !== -1) {
        // Producto ya existe, actualizar cantidad
        cart[existenteIndex].cantidad += cantidad;
        
        // Validar que no exceda el stock
        if (cart[existenteIndex].cantidad > producto.stockActual) {
            cart[existenteIndex].cantidad = producto.stockActual;
            showToast(`Stock máximo alcanzado: ${producto.stockActual} unidades`, 'warning');
        } else {
            showToast(`Cantidad actualizada de ${producto.nombre}`, 'success');
        }
    } else {
        // Producto nuevo, agregar al carrito
        cart.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: Number(producto.precioVenta),
            cantidad: cantidad,
            imagen: producto.imagenUrl || 'https://via.placeholder.com/80',
            stock: producto.stockActual || 0
        });
        showToast(`${producto.nombre} agregado al carrito`, 'success');
    }

    guardarCarrito();
    actualizarContadorCarrito();

    // Efecto visual en el icono del carrito
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        cartIcon.classList.add('cart-item-added');
        setTimeout(() => {
            cartIcon.classList.remove('cart-item-added');
        }, 300);
    }

    } catch (error) {
    console.error('Error:', error);
    showToast('Error al agregar producto', 'danger');
    }
    }

    // Función mostrarCarrito actualizada para asegurar que los botones funcionen
    function mostrarCarrito() {
    console.log('🛒 Mostrando carrito:', cart);

    const content = document.getElementById('carritoContent');
    const totalElement = document.getElementById('carritoTotal');

    if (!cart || cart.length === 0) {
    content.innerHTML = `
        <div class="empty-cart">
            <i class="fas fa-shopping-cart"></i>
            <h5>Tu carrito está vacío</h5>
            <p>Agrega algunos productos para comenzar</p>
            <button class="btn cart-btn-primary mt-3" data-bs-dismiss="modal">
                <i class="fas fa-store me-2"></i>Comenzar a Comprar
            </button>
        </div>
    `;
    totalElement.textContent = '0';
    } else {
    let html = '';
    let total = 0;

    cart.forEach((item) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        html += `
            <div class="cart-item">
                <div class="cart-item-img-container">
                    <div style="position: relative;">
                        <img src="${item.imagen}" alt="${item.nombre}" class="cart-item-img"
                                onerror="this.src='https://via.placeholder.com/150?text=Producto'">
                    </div>
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.nombre}</div>
                        <div class="cart-item-price">$${item.precio.toLocaleString()} c/u</div>
                        <div class="cart-item-meta">Stock disponible: ${item.stock} unidades</div>
                    </div>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button class="quantity-btn" 
                                onclick="modificarCantidadCarrito(${item.id}, -1)"
                                ${item.cantidad <= 1 ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity-display">${item.cantidad}</span>
                        <button class="quantity-btn" 
                                onclick="modificarCantidadCarrito(${item.id}, 1)"
                                ${item.cantidad >= item.stock ? 'disabled' : ''}>
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="cart-item-total">$${subtotal.toLocaleString()}</div>
                    <button class="delete-btn" onclick="eliminarDelCarrito(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    // Agregar sección de total
    html += `
        <div class="cart-total">
            <div class="cart-total-content">
                <span class="cart-total-label">Total a pagar:</span>
                <span class="cart-total-amount">$${total.toLocaleString()}</span>
            </div>
        </div>
        <div class="cart-actions">
            <button class="cart-btn cart-btn-secondary" data-bs-dismiss="modal">
                <i class="fas fa-arrow-left me-2"></i>Seguir Comprando
            </button>
            <button class="cart-btn cart-btn-primary" onclick="procesarCompra()">
                <i class="fas fa-credit-card me-2"></i>Finalizar Compra
            </button>
        </div>
    `;

    content.innerHTML = html;
    totalElement.textContent = total.toLocaleString();
    }

    // Mostrar el modal
    const modalElement = document.getElementById('carritoModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    }



    // Función para cambiar cantidad en los inputs de productos (si la necesitas)
    function cambiarCantidad(inputId, cambio, stockMax) {
    const input = document.getElementById(inputId);
    if (!input) return;

    let cantidad = parseInt(input.value) || 1;
    cantidad += cambio;

    // Validar límites
    if (cantidad < 1) cantidad = 1;
    if (cantidad > stockMax) {
    cantidad = stockMax;
    showToast(`Stock máximo: ${stockMax} unidades`, 'warning');
    }

    input.value = cantidad;
    }

    // Función showToast (asegúrate de que esté definida)
    function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    const toastId = 'toast-' + Date.now();
    const icons = {
    success: 'check-circle', 
    danger: 'exclamation-circle', 
    warning: 'exclamation-triangle', 
    info: 'info-circle'
    };

    toastContainer.insertAdjacentHTML('beforeend', `
    <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0">
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-${icons[type]} me-2"></i>${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    </div>
    `);

    const toast = new bootstrap.Toast(document.getElementById(toastId), {delay: 3000});
    toast.show();

    document.getElementById(toastId).addEventListener('hidden.bs.toast', function() {
    this.remove();
    });
    }



    // ============================================
    // FUNCIONES DE PAGO
    // ============================================

    function procesarCompra() {
    if (!window.cart || window.cart.length === 0) {
        showToast('El carrito está vacío', 'warning');
        return;
    }

    // Verificar si hay usuario logueado
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user) {
        showToast('Debes iniciar sesión para continuar con la compra', 'warning');
        setTimeout(() => {
            mostrarFormularioLogin();
        }, 1500);
        return;
    }

    // Calcular total
    const total = window.cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    // Guardar información de la compra antes de ir a pagar
    const infoCompra = {
        items: window.cart,
        total: total,
        userId: user.id,
        userEmail: user.email,
        userName: user.nombre,
        fecha: new Date().toISOString()
    };

    localStorage.setItem('compra_pendiente', JSON.stringify(infoCompra));

    // Cerrar modal del carrito
    const modal = bootstrap.Modal.getInstance(document.getElementById('carritoModal'));
    if (modal) modal.hide();

    // Ir a la página de pago
    irAPaginaPago();
    }

    function irAPaginaPago() {
    try {
        // 1. Validar compra
        const compra = JSON.parse(localStorage.getItem('compra_pendiente'));
        
        if (!compra || !compra.items || compra.items.length === 0) {
            showToast('Error: No hay información de compra', 'danger');
            return;
        }
        
        // 2. Validar que hay usuario
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Debes iniciar sesión para continuar', 'warning');
            mostrarFormularioLogin();
            return;
        }
        
        // 3. Determinar URL base
        let baseUrl;
        
        // Prioridad 1: CONFIG
        if (window.CONFIG?.api?.baseUrl) {
            baseUrl = window.CONFIG.api.baseUrl;
        }
        // Prioridad 2: window.location.origin (automático)
        else {
            baseUrl = window.location.origin;
        }
        
        // 4. Construir URL de pago
        const pagoUrl = `${baseUrl}/pago.html`;
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔗 Redirigiendo a página de pago');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Base URL:', baseUrl);
        console.log('Pago URL:', pagoUrl);
        console.log('Hostname:', window.location.hostname);
        console.log('Total compra:', compra.total);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // 5. Redirigir
        window.location.href = pagoUrl;
        
    } catch (error) {
        console.error('❌ Error al ir a página de pago:', error);
        showToast('Error al procesar la compra', 'danger');
    }
    }

    function verificarPagoRetorno() {
    // Obtener parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const transactionId = urlParams.get('id');

    if (status && transactionId) {
        if (status === 'APPROVED') {
            limpiarCompraPendiente();
            showToast('¡Pago exitoso! Gracias por tu compra', 'success');
            
            // Mostrar confirmación
            mostrarConfirmacionPago(transactionId, 'success');
        } else if (status === 'PENDING') {
            showToast('Tu pago está pendiente de confirmación', 'warning');
            mostrarConfirmacionPago(transactionId, 'pending');
        } else {
            showToast('El pago no pudo ser procesado', 'danger');
            mostrarConfirmacionPago(transactionId, 'error');
        }
        
        // Limpiar URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    }

    function limpiarCompraPendiente() {
    localStorage.removeItem('compra_pendiente');
    window.cart = [];
    guardarCarrito();
    actualizarContadorCarrito();
    }

    function mostrarConfirmacionPago(transactionId, estado) {
    const contenedor = document.getElementById('contenidoPrincipal');

    const iconos = {
        success: { icon: 'fa-check-circle', color: 'success', titulo: '¡Pago Exitoso!' },
        pending: { icon: 'fa-clock', color: 'warning', titulo: 'Pago Pendiente' },
        error: { icon: 'fa-times-circle', color: 'danger', titulo: 'Pago Rechazado' }
    };

    const info = iconos[estado] || iconos.error;

    contenedor.innerHTML = `
        <div class="container mt-5 mb-5">
            <div class="row justify-content-center">
                <div class="col-md-6">
                    <div class="card shadow-lg text-center">
                        <div class="card-body p-5">
                            <i class="fas ${info.icon} fa-5x text-${info.color} mb-4"></i>
                            <h2 class="mb-3">${info.titulo}</h2>
                            <p class="text-muted mb-4">ID de Transacción: ${transactionId}</p>
                            
                            ${estado === 'success' ? `
                                <div class="alert alert-success">
                                    Tu pedido será procesado en breve. Recibirás un correo de confirmación.
                                </div>
                            ` : estado === 'pending' ? `
                                <div class="alert alert-warning">
                                    Tu pago está siendo verificado. Te notificaremos cuando sea confirmado.
                                </div>
                            ` : `
                                <div class="alert alert-danger">
                                    Hubo un problema con tu pago. Por favor intenta nuevamente.
                                </div>
                            `}
                            
                            <button class="btn btn-primary btn-lg mt-3" onclick="cargarInicio()">
                                <i class="fas fa-home me-2"></i>Volver al Inicio
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    }

    // Nueva función para ir a la página de confirmación de pago
    function irAPaginaConfirmacionPago() {
    try {
    // 1. Validar que hay información de compra procesada
    const compraProcesada = localStorage.getItem('compra_procesada');
    const resultadoPago = localStorage.getItem('resultado_pago');

    if (!compraProcesada && !resultadoPago) {
        showToast('No hay información de pago procesado', 'warning');
        // Redirigir al inicio si no hay datos de pago
        setTimeout(() => {
            cargarInicio();
        }, 2000);
        return;
    }

    // 2. Validar que hay usuario (opcional, pero recomendado)
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Sesión expirada', 'warning');
        mostrarFormularioLogin();
        return;
    }

    // 3. Determinar URL base
    let baseUrl;

    // Prioridad 1: CONFIG
    if (window.CONFIG?.api?.baseUrl) {
        baseUrl = window.CONFIG.api.baseUrl;
    }
    // Prioridad 2: window.location.origin (automático)
    else {
        baseUrl = window.location.origin;
    }

    // 4. Construir URL de confirmación
    const confirmacionUrl = `${baseUrl}/confir_pago.html`;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Redirigiendo a confirmación de pago');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Base URL:', baseUrl);
    console.log('URL Confirmación:', confirmacionUrl);
    console.log('Hostname:', window.location.hostname);

    // Log información de la compra procesada
    if (compraProcesada) {
        const compra = JSON.parse(compraProcesada);
        console.log('Compra procesada:', compra);
    }

    if (resultadoPago) {
        const resultado = JSON.parse(resultadoPago);
        console.log('Resultado pago:', resultado);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 5. Redirigir
    window.location.href = confirmacionUrl;

    } catch (error) {
    console.error('❌ Error al ir a página de confirmación:', error);
    showToast('Error al acceder a la confirmación', 'danger');

    // Fallback: redirigir al inicio
    setTimeout(() => {
        cargarInicio();
    }, 3000);
    }
    }

    // Función para guardar datos de pago procesado (usar después del pago exitoso)
    function guardarDatosPagoProcesado(datosPago) {
    try {
    // Guardar información del pago procesado
    localStorage.setItem('compra_procesada', JSON.stringify(datosPago.compra));
    localStorage.setItem('resultado_pago', JSON.stringify(datosPago.resultado));
    localStorage.setItem('fecha_procesamiento', new Date().toISOString());

    console.log('✅ Datos de pago guardados para confirmación');

    } catch (error) {
    console.error('❌ Error guardando datos de pago:', error);
    }
    }

    // Función para cargar datos en la página de confirmación (usar en confir_pago.html)
    function cargarDatosConfirmacionPago() {
    try {
    const compraProcesada = JSON.parse(localStorage.getItem('compra_procesada') || 'null');
    const resultadoPago = JSON.parse(localStorage.getItem('resultado_pago') || 'null');
    const fechaProcesamiento = localStorage.getItem('fecha_procesamiento');

    if (!compraProcesada && !resultadoPago) {
        console.warn('⚠️ No hay datos de confirmación disponibles');
        return null;
    }

    const datosConfirmacion = {
        compra: compraProcesada,
        resultado: resultadoPago,
        fechaProcesamiento: fechaProcesamiento,
        numeroReferencia: generarNumeroReferencia()
    };

    console.log('📋 Datos de confirmación cargados:', datosConfirmacion);
    return datosConfirmacion;

    } catch (error) {
    console.error('❌ Error cargando datos de confirmación:', error);
    return null;
    }
    }

    // Función auxiliar para generar número de referencia
    function generarNumeroReferencia() {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 10000);
    return `REF-${timestamp}-${random}`;
    }

    // Función para limpiar datos de confirmación después de mostrar
    function limpiarDatosConfirmacion() {
    try {
    localStorage.removeItem('compra_procesada');
    localStorage.removeItem('resultado_pago');
    localStorage.removeItem('fecha_procesamiento');
    console.log('🧹 Datos de confirmación limpiados');
    } catch (error) {
    console.error('Error limpiando datos de confirmación:', error);
    }
    }

    // Función para procesar retorno de pago (usar en index.html al cargar)
    function procesarRetornoPago() {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const transactionId = urlParams.get('transaction_id');
    const reference = urlParams.get('reference');

    if (status && transactionId) {
    console.log('🔄 Procesando retorno de pago:', { status, transactionId, reference });

    // Aquí puedes manejar el retorno desde la pasarela de pago
    if (status === 'approved') {
        // Pago exitoso, preparar datos para confirmación
        const compraPendiente = JSON.parse(localStorage.gextItem('compra_pendiente') || 'null');
        
        if (compraPendiente) {
            const datosPago = {
                compra: compraPendiente,
                resultado: {
                    status: 'approved',
                    transactionId: transactionId,
                    reference: reference,
                    fecha: new Date().toISOString()
                }
            };
            
            guardarDatosPagoProcesado(datosPago);
            limpiarCompraPendiente();
            
            // Redirigir a confirmación
            setTimeout(() => {
                irAPaginaConfirmacionPago();
            }, 1000);
        }
    } else {
        // Pago fallido
        showToast('El pago no pudo ser procesado', 'danger');
    }

    // Limpiar parámetros de URL
    window.history.replaceState({}, document.title, window.location.pathname);
    }
    }

    // ============================================
    // FUNCIONES DE AUTENTICACIÓN
    // ============================================

    function verificarSesion() {
    const token = localStorage.getItem('token');
    if (token) {
        mostrarPerfil();
    } else {
        mostrarFormularioLogin();
    }
    }

    function mostrarFormularioLogin() {
    const contenedor = document.getElementById('contenidoPrincipal');
    contenedor.innerHTML = `
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-6 col-lg-5">
                    <div class="card shadow-lg border-0">
                        <div class="card-header bg-primary text-white text-center py-3">
                            <h4 class="mb-0"><i class="fas fa-sign-in-alt me-2"></i>Iniciar Sesión</h4>
                        </div>
                        <div class="card-body p-4">
                            <div id="loginAlert"></div>
                            
                            <form id="loginForm" onsubmit="procesarLogin(event)">
                                <div class="mb-3">
                                    <label class="form-label">
                                        <i class="fas fa-envelope me-1"></i> Email
                                    </label>
                                    <input type="email" class="form-control" id="loginEmail" required placeholder="tu@email.com">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">
                                        <i class="fas fa-lock me-1"></i> Contraseña
                                    </label>
                                    <input type="password" class="form-control" id="loginPassword" required placeholder="••••••••">
                                </div>
                                
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-primary" id="loginBtn">
                                        <i class="fas fa-sign-in-alt me-1"></i> Iniciar Sesión
                                    </button>
                                </div>
                            </form>
                            
                            <hr class="my-4">
                            
                            <div class="text-center">
                                <p class="mb-2">¿No tienes cuenta?</p>
                                <button class="btn btn-outline-primary" onclick="mostrarFormularioRegistro()">
                                    <i class="fas fa-user-plus me-1"></i> Registrarse
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    }

    function mostrarFormularioRegistro() {
    const contenedor = document.getElementById('contenidoPrincipal');
    contenedor.innerHTML = `
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-8 col-lg-6">
                    <div class="card shadow-lg border-0">
                        <div class="card-header bg-success text-white text-center py-3">
                            <h4 class="mb-0"><i class="fas fa-user-plus me-2"></i>Crear Cuenta</h4>
                        </div>
                        <div class="card-body p-4">
                            <div id="registerAlert"></div>
                            
                            <form id="registerForm" onsubmit="procesarRegistro(event)">
                                <div class="mb-3">
                                    <label class="form-label">
                                        <i class="fas fa-user me-1"></i> Nombre Completo
                                    </label>
                                    <input type="text" class="form-control" id="regNombre" required placeholder="Juan Pérez">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">
                                        <i class="fas fa-envelope me-1"></i> Email
                                    </label>
                                    <input type="email" class="form-control" id="regEmail" required placeholder="tu@email.com">
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">
                                            <i class="fas fa-lock me-1"></i> Contraseña
                                        </label>
                                        <input type="password" class="form-control" id="regPassword" required minlength="6" placeholder="Mínimo 6 caracteres">
                                    </div>
                                    
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">
                                            <i class="fas fa-lock me-1"></i> Confirmar Contraseña
                                        </label>
                                        <input type="password" class="form-control" id="regPasswordConfirm" required>
                                    </div>
                                </div>
                                
                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-success" id="registerBtn">
                                        <i class="fas fa-user-plus me-1"></i> Crear Cuenta
                                    </button>
                                </div>
                            </form>
                            
                            <hr class="my-4">
                            
                            <div class="text-center">
                                <p class="mb-2">¿Ya tienes cuenta?</p>
                                <button class="btn btn-outline-success" onclick="mostrarFormularioLogin()">
                                    <i class="fas fa-sign-in-alt me-1"></i> Iniciar Sesión
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    }

    async function procesarLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    const alert = document.getElementById('loginAlert');

    console.log('=== 🖥️ INICIO LOGIN FRONTEND ===');
    console.log('📧 Email a enviar:', email);
    console.log('🔑 Password a enviar:', password ? '***' : 'VACÍO');

    //Usar CONFIG que ya está definido globalmente
    const loginURL = `${window.CONFIG.api.baseUrl}/api/auth/login`;

    console.log('🌐 URL base desde CONFIG:', window.CONFIG.api.baseUrl);
    console.log('🎯 URL de login completa:', loginURL);

    // Guardar estado original del botón
    const originalBtnText = btn.innerHTML;
    const originalBtnState = btn.disabled;

    // Mostrar loading
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Iniciando...';
    alert.innerHTML = '';

    try {
        console.log ('🔍 Intentando login con:', { email });   

        const response = await fetch(loginURL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        console.log('📡 Respuesta del servidor:', {
            status: response.status,
            ok: response.ok,
        });

        // Verificar si la respuesta es JSON válido
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text();
            console.error('❌ El servidor no devolvió JSON:', textResponse.substring(0, 200));

            // Mostrar error específico según el status
            let errorMessage = 'Error del servidor';
            if (response.status === 404) {
                errorMessage = 'Servicio de autenticación no disponible (404)';
            } else if (response.status === 500) {
                errorMessage = 'Error interno del servidor (500)';
            } else {
                errorMessage = `Error ${response.status}: ${response.statusText}`;
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('📊 Datos recibidos:', data);

        if (response.ok && data.success) {
            console.log('✅ Login exitoso');

            // Guardar token y usuario
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.currentUser = data.user;
            
            showToast(`¡Bienvenido ${data.user.nombre}!`, 'success');
            
            // Limpiar alertas
            alert.innerHTML = '';

            // Cerrar modal de login si existe
            const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
            if (loginModal) {
                loginModal.hide();
            }
            
            // Recargar la página o contenido
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } else {
            const errorMessage = data.error || data.message || 'Error al iniciar sesión';
            console.error('❌ Error en login:', errorMessage);
            alert.innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;
        }    

    } catch (error) {
        console.error('💥 Error en login:', error);
        
        let errorMessage = 'Error de conexión con el servidor';
        
        if (error.message.includes('404')) {
            errorMessage = 'Servicio de autenticación no disponible';
        } else if (error.message.includes('500')) {
            errorMessage = 'Error interno del servidor';
        } else if (error.message.includes('JSON')) {
            errorMessage = 'Error en la respuesta del servidor';
        } else if (error.name === 'TypeError') {
            errorMessage = 'No se pudo conectar con el servidor';
        }    

        alert.innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;
    } finally {
        // Siempre restaurar el botón
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt me-1"></i> Iniciar Sesión';
    }
    }

    async function procesarRegistro(event) {
    event.preventDefault();

    const nombre = document.getElementById('regNombre').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    const btn = document.getElementById('registerBtn');
    const alert = document.getElementById('registerAlert');

    alert.innerHTML = '';

    if (password !== passwordConfirm) {
        alert.innerHTML = '<div class="alert alert-warning">Las contraseñas no coinciden</div>';
        return;
    }

    if (password.length < 6) {
        alert.innerHTML = '<div class="alert alert-warning">La contraseña debe tener al menos 6 caracteres</div>';
        return;
    }

    if (!nombre || !email) {
        alert.innerHTML = '<div class="alert alert-warning">Todos los campos son obligatorios</div>';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Creando cuenta...';

    try {
        // ✅ USAR fetchAPI EN LUGAR DE FETCH DIRECTO
        const data = await fetchAPI('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ nombre, email, password })
        });
        
        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.currentUser = data.user;
            
            showToast('¡Cuenta creada exitosamente!', 'success');
            cargarInicio();

            console.log('🔄 Iniciando registro...');
            console.log('📧 Email:', email);
            console.log('👤 Nombre:', nombre);
        } else {
            // Manejar errores del servidor
            const errorMessage = data.error || 'Error al crear cuenta';
            alert.innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;
            console.error('❌ Error del servidor:', errorMessage);                       
        }

    } catch (error) {
        console.error('💥 Error en registro:', error);
        
        let errorMessage = 'Error de conexión con el servidor';
        
        if (error.message.includes('Configuración')) {
            errorMessage = 'Error de configuración de la aplicación';
        } else if (error.message.includes('JSON')) {
            errorMessage = 'Error en la respuesta del servidor';
        } else if (error.name === 'TypeError') {
            errorMessage = 'No se pudo conectar con el servidor';
        }
        
        alert.innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-user-plus me-1"></i> Crear Cuenta';
    }
    }

    // ============================================
    // FUNCIONES DE PERFIL DE USUARIO
    // ============================================

    async function mostrarPerfil() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');

    if (!user || !token) {
        mostrarFormularioLogin();
        return;
    }

    const contenedor = document.getElementById('contenidoPrincipal');
    const baseUrl = window.location.origin;

    contenedor.innerHTML = `
        <div class="profile-header">
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-md-3 text-center">
                        <div class="profile-photo-container">
                            <img id="profilePhoto" class="profile-photo" 
                                    src="${user.foto_perfil || 'https://via.placeholder.com/150?text=Usuario'}" 
                                    alt="Foto de perfil">
                            <button class="photo-upload-btn" onclick="document.getElementById('photoInput').click()">
                                <i class="fas fa-camera"></i>
                            </button>
                            <input type="file" id="photoInput" accept="image/*" style="display: none" onchange="subirFotoPerfil(this)">
                        </div>
                    </div>
                    <div class="col-md-9">
                        <h2>${user.nombre}</h2>
                        <p class="mb-2">${user.email}</p>
                        <span id="levelBadge" class="level-badge level-bronce">Nivel ${user.nivel || 1} - Bronce</span>
                        <div class="mt-3">
                            <div class="progress-custom">
                                <div id="pointsProgress" class="progress-bar-custom" style="width: 0%">
                                    <span id="pointsText">0 / 100 puntos</span>
                                </div>
                            </div>
                            <small class="text-white">Próximo nivel: Plata (100 puntos)</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="container mb-5">
            <!-- Estadísticas -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-trophy text-warning"></i></div>
                        <h3>${user.puntos || 0}</h3>
                        <p class="text-muted mb-0">Puntos Totales</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-shopping-bag text-primary"></i></div>
                        <h3>${user.cantidad_compras || 0}</h3>
                        <p class="text-muted mb-0">Compras</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-dollar-sign text-success"></i></div>
                        <h3>$${Number(user.total_compras || 0).toLocaleString()}</h3>
                        <p class="text-muted mb-0">Total Gastado</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon"><i class="fas fa-percent text-danger"></i></div>
                        <h3 id="statDescuento">0%</h3>
                        <p class="text-muted mb-0">Descuento</p>
                    </div>
                </div>
            </div>

            <!-- Tabs -->
            <ul class="nav nav-tabs mb-4">
                <li class="nav-item">
                    <a class="nav-link active" data-bs-toggle="tab" href="#datosPersonales">
                        <i class="fas fa-user me-2"></i>Datos
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" data-bs-toggle="tab" href="#beneficios">
                        <i class="fas fa-gift me-2"></i>Beneficios
                    </a>
                </li>
            </ul>

            <div class="tab-content">
                <!-- Datos Personales -->
                <div id="datosPersonales" class="tab-pane fade show active">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between">
                            <h5 class="mb-0">Información Personal</h5>
                            <button class="btn btn-sm btn-primary" id="btnEditar" onclick="habilitarEdicion()">
                                <i class="fas fa-edit me-1"></i>Editar
                            </button>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label>Nombre</label>
                                    <input type="text" class="form-control" id="inputNombre" value="${user.nombre || ''}" disabled>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label>Email</label>
                                    <input type="email" class="form-control" id="inputEmail" value="${user.email || ''}" disabled>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label>Teléfono</label>
                                    <input type="tel" class="form-control" id="inputTelefono" value="${user.telefono || ''}" disabled>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label>Dirección</label>
                                    <input type="text" class="form-control" id="inputDireccion" value="${user.direccion || ''}" disabled>
                                </div>
                            </div>
                            <div id="botonesEdicion" style="display: none;">
                                <button class="btn btn-success" onclick="guardarCambiosPerfil()">
                                    <i class="fas fa-save me-1"></i>Guardar
                                </button>
                                <button class="btn btn-secondary" onclick="cancelarEdicion()">
                                    <i class="fas fa-times me-1"></i>Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Beneficios -->
                <div id="beneficios" class="tab-pane fade">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">Niveles y Beneficios</h5>
                        </div>
                        <div class="card-body">
                            <div class="benefit-item">
                                <div><span class="level-badge level-bronce">Bronce</span></div>
                                <div class="flex-grow-1 ms-3">
                                    <strong>0 puntos</strong> - 0% descuento
                                    <p class="mb-0 small text-muted">Cliente nuevo</p>
                                </div>
                                <i class="fas fa-trophy fa-2x text-warning"></i>
                            </div>
                            <div class="benefit-item">
                                <div><span class="level-badge level-plata">Plata</span></div>
                                <div class="flex-grow-1 ms-3">
                                    <strong>100 puntos</strong> - 5% descuento
                                    <p class="mb-0 small text-muted">5% en todas tus compras</p>
                                </div>
                                <i class="fas fa-trophy fa-2x text-warning"></i>
                            </div>
                            <div class="benefit-item">
                                <div><span class="level-badge level-oro">Oro</span></div>
                                <div class="flex-grow-1 ms-3">
                                    <strong>500 puntos</strong> - 10% descuento
                                    <p class="mb-0 small text-muted">10% + envío gratis</p>
                                </div>
                                <i class="fas fa-trophy fa-2x text-warning"></i>
                            </div>
                            <div class="benefit-item">
                                <div><span class="level-badge level-platino">Platino</span></div>
                                <div class="flex-grow-1 ms-3">
                                    <strong>1500 puntos</strong> - 15% descuento
                                    <p class="mb-0 small text-muted">15% + envío gratis + regalos</p>
                                </div>
                                <i class="fas fa-trophy fa-2x text-warning"></i>
                            </div>
                            <div class="benefit-item">
                                <div><span class="level-badge level-diamante">Diamante</span></div>
                                <div class="flex-grow-1 ms-3">
                                    <strong>5000 puntos</strong> - 20% descuento
                                    <p class="mb-0 small text-muted">20% + todos los beneficios</p>
                                </div>
                                <i class="fas fa-trophy fa-2x text-warning"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="text-center mt-4">
                <button class="btn btn-danger" onclick="cerrarSesion()">
                    <i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión
                </button>
            </div>
        </div>
    `;

    actualizarNivelYProgreso(user);
    }

    function actualizarNivelYProgreso(user) {
    const niveles = [
        { nivel: 1, nombre: 'Bronce', puntos: 0, descuento: 0, class: 'level-bronce' },
        { nivel: 2, nombre: 'Plata', puntos: 100, descuento: 5, class: 'level-plata' },
        { nivel: 3, nombre: 'Oro', puntos: 500, descuento: 10, class: 'level-oro' },
        { nivel: 4, nombre: 'Platino', puntos: 1500, descuento: 15, class: 'level-platino' },
        { nivel: 5, nombre: 'Diamante', puntos: 5000, descuento: 20, class: 'level-diamante' }   
    ];

    const puntos = user.puntos || 0;
    let nivelActual = niveles[0];
    let nivelSiguiente = niveles[1];

    // Encontrar nivel actual y siguiente
    for (let i = 0; i < niveles.length; i++) {
        if (puntos >= niveles[i].puntos) {
            nivelActual = niveles[i];
            nivelSiguiente = niveles[i + 1] || niveles[i];
        } else {
            break;
        }
    }

    // Calcular progreso
    const rangoPuntos = nivelSiguiente.puntos - nivelActual.puntos;
    const progreso = puntos - nivelActual.puntos;
    const porcentaje = rangoPuntos > 0 ? (progreso / rangoPuntos) * 100 : 100;

    // Actualizar UI
    const badge = document.getElementById('levelBadge');
    const progressBar = document.getElementById('pointsProgress');
    const progressText = document.getElementById('pointsText');
    const statDescuento = document.getElementById('statDescuento');

    if (badge) {
        badge.textContent = `Nivel ${nivelActual.nivel} - ${nivelActual.nombre}`;
        badge.className = `level-badge ${nivelActual.class}`;
    }

    if (progressBar) progressBar.style.width = porcentaje + '%';
    if (progressText) progressText.textContent = `${puntos} / ${nivelSiguiente.puntos} puntos`;
    if (statDescuento) statDescuento.textContent = `${nivelActual.descuento}%`;
    }

    function habilitarEdicion() {
    const user = JSON.parse(localStorage.getItem('user'));
    datosOriginalesPerfil = { ...user };

    document.getElementById('inputNombre').disabled = false;
    document.getElementById('inputTelefono').disabled = false;
    document.getElementById('inputDireccion').disabled = false;
    document.getElementById('btnEditar').style.display = 'none';
    document.getElementById('botonesEdicion').style.display = 'block';
    }

    function cancelarEdicion() {
    document.getElementById('inputNombre').value = datosOriginalesPerfil.nombre || '';
    document.getElementById('inputTelefono').value = datosOriginalesPerfil.telefono || '';
    document.getElementById('inputDireccion').value = datosOriginalesPerfil.direccion || '';

    document.getElementById('inputNombre').disabled = true;
    document.getElementById('inputTelefono').disabled = true;
    document.getElementById('inputDireccion').disabled = true;
    document.getElementById('btnEditar').style.display = 'block';
    document.getElementById('botonesEdicion').style.display = 'none';
    }

    async function guardarCambiosPerfil() {
    const token = localStorage.getItem('token');
    const datos = {
        nombre: document.getElementById('inputNombre').value,
        telefono: document.getElementById('inputTelefono').value,
        direccion: document.getElementById('inputDireccion').value
    };

    try {
        const response = await fetch(`${window.CONFIG.api.baseUrl}/api/auth/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datos)
        });

        if (!response.ok) throw new Error('Error');

        const result = await response.json();
        localStorage.setItem('user', JSON.stringify(result.user));
        
        showToast('✅ Cambios guardados', 'success');
        cancelarEdicion();

    } catch (error) {
        showToast('❌ Error al guardar', 'danger');
    }
    }

    function subirFotoPerfil(input) {
    if (!input.files || !input.files[0]) return;
    showToast('⚠️ Función de foto en desarrollo', 'info');
    }

    function cerrarSesion() {
    if (confirm('¿Cerrar sesión?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.currentUser = null;
        showToast('Sesión cerrada', 'info');
        cargarInicio();
    }
    }

    // ============================================
    // FUNCIONES UTILITARIAS
    // ============================================

    function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    const toastId = 'toast-' + Date.now();
    const icons = {success: 'check-circle', danger: 'exclamation-circle', warning: 'exclamation-triangle', info: 'info-circle'};

    toastContainer.insertAdjacentHTML('beforeend', `
        <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="fas fa-${icons[type]} me-2"></i>${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `);

    const toast = new bootstrap.Toast(document.getElementById(toastId), {delay: 3000});
    toast.show();

    document.getElementById(toastId).addEventListener('hidden.bs.toast', function() {
        this.remove();
    });
    }


    // ============================================
    // INICIALIZACIÓN
    // ============================================

    document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM listo');

    // Cargar carrito
    try {
        const saved = localStorage.getItem('supermercado_cart');
        if (saved) {
            window.cart = JSON.parse(saved);
            actualizarContadorCarrito();
        }
    } catch (error) {
        window.cart = [];
    }

    // Verificar pago de retorno
    verificarPagoRetorno();

    // Cargar página inicial
    cargarInicio();

    // Manejar retorno de pago
    procesarRetornoPago();

    });