import { CONFIG, UTILS, Logger } from './config.js';

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
        Logger.info('ApiClient inicializado con baseURL:', this.baseURL);
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
    // MÉTODO PRIVADO PARA FETCH CON RETRY
    // ============================================

    async _fetch(endpoint, options = {}, retryCount = 0) {
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
            credentials: 'include',
            mode: 'cors' // Importante para CORS
        };

        // Remover body si es GET o HEAD
        if (['GET', 'HEAD'].includes(config.method?.toUpperCase())) {
            delete config.body;
        }

        try {
            Logger.log(`🌐 API Request: ${config.method} ${url}`);

            const response = await fetch(url, config);
            const duration = Date.now() - startTime;

            Logger.log(`📨 API Response: ${response.status} - ${duration}ms`);

            // Procesar respuesta
            const data = await this._handleResponse(response);

            return {
                success: true,
                data,
                status: response.status,
                duration: `${duration}ms`
            };

        } catch (error) {
            Logger.error(`❌ API Error: ${config.method} ${url}`, error);

            // Retry logic para errores de red
            if (retryCount < CONFIG.api.retryAttempts && this._shouldRetry(error)) {
                Logger.warn(`🔄 Reintentando... (${retryCount + 1}/${CONFIG.api.retryAttempts})`);
                await this._delay(CONFIG.api.retryDelay * (retryCount + 1));
                return this._fetch(endpoint, options, retryCount + 1);
            }

            return {
                success: false,
                error: this._getErrorMessage(error),
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
                const error = new Error(data.error || data.message || 'Error en la petición');
                error.status = response.status;
                error.details = data.details || data;
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
    // UTILIDADES DE ERROR Y RETRY
    // ============================================

    _shouldRetry(error) {
        // Reintentar solo en errores de red, no en errores del servidor
        return error.message.includes('fetch') || 
               error.message.includes('network') ||
               error.message.includes('NetworkError') ||
               error.status === 0;
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    _getErrorMessage(error) {
        if (error.status === 0) {
            return CONFIG.MESSAGES.NETWORK_ERROR;
        } else if (error.status === 401) {
            return CONFIG.MESSAGES.UNAUTHORIZED;
        } else if (error.status === 404) {
            return CONFIG.MESSAGES.NOT_FOUND;
        } else if (error.status >= 500) {
            return CONFIG.MESSAGES.SERVER_ERROR;
        }
        return error.message || 'Error desconocido';
    }

    // ============================================
    // MANEJO DE AUTENTICACIÓN
    // ============================================

    setToken(token) {
        Logger.info('🔑 Token establecido');
        UTILS.storage.set(CONFIG.AUTH.TOKEN_KEY, token);
        this.token = token;
    }

    getToken() {
        if (this.token) return this.token;
        return UTILS.storage.get(CONFIG.AUTH.TOKEN_KEY);
    }

    removeToken() {
        Logger.info('🔓 Token removido');
        this.token = null;
        UTILS.storage.remove(CONFIG.AUTH.TOKEN_KEY);
        UTILS.storage.remove(CONFIG.AUTH.USER_KEY);
    }

    setUser(userData) {
        UTILS.storage.set(CONFIG.AUTH.USER_KEY, userData);
    }

    getUser() {
        return UTILS.storage.get(CONFIG.AUTH.USER_KEY);
    }

    // ============================================
    // MÉTODOS ESPECÍFICOS - AUTENTICACIÓN
    // ============================================

    async login(credentials) {
        const response = await this.post(CONFIG.endpoints.LOGIN, credentials);
        
        if (response.success && response.data.token) {
            this.setToken(response.data.token);
            if (response.data.user) {
                this.setUser(response.data.user);
            }
            Logger.success('✅ Login exitoso');
        }
        
        return response;
    }

    async register(userData) {
        const response = await this.post(CONFIG.endpoints.REGISTER, userData);
        
        if (response.success && response.data.token) {
            this.setToken(response.data.token);
            if (response.data.user) {
                this.setUser(response.data.user);
            }
            Logger.success('✅ Registro exitoso');
        }
        
        return response;
    }

    async verifyToken() {
        return this.get(CONFIG.endpoints.VERIFY_TOKEN);
    }

    async logout() {
        this.removeToken();
        Logger.success('✅ Sesión cerrada');
        return { success: true, message: 'Sesión cerrada' };
    }

    // ============================================
    // MÉTODOS ESPECÍFICOS - PRODUCTOS
    // ============================================

    async getProductos(page = 1, limit = CONFIG.PAGINATION.DEFAULT_LIMIT) {
        return this.get(`${CONFIG.endpoints.PRODUCTOS}?page=${page}&limit=${limit}`);
    }

    async getProductoById(id) {
        return this.get(`${CONFIG.endpoints.PRODUCTOS}/${id}`);
    }

    async getProductosDestacados() {
        return this.get(CONFIG.endpoints.PRODUCTOS_DESTACADOS);
    }

    async getProductosPorCategoria(categoriaId, page = 1) {
        return this.get(`${CONFIG.endpoints.PRODUCTOS}/categoria/${categoriaId}?page=${page}`);
    }

    async buscarProductos(termino, page = 1) {
        const terminoEncoded = encodeURIComponent(termino);
        return this.get(`${CONFIG.endpoints.PRODUCTOS_BUSCAR}/${terminoEncoded}?page=${page}`);
    }

    async crearProducto(productoData) {
        return this.post(CONFIG.endpoints.PRODUCTOS, productoData);
    }

    async actualizarProducto(id, productoData) {
        return this.put(`${CONFIG.endpoints.PRODUCTOS}/${id}`, productoData);
    }

    async eliminarProducto(id) {
        return this.delete(`${CONFIG.endpoints.PRODUCTOS}/${id}`);
    }

    // ============================================
    // MÉTODOS ESPECÍFICOS - DASHBOARD
    // ============================================

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

    // ============================================
    // MÉTODOS ESPECÍFICOS - CARRITO
    // ============================================

    async getCarrito() {
        return this.get('/api/carrito');
    }

    async agregarAlCarrito(productoId, cantidad = 1) {
        return this.post('/api/carrito/agregar', { productoId, cantidad });
    }

    async actualizarCarrito(itemId, cantidad) {
        return this.put(`/api/carrito/${itemId}`, { cantidad });
    }

    async eliminarDelCarrito(itemId) {
        return this.delete(`/api/carrito/${itemId}`);
    }

    async vaciarCarrito() {
        return this.delete('/api/carrito');
    }

    // ============================================
    // MÉTODOS ESPECÍFICOS - PAGOS
    // ============================================

    async crearTransaccion(datosTransaccion) {
        return this.post(`${CONFIG.endpoints.PAGOS}/crear-transaccion`, datosTransaccion);
    }

    async verificarTransaccion(transaccionId) {
        return this.get(`${CONFIG.endpoints.PAGOS}/verificar/${transaccionId}`);
    }

    // ============================================
    // UTILIDADES
    // ============================================

    async healthCheck() {
        return this.get(CONFIG.endpoints.HEALTH);
    }

    async testDB() {
        return this.get(CONFIG.endpoints.TEST_DB);
    }

    async subirArchivo(archivo, endpoint = CONFIG.FILES.UPLOAD_ENDPOINT) {
        const formData = new FormData();
        formData.append('archivo', archivo);

        return this._fetch(endpoint, {
            method: 'POST',
            body: formData,
            headers: {} // No establecer Content-Type para FormData
        });
    }
}

// ============================================
// INSTANCIA GLOBAL
// ============================================

const api = new ApiClient();

// ============================================
// INTERCEPTOR GLOBAL PARA ERRORES 401
// ============================================

if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
        const response = await originalFetch.apply(this, args);
        
        if (response.status === 401) {
            Logger.warn('🔐 Sesión expirada, limpiando token...');
            api.removeToken();
            
            // Opcional: redirigir a login si no estamos ya allí
            if (!window.location.pathname.includes('/login')) {
                Logger.info('🔄 Redirigiendo a login...');
                // window.location.href = '/login';
            }
        }
        
        return response;
    };
}

// ============================================
// FUNCIONES DE CONVENIENCIA
// ============================================

export const auth = {
    login: (credentials) => api.login(credentials),
    register: (userData) => api.register(userData),
    verify: () => api.verifyToken(),
    logout: () => api.logout(),
    setToken: (token) => api.setToken(token),
    getToken: () => api.getToken(),
    getUser: () => api.getUser(),
    setUser: (userData) => api.setUser(userData)
};

export const productos = {
    getAll: (page, limit) => api.getProductos(page, limit),
    getById: (id) => api.getProductoById(id),
    getDestacados: () => api.getProductosDestacados(),
    getPorCategoria: (categoriaId, page) => api.getProductosPorCategoria(categoriaId, page),
    buscar: (termino, page) => api.buscarProductos(termino, page),
    crear: (data) => api.crearProducto(data),
    actualizar: (id, data) => api.actualizarProducto(id, data),
    eliminar: (id) => api.eliminarProducto(id)
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

export const pagos = {
    crear: (datos) => api.crearTransaccion(datos),
    verificar: (id) => api.verificarTransaccion(id)
};

export const utils = {
    health: () => api.healthCheck(),
    testDB: () => api.testDB(),
    subirArchivo: (archivo, endpoint) => api.subirArchivo(archivo, endpoint)
};

// Exportar la instancia principal
export default api;