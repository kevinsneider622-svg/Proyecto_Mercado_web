// Funciones para gestión de productos

let productosActuales = [];
let categoriasDisponibles = [];
let paginaActual = 1;
let totalPaginas = 1;

// Cargar página de productos
function cargarPaginaProductos() {
    const contenido = `
        <div class="row mb-4">
            <div class="col-12">
                <h2><i class="fas fa-box"></i> Catálogo de Productos</h2>
            </div>
        </div>

        <!-- Filtros y búsqueda -->
        <div class="filter-section mb-4">
            <div class="row">
                <div class="col-md-4 mb-3">
                    <div class="search-box">
                        <input type="text" class="form-control" id="searchBox" placeholder="Buscar productos...">
                        <button class="btn btn-primary" onclick="filtrarProductos()">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <select class="form-select" id="filtroCategoria" onchange="filtrarProductos()">
                        <option value="">Todas las categorías</option>
                        <!-- Se cargarán dinámicamente -->
                    </select>
                </div>
                <div class="col-md-2 mb-3">
                    <select class="form-select" id="ordenarPor" onchange="filtrarProductos()">
                        <option value="">Ordenar por</option>
                        <option value="nombre_asc">Nombre A-Z</option>
                        <option value="nombre_desc">Nombre Z-A</option>
                        <option value="precio_asc">Precio menor</option>
                        <option value="precio_desc">Precio mayor</option>
                    </select>
                </div>
                <div class="col-md-3 mb-3">
                    <button class="btn btn-outline-secondary w-100" onclick="limpiarFiltros()">
                        <i class="fas fa-times"></i> Limpiar Filtros
                    </button>
                </div>
            </div>
        </div>

        <!-- Lista de productos -->
        <div id="productosContainer">
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando productos...</span>
                </div>
            </div>
        </div>

        <!-- Paginación -->
        <nav aria-label="Paginación de productos" id="paginacionContainer" style="display: none;">
            <ul class="pagination justify-content-center" id="paginacionList">
                <!-- Se genera dinámicamente -->
            </ul>
        </nav>
    `;
    
    document.getElementById('contenidoPrincipal').innerHTML = contenido;
    
    // Cargar datos iniciales
    cargarProductos();
    cargarCategorias();
}

// Cargar productos desde la API
async function cargarProductos(pagina = 1, filtros = {}) {
    try {
        mostrarLoadingProductos();
        
        const params = {
            page: pagina,
            limit: 12,
            ...filtros
        };
        
        const response = await ProductosAPI.obtenerTodos(params);
        
        productosActuales = response.productos || [];
        paginaActual = response.pagination?.page || 1;
        totalPaginas = response.pagination?.pages || 1;
        
        mostrarProductos();
        actualizarPaginacion();
        
    } catch (error) {
        console.error('Error cargando productos:', error);
        mostrarErrorProductos(error.message);
    }
}

// Mostrar productos en el HTML
function mostrarProductos() {
    const container = document.getElementById('productosContainer');
    
    if (!productosActuales || productosActuales.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-box-open fa-4x text-muted mb-3"></i>
                <h5 class="text-muted">No hay productos disponibles</h5>
                <p class="text-muted">Intenta cambiar los filtros o agregar productos desde el panel de administración</p>
            </div>
        `;
        return;
    }
    
    const productosHtml = `
        <div class="row">
            ${productosActuales.map(producto => `
                <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
                    <div class="card product-card h-100">
                        <img src="${obtenerImagenProducto(producto.imagenUrl)}" 
                             class="product-image" 
                             alt="${producto.nombre}"
                             onerror="this.src='img/placeholder.jpg'">
                        
                        <div class="card-body d-flex flex-column">
                            <h6 class="card-title mb-2">${producto.nombre}</h6>
                            
                            ${producto.descripcion ? 
                                `<p class="card-text text-muted small mb-2">${producto.descripcion}</p>` : 
                                ''
                            }
                            
                            <div class="mt-auto">
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span class="product-price">${formatearPrecio(producto.precioVenta)}</span>
                                    <small class="text-muted">
                                        ${producto.categoria?.nombre || 'Sin categoría'}
                                    </small>
                                </div>
                                
                                <div class="mb-3">
                                    <span class="product-stock ${producto.stockActual < 10 ? 'low-stock' : ''}">
                                        <i class="fas fa-boxes"></i> Stock: ${producto.stockActual}
                                    </span>
                                </div>
                                
                                <div class="d-grid">
                                    ${producto.stockActual > 0 ? 
                                        `<button class="btn btn-add-cart" onclick="agregarProductoAlCarrito(${producto.id})">
                                            <i class="fas fa-cart-plus"></i> Agregar al Carrito
                                        </button>` :
                                        `<button class="btn btn-secondary" disabled>
                                            <i class="fas fa-times"></i> Sin Stock
                                        </button>`
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = productosHtml;
}

// Agregar producto al carrito (wrapper)
async function agregarProductoAlCarrito(productoId) {
    try {
        const producto = productosActuales.find(p => p.id === productoId);
        if (!producto) {
            showToast('Producto no encontrado', 'error');
            return;
        }
        
        const exito = agregarAlCarrito(producto, 1);
        if (exito) {
            // Opcional: actualizar la vista del producto para reflejar el cambio de stock
            // cargarProductos(paginaActual);
        }
        
    } catch (error) {
        console.error('Error agregando producto:', error);
        showToast('Error al agregar producto al carrito', 'error');
    }
}

// Filtrar productos
function filtrarProductos() {
    const search = document.getElementById('searchBox')?.value || '';
    const categoria = document.getElementById('filtroCategoria')?.value || '';
    const orden = document.getElementById('ordenarPor')?.value || '';
    
    const filtros = {};
    
    if (search.trim()) {
        filtros.search = search.trim();
    }
    
    if (categoria) {
        filtros.categoria = categoria;
    }
    
    if (orden) {
        const [campo, direccion] = orden.split('_');
        filtros.sortBy = campo;
        filtros.sortOrder = direccion;
    }
    
    cargarProductos(1, filtros);
}

// Limpiar filtros
function limpiarFiltros() {
    document.getElementById('searchBox').value = '';
    document.getElementById('filtroCategoria').value = '';
    document.getElementById('ordenarPor').value = '';
    
    cargarProductos(1);
}

// Cargar categorías para el filtro
async function cargarCategorias() {
    try {
        const categorias = await CategoriasAPI.obtenerTodas();
        categoriasDisponibles = categorias || [];
        
        const selectCategoria = document.getElementById('filtroCategoria');
        if (selectCategoria) {
            selectCategoria.innerHTML = '<option value="">Todas las categorías</option>';
            
            categorias.forEach(categoria => {
                selectCategoria.innerHTML += `
                    <option value="${categoria.id}">${categoria.nombre}</option>
                `;
            });
        }
        
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

// Actualizar paginación
function actualizarPaginacion() {
    const container = document.getElementById('paginacionContainer');
    const list = document.getElementById('paginacionList');
    
    if (totalPaginas <= 1) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    let paginacionHtml = '';
    
    // Botón anterior
    if (paginaActual > 1) {
        paginacionHtml += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="cambiarPagina(${paginaActual - 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;
    }
    
    // Números de página
    const inicio = Math.max(1, paginaActual - 2);
    const fin = Math.min(totalPaginas, paginaActual + 2);
    
    for (let i = inicio; i <= fin; i++) {
        paginacionHtml += `
            <li class="page-item ${i === paginaActual ? 'active' : ''}">
                <a class="page-link" href="#" onclick="cambiarPagina(${i})">${i}</a>
            </li>
        `;
    }
    
    // Botón siguiente
    if (paginaActual < totalPaginas) {
        paginacionHtml += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="cambiarPagina(${paginaActual + 1})">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;
    }
    
    list.innerHTML = paginacionHtml;
}

// Cambiar página
function cambiarPagina(nuevaPagina) {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas && nuevaPagina !== paginaActual) {
        const filtros = obtenerFiltrosActuales();
        cargarProductos(nuevaPagina, filtros);
    }
}

// Obtener filtros actuales
function obtenerFiltrosActuales() {
    const search = document.getElementById('searchBox')?.value || '';
    const categoria = document.getElementById('filtroCategoria')?.value || '';
    const orden = document.getElementById('ordenarPor')?.value || '';
    
    const filtros = {};
    
    if (search.trim()) filtros.search = search.trim();
    if (categoria) filtros.categoria = categoria;
    if (orden) {
        const [campo, direccion] = orden.split('_');
        filtros.sortBy = campo;
        filtros.sortOrder = direccion;
    }
    
    return filtros;
}

// Funciones de utilidad
function mostrarLoadingProductos() {
    document.getElementById('productosContainer').innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando productos...</span>
            </div>
            <p class="mt-2 text-muted">Cargando productos...</p>
        </div>
    `;
}

function mostrarErrorProductos(mensaje) {
    document.getElementById('productosContainer').innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-exclamation-triangle fa-4x text-danger mb-3"></i>
            <h5 class="text-danger">Error al cargar productos</h5>
            <p class="text-muted">${mensaje}</p>
            <button class="btn btn-primary" onclick="cargarProductos()">
                <i class="fas fa-redo"></i> Intentar de nuevo
            </button>
        </div>
    `;
}

function obtenerImagenProducto(imagenUrl) {
    if (imagenUrl) {
        return imagenUrl.startsWith('http') ? imagenUrl : `${window.CONFIG?.API_BASE_URL || 'http://localhost:3000'}${imagenUrl}`;
    }
    return 'img/placeholder.jpg';
}

function formatearPrecio(precio) {
    if (typeof precio === 'string') {
        precio = parseFloat(precio);
    }
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(precio);
}

// Configurar búsqueda en tiempo real (opcional)
document.addEventListener('DOMContentLoaded', function() {
    // Búsqueda con Enter
    document.addEventListener('keypress', function(e) {
        if (e.target.id === 'searchBox' && e.key === 'Enter') {
            e.preventDefault();
            filtrarProductos();
        }
    });
});

// Cargar productos con stock bajo (para admin)
async function cargarProductosStockBajo() {
    try {
        const response = await ProductosAPI.obtenerTodos({ stockBajo: true });
        const productos = response.productos || [];
        
        if (productos.length === 0) {
            return '<p class="text-muted">No hay productos con stock bajo</p>';
        }
        
        return productos.map(producto => `
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                <div>
                    <strong>${producto.nombre}</strong><br>
                    <small class="text-muted">Stock: ${producto.stockActual}</small>
                </div>
                <span class="badge bg-warning">Stock Bajo</span>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error cargando productos con stock bajo:', error);
        return '<p class="text-danger">Error cargando productos</p>';
    }
}