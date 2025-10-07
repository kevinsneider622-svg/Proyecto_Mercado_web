/**
 * UTILS.js
 * * Este archivo contiene un conjunto de funciones de utilidad (helpers)
 * que se usan a lo largo de toda la aplicación frontend.
 * * Se expone como // Función para cargar la tabla de productos
async function cargarTablaProductos() {
    try {
        const response = await ProductosAPI.obtenerTodos();
        const tbody = document.getElementById('productosTableBody');
        
        if (!tbody) return;
        
        if (!response.productos || response.productos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">No hay productos disponibles</td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = response.productos.map(producto => `
            <tr>
                <td>${producto.id}</td>
                <td>${producto.nombre}</td>
                <td>${window.UTILS.formatPrice(producto.precio_venta || producto.precioVenta)}</td>
                <td>
                    <span class="badge ${producto.stock_actual < 10 ? 'bg-danger' : 'bg-success'}">
                        ${producto.stock_actual}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="editarProducto(${producto.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarProducto(${producto.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error al cargar la tabla de productos:', error);
        const tbody = document.getElementById('productosTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-danger">
                        <i class="fas fa-exclamation-triangle"></i> 
                        Error al cargar los productos
                    </td>
                </tr>
            `;
        }
    }
}

// Hacer el objeto UTILS accesible globalmente.
window.UTILS = UTILS; objeto global llamado UTILS.
 * * Requiere: Nada, debe cargarse antes de api.js y main.js.
 */
window.UTILS = {
    /**
     * @function debounce
     * Retrasa la ejecución de una función hasta que haya pasado cierto tiempo
     * sin que se haya llamado de nuevo (útil para eventos como resize, input de búsqueda).
     * @param {function} func - La función a ejecutar.
     * @param {number} delay - El tiempo de espera en milisegundos.
     * @returns {function} Una función debounced que envuelve la original.
     */
    debounce: (func, delay) => {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    },

    /**
     * @function throttle
     * Limita la ejecución de una función a una vez cada cierto tiempo.
     * @param {function} func - La función a ejecutar.
     * @param {number} limit - El tiempo mínimo entre ejecuciones en milisegundos.
     * @returns {function} Una función throttled que envuelve la original.
     */
    throttle: (func, limit) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * @function formatPrice
     * Formatea un número como una cadena de texto de moneda.
     * @param {number} price - El valor numérico a formatear.
     * @param {string} locale - El código de localización (por defecto 'es-CO').
     * @param {string} currency - El código de moneda (por defecto 'COP').
     * @returns {string} El precio formateado como string.
     */
    formatPrice: (price, locale = 'es-CO', currency = 'COP') => {
        if (isNaN(price)) return '---';
        return new Intl.NumberFormat(locale, { 
            style: 'currency', 
            currency: currency, 
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    },

    /**
     * @function sleep
     * Devuelve una promesa que se resuelve después de un tiempo.
     * @param {number} ms - Milisegundos a esperar.
     * @returns {Promise<void>}
     */
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
    
    /**
     * @function sanitizeInput
     * Limpia una cadena de texto para evitar inyecciones HTML básicas (XSS).
     * @param {string} str - La cadena a limpiar.
     * @returns {string} La cadena limpia.
     */
    sanitizeInput: (str) => {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * @function storage
     * Wrapper para localStorage con manejo de JSON y errores.
     */
    storage: {
        get: (key) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.error('Error reading from localStorage:', e);
                return null;
            }
        },
        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Error writing to localStorage:', e);
                return false;
            }
        },
        remove: (key) => {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Error removing from localStorage:', e);
                return false;
            }
        }
    },

    /**
     * @function generateId
     * Genera un ID único.
     * @returns {string} Un ID único.
     */
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * @function formatDate
     * Formatea una fecha en un formato legible.
     * @param {Date|string} date - La fecha a formatear.
     * @param {string} locale - El código de localización (por defecto 'es-CO').
     * @returns {string} La fecha formateada.
     */
    formatDate: (date, locale = 'es-CO') => {
        try {
            const d = new Date(date);
            return d.toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return '---';
        }
    },

    /**
     * @function validate
     * Funciones de validación comunes.
     */
    validate: {
        email: (email) => {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(String(email).toLowerCase());
        },
        phone: (phone) => {
            const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
            return re.test(String(phone));
        },
        url: (url) => {
            try {
                new URL(url);
                return true;
            } catch (e) {
                return false;
            }
        }
    }
};

// Hace el objeto UTILS accesible globalmente.
window.UTILS = UTILS;
