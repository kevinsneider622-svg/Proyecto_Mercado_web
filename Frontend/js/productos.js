// Funciones para gestión de productos

let productosActuales = [];
let categoriasDisponibles = [];
let paginaActual = 1;
let totalPaginas = 1;

// Cargar todos los productos
async function cargarProductos() {
    try {
        const params = {
            page: paginaActual,
            limit: 12
        };
        const response = await ProductosAPI.obtenerTodos(params);
        
        if (response && response.productos) {
            productosActuales = response.productos;
            totalPaginas = response.pagination ? response.pagination.pages : 1;
            mostrarProductos();
            actualizarPaginacion();
        } else {
            mostrarError('No se pudieron cargar los productos');
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
        mostrarError('Error al cargar los productos');
    }
}

// Cargar página de productos
function cargarPaginaProductos() {
    const contenido = `
        <div class="row mb-4">
            <div class="col-12">
                <h2><i class="fas fa-box"></i> Catálogo de Productos</h2>
            </div>
        </div>
        
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

        <div id="productosContainer">
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando productos...</span>
                </div>
            </div>
        </div>

        <nav aria-label="Paginación de productos" id="paginacionContainer" style="display: none;">
            <ul class="pagination justify-content-center" id="paginacionList"></ul>
        </nav>
    `;
    
    document.getElementById('contenidoPrincipal').innerHTML = contenido;
    cargarProductos();
    cargarCategorias();
}

async function cargarProductosDestacados() {
    try {
        const response = await ProductosAPI.obtenerDestacados();
        if (response && response.productos) {
            mostrarProductosDestacados(response.productos);
        } else {
            mostrarErrorProductosDestacados();
        }
    } catch (error) {
        console.error('Error cargando productos destacados:', error);
        mostrarErrorProductosDestacados();
    }
}

function mostrarProductosDestacados(productos) {
    const container = document.getElementById('productosDestacados');
    if (!productos || productos.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                No hay productos destacados disponibles en este momento.
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="row">
            ${productos.map(producto => `
                <div class="col-md-3 mb-3">
                    <div class="card product-card h-100">
                        <img src="${producto.imagenUrl || 'img/placeholder.jpg'}" 
                             class="product-image" 
                             alt="${producto.nombre}"
                             onerror="this.src='img/placeholder.jpg'">
                        <div class="card-body">
                            <h6 class="card-title">${producto.nombre}</h6>
                            <p class="product-price">$${producto.precio}</p>
                            <button class="btn btn-primary btn-sm w-100" onclick="agregarAlCarrito(${producto.id})">
                                <i class="fas fa-cart-plus"></i> Agregar
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function mostrarErrorProductosDestacados() {
    const container = document.getElementById('productosDestacados');
    container.innerHTML = `
        <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle"></i>
            Lo sentimos, no pudimos cargar los productos destacados.
        </div>
    `;
}

function mostrarError(mensaje) {
    const container = document.getElementById('productosContainer');
    container.innerHTML = `
        <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle"></i>
            ${mensaje}
        </div>
    `;
}

async function cambiarPagina(nuevaPagina) {
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    
    paginaActual = nuevaPagina;
    await cargarProductos();
    window.scrollTo(0, 0);
}

function actualizarPaginacion() {
    const paginacionContainer = document.getElementById('paginacionContainer');
    if (!paginacionContainer) return;

    if (totalPaginas <= 1) {
        paginacionContainer.style.display = 'none';
        return;
    }

    paginacionContainer.style.display = 'block';
    const paginacionList = document.getElementById('paginacionList');
    
    let paginacionHtml = '';
    
    // Botón anterior
    paginacionHtml += `
        <li class="page-item ${paginaActual === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cambiarPagina(${paginaActual - 1})">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;

    // Números de página
    for (let i = 1; i <= totalPaginas; i++) {
        if (
            i === 1 || // Primera página
            i === totalPaginas || // Última página
            (i >= paginaActual - 2 && i <= paginaActual + 2) // 2 páginas antes y después de la actual
        ) {
            paginacionHtml += `
                <li class="page-item ${i === paginaActual ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="cambiarPagina(${i})">${i}</a>
                </li>
            `;
        } else if (
            i === paginaActual - 3 || 
            i === paginaActual + 3
        ) {
            paginacionHtml += `
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `;
        }
    }

    // Botón siguiente
    paginacionHtml += `
        <li class="page-item ${paginaActual === totalPaginas ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cambiarPagina(${paginaActual + 1})">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;

    paginacionList.innerHTML = paginacionHtml;
}

function mostrarProductos() {
    const container = document.getElementById('productosContainer');
    
    if (!productosActuales || productosActuales.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-box-open fa-4x text-muted mb-3"></i>
                <h5 class="text-muted">No hay productos disponibles</h5>
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
                             onerror="this.src='https://via.placeholder.com/200x200/0d6efd/ffffff?text=Producto'">
                        
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
                                            <i class="fas fa-cart-plus"></i> Agregar
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

async function agregarProductoAlCarrito(productoId) {
    try {
        const producto = productosActuales.find(p => p.id === productoId);
        if (!producto) {
            showToast('Producto no encontrado', 'error');
            return;
        }
        agregarAlCarrito(producto, 1);
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al agregar producto', 'error');
    }
}

function filtrarProductos() {
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
    
    cargarProductos(1, filtros);
}

function limpiarFiltros() {
    document.getElementById('searchBox').value = '';
    document.getElementById('filtroCategoria').value = '';
    document.getElementById('ordenarPor').value = '';
    cargarProductos(1);
}

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

function actualizarPaginacion() {
    const container = document.getElementById('paginacionContainer');
    const list = document.getElementById('paginacionList');
    
    if (totalPaginas <= 1) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    let paginacionHtml = '';
    
    if (paginaActual > 1) {
        paginacionHtml += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="cambiarPagina(${paginaActual - 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;
    }
    
    const inicio = Math.max(1, paginaActual - 2);
    const fin = Math.min(totalPaginas, paginaActual + 2);
    
    for (let i = inicio; i <= fin; i++) {
        paginacionHtml += `
            <li class="page-item ${i === paginaActual ? 'active' : ''}">
                <a class="page-link" href="#" onclick="cambiarPagina(${i})">${i}</a>
            </li>
        `;
    }
    
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

function cambiarPagina(nuevaPagina) {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
        const filtros = obtenerFiltrosActuales();
        cargarProductos(nuevaPagina, filtros);
    }
}

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

function mostrarLoadingProductos() {
    document.getElementById('productosContainer').innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando productos...</span>
            </div>
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
    return 'https://via.placeholder.com/200x200/0d6efd/ffffff?text=Producto';
}

function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(parseFloat(precio));
}

// Exponer funciones globalmente
window.cargarPaginaProductos = cargarPaginaProductos;
window.cargarProductos = cargarProductos;
window.filtrarProductos = filtrarProductos;
window.limpiarFiltros = limpiarFiltros;
window.agregarProductoAlCarrito = agregarProductoAlCarrito;
window.cambiarPagina = cambiarPagina;