// Carrito de compras - Versión completa funcional

function agregarAlCarrito(producto, cantidad = 1) {
    try {
        if (!window.cart) {
            window.cart = [];
        }

        const existente = window.cart.find(item => item.id === producto.id);
        
        if (existente) {
            existente.cantidad += cantidad;
        } else {
            window.cart.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precioVenta,
                cantidad: cantidad,
                imagen: producto.imagenUrl
            });
        }
        
        localStorage.setItem('supermercado_cart', JSON.stringify(window.cart));
        actualizarContadorCarrito();
        showToast('Producto agregado al carrito', 'success');
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al agregar producto', 'danger');
    }
}

function mostrarCarrito() {
    try {
        const modal = document.getElementById('carritoModal');
        if (!modal) {
            console.error('Modal carritoModal no encontrado');
            return;
        }

        const content = document.getElementById('carritoContent');
        const totalElement = document.getElementById('carritoTotal');
        
        if (!window.cart || window.cart.length === 0) {
            content.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-shopping-cart fa-4x text-muted mb-3"></i>
                    <h5 class="text-muted">Tu carrito está vacío</h5>
                    <p class="text-muted">Agrega algunos productos para comenzar</p>
                </div>
            `;
            totalElement.textContent = '0';
        } else {
            let html = '';
            let total = 0;
            
            window.cart.forEach(item => {
                const subtotal = item.precio * item.cantidad;
                total += subtotal;
                html += `
                    <div class="cart-item d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                        <div class="cart-item-info">
                            <h6 class="mb-0 text-dark">${item.nombre}</h6>
                            <span class="text-muted">$${item.precio.toLocaleString()} x ${item.cantidad}</span>
                        </div>
                        <div class="cart-item-actions d-flex align-items-center gap-2">
                            <span class="text-primary fw-bold">$${subtotal.toLocaleString()}</span>
                            <button class="btn btn-sm btn-outline-danger" onclick="eliminarDelCarrito(${item.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            content.innerHTML = html;
            totalElement.textContent = total.toLocaleString();
        }
        
        new bootstrap.Modal(modal).show();
        
    } catch (error) {
        console.error('Error mostrando carrito:', error);
        alert('Error al mostrar el carrito');
    }
}

function eliminarDelCarrito(id) {
    if (!window.cart) return;
    
    window.cart = window.cart.filter(item => item.id !== id);
    localStorage.setItem('supermercado_cart', JSON.stringify(window.cart));
    actualizarContadorCarrito();
    mostrarCarrito();
    showToast('Producto eliminado del carrito', 'info');
}

function actualizarContadorCarrito() {
    const counter = document.getElementById('carritoCount');
    if (counter && window.cart) {
        const total = window.cart.reduce((sum, item) => sum + item.cantidad, 0);
        counter.textContent = total;
        counter.style.display = total > 0 ? 'inline' : 'none';
    }
}

function procesarCompra() {
    if (!window.cart || window.cart.length === 0) {
        showToast('El carrito está vacío', 'warning');
        return;
    }
    
    const total = window.cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    if (confirm(`¿Confirmar compra por $${total.toLocaleString()}?`)) {
        showToast('¡Compra procesada exitosamente!', 'success');
        window.cart = [];
        localStorage.setItem('supermercado_cart', JSON.stringify(window.cart));
        actualizarContadorCarrito();
        bootstrap.Modal.getInstance(document.getElementById('carritoModal')).hide();
    }
}

// Exponer funciones globalmente
window.agregarAlCarrito = agregarAlCarrito;
window.mostrarCarrito = mostrarCarrito;
window.actualizarContadorCarrito = actualizarContadorCarrito;
window.eliminarDelCarrito = eliminarDelCarrito;
window.procesarCompra = procesarCompra;

// Cargar carrito al iniciar
document.addEventListener('DOMContentLoaded', function() {
    const saved = localStorage.getItem('supermercado_cart');
    if (saved) {
        window.cart = JSON.parse(saved);
        actualizarContadorCarrito();
    }
});