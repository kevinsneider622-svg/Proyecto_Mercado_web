// API principal
const API = {
    baseUrl: 'http://localhost:3000/api'
};

// Productos API
const ProductosAPI = {
    async obtenerTodos(params = {}) {
        try {
            const queryParams = new URLSearchParams({
                page: params.page || 1,
                limit: params.limit || 4
            }).toString();
            const response = await fetch(`${API.baseUrl}/productos?${queryParams}`);
            return await response.json();
        } catch (error) {
            console.error('Error al obtener productos:', error);
            return { productos: [], pagination: { page: 1, pages: 0, total: 0 } };
        }
    },

    async obtenerDestacados() {
        try {
            const response = await fetch(`${API.baseUrl}/productos/destacados`);
            return await response.json();
        } catch (error) {
            console.error('Error al obtener productos destacados:', error);
            return { productos: [] };
        }
    }
};

// Dashboard API
const DashboardAPI = {
    async obtenerEstadisticas() {
        try {
            console.log('Obteniendo estadísticas desde:', `${API.baseUrl}/dashboard/estadisticas`);
            const response = await fetch(`${API.baseUrl}/dashboard/estadisticas`);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log('Datos recibidos:', data);
            return data;
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            return {
                totalProductos: 0,
                totalCategorias: 0,
                totalClientes: 0,
                ordenesHoy: 0,
                ventasHoy: 0,
                productosStockBajo: 0
            };
        }
    },

    async obtenerProductosDestacados() {
        try {
            const response = await fetch(`${API.baseUrl}/productos/destacados`);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error al obtener productos destacados:', error);
            return { productos: [] };
        }
    }
};



// Exportar APIs globalmente
window.API = API;
window.DashboardAPI = DashboardAPI;
window.ProductosAPI = ProductosAPI;