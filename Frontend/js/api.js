// API de Productos
const ProductosAPI = {
    async obtenerTodos(filtros = {}) {
        const query = new URLSearchParams(filtros).toString();
        const url = `${CONFIG.API_BASE_URL}/productos?${query}`;
        try {
            console.log('🔍 Consultando:', url);
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('✅ Datos recibidos:', data);
            return data;
        } catch (error) {
            console.error("❌ Error en ProductosAPI:", error);
            return { 
                productos: [],
                error: true, 
                message: error.message
            };
        }
    }
};

// API del Dashboard
const DashboardAPI = {
    async obtenerEstadisticas() {
        return {
            totalProductos: 0,
            totalCategorias: 0,
            ordenesHoy: 0,
            totalClientes: 0
        };
    }
};

// API de Categorías
const CategoriasAPI = {
    async obtenerTodas() {
        return [];
    }
};

// Exponer globalmente
window.ProductosAPI = ProductosAPI;
window.DashboardAPI = DashboardAPI;
window.CategoriasAPI = CategoriasAPI;