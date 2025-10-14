// Carrito de compras - Versión mejorada y optimizada
class CarritoManager {
    constructor() {
        this.cart = [];
        this.init();
    }

    init() {
        // Cargar carrito al inicializar
        this.cargarCarrito();
        
        // Exponer métodos globalmente
        window.agregarAlCarrito = (producto, cantidad) => this.agregarAlCarrito(producto, cantidad);
        window.mostrarCarrito = () => this.mostrarCarrito();
        window.actualizarContadorCarrito = () => this.actualizarContadorCarrito();
        window.eliminarDelCarrito = (id) => this.eliminarDelCarrito(id);
        window.procesarCompra = () => this.procesarCompra();
        window.modificarCantidad = (id, cambio) => this.modificarCantidad(id, cambio);
        window.vaciarCarrito = () => this.vaciarCarrito();
        window.obtenerTotalCarrito = () => this.obtenerTotalCarrito();
    }

    cargarCarrito() {
        try {
            const saved = localStorage.getItem('supermercado_cart');
            if (saved) {
                this.cart = JSON.parse(saved);
                this.actualizarContadorCarrito();
            }
        } catch (error) {
            console.error('Error cargando carrito:', error);
            this.cart = [];
        }
    }

    guardarCarrito() {
        try {
            localStorage.setItem('supermercado_cart', JSON.stringify(this.cart));
        } catch (error) {
            console.error('Error guardando carrito:', error);
            this.showToast('Error al guardar el carrito', 'danger');
        }
    }

    validarProducto(producto) {
        return producto && 
               producto.id && 
               producto.nombre && 
               typeof producto.precioVenta === 'number' && 
               producto.precioVenta > 0;
    }

    agregarAlCarrito(producto, cantidad = 1) {
        try {
            // Validar producto
            if (!this.validarProducto(producto)) {
                console.error('Producto inválido:', producto);
                this.showToast('Error: Producto inválido', 'danger');
                return false;
            }

            // Validar cantidad
            if (cantidad <= 0 || !Number.isInteger(cantidad)) {
                this.showToast('Cantidad inválida', 'warning');
                return false;
            }

            // Buscar producto existente
            const existente = this.cart.find(item => item.id === producto.id);
            
            if (existente) {
                existente.cantidad += cantidad;
                this.showToast(`Cantidad de ${producto.nombre} actualizada`, 'info');
            } else {
                this.cart.push({
                    id: producto.id,
                    nombre: producto.nombre,
                    precio: producto.precioVenta,
                    cantidad: cantidad,
                    imagen: producto.imagenUrl || this.getImagenPorDefecto(),
                    fechaAgregado: new Date().toISOString()
                });
                this.showToast(`${producto.nombre} agregado al carrito`, 'success');
            }
            
            // Actualizar almacenamiento y UI
            this.guardarCarrito();
            this.actualizarContadorCarrito();
            return true;

        } catch (error) {
            console.error('Error agregando al carrito:', error);
            this.showToast('Error al agregar producto', 'danger');
            return false;
        }
    }

    modificarCantidad(id, cambio) {
        const item = this.cart.find(item => item.id === id);
        if (!item) return false;

        const nuevaCantidad = item.cantidad + cambio;
        
        if (nuevaCantidad <= 0) {
            this.eliminarDelCarrito(id);
        } else {
            item.cantidad = nuevaCantidad;
            this.guardarCarrito();
            this.actualizarContadorCarrito();
            
            // Si el carrito está visible, actualizarlo
            if (document.getElementById('carritoModal')?.classList.contains('show')) {
                this.mostrarCarrito();
            }
            
            this.showToast(`Cantidad de ${item.nombre} actualizada`, 'info');
        }
        return true;
    }

    eliminarDelCarrito(id) {
        const itemIndex = this.cart.findIndex(item => item.id === id);
        if (itemIndex === -1) return false;

        const itemEliminado = this.cart[itemIndex];
        this.cart.splice(itemIndex, 1);
        
        this.guardarCarrito();
        this.actualizarContadorCarrito();
        this.showToast(`${itemEliminado.nombre} eliminado del carrito`, 'info');

        // Actualizar vista si el carrito está abierto
        if (document.getElementById('carritoModal')?.classList.contains('show')) {
            if (this.cart.length === 0) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('carritoModal'));
                if (modal) modal.hide();
            } else {
                this.mostrarCarrito();
            }
        }
        
        return true;
    }

    vaciarCarrito() {
        const hadItems = this.cart.length > 0;
        this.cart = [];
        this.guardarCarrito();
        this.actualizarContadorCarrito();
        
        if (hadItems) {
            this.showToast('Carrito vaciado', 'info');
            
            // Cerrar modal si está abierto
            const modal = bootstrap.Modal.getInstance(document.getElementById('carritoModal'));
            if (modal) modal.hide();
        }
    }

    mostrarCarrito() {
        try {
            const modalElement = document.getElementById('carritoModal');
            if (!modalElement) {
                console.error('Modal carritoModal no encontrado');
                this.showToast('Error: No se puede mostrar el carrito', 'danger');
                return;
            }

            const content = document.getElementById('carritoContent');
            const totalElement = document.getElementById('carritoTotal');
            
            if (!this.cart || this.cart.length === 0) {
                content.innerHTML = this.getHTMLCarritoVacio();
                if (totalElement) totalElement.textContent = '0';
            } else {
                const { html, total } = this.generarHTMLCarrito();
                content.innerHTML = html;
                if (totalElement) totalElement.textContent = total.toLocaleString();
            }
            
            // Mostrar modal
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
            
        } catch (error) {
            console.error('Error mostrando carrito:', error);
            this.showToast('Error al mostrar el carrito', 'danger');
        }
    }

    generarHTMLCarrito() {
        let html = '';
        let total = 0;
        
        this.cart.forEach(item => {
            const subtotal = item.precio * item.cantidad;
            total += subtotal;
            
            html += `
                <div class="cart-item d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                    <div class="d-flex align-items-center flex-grow-1">
                        <img src="${item.imagen}" alt="${item.nombre}" 
                             class="rounded me-3" width="60" height="60" 
                             style="object-fit: cover;" onerror="this.src='${this.getImagenPorDefecto()}'">
                        <div class="flex-grow-1">
                            <h6 class="mb-1 text-dark">${item.nombre}</h6>
                            <small class="text-muted">$${item.precio.toLocaleString()} c/u</small>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-3">
                        <div class="d-flex align-items-center">
                            <button class="btn btn-sm btn-outline-secondary" 
                                    onclick="modificarCantidad(${item.id}, -1)"
                                    ${item.cantidad <= 1 ? 'disabled' : ''}>
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="mx-2 fw-bold">${item.cantidad}</span>
                            <button class="btn btn-sm btn-outline-secondary" 
                                    onclick="modificarCantidad(${item.id}, 1)">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <span class="text-primary fw-bold">$${subtotal.toLocaleString()}</span>
                        <button class="btn btn-sm btn-outline-danger" 
                                onclick="eliminarDelCarrito(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        // Agregar botón para vaciar carrito si hay items
        if (this.cart.length > 0) {
            html += `
                <div class="text-center mt-4">
                    <button class="btn btn-outline-danger btn-sm" onclick="vaciarCarrito()">
                        <i class="fas fa-broom me-1"></i>Vaciar Carrito
                    </button>
                </div>
            `;
        }

        return { html, total };
    }

    getHTMLCarritoVacio() {
        return `
            <div class="text-center py-5">
                <i class="fas fa-shopping-cart fa-4x text-muted mb-3"></i>
                <h5 class="text-muted mb-2">Tu carrito está vacío</h5>
                <p class="text-muted mb-3">Agrega algunos productos para comenzar</p>
                <button class="btn btn-primary" data-bs-dismiss="modal">
                    <i class="fas fa-store me-1"></i>Comenzar a Comprar
                </button>
            </div>
        `;
    }

    actualizarContadorCarrito() {
        const counter = document.getElementById('carritoCount');
        if (counter) {
            const total = this.cart.reduce((sum, item) => sum + item.cantidad, 0);
            counter.textContent = total;
            counter.style.display = total > 0 ? 'inline' : 'none';
            
            // Disparar evento personalizado para notificar cambios
            window.dispatchEvent(new CustomEvent('carritoActualizado', {
                detail: { totalItems: total, carrito: this.cart }
            }));
        }
    }

    obtenerTotalCarrito() {
        return this.cart.reduce((total, item) => total + (item.precio * item.cantidad), 0);
    }

    obtenerCantidadProducto(id) {
        const item = this.cart.find(item => item.id === id);
        return item ? item.cantidad : 0;
    }

    procesarCompra() {
        if (!this.cart || this.cart.length === 0) {
            this.showToast('El carrito está vacío', 'warning');
            return false;
        }
        
        const total = this.obtenerTotalCarrito();
        
        if (confirm(`¿Confirmar compra de ${this.cart.length} producto(s) por $${total.toLocaleString()}?`)) {
            // Simular procesamiento de compra
            this.showToast('¡Compra procesada exitosamente!', 'success');
            
            // Limpiar carrito después de la compra
            this.vaciarCarrito();
            return true;
        }
        
        return false;
    }

    getImagenPorDefecto() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjBGMEYwIi8+CjxwYXRoIGQ9Ik00MCA0MEM0Mi43NjE0IDQwIDQ1IDM3Ljc2MTQgNDUgMzVDNDUgMzIuMjM4NiA0Mi43NjE0IDMwIDQwIDMwQzM3LjIzODYgMzAgMzUgMzIuMjM4NiAzNSAzNUMzNSAzNy43NjE0IDM3LjIzODYgNDAgNDAgNDBaIiBmaWxsPSIjQ0VDRUNFIi8+CjxwYXRoIGQ9Ik0zNSA1MEg0NUM0Ni4xMDQ2IDUwIDQ3IDQ5LjEwNDYgNDcgNDhWNDJDNDcgNDAuODk1NCA0Ni4xMDQ2IDQwIDQ1IDQwSDM1QzMzLjg5NTQgNDAgMzMgNDAuODk1NCAzMyA0MlY0OEMzMyA0OS4xMDQ2IDMzLjg5NTQgNTAgMzUgNTBaIiBmaWxsPSIjQ0VDRUNFIi8+Cjwvc3ZnPgo=';
    }

    showToast(message, type = 'info') {
        // Verificar si existe la función showToast global
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
            return;
        }

        // Implementación básica de toast si no existe
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // Crear toast básico si Bootstrap está disponible
        if (typeof bootstrap !== 'undefined') {
            const toastContainer = document.querySelector('.toast-container') || this.crearToastContainer();
            const toastId = 'toast-' + Date.now();
            
            const toastHtml = `
                <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0" role="alert">
                    <div class="d-flex">
                        <div class="toast-body">
                            <i class="fas ${this.getToastIcon(type)} me-2"></i>${message}
                        </div>
                        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                    </div>
                </div>
            `;
            
            toastContainer.insertAdjacentHTML('beforeend', toastHtml);
            
            const toastElement = document.getElementById(toastId);
            const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
            toast.show();
            
            toastElement.addEventListener('hidden.bs.toast', () => {
                toastElement.remove();
            });
        }
    }

    crearToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    }

    getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            danger: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }
}

// Inicializar el carrito cuando se carga la página
document.addEventListener('DOMContentLoaded', function() {
    window.carritoManager = new CarritoManager();
});

// Exportar para módulos (si se usa ES6)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CarritoManager;
}