import { productos as ProductosAPI } from './api.js';
import { CONFIG, UTILS, showToast } from './config.js';

// ============================================
// CLASE PRINCIPAL DE GESTIÓN DE PRODUCTOS
// ============================================

class ProductosManager {
    constructor() {
        this.productosActuales = [];
        this.categoriasDisponibles = [];
        this.paginaActual = 1;
        this.totalPaginas = 1;
        this.filtrosActuales = {};
        this.isLoading = false;
    }

    // ============================================
    // MÉTODOS PRINCIPALES
    // ============================================

    /**
     * Cargar página de productos
     */
    async cargarPaginaProductos() {
        const contenido = `
            <div class="container-fluid">
                <!-- Header -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 class="h3 mb-1 text-gray-800">
                                    <i class="fas fa-boxes me-2"></i>Catálogo de Productos
                                </h1>
                                <p class="text-muted mb-0">Explora nuestra amplia selección de productos</p>
                            </div>
                            <div class="d-flex gap-2">
                                <button class="btn btn-outline-primary" onclick="productosManager.actualizar()">
                                    <i class="fas fa-sync-alt me-1"></i>Actualizar
                                </button>
                                ${this.esAdministrador() ? `
                                    <button class="btn btn-primary" onclick="productosManager.mostrarFormularioProducto()">
                                        <i class="fas fa-plus me-1"></i>Nuevo Producto
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Filtros -->
                <div class="card shadow-sm mb-4">
                    <div class="card-body">
                        <div class="row g-3">
                            <!-- Búsqueda -->
                            <div class="col-md-4">
                                <div class="input-group">
                                    <input type="text" 
                                           class="form-control" 
                                           id="searchBox" 
                                           placeholder="Buscar productos..."
                                           value="${this.filtrosActuales.search || ''}">
                                    <button class="btn btn-primary" type="button" onclick="productosManager.filtrarProductos()">
                                        <i class="fas fa-search"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Filtro por categoría -->
                            <div class="col-md-3">
                                <select class="form-select" id="filtroCategoria" onchange="productosManager.filtrarProductos()">
                                    <option value="">Todas las categorías</option>
                                </select>
                            </div>

                            <!-- Ordenamiento -->
                            <div class="col-md-3">
                                <select class="form-select" id="ordenarPor" onchange="productosManager.filtrarProductos()">
                                    <option value="">Ordenar por</option>
                                    <option value="nombre_asc" ${this.filtrosActuales.sortBy === 'nombre' && this.filtrosActuales.sortOrder === 'asc' ? 'selected' : ''}>Nombre A-Z</option>
                                    <option value="nombre_desc" ${this.filtrosActuales.sortBy === 'nombre' && this.filtrosActuales.sortOrder === 'desc' ? 'selected' : ''}>Nombre Z-A</option>
                                    <option value="precio_asc" ${this.filtrosActuales.sortBy === 'precio' && this.filtrosActuales.sortOrder === 'asc' ? 'selected' : ''}>Precio menor</option>
                                    <option value="precio_desc" ${this.filtrosActuales.sortBy === 'precio' && this.filtrosActuales.sortOrder === 'desc' ? 'selected' : ''}>Precio mayor</option>
                                    <option value="stock_asc" ${this.filtrosActuales.sortBy === 'stock' && this.filtrosActuales.sortOrder === 'asc' ? 'selected' : ''}>Stock menor</option>
                                    <option value="stock_desc" ${this.filtrosActuales.sortBy === 'stock' && this.filtrosActuales.sortOrder === 'desc' ? 'selected' : ''}>Stock mayor</option>
                                </select>
                            </div>

                            <!-- Limpiar filtros -->
                            <div class="col-md-2">
                                <button class="btn btn-outline-secondary w-100" onclick="productosManager.limpiarFiltros()">
                                    <i class="fas fa-times me-1"></i>Limpiar
                                </button>
                            </div>
                        </div>

                        <!-- Filtros activos -->
                        <div class="mt-3" id="filtrosActivos" style="display: none;">
                            <div class="d-flex flex-wrap gap-2">
                                <!-- Se muestran los filtros activos dinámicamente -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Contador de resultados -->
                <div class="row mb-3">
                    <div class="col-12">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="text-muted" id="contadorResultados">
                                Cargando productos...
                            </span>
                            <div class="d-flex gap-2 align-items-center">
                                <span class="text-muted small">Mostrar:</span>
                                <select class="form-select form-select-sm" style="width: auto;" id="limitePorPagina" onchange="productosManager.cambiarLimitePorPagina(this.value)">
                                    <option value="12">12</option>
                                    <option value="24">24</option>
                                    <option value="48">48</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Productos -->
                <div class="row">
                    <div class="col-12">
                        <div id="productosContainer">
                            <div class="text-center py-5">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Cargando productos...</span>
                                </div>
                                <p class="mt-2 text-muted">Cargando catálogo de productos...</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Paginación -->
                <div class="row mt-4">
                    <div class="col-12">
                        <nav aria-label="Paginación de productos" id="paginacionContainer" style="display: none;">
                            <ul class="pagination justify-content-center" id="paginacionList"></ul>
                        </nav>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('contenidoPrincipal').innerHTML = contenido;
        
        // Cargar datos
        await Promise.all([
            this.cargarCategorias(),
            this.cargarProductos()
        ]);
    }

    /**
     * Cargar productos con filtros
     */
    async cargarProductos(pagina = this.paginaActual) {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            this.paginaActual = pagina;
            this.mostrarLoading();

            const params = {
                page: this.paginaActual,
                limit: parseInt(this.filtrosActuales.limit) || 12,
                ...this.filtrosActuales
            };

            // Limpiar parámetros vacíos
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null || params[key] === undefined) {
                    delete params[key];
                }
            });

            console.log('📦 Cargando productos con parámetros:', params);

            const resultado = await ProductosAPI.getAll(params.page, params.limit);
            
            if (resultado.success) {
                this.productosActuales = resultado.data.productos || [];
                this.totalPaginas = resultado.data.pagination?.pages || 1;
                
                this.mostrarProductos();
                this.actualizarPaginacion();
                this.actualizarContadorResultados(resultado.data.pagination);
                this.actualizarFiltrosActivos();
                
                console.log(`✅ Productos cargados: ${this.productosActuales.length} productos`);
            } else {
                throw new Error(resultado.error || 'Error al cargar productos');
            }

        } catch (error) {
            console.error('❌ Error al cargar productos:', error);
            this.mostrarError('No se pudieron cargar los productos: ' + error.message);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Cargar categorías para filtros
     */
    async cargarCategorias() {
        try {
            // Por ahora usamos las categorías del config
            this.categoriasDisponibles = Object.entries(CONFIG.categories).map(([key, nombre]) => ({
                id: key,
                nombre: nombre
            }));

            const selectCategoria = document.getElementById('filtroCategoria');
            if (selectCategoria) {
                selectCategoria.innerHTML = '<option value="">Todas las categorías</option>';
                this.categoriasDisponibles.forEach(categoria => {
                    const selected = this.filtrosActuales.categoria === categoria.id ? 'selected' : '';
                    selectCategoria.innerHTML += `
                        <option value="${categoria.id}" ${selected}>${categoria.nombre}</option>
                    `;
                });
            }
        } catch (error) {
            console.error('❌ Error cargando categorías:', error);
        }
    }

    // ============================================
    // FILTRADO Y BÚSQUEDA
    // ============================================

    /**
     * Aplicar filtros a los productos
     */
    filtrarProductos() {
        const search = document.getElementById('searchBox')?.value.trim() || '';
        const categoria = document.getElementById('filtroCategoria')?.value || '';
        const orden = document.getElementById('ordenarPor')?.value || '';

        // Actualizar filtros
        this.filtrosActuales = {};
        
        if (search) this.filtrosActuales.search = search;
        if (categoria) this.filtrosActuales.categoria = categoria;
        if (orden) {
            const [campo, direccion] = orden.split('_');
            this.filtrosActuales.sortBy = campo;
            this.filtrosActuales.sortOrder = direccion;
        }

        // Reiniciar a primera página
        this.paginaActual = 1;
        this.cargarProductos();
    }

    /**
     * Limpiar todos los filtros
     */
    limpiarFiltros() {
        this.filtrosActuales = {};
        this.paginaActual = 1;

        // Limpiar controles
        const searchBox = document.getElementById('searchBox');
        const filtroCategoria = document.getElementById('filtroCategoria');
        const ordenarPor = document.getElementById('ordenarPor');

        if (searchBox) searchBox.value = '';
        if (filtroCategoria) filtroCategoria.value = '';
        if (ordenarPor) ordenarPor.value = '';

        this.cargarProductos();
        showToast('Filtros limpiados correctamente', 'info');
    }

    /**
     * Cambiar límite de productos por página
     */
    cambiarLimitePorPagina(limite) {
        this.filtrosActuales.limit = parseInt(limite);
        this.paginaActual = 1;
        this.cargarProductos();
    }

    // ============================================
    // VISUALIZACIÓN DE PRODUCTOS
    // ============================================

    /**
     * Mostrar productos en el contenedor
     */
    mostrarProductos() {
        const container = document.getElementById('productosContainer');
        
        if (!this.productosActuales || this.productosActuales.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-box-open fa-4x text-muted mb-3"></i>
                    <h5 class="text-muted mb-2">No se encontraron productos</h5>
                    <p class="text-muted mb-3">No hay productos que coincidan con tus criterios de búsqueda.</p>
                    <button class="btn btn-primary" onclick="productosManager.limpiarFiltros()">
                        <i class="fas fa-times me-1"></i>Limpiar filtros
                    </button>
                </div>
            `;
            return;
        }

        const productosHtml = `
            <div class="row g-4">
                ${this.productosActuales.map(producto => `
                    <div class="col-xl-3 col-lg-4 col-md-6">
                        <div class="card product-card h-100 shadow-sm">
                            <!-- Imagen del producto -->
                            <div class="product-image-container position-relative">
                                <img src="${this.obtenerImagenProducto(producto.imagenUrl)}" 
                                     class="product-image" 
                                     alt="${producto.nombre}"
                                     loading="lazy"
                                     onerror="this.src='/img/placeholder-product.jpg'">
                                
                                <!-- Badges -->
                                <div class="position-absolute top-0 start-0 p-2">
                                    ${producto.stockActual === 0 ? `
                                        <span class="badge bg-danger">
                                            <i class="fas fa-times me-1"></i>Agotado
                                        </span>
                                    ` : producto.stockActual < 5 ? `
                                        <span class="badge bg-warning">
                                            <i class="fas fa-exclamation-circle me-1"></i>Stock Bajo
                                        </span>
                                    ` : ''}
                                </div>
                                
                                <!-- Acciones rápidas -->
                                <div class="position-absolute top-0 end-0 p-2">
                                    <button class="btn btn-sm btn-light rounded-circle" 
                                            onclick="productosManager.toggleFavorito(${producto.id})"
                                            title="Agregar a favoritos">
                                        <i class="far fa-heart"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Contenido de la tarjeta -->
                            <div class="card-body d-flex flex-column">
                                <!-- Información del producto -->
                                <h6 class="product-name mb-2">${producto.nombre}</h6>
                                
                                ${producto.descripcion ? `
                                    <p class="product-description text-muted small mb-2 flex-grow-1">
                                        ${producto.descripcion.length > 80 ? 
                                            producto.descripcion.substring(0, 80) + '...' : 
                                            producto.descripcion
                                        }
                                    </p>
                                ` : ''}

                                <!-- Precio y stock -->
                                <div class="mt-auto">
                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                        <span class="product-price h6 mb-0 text-primary">
                                            ${UTILS.formatPrice(producto.precioVenta)}
                                        </span>
                                        <small class="text-muted">
                                            <i class="fas fa-boxes me-1"></i>${producto.stockActual}
                                        </small>
                                    </div>

                                    <!-- Categoría -->
                                    <div class="mb-3">
                                        <small class="text-muted">
                                            <i class="fas fa-tag me-1"></i>
                                            ${this.obtenerNombreCategoria(producto.categoriaId)}
                                        </small>
                                    </div>

                                    <!-- Botón de acción -->
                                    <div class="d-grid">
                                        ${producto.stockActual > 0 ? `
                                            <button class="btn btn-primary" 
                                                    onclick="productosManager.agregarAlCarrito(${producto.id})">
                                                <i class="fas fa-cart-plus me-2"></i>
                                                Agregar al Carrito
                                            </button>
                                        ` : `
                                            <button class="btn btn-secondary" disabled>
                                                <i class="fas fa-times me-2"></i>
                                                Sin Stock
                                            </button>
                                        `}
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

    /**
     * Mostrar estado de loading
     */
    mostrarLoading() {
        const container = document.getElementById('productosContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando productos...</span>
                    </div>
                    <p class="mt-2 text-muted">Buscando productos...</p>
                </div>
            `;
        }
    }

    /**
     * Mostrar error
     */
    mostrarError(mensaje) {
        const container = document.getElementById('productosContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-exclamation-triangle fa-4x text-danger mb-3"></i>
                    <h5 class="text-danger mb-2">Error al cargar productos</h5>
                    <p class="text-muted mb-3">${mensaje}</p>
                    <button class="btn btn-primary" onclick="productosManager.cargarProductos()">
                        <i class="fas fa-redo me-1"></i> Intentar de nuevo
                    </button>
                </div>
            `;
        }
    }

    // ============================================
    // PAGINACIÓN
    // ============================================

    /**
     * Actualizar controles de paginación
     */
    actualizarPaginacion() {
        const container = document.getElementById('paginacionContainer');
        const list = document.getElementById('paginacionList');
        
        if (!container || !list) return;

        if (this.totalPaginas <= 1) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        
        let paginacionHtml = '';
        const { paginaActual, totalPaginas } = this;

        // Botón anterior
        paginacionHtml += `
            <li class="page-item ${paginaActual === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="productosManager.cambiarPagina(${paginaActual - 1})" aria-label="Anterior">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Números de página
        const paginasMostrar = this.obtenerPaginasParaMostrar();
        
        paginasMostrar.forEach(pagina => {
            if (pagina === '...') {
                paginacionHtml += `
                    <li class="page-item disabled">
                        <span class="page-link">...</span>
                    </li>
                `;
            } else {
                paginacionHtml += `
                    <li class="page-item ${pagina === paginaActual ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="productosManager.cambiarPagina(${pagina})">${pagina}</a>
                    </li>
                `;
            }
        });

        // Botón siguiente
        paginacionHtml += `
            <li class="page-item ${paginaActual === totalPaginas ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="productosManager.cambiarPagina(${paginaActual + 1})" aria-label="Siguiente">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        list.innerHTML = paginacionHtml;
    }

    /**
     * Cambiar de página
     */
    cambiarPagina(nuevaPagina) {
        if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
            this.cargarProductos(nuevaPagina);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    /**
     * Obtener array de páginas para mostrar en la paginación
     */
    obtenerPaginasParaMostrar() {
        const { paginaActual, totalPaginas } = this;
        const paginas = [];
        const rango = 2; // Número de páginas a mostrar a cada lado de la actual

        // Siempre mostrar primera página
        paginas.push(1);

        // Páginas alrededor de la actual
        const inicio = Math.max(2, paginaActual - rango);
        const fin = Math.min(totalPaginas - 1, paginaActual + rango);

        // Agregar puntos suspensivos si hay gap
        if (inicio > 2) {
            paginas.push('...');
        }

        // Agregar páginas del rango
        for (let i = inicio; i <= fin; i++) {
            paginas.push(i);
        }

        // Agregar puntos suspensivos si hay gap al final
        if (fin < totalPaginas - 1) {
            paginas.push('...');
        }

        // Siempre mostrar última página si hay más de una
        if (totalPaginas > 1) {
            paginas.push(totalPaginas);
        }

        return paginas;
    }

    // ============================================
    // UTILIDADES
    // ============================================

    /**
     * Obtener URL de imagen del producto
     */
    obtenerImagenProducto(imagenUrl) {
        if (!imagenUrl) {
            return '/img/placeholder-product.jpg';
        }
        
        if (imagenUrl.startsWith('http')) {
            return imagenUrl;
        }
        
        // Asumiendo que las imágenes se sirven desde /uploads
        return `${CONFIG.api.baseUrl.replace('/api', '')}${imagenUrl}`;
    }

    /**
     * Obtener nombre de categoría por ID
     */
    obtenerNombreCategoria(categoriaId) {
        if (!categoriaId) return 'Sin categoría';
        
        const categoria = this.categoriasDisponibles.find(cat => cat.id === categoriaId);
        return categoria ? categoria.nombre : 'Sin categoría';
    }

    /**
     * Verificar si el usuario es administrador
     */
    esAdministrador() {
        // Esto debería integrarse con tu módulo de auth
        return window.currentUser?.rol === 'admin';
    }

    /**
     * Actualizar contador de resultados
     */
    actualizarContadorResultados(pagination) {
        const contador = document.getElementById('contadorResultados');
        if (contador && pagination) {
            const inicio = (pagination.page - 1) * pagination.limit + 1;
            const fin = Math.min(pagination.page * pagination.limit, pagination.total);
            contador.textContent = `Mostrando ${inicio}-${fin} de ${pagination.total} productos`;
        }
    }

    /**
     * Actualizar visualización de filtros activos
     */
    actualizarFiltrosActivos() {
        const container = document.getElementById('filtrosActivos');
        if (!container) return;

        const filtros = Object.entries(this.filtrosActuales)
            .filter(([key, value]) => value && key !== 'limit' && key !== 'page');

        if (filtros.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        
        const filtrosHtml = filtros.map(([key, value]) => {
            let etiqueta = '';
            let valorMostrar = value;

            switch(key) {
                case 'search':
                    etiqueta = 'Búsqueda';
                    break;
                case 'categoria':
                    etiqueta = 'Categoría';
                    valorMostrar = this.obtenerNombreCategoria(value);
                    break;
                case 'sortBy':
                    etiqueta = 'Orden';
                    const orden = this.filtrosActuales.sortOrder === 'asc' ? 'Ascendente' : 'Descendente';
                    valorMostrar = `${value} (${orden})`;
                    break;
                default:
                    etiqueta = key;
            }

            return `
                <span class="badge bg-primary">
                    ${etiqueta}: ${valorMostrar}
                    <button type="button" class="btn-close btn-close-white ms-1" 
                            onclick="productosManager.removerFiltro('${key}')"></button>
                </span>
            `;
        }).join('');

        container.innerHTML = filtrosHtml;
    }

    /**
     * Remover filtro específico
     */
    removerFiltro(key) {
        delete this.filtrosActuales[key];
        this.paginaActual = 1;
        this.cargarProductos();
    }

    /**
     * Agregar producto al carrito
     */
    agregarAlCarrito(productoId) {
        // Integrar con tu módulo de carrito
        const producto = this.productosActuales.find(p => p.id === productoId);
        if (producto) {
            showToast(`${producto.nombre} agregado al carrito`, 'success');
            // Aquí llamarías a tu función de carrito: carrito.agregar(producto)
        }
    }

    /**
     * Toggle favorito (placeholder)
     */
    toggleFavorito(productoId) {
        showToast('Funcionalidad de favoritos en desarrollo', 'info');
    }

    /**
     * Mostrar formulario de producto (admin)
     */
    mostrarFormularioProducto() {
        showToast('Formulario de producto - Funcionalidad en desarrollo', 'info');
    }

    /**
     * Actualizar productos
     */
    actualizar() {
        this.cargarProductos();
        showToast('Catálogo actualizado', 'info');
    }
}

// ============================================
// INSTANCIA GLOBAL E INICIALIZACIÓN
// ============================================

// Crear instancia global
const productosManager = new ProductosManager();

// ============================================
// EXPORTACIONES
// ============================================

export default productosManager;
export {
    ProductosManager,
    productosManager
};