import { dashboard as DashboardAPI } from './api.js';
import { CONFIG, UTILS, showToast } from './config.js';

// ============================================
// CLASE PRINCIPAL DEL DASHBOARD
// ============================================

class DashboardManager {
    constructor() {
        this.stats = null;
        this.charts = {};
        this.isLoading = false;
    }

    // ============================================
    // MÉTODOS PRINCIPALES
    // ============================================

    /**
     * Cargar y mostrar el dashboard completo
     */
    async cargarDashboard() {
        if (this.isLoading) return;
        
        try {
            this.isLoading = true;
            this.mostrarLoading(true);

            console.log('📊 Cargando dashboard...');

            // Obtener estadísticas
            const resultado = await DashboardAPI.getEstadisticas();
            
            if (resultado.success) {
                this.stats = resultado.data.estadisticas;
                console.log('✅ Estadísticas cargadas:', this.stats);
                
                // Actualizar la UI
                this.actualizarTarjetasEstadisticas();
                this.actualizarContadores();
                this.inicializarGraficos();
                this.cargarDatosAdicionales();
                
                showToast('Dashboard actualizado correctamente', 'success');
            } else {
                throw new Error(resultado.error || 'Error al cargar estadísticas');
            }

        } catch (error) {
            console.error('❌ Error cargando el dashboard:', error);
            this.mostrarError('Error al cargar los datos del dashboard: ' + error.message);
        } finally {
            this.isLoading = false;
            this.mostrarLoading(false);
        }
    }

    /**
     * Actualizar tarjetas de estadísticas
     */
    actualizarTarjetasEstadisticas() {
        const tarjetas = document.getElementById('statsSection');
        if (!tarjetas) {
            console.warn('❌ No se encontró el contenedor de estadísticas');
            return;
        }

        const { stats } = this;
        const ventasFormateadas = UTILS.formatPrice(stats.ventasHoy || 0);

        tarjetas.innerHTML = `
            <!-- Productos -->
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-primary shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                    Total Productos
                                </div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800">
                                    ${stats.totalProductos || 0}
                                </div>
                                <div class="text-xs text-muted mt-1">
                                    <i class="fas fa-${stats.productosStockBajo > 0 ? 'exclamation-triangle text-warning' : 'check-circle text-success'}"></i>
                                    ${stats.productosStockBajo || 0} con stock bajo
                                </div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-boxes fa-2x text-gray-300"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Categorías -->
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-success shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                                    Categorías Activas
                                </div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800">
                                    ${stats.totalCategorias || 0}
                                </div>
                                <div class="text-xs text-muted mt-1">
                                    <i class="fas fa-tags text-success"></i>
                                    Diversidad de productos
                                </div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-tags fa-2x text-gray-300"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Ventas Hoy -->
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-info shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                                    Ventas del Día
                                </div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800">
                                    ${ventasFormateadas}
                                </div>
                                <div class="text-xs text-muted mt-1">
                                    <i class="fas fa-receipt text-info"></i>
                                    ${stats.ordenesHoy || 0} órdenes
                                </div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-shopping-cart fa-2x text-gray-300"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Clientes -->
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-warning shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                    Clientes Registrados
                                </div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800">
                                    ${stats.totalClientes || 0}
                                </div>
                                <div class="text-xs text-muted mt-1">
                                    <i class="fas fa-user-plus text-warning"></i>
                                    Base de clientes
                                </div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-users fa-2x text-gray-300"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar animaciones
        this.animarContadores();
    }

    /**
     * Actualizar contadores individuales
     */
    actualizarContadores() {
        const { stats } = this;
        
        // Actualizar elementos individuales si existen
        const elementos = {
            'totalProductos': stats.totalProductos || 0,
            'totalCategorias': stats.totalCategorias || 0,
            'totalVentas': stats.ordenesHoy || 0,
            'totalClientes': stats.totalClientes || 0,
            'ventasHoy': UTILS.formatPrice(stats.ventasHoy || 0),
            'productosStockBajo': stats.productosStockBajo || 0
        };

        Object.keys(elementos).forEach(id => {
            const elemento = document.getElementById(id);
            if (elemento) {
                elemento.textContent = elementos[id];
            }
        });
    }

    /**
     * Inicializar gráficos del dashboard
     */
    async inicializarGraficos() {
        try {
            // Cargar datos para gráficos
            const [ventasCategoria, stockBajo, ultimasVentas] = await Promise.all([
                DashboardAPI.getVentasPorCategoria(),
                DashboardAPI.getStockBajo(),
                DashboardAPI.getUltimasVentas()
            ]);

            // Inicializar gráficos si las librerías están disponibles
            if (typeof Chart !== 'undefined') {
                this.inicializarGraficoVentas(ventasCategoria);
                this.inicializarGraficoStock(stockBajo);
            }

            // Actualizar tablas
            this.actualizarTablaVentas(ultimasVentas);
            this.actualizarTablaStock(stockBajo);

        } catch (error) {
            console.warn('⚠️ No se pudieron cargar los gráficos:', error);
        }
    }

    /**
     * Cargar datos adicionales del dashboard
     */
    async cargarDatosAdicionales() {
        try {
            // Aquí puedes cargar más datos específicos según necesites
            console.log('📈 Cargando datos adicionales del dashboard...');
            
            // Ejemplo: Métricas de rendimiento
            const metricas = await this.calcularMetricasRendimiento();
            this.actualizarMetricasAvanzadas(metricas);

        } catch (error) {
            console.warn('⚠️ Error cargando datos adicionales:', error);
        }
    }

    // ============================================
    // GRÁFICOS Y VISUALIZACIONES
    // ============================================

    /**
     * Inicializar gráfico de ventas por categoría
     */
    inicializarGraficoVentas(datosVentas) {
        const ctx = document.getElementById('graficoVentas');
        if (!ctx || !datosVentas.success) return;

        const datos = datosVentas.data.categorias || [];
        
        // Destruir gráfico anterior si existe
        if (this.charts.ventas) {
            this.charts.ventas.destroy();
        }

        this.charts.ventas = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: datos.map(item => item.categoria),
                datasets: [{
                    label: 'Ventas por Categoría',
                    data: datos.map(item => item.total_ingresos || 0),
                    backgroundColor: [
                        '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', 
                        '#e74a3b', '#858796', '#5a5c69', '#2e59d9'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Ventas por Categoría'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return UTILS.formatPrice(value);
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Inicializar gráfico de stock bajo
     */
    inicializarGraficoStock(datosStock) {
        const ctx = document.getElementById('graficoStock');
        if (!ctx || !datosStock.success) return;

        const datos = datosStock.data.productos || [];
        
        if (this.charts.stock) {
            this.charts.stock.destroy();
        }

        this.charts.stock = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: datos.map(item => item.nombre),
                datasets: [{
                    data: datos.map(item => item.stock_actual),
                    backgroundColor: [
                        '#e74a3b', '#f6c23e', '#4e73df', '#1cc88a',
                        '#36b9cc', '#858796', '#5a5c69'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'Productos con Stock Bajo'
                    }
                }
            }
        });
    }

    /**
     * Actualizar tabla de últimas ventas
     */
    actualizarTablaVentas(datosVentas) {
        const tbody = document.getElementById('tablaVentasBody');
        if (!tbody || !datosVentas.success) return;

        const ventas = datosVentas.data.ventas || [];
        
        tbody.innerHTML = ventas.map(venta => `
            <tr>
                <td>#${venta.id}</td>
                <td>${venta.cliente_nombre || 'Cliente no registrado'}</td>
                <td>${UTILS.formatPrice(venta.total || 0)}</td>
                <td>
                    <span class="badge bg-${this.getBadgeColorEstado(venta.estado)}">
                        ${UTILS.capitalize(venta.estado || 'pendiente')}
                    </span>
                </td>
                <td>${UTILS.formatDateTime(venta.fecha_creacion)}</td>
            </tr>
        `).join('') || '<tr><td colspan="5" class="text-center">No hay ventas recientes</td></tr>';
    }

    /**
     * Actualizar tabla de stock bajo
     */
    actualizarTablaStock(datosStock) {
        const tbody = document.getElementById('tablaStockBody');
        if (!tbody || !datosStock.success) return;

        const productos = datosStock.data.productos || [];
        
        tbody.innerHTML = productos.map(producto => `
            <tr>
                <td>${producto.nombre}</td>
                <td>
                    <span class="badge bg-${producto.stock_actual < 5 ? 'danger' : 'warning'}">
                        ${producto.stock_actual} unidades
                    </span>
                </td>
                <td>${UTILS.formatPrice(producto.precio_venta || 0)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" 
                            onclick="dashboard.reabastecerProducto(${producto.id})">
                        <i class="fas fa-boxes"></i> Reabastecer
                    </button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="4" class="text-center">Todo el stock está en niveles normales</td></tr>';
    }

    // ============================================
    // MÉTODOS DE UTILIDAD
    // ============================================

    /**
     * Mostrar/ocultar estado de loading
     */
    mostrarLoading(mostrar) {
        const loadingElement = document.getElementById('dashboardLoading');
        const contentElement = document.getElementById('dashboardContent');
        
        if (loadingElement) {
            loadingElement.style.display = mostrar ? 'block' : 'none';
        }
        if (contentElement) {
            contentElement.style.display = mostrar ? 'none' : 'block';
        }
    }

    /**
     * Mostrar mensaje de error
     */
    mostrarError(mensaje) {
        const statsSection = document.getElementById('statsSection');
        if (statsSection) {
            statsSection.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger d-flex align-items-center" role="alert">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <div>${mensaje}</div>
                    </div>
                </div>
            `;
        }
        
        showToast(mensaje, 'danger');
    }

    /**
     * Animar contadores numéricos
     */
    animarContadores() {
        const counters = document.querySelectorAll('.font-weight-bold.text-gray-800');
        
        counters.forEach(counter => {
            const target = parseInt(counter.textContent);
            if (isNaN(target)) return;
            
            let current = 0;
            const increment = target / 50;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.textContent = target.toLocaleString();
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.floor(current).toLocaleString();
                }
            }, 30);
        });
    }

    /**
     * Obtener color del badge según estado
     */
    getBadgeColorEstado(estado) {
        const colores = {
            'pendiente': 'warning',
            'procesando': 'info',
            'enviado': 'primary',
            'entregado': 'success',
            'cancelado': 'danger'
        };
        return colores[estado] || 'secondary';
    }

    /**
     * Calcular métricas de rendimiento
     */
    async calcularMetricasRendimiento() {
        // Aquí puedes calcular métricas avanzadas
        return {
            conversionRate: Math.random() * 100,
            avgOrderValue: this.stats.ventasHoy / (this.stats.ordenesHoy || 1),
            customerSatisfaction: 4.5 + Math.random() * 0.5
        };
    }

    /**
     * Actualizar métricas avanzadas
     */
    actualizarMetricasAvanzadas(metricas) {
        // Actualizar elementos de métricas avanzadas si existen
        console.log('📊 Métricas avanzadas:', metricas);
    }

    /**
     * Reabastecer producto (función de ejemplo)
     */
    reabastecerProducto(productoId) {
        showToast(`Función de reabastecimiento para producto ${productoId}`, 'info');
        // Aquí implementarías la lógica de reabastecimiento
    }

    /**
     * Actualizar dashboard manualmente
     */
    async actualizar() {
        console.log('🔄 Actualizando dashboard...');
        await this.cargarDashboard();
    }

    /**
     * Destruir instancia y limpiar recursos
     */
    destruir() {
        // Destruir todos los gráficos
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        
        this.charts = {};
        this.stats = null;
    }
}

// ============================================
// INSTANCIA GLOBAL E INICIALIZACIÓN
// ============================================

// Crear instancia global
const dashboard = new DashboardManager();

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        dashboard.cargarDashboard();
    });
} else {
    dashboard.cargarDashboard();
}

// ============================================
// EXPORTACIONES
// ============================================

export default dashboard;
export {
    DashboardManager,
    dashboard
};