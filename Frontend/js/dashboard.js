/**
 * dashboard.js
 * Cliente de API para el dashboard
 */
const DashboardAPI = {
    async obtenerEstadisticas() {
        try {
            console.log('Intentando obtener estadísticas...');
            const response = await fetch(`${API.baseUrl}/dashboard/estadisticas`);
            
            if (!response.ok) {
                console.error('Error en la respuesta:', response.status, response.statusText);
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('Respuesta no es JSON:', contentType);
                throw new Error('Formato de respuesta inválido');
            }
            
            const data = await response.json();
            console.log('Estadísticas recibidas:', data);
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

    async cargarDashboard() {
        try {
            // Obtener estadísticas
            const stats = await this.obtenerEstadisticas();
            
            // Actualizar los contadores
            document.getElementById('totalProductos').textContent = stats.totalProductos || 0;
            document.getElementById('totalCategorias').textContent = stats.totalCategorias || 0;
            document.getElementById('totalVentas').textContent = stats.ordenesHoy || 0;
            document.getElementById('totalClientes').textContent = stats.totalClientes || 0;

            // Actualizar las tarjetas de estadísticas
            this.actualizarTarjetasEstadisticas(stats);

        } catch (error) {
            console.error('Error cargando el dashboard:', error);
            this.mostrarError('Error al cargar los datos del dashboard');
        }
    },

    actualizarTarjetasEstadisticas(stats) {
        const tarjetas = document.getElementById('statsSection');
        if (!tarjetas) return;

        tarjetas.innerHTML = `
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-primary shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                    Productos</div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800">${stats.totalProductos || 0}</div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-box fa-2x text-gray-300"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-success shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                                    Categorías</div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800">${stats.totalCategorias || 0}</div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-tags fa-2x text-gray-300"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-info shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                                    Ventas Hoy</div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800">${window.UTILS.formatPrice(stats.ventasHoy || 0)}</div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-shopping-cart fa-2x text-gray-300"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-warning shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                    Clientes</div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800">${stats.totalClientes || 0}</div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-users fa-2x text-gray-300"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    mostrarError(mensaje) {
        const statsSection = document.getElementById('statsSection');
        if (statsSection) {
            statsSection.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-triangle"></i> ${mensaje}
                    </div>
                </div>
            `;
        }
    }
};