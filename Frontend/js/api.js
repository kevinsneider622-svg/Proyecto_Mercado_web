import { CONFIG } from './config.js';
import { UTILS } from './config.js';

// ============================================
// CLASE PRINCIPAL DE API
// ============================================

class ApiClient {
    constructor(baseURL = CONFIG.api.baseUrl) {
        this.baseURL = baseURL;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
    }

    // ============================================
    // MÉTODOS HTTP BÁSICOS
    // ============================================

    async get(endpoint, options = {}) {
        return this._fetch(endpoint, {
            method: 'GET',
            ...options
        });
    }

    async post(endpoint, data = {}, options = {}) {
        return this._fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options
        });
    }

    async put(endpoint, data = {}, options = {}) {
        return this._fetch(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options
        });
    }

    async delete(endpoint, options = {}) {
        return this._fetch(endpoint, {
            method: 'DELETE',
            ...options
        });
    }

    async patch(endpoint, data = {}, options = {}) {
        return this._fetch(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
            ...options
        });
    }

    // ============================================
    // MÉTODO PRIVADO PARA FETCH
    // ============================================

    async _fetch(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const startTime = Date.now();

        // Preparar headers
        const headers = {
            ...this.defaultHeaders,
            ...options.headers
        };

        // Agregar token de autenticación si existe
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers,
            credentials: 'include'
        };

        // Remover body si es GET o HEAD
        if (['GET', 'HEAD'].includes(config.method?.toUpperCase())) {
            delete config.body;
        }

        try {
            console.log(`🌐 API Request: ${config.method} ${url}`);

            const response = await fetch(url, config);
            const duration = Date.now() - startTime;

            // Log de respuesta
            console.log(`📨 API Response: ${response.status} - ${duration}ms`);

            // Procesar respuesta
            const data = await this._handleResponse(response);

            return {
                success: true,
                data,
                status: response.status,
                duration: `${duration}ms`
            };

        } catch (error) {
            console.error(`❌ API Error: ${config.method} ${url}`, error);
            
            return {
                success: false,
                error: error.message,
                status: error.status || 0,
                details: error.details || null
            };
        }
    }

    // ============================================
    // MANEJO DE RESPUESTAS
    // ============================================

    async _handleResponse(response) {
        const contentType = response.headers.get('content-type');

        // Verificar si la respuesta es JSON
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.error || 'Error en la petición');
                error.status = response.status;
                error.details = data.details;
                throw error;
            }

            return data;
        } else {
            // Para respuestas que no son JSON
            const text = await response.text();

            if (!response.ok) {
                const error = new Error(text || 'Error en la petición');
                error.status = response.status;
                throw error;
            }

            return text;
        }
    }

    // ============================================
    // MANEJO DE AUTENTICACIÓN
    // ============================================

    setToken(token) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', token);
        }
        this.token = token;
    }

    getToken() {
        if (this.token) return this.token;
        
        if (typeof window !== 'undefined') {
            return localStorage.getItem('auth_token');
        }
        
        return null;
    }

    removeToken() {
        this.token = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
        }
    }

    // ============================================
    // MÉTODOS ESPECÍFICOS DE LA APLICACIÓN
    // ============================================

    // 🔐 AUTENTICACIÓN
    async login(credentials) {
        return this.post(CONFIG.endpoints.LOGIN, credentials);
    }

    async register(userData) {
        return this.post(CONFIG.endpoints.REGISTER, userData);
    }

    async verifyToken() {
        return this.get(CONFIG.endpoints.VERIFY_TOKEN);
    }

    async logout() {
        this.removeToken();
        return { success: true, message: 'Sesión cerrada' };
    }

    // 📦 PRODUCTOS
    async getProductos(page = 1, limit = CONFIG.PAGINATION.DEFAULT_LIMIT) {
        return this.get(`${CONFIG.endpoints.PRODUCTOS}?page=${page}&limit=${limit}`);
    }

    async getProductoById(id) {
        return this.get(`${CONFIG.endpoints.PRODUCTOS}/${id}`);
    }

    async getProductosDestacados() {
        return this.get(`${CONFIG.endpoints.PRODUCTOS}/destacados`);
    }

    async getProductosPorCategoria(categoriaId, page = 1) {
        return this.get(`${CONFIG.endpoints.PRODUCTOS}/categoria/${categoriaId}?page=${page}`);
    }

    async buscarProductos(termino, page = 1) {
        return this.get(`${CONFIG.endpoints.PRODUCTOS}/buscar/${encodeURIComponent(termino)}?page=${page}`);
    }

    // 📊 DASHBOARD
    async getEstadisticas() {
        return this.get(CONFIG.endpoints.ESTADISTICAS);
    }

    async getUltimasVentas() {
        return this.get(`${CONFIG.endpoints.DASHBOARD}/ultimas-ventas`);
    }

    async getStockBajo() {
        return this.get(`${CONFIG.endpoints.DASHBOARD}/stock-bajo`);
    }

    async getVentasPorCategoria() {
        return this.get(`${CONFIG.endpoints.DASHBOARD}/ventas-por-categoria`);
    }

    // 🛒 CARRITO (si está implementado en el backend)
    async getCarrito() {
        return this.get('/carrito');
    }

    async agregarAlCarrito(productoId, cantidad = 1) {
        return this.post('/carrito/agregar', { productoId, cantidad });
    }

    async actualizarCarrito(itemId, cantidad) {
        return this.put(`/carrito/${itemId}`, { cantidad });
    }

    async eliminarDelCarrito(itemId) {
        return this.delete(`/carrito/${itemId}`);
    }

    async vaciarCarrito() {
        return this.delete('/carrito');
    }

    // ============================================
    // UTILIDADES
    // ============================================

    // Health check del servidor
    async healthCheck() {
        return this.get('/health');
    }

    // Test de base de datos
    async testDB() {
        return this.get('/test-db');
    }

    // Subida de archivos
    async subirArchivo(archivo, endpoint = '/upload') {
        const formData = new FormData();
        formData.append('archivo', archivo);

        return this._fetch(endpoint, {
            method: 'POST',
            body: formData,
            headers: {
                // No establecer Content-Type para FormData, el navegador lo hace automáticamente
            }
        });
    }
}

// ============================================
// INSTANCIA GLOBAL Y CONFIGURACIÓN
// ============================================

// Crear instancia global
const api = new ApiClient();

// Interceptores globales (opcional)
if (typeof window !== 'undefined') {
    // Interceptor para redireccionar en errores de autenticación
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);
        
        if (response.status === 401) {
            console.warn('🔐 Sesión expirada, redirigiendo...');
            api.removeToken();
            // Opcional: redirigir a login
            // window.location.href = '/login';
        }
        
        return response;
    };
}

// ============================================
// FUNCIONES DE CONVENIENCIA
// ============================================

// Funciones de conveniencia para uso directo
export const auth = {
    login: (credentials) => api.login(credentials),
    register: (userData) => api.register(userData),
    verify: () => api.verifyToken(),
    logout: () => api.logout(),
    setToken: (token) => api.setToken(token)
};

export const productos = {
    getAll: (page, limit) => api.getProductos(page, limit),
    getById: (id) => api.getProductoById(id),
    getDestacados: () => api.getProductosDestacados(),
    getPorCategoria: (categoriaId, page) => api.getProductosPorCategoria(categoriaId, page),
    buscar: (termino, page) => api.buscarProductos(termino, page)
};

export const dashboard = {
    getEstadisticas: () => api.getEstadisticas(),
    getUltimasVentas: () => api.getUltimasVentas(),
    getStockBajo: () => api.getStockBajo(),
    getVentasPorCategoria: () => api.getVentasPorCategoria()
};

export const carrito = {
    get: () => api.getCarrito(),
    agregar: (productoId, cantidad) => api.agregarAlCarrito(productoId, cantidad),
    actualizar: (itemId, cantidad) => api.actualizarCarrito(itemId, cantidad),
    eliminar: (itemId) => api.eliminarDelCarrito(itemId),
    vaciar: () => api.vaciarCarrito()
};

export const utils = {
    health: () => api.healthCheck(),
    testDB: () => api.testDB(),
    subirArchivo: (archivo, endpoint) => api.subirArchivo(archivo, endpoint)
};

// Exportar la instancia principal
export default api;