// Funciones del carrito de compras

// Agregar producto al carrito
function agregarAlCarrito(producto, cantidad = 1) {
    try {

         console.log('Agregando producto:', producto);

          if (!window.cart) {
            window.cart = [];
         }

          // Buscar si el producto ya existe
        const existingIndex = window.cart.findIndex(item => item.id === producto.id);
        
        if (existingIndex !== -1) {
            // Producto existe, actualizar cantidad
            window.cart[existingIndex].cantidad += cantidad;
        } else {
            // Nuevo producto
            window.cart.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precioVenta,
                cantidad: cantidad,
                imagen: producto.imagenUrl
            });
        }
        
        // Guardar en localStorage
        localStorage.setItem('supermercado_cart', JSON.stringify(window.cart));
        
        // Actualizar contador
        actualizarContadorCarrito();
        
        // Mostrar mensaje
        showToast('Producto agregado al carrito', 'success');
        
    } catch (error) {
        console.error('Error agregando al carrito:', error);
        showToast('Error al agregar producto', 'danger');
    }

    // Hasta aqui va el nuevo codigo 
        
 
        // Validar cantidad
        if (cantidad <= 0 || cantidad > CONFIG.CART.MAX_QUANTITY) {
            showToast(`Cantidad inválida. Máximo ${CONFIG.CART.MAX_QUANTITY} productos`, 'warning');
            return false;
        }

        // Buscar si el producto ya existe en el carrito
        const existingIndex = cart.findIndex(item => item.id === producto.id);
        
        if (existingIndex !== -1) {
            // Producto ya existe, actualizar cantidad
            const nuevaCantidad = cart[existingIndex].cantidad + cantidad;
            
            if (nuevaCantidad > CONFIG.CART.MAX_QUANTITY) {
                showToast(CONFIG.MESSAGES.WARNING.CART_LIMIT, 'warning');
                return false;
            }
            
            if (nuevaCantidad > producto.stockActual) {
                showToast(`Stock insuficiente. Disponible: ${producto.stockActual}`, 'warning');
                return false;
            }
            
            cart[existingIndex].cantidad = nuevaCantidad;
            cart[existingIndex].subtotal = cart[existingIndex].precio * nuevaCantidad;
        } else {
            // Nuevo producto en el carrito
            if (cantidad > producto.stockActual) {
                showToast(`Stock insuficiente. Disponible: ${producto.stockActual}`, 'warning');
                return false;
            }
            
            cart.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precioVenta,
                cantidad: cantidad,
                subtotal: producto.precioVenta * cantidad,
                imagen: producto.imagenUrl || '/img/placeholder.jpg',
                stockDisponible: producto.stockActual
            });
        }
        
        // Guardar en localStorage y actualizar UI
        guardarCarritoEnStorage();
        updateCartCounter();
        showToast(CONFIG.MESSAGES.SUCCESS.PRODUCT_ADDED, 'success');
        
        return true;
    } catch (error) {
        console.error('Error agregando al carrito:', error);
        showToast('Error al agregar producto al carrito', 'danger');
        return false
    }
}

// Actualizar cantidad de un producto en el carrito
function actualizarCantidadCarrito(productoId, nuevaCantidad) {
    try {
        const index = cart.findIndex(item => item.id === productoId);
        
        if (index === -1) {
            showToast('Producto no encontrado en el carrito', 'warning');
            return false;
        }
        
        if (nuevaCantidad <= 0) {
            // Eliminar producto del carrito
            return eliminarDelCarrito(productoId);
        }
        
        if (nuevaCantidad > CONFIG.CART.MAX_QUANTITY) {
            showToast(`Cantidad máxima: ${CONFIG.CART.MAX_QUANTITY}`, 'warning');
            return false;
        }
        
        if (nuevaCantidad > cart[index].stockDisponible) {
            showToast(`Stock insuficiente. Disponible: ${cart[index].stockDisponible}`, 'warning');
            return false;
        }
        
        cart[index].cantidad = nuevaCantidad;
        cart[index].subtotal = cart[index].precio * nuevaCantidad;
        
        guardarCarritoEnStorage();
        updateCartCounter();
        actualizarVistaCarrito();
        
        return true;
    } catch (error) {
        console.error('Error actualizando carrito:', error);
        showToast('Error al actualizar el carrito', 'danger');
        return false;
    }
}

// Eliminar producto del carrito
function eliminarDelCarrito(productoId) {
    try {
        const index = cart.findIndex(item => item.id === productoId);
        
        if (index !== -1) {
            cart.splice(index, 1);
            guardarCarritoEnStorage();
            updateCartCounter();
            actualizarVistaCarrito();
            showToast('Producto eliminado del carrito', 'info');
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error eliminando del carrito:', error);
        showToast('Error al eliminar producto', 'danger');
        return false;
    }
}

// Limpiar carrito completo
function limpiarCarrito() {
    if (cart.length === 0) {
        showToast(CONFIG.MESSAGES.INFO.EMPTY_CART, 'info');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
        cart = [];
        guardarCarritoEnStorage();
        updateCartCounter();
        actualizarVistaCarrito();
        showToast('Carrito vaciado', 'info');
    }
}

// Mostrar carrito en modal
function mostrarCarrito() {
    if (cart.length === 0) {
        mostrarCarritoVacio();
    } else {
        mostrarCarritoConProductos();
    }
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('carritoModal'));
    modal.show();
}

// Mostrar carrito vacío
function mostrarCarritoVacio() {
    const content = `
        <div class="text-center py-4">
            <i class="fas fa-shopping-cart fa-4x text-muted mb-3"></i>
            <h5 class="text-muted">Tu carrito está vacío</h5>
            <p class="text-muted">Agrega algunos productos para comenzar</p>
            <button class="btn btn-primary" onclick="cerrarModalYIrAProductos()">
                <i class="fas fa-store"></i> Ver Productos
            </button>
        </div>
    `;
    
    document.getElementById('carritoContent').innerHTML = content;
    document.getElementById('carritoTotal').textContent = '0.00';
}

// Mostrar carrito con productos
function mostrarCarritoConProductos() {
    let content = '';
    let total = 0;
    
    cart.forEach(item => {
        total += item.subtotal;
        content += `
            <div class="cart-item d-flex align-items-center">
                <img src="${CONFIG.API_BASE_URL}${item.imagen}" 
                     alt="${item.nombre}" 
                     class="cart-item-image me-3"
                     onerror="this.src='img/placeholder.jpg'">
                
                <div class="flex-grow-1">
                    <h6 class="mb-1">${item.nombre}</h6>
                    <small class="text-muted">Precio: ${UTILS.formatPrice(item.precio)}</small>
                </div>
                
                <div class="quantity-controls me-3">
                    <button class="quantity-btn" onclick="actualizarCantidadCarrito(${item.id}, ${item.cantidad - 1})">
                        <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" class="quantity-input" value="${item.cantidad}" 
                           min="1" max="${item.stockDisponible}"
                           onchange="actualizarCantidadCarrito(${item.id}, this.value)">
                    <button class="quantity-btn" onclick="actualizarCantidadCarrito(${item.id}, ${item.cantidad + 1})">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                
                <div class="text-end me-3">
                    <div class="fw-bold">${UTILS.formatPrice(item.subtotal)}</div>
                    <small class="text-muted">Stock: ${item.stockDisponible}</small>
                </div>
                
                <button class="btn btn-outline-danger btn-sm" 
                        onclick="eliminarDelCarrito(${item.id})"
                        title="Eliminar producto">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    });
    
    content += `
        <div class="mt-3 pt-3 border-top">
            <div class="d-flex justify-content-between align-items-center">
                <button class="btn btn-outline-secondary" onclick="limpiarCarrito()">
                    <i class="fas fa-trash"></i> Vaciar Carrito
                </button>
                <div class="text-end">
                    <div class="h5 mb-0">Total: ${UTILS.formatPrice(total)}</div>
                    <small class="text-muted">${cart.length} producto(s)</small>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('carritoContent').innerHTML = content;
    document.getElementById('carritoTotal').textContent = total.toFixed(2);
}

// Actualizar vista del carrito
function actualizarVistaCarrito() {
    if (document.getElementById('carritoModal')?.classList.contains('show')) {
        mostrarCarrito();
    }
}

// Cerrar modal y ir a productos
function cerrarModalYIrAProductos() {
    bootstrap.Modal.getInstance(document.getElementById('carritoModal')).hide();
    cargarPagina('productos');
}

// Procesar compra
async function procesarCompra() {
    if (cart.length === 0) {
        showToast(CONFIG.MESSAGES.ERROR.CART_EMPTY, 'warning');
        return;
    }
    
    if (!currentUser) {
        showToast('Debes iniciar sesión para realizar una compra', 'warning');
        bootstrap.Modal.getInstance(document.getElementById('carritoModal')).hide();
        cargarPagina('login');
        return;
    }
    
    try {
        // Preparar datos de la orden
        const ordenData = {
            detalles: cart.map(item => ({
                productoId: item.id,
                cantidad: item.cantidad,
                precioUnitario: item.precio
            })),
            total: calcularTotalCarrito()
        };
        
        const response = await OrdenesAPI.crear(ordenData);
        
        // Limpiar carrito y mostrar éxito
        cart = [];
        guardarCarritoEnStorage();
        updateCartCounter();
        
        bootstrap.Modal.getInstance(document.getElementById('carritoModal')).hide();
        
        showToast(CONFIG.MESSAGES.SUCCESS.ORDER_CREATED, 'success');
        mostrarDetalleOrden(response);
        
    } catch (error) {
        console.error('Error procesando compra:', error);
        showToast(error.message || 'Error al procesar la compra', 'danger');
    }
}

// Calcular total del carrito
function calcularTotalCarrito() {
    return cart.reduce((total, item) => total + item.subtotal, 0);
}

// Obtener cantidad total de productos en carrito
function obtenerCantidadTotalCarrito() {
    return cart.reduce((total, item) => total + item.cantidad, 0);
}

// Actualizar contador del carrito en la navbar
function actualizaContadorCarrito() {
    const counter = document.getElementById('carritoCount');
    if (counter) {
        const totalItems = obtenerCantidadTotalCarrito();
        counter.textContent = totalItems;
        counter.style.display = totalItems > 0 ? 'inline' : 'none';
        counter.textContent = window.cart ? window.cart.length : 0;
    }
}

window.actualizarContadorCarrito = actualizarContadorCarrito;
    
// Guardar carrito en localStorage
function guardarCarritoEnStorage() {
    try {
        localStorage.setItem(CONFIG.CART.STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
        console.error('Error guardando carrito:', error);
    }
}

// Cargar carrito desde localStorage
function cargarCarritoDesdeStorage() {
    try {
        const savedCart = localStorage.getItem(CONFIG.CART.STORAGE_KEY);
        if (savedCart) {
            cart = JSON.parse(savedCart);
            updateCartCounter();
        }
    } catch (error) {
        console.error('Error cargando carrito:', error);
        cart = [];
    }
}

// Mostrar detalle de orden (placeholder)
function mostrarDetalleOrden(orden) {
    const detalleHtml = `
        <div class="alert alert-success">
            <h5><i class="fas fa-check-circle"></i> ¡Compra Exitosa!</h5>
            <p><strong>Número de Orden:</strong> #${orden.id}</p>
            <p><strong>Total:</strong> ${UTILS.formatPrice(orden.total)}</p>
            <p><strong>Estado:</strong> ${UTILS.capitalize(orden.estado)}</p>
            <p class="mb-0">Recibirás un email de confirmación en breve.</p>
        </div>
    `;
    
    // Aquí podrías mostrar un modal con los detalles o redirigir a una página de confirmación
    document.getElementById('contenidoPrincipal').innerHTML = detalleHtml;
}

// Verificar stock de productos en carrito
async function verificarStockCarrito() {
    try {
        for (let item of cart) {
            const producto = await ProductosAPI.obtenerPorId(item.id);
            if (producto.stockActual < item.cantidad) {
                showToast(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stockActual}`, 'warning');
                // Ajustar cantidad automáticamente
                actualizarCantidadCarrito(item.id, producto.stockActual);
            }
        }
    } catch (error) {
        console.error('Error verificando stock:', error);
    }
}

// Inicializar carrito al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarCarritoDesdeStorage();
});