// Configuración global
const CONFIG = {
    // URL base de la API
    API_BASE_URL: 'https://proyecto-mercado-web.onrender.com/api',

    // URLs específicas
    ENDPOINTS: {
        // Autenticación
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        VERIFY_TOKEN: '/auth/verify',
        
        // Productos
        PRODUCTOS: '/productos',
        PRODUCTO_BY_ID: '/productos',
        
        // Categorías
        CATEGORIAS: '/categorias',
        
        // Proveedores
        PROVEEDORES: '/proveedores',
        
        // Clientes
        CLIENTES: '/clientes',
        
        // Órdenes
        ORDENES: '/ordenes',
        
        // Dashboard
        DASHBOARD: '/dashboard',
        ESTADISTICAS: '/dashboard/estadisticas'
    },

    // Configuración de UI
    UI: {
        ANIMATION_DURATION: 300,
        TOAST_DURATION: 5000,
        DEBOUNCE_DELAY: 500
    },

    // Configuración de paginación
    PAGINATION: {
        DEFAULT_LIMIT: 12,
        MAX_LIMIT: 50
    },
    
    // Configuración de archivos
    FILES: {
        MAX_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
        UPLOAD_PATH: '/uploads'
    },
    
    // Configuración del carrito
    CART: {
        STORAGE_KEY: 'supermercado_cart',
        MAX_QUANTITY: 99
    },
    
    // Configuración de la aplicación
    APP: {
        NAME: 'Mi Supermercado',
        VERSION: '1.0.0',
        COMPANY: 'Tu Empresa'
    },
    
    // Mensajes predefinidos
    MESSAGES: {
        SUCCESS: {
            PRODUCT_ADDED: 'Producto agregado al carrito',
            PRODUCT_UPDATED: 'Producto actualizado correctamente',
            PRODUCT_DELETED: 'Producto eliminado correctamente',
            ORDER_CREATED: 'Pedido creado exitosamente',
            LOGIN_SUCCESS: 'Sesión iniciada correctamente',
            LOGOUT_SUCCESS: 'Sesión cerrada correctamente'
        },
        ERROR: {
            GENERIC: 'Ha ocurrido un error. Intenta nuevamente.',
            NETWORK: 'Error de conexión. Verifica tu internet.',
            UNAUTHORIZED: 'No tienes permisos para esta acción.',
            PRODUCT_NOT_FOUND: 'Producto no encontrado',
            CART_EMPTY: 'El carrito está vacío',
            INVALID_CREDENTIALS: 'Credenciales incorrectas',
            SERVER_ERROR: 'Error del servidor. Contacta al administrador.'
        },
        WARNING: {
            LOW_STOCK: 'Stock bajo para este producto',
            CART_LIMIT: 'Has alcanzado el límite máximo de este producto',
            UNSAVED_CHANGES: 'Tienes cambios sin guardar'
        },
        INFO: {
            LOADING: 'Cargando...',
            NO_RESULTS: 'No se encontraron resultados',
            EMPTY_CART: 'Tu carrito está vacío'
        }
    },
    
    
    
    // Estados de productos
    PRODUCT_STATUS: {
        ACTIVE: 'activo',
        INACTIVE: 'inactivo'
    },
    
    // Estados de órdenes
    ORDER_STATUS: {
        PENDING: 'pendiente',
        PROCESSING: 'procesando',
        SHIPPED: 'enviado',
        DELIVERED: 'entregado',
        CANCELLED: 'cancelado'
    },
    
    // Roles de usuario
    USER_ROLES: {
        ADMIN: 'admin',
        EMPLOYEE: 'empleado',
        CUSTOMER: 'cliente'
    }
};

// Variables globales
let currentUser = null;
let currentPage = 'inicio';
let cart = [];

// Funciones de utilidad
const UTILS = {
    // Formatear precio
    formatPrice: (price) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(price);
    },
    
    // Formatear fecha
    formatDate: (date) => {
        return new Date(date).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    // Formatear fecha y hora
    formatDateTime: (date) => {
        return new Date(date).toLocaleString('es-CO');
    },
    
    // Capitalizar primera letra
    capitalize: (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    
    // Generar ID único
    generateId: () => {
        return Math.random().toString(36).substr(2, 9);
    },
    
    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Validar email
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // Validar teléfono
    isValidPhone: (phone) => {
        const phoneRegex = /^[+]?[\s\d\-\(\)]{7,}$/;
        return phoneRegex.test(phone);
    },
    
    // Limpiar HTML
    sanitizeHtml: (str) => {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
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
    
    // Scroll suave
    smoothScroll: (target) => {
        document.querySelector(target)?.scrollIntoView({
            behavior: 'smooth'
        });
    }
};

// Event listeners globales
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar aplicación
    initializeApp();
});

// Funciones de inicialización
function initializeApp() {
    console.log(`🚀 Inicializando ${CONFIG.APP.NAME} v${CONFIG.APP.VERSION}`);
    
    // Cargar carrito desde localStorage
    loadCartFromStorage();
    
    // Verificar autenticación
    checkAuthenticationStatus();
    
    // Configurar event listeners globales
    setupGlobalEventListeners();
    
    // Configurar interceptores
    setupApiInterceptors();
}

function loadCartFromStorage() {
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

function checkAuthenticationStatus() {
    const token = localStorage.getItem('token');
    if (token) {
        // Verificar si el token es válido
        verifyToken();
    }
}

function setupGlobalEventListeners() {
    // Manejar errores de red
    window.addEventListener('online', () => {
        showToast('Conexión restaurada', 'success');
    });
    
    window.addEventListener('offline', () => {
        showToast('Sin conexión a internet', 'warning');
    });
    
    // Manejar cambios de tamaño de pantalla
    window.addEventListener('resize', UTILS.debounce(() => {
        handleResponsiveChanges();
    }, CONFIG.UI.DEBOUNCE_DELAY));
}

function setupApiInterceptors() {
    // Los interceptores se configurarán en api.js
}

function handleResponsiveChang(){
    
}


// Exponer CONFIG, cart, currentUser, UTILS globalmente para que main.js y api.js los usen
window.CONFIG = CONFIG;
window.UTILS = UTILS;
window.cart = cart;
window.currentUser = currentUser;
window.currentPage = currentPage;   
//-----------------------------------------------------------------------------------------