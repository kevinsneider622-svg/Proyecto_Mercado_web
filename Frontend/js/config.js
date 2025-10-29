// ============================================
// CONFIGURACIÓN GLOBAL
// ============================================

const CONFIG = {
    api: {
        // URL base de la API - detecta automáticamente el entorno
        baseUrl: (() => {
           
            // Verificar si existe variable de entorno (Front) 
            if (typeof window !== 'undefined') {
                if (window.ENV?.VITE_API_URL) {
                    return window.ENV.VITE_API_URL;
            }


            // Detectar entorno por hostname (Local)
            const isDevelopment =window.location.hostname === 'localhost' ||
                                window.location.hostname === '127.0.0.1'; 


            // Retornar URL según entorno
            return isDevelopment 
                ? 'http://localhost:3000'
                : 'https://proyecto-mercado-web.onrender.com';
        }

        // Verificar si existeb variable de entorno (Back)
        
        if (typeof process !== 'undefined') {
            return process.env.NODE_ENV === 'production'    
                ? 'https://proyecto-mercado-web.onrender.com'
                : 'http://localhost:3000';
        }

        //FallBack
        return 'http://localhost:3000';

        })()

      },
    };  


        // URLs específicas
    endpoints: {
        // Autenticación
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        VERIFY_TOKEN: '/api/auth/verify',
        PROFILE: '/api/auth/profile',
        
        // Productos
        PRODUCTOS: '/api/productos',
        PRODUCTOS_DESTACADOS: '/api/productos/destacados',
        PRODUCTOS_CATEGORIA: '/api/productos/categoria',
        PRODUCTOS_BUSCAR: '/api/productos/buscar',
        
        // Categorías
        CATEGORIAS: '/api/categorias',
        
        // Proveedores
        PROVEEDORES: '/api/proveedores',
        
        // Clientes
        CLIENTES: '/api/clientes',
        
        // Órdenes
        ORDENES: '/api/ordenes',
        
        // Dashboard
        DASHBOARD: '/api/dashboard',
        ESTADISTICAS: '/api/dashboard/estadisticas',
        ULTIMAS_VENTAS: '/api/dashboard/ultimas-ventas',
        STOCK_BAJO: '/api/dashboard/stock-bajo',
        VENTAS_CATEGORIA: '/api/dashboard/ventas-por-categoria'
    },

    // Configuración de UI
    ui: {
        ANIMATION_DURATION: 300,
        TOAST_DURATION: 5000,
        DEBOUNCE_DELAY: 500,
        LOADING_DELAY: 300
    },

    // Configuración de paginación
    pagination: {
        DEFAULT_LIMIT: 12,
        MAX_LIMIT: 50,
        VISIBLE_PAGES: 5
    },
    
    // Configuración de archivos
    files: {
        MAX_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        UPLOAD_PATH: '/uploads',
        MAX_FILES: 5
    },
    
    // Configuración del carrito
    cart: {
        STORAGE_KEY: 'supermercado_cart',
        MAX_QUANTITY: 99,
        TIMEOUT: 30 * 60 * 1000 // 30 minutos
    },
    
    // Configuración de la aplicación
    app: {
        NAME: 'Mi Supermercado',
        VERSION: '1.0.0',
        COMPANY: 'Supermercado Digital',
        DESCRIPTION: 'Sistema de gestión para supermercados',
        SUPPORT_EMAIL: 'soporte@misupermercado.com',
        SUPPORT_PHONE: '+57 1 234 5678'
    },
    
    // Mensajes predefinidos
    messages: {
        SUCCESS: {
            PRODUCT_ADDED: 'Producto agregado al carrito',
            PRODUCT_UPDATED: 'Producto actualizado correctamente',
            PRODUCT_DELETED: 'Producto eliminado correctamente',
            ORDER_CREATED: 'Pedido creado exitosamente',
            LOGIN_SUCCESS: 'Sesión iniciada correctamente',
            LOGOUT_SUCCESS: 'Sesión cerrada correctamente',
            REGISTER_SUCCESS: 'Cuenta creada exitosamente',
            PROFILE_UPDATED: 'Perfil actualizado correctamente',
            CART_UPDATED: 'Carrito actualizado correctamente'
        },
        ERROR: {
            GENERIC: 'Ha ocurrido un error. Intenta nuevamente.',
            NETWORK: 'Error de conexión. Verifica tu internet.',
            UNAUTHORIZED: 'No tienes permisos para esta acción.',
            PRODUCT_NOT_FOUND: 'Producto no encontrado',
            CART_EMPTY: 'El carrito está vacío',
            INVALID_CREDENTIALS: 'Credenciales incorrectas',
            SERVER_ERROR: 'Error del servidor. Contacta al administrador.',
            VALIDATION_ERROR: 'Por favor verifica los datos ingresados',
            FILE_TOO_LARGE: 'El archivo es demasiado grande',
            FILE_TYPE_NOT_ALLOWED: 'Tipo de archivo no permitido'
        },
        WARNING: {
            LOW_STOCK: 'Stock bajo para este producto',
            CART_LIMIT: 'Has alcanzado el límite máximo de este producto',
            UNSAVED_CHANGES: 'Tienes cambios sin guardar',
            SESSION_EXPIRED: 'Tu sesión ha expirado',
            OFFLINE_MODE: 'Estás trabajando sin conexión'
        },
        INFO: {
            LOADING: 'Cargando...',
            NO_RESULTS: 'No se encontraron resultados',
            EMPTY_CART: 'Tu carrito está vacío',
            SEARCHING: 'Buscando...',
            PROCESSING: 'Procesando...'
        }
    },

    // Estados de productos
    productStatus: {
        ACTIVE: 'activo',
        INACTIVE: 'inactivo',
        OUT_OF_STOCK: 'agotado'
    },
    
    // Estados de órdenes
    orderStatus: {
        PENDING: 'pendiente',
        PROCESSING: 'procesando',
        SHIPPED: 'enviado',
        DELIVERED: 'entregado',
        CANCELLED: 'cancelado',
        REFUNDED: 'reembolsado'
    },
    
    // Roles de usuario
    userRoles: {
        ADMIN: 'admin',
        EMPLOYEE: 'empleado',
        CUSTOMER: 'cliente'
    },

    // Categorías predefinidas
    categories: {
        FRUTAS: 'Frutas y Verduras',
        LACTEOS: 'Lácteos y Huevos',
        CARNES: 'Carnes y Pescados',
        PANADERIA: 'Panadería y Pastelería',
        BEBIDAS: 'Bebidas y Licores',
        LIMPIEZA: 'Limpieza del Hogar',
        CUIDADO_PERSONAL: 'Cuidado Personal',
        DESPENSA: 'Despensa Básica',
        CONGELADOS: 'Productos Congelados',
        MASCOTAS: 'Mascotas'
    },

    // Configuración de temas
    themes: {
        LIGHT: 'light',
        DARK: 'dark',
        AUTO: 'auto'
    }
};

// ============================================
// VARIABLES GLOBALES
// ============================================

let currentUser = null;
let currentPage = 'inicio';
let cart = [];
let appInitialized = false;

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

const UTILS = {
    // Formatear precio
    formatPrice: (price, currency = 'COP') => {
        if (typeof price !== 'number') {
            price = parseFloat(price) || 0;
        }
        
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    },
    
    // Formatear precio con decimales
    formatPriceDecimal: (price, currency = 'COP') => {
        if (typeof price !== 'number') {
            price = parseFloat(price) || 0;
        }
        
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price);
    },
    
    // Formatear fecha
    formatDate: (date, options = {}) => {
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        return new Date(date).toLocaleDateString('es-CO', { ...defaultOptions, ...options });
    },
    
    // Formatear fecha y hora
    formatDateTime: (date) => {
        return new Date(date).toLocaleString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // Formatear fecha relativa (hace x tiempo)
    formatRelativeTime: (date) => {
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Ahora mismo';
        if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
        if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
        
        return UTILS.formatDate(date);
    },
    
    // Capitalizar primera letra
    capitalize: (str) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },
    
    // Capitalizar cada palabra
    capitalizeWords: (str) => {
        if (!str) return '';
        return str.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    },
    
    // Generar ID único
    generateId: (length = 8) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },
    
    // Debounce function
    debounce: (func, wait, immediate = false) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },
    
    // Throttle function
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
    
    // Validar email
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Validar teléfono
    isValidPhone: (phone) => {
        const phoneRegex = /^[+]?[\s\d\-\(\)]{7,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    },
    
    // Validar URL
    isValidUrl: (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },
    
    // Limpiar HTML
    sanitizeHtml: (str) => {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },
    
    // Escapar caracteres especiales para regex
    escapeRegex: (str) => {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },
    
    // Obtener parámetros URL
    getUrlParams: () => {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    },
    
    // Actualizar parámetros URL
    updateUrlParams: (params) => {
        const url = new URL(window.location);
        Object.keys(params).forEach(key => {
            if (params[key] === null || params[key] === '') {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, params[key]);
            }
        });
        window.history.replaceState({}, '', url);
    },
    
    // Scroll suave
    smoothScroll: (target, offset = 0) => {
        const element = typeof target === 'string' ? document.querySelector(target) : target;
        if (!element) return;
        
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    },
    
    // Copiar al portapapeles
    copyToClipboard: async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback para navegadores antiguos
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        }
    },
    
    // Descargar archivo
    downloadFile: (content, filename, contentType = 'text/plain') => {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },
    
    // Validar archivo
    isValidFile: (file, maxSize = CONFIG.files.MAX_SIZE, allowedTypes = CONFIG.files.ALLOWED_TYPES) => {
        if (file.size > maxSize) {
            return { valid: false, error: CONFIG.messages.ERROR.FILE_TOO_LARGE };
        }
        
        if (!allowedTypes.includes(file.type)) {
            return { valid: false, error: CONFIG.messages.ERROR.FILE_TYPE_NOT_ALLOWED };
        }
        
        return { valid: true, error: null };
    },
    
    // Formatear tamaño de archivo
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // Obtener diferencia entre fechas
    getDateDiff: (date1, date2, unit = 'days') => {
        const diffMs = new Date(date2) - new Date(date1);
        const conversions = {
            milliseconds: 1,
            seconds: 1000,
            minutes: 1000 * 60,
            hours: 1000 * 60 * 60,
            days: 1000 * 60 * 60 * 24
        };
        
        return Math.floor(diffMs / conversions[unit]);
    },
    
    // Verificar si es móvil
    isMobile: () => {
        return window.innerWidth <= 768;
    },
    
    // Verificar si es tablet
    isTablet: () => {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    },
    
    // Verificar si es escritorio
    isDesktop: () => {
        return window.innerWidth > 1024;
    }
};

// ============================================
// FUNCIONES DE INICIALIZACIÓN
// ============================================

/**
 * Inicializar la aplicación
 */
function initializeApp() {
    if (appInitialized) return;
    
    console.log(`🚀 Inicializando ${CONFIG.app.NAME} v${CONFIG.app.VERSION}`);
    console.log(`📍 Entorno: ${window.location.hostname}`);
    console.log(`🔗 API Base: ${CONFIG.api.baseUrl}`);
    
    // Cargar carrito desde localStorage
    loadCartFromStorage();
    
    // Configurar event listeners globales
    setupGlobalEventListeners();
    
    // Configurar tema
    setupTheme();
    
    appInitialized = true;
    
    console.log('✅ Aplicación inicializada correctamente');
}

/**
 * Cargar carrito desde localStorage
 */
function loadCartFromStorage() {
    try {
        const savedCart = localStorage.getItem(CONFIG.cart.STORAGE_KEY);
        const savedTimestamp = localStorage.getItem(`${CONFIG.cart.STORAGE_KEY}_timestamp`);
        
        if (savedCart) {
            const cartData = JSON.parse(savedCart);
            const now = Date.now();
            const savedTime = parseInt(savedTimestamp) || 0;
            
            // Verificar si el carrito ha expirado (30 minutos)
            if (now - savedTime < CONFIG.cart.TIMEOUT) {
                cart = cartData;
                updateCartCounter();
            } else {
                // Limpiar carrito expirado
                localStorage.removeItem(CONFIG.cart.STORAGE_KEY);
                localStorage.removeItem(`${CONFIG.cart.STORAGE_KEY}_timestamp`);
                cart = [];
            }
        }
    } catch (error) {
        console.error('❌ Error cargando carrito:', error);
        cart = [];
    }
}

/**
 * Guardar carrito en localStorage
 */
function saveCartToStorage() {
    try {
        localStorage.setItem(CONFIG.cart.STORAGE_KEY, JSON.stringify(cart));
        localStorage.setItem(`${CONFIG.cart.STORAGE_KEY}_timestamp`, Date.now().toString());
    } catch (error) {
        console.error('❌ Error guardando carrito:', error);
    }
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
        showToast('⚠️ Sin conexión a internet', 'warning');
    });
    
    // Manejar cambios de tamaño de pantalla
    window.addEventListener('resize', UTILS.debounce(() => {
        handleResponsiveChanges();
    }, CONFIG.ui.DEBOUNCE_DELAY));
    
    // Guardar carrito antes de cerrar la página
    window.addEventListener('beforeunload', () => {
        saveCartToStorage();
    });
}

/**
 * Configurar tema de la aplicación
 */
function setupTheme() {
    const savedTheme = localStorage.getItem('theme') || CONFIG.themes.AUTO;
    setTheme(savedTheme);
}

/**
 * Establecer tema
 */
function setTheme(theme) {
    const html = document.documentElement;
    
    if (theme === CONFIG.themes.AUTO) {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        html.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
    } else {
        html.setAttribute('data-bs-theme', theme);
    }
    
    localStorage.setItem('theme', theme);
}

/**
 * Manejar cambios responsive
 */
function handleResponsiveChanges() {
    // Aquí puedes agregar lógica específica para cambios de tamaño
    const breakpoint = UTILS.isMobile() ? 'mobile' : UTILS.isTablet() ? 'tablet' : 'desktop';
    
    // Disparar evento personalizado
    window.dispatchEvent(new CustomEvent('breakpointChange', {
        detail: { breakpoint }
    }));
}

/**
 * Actualizar contador del carrito
 */
function updateCartCounter() {
    const cartCounter = document.getElementById('cartCounter');
    if (cartCounter) {
        const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);
        cartCounter.textContent = totalItems;
        cartCounter.style.display = totalItems > 0 ? 'inline' : 'none';
    }
}

/**
 * Mostrar toast (notificación)
 */
function showToast(message, type = 'info', duration = CONFIG.ui.TOAST_DURATION) {
    // Buscar contenedor de toasts o crear uno
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Crear toast
    const toastId = 'toast-' + UTILS.generateId();
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-bg-${type} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Mostrar toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: duration });
    toast.show();
    
    // Remover del DOM cuando se oculte
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// ============================================
// INICIALIZACIÓN AUTOMÁTICA
// ============================================

// Inicializar cuando el DOM esté listo
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
    window.UTILS = UTILS;
    window.currentUser = currentUser;
    window.currentPage = currentPage;
    window.cart = cart;
    window.initializeApp = initializeApp;
    window.showToast = showToast;
    window.updateCartCounter = updateCartCounter;
    window.saveCartToStorage = saveCartToStorage;
    window.setTheme = setTheme;
    
    console.log('%c✅ CONFIG CARGADO GLOBALMENTE', 'color: #00ff00; font-weight: bold; font-size: 14px');
    console.log('🌐 Backend URL:', CONFIG.api.baseUrl);
    console.log('📍 Hostname:', window.location.hostname);
}

// ============================================
// INICIALIZACIÓN AUTOMÁTICA
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// ============================================
// EXPORTACIONES ES6 (para módulos)
// ============================================

export {
    CONFIG,
    UTILS,
    currentUser,
    currentPage,
    cart,
    initializeApp,
    showToast,
    updateCartCounter,
    saveCartToStorage,
    setTheme
};

export default {
    CONFIG,
    UTILS,
    currentUser,
    currentPage,
    cart,
    initializeApp,
    showToast,
    updateCartCounter,
    saveCartToStorage,
    setTheme
};
