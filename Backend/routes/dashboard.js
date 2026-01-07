const express = require ('express');
const db = require ('../db.js');

const router = express.Router();

// ============================================
// MIDDLEWARES
// ============================================

/**
 * Middleware para verificar si es administrador
 * @TODO: Implementar lógica de autenticación real
 */
const verificarAdmin = async (req, res, next) => {
    try {
        // Por ahora pasamos directamente - implementar lógica real después
        console.log('🔐 Middleware admin - acceso permitido temporalmente');
        next();
    } catch (error) {
        console.error('❌ Error en verificación admin:', error);
        res.status(403).json({ 
            success: false,
            error: 'No autorizado' 
        });
    }
};

// ============================================
// RUTAS DE ESTADÍSTICAS
// ============================================

/**
 * @route   GET /api/dashboard/estadisticas
 * @desc    Obtener estadísticas generales del dashboard
 * @access  Público (debería ser privado en producción)
 */
router.get('/estadisticas', async (req, res) => {
    console.log('📊 Ruta /estadisticas accedida');
    
    try {
        // Verificar conexión a la base de datos
        const testQuery = await db.query('SELECT NOW() as tiempo_servidor');
        console.log('✅ Conexión a DB OK - Tiempo servidor:', testQuery.rows[0].tiempo_servidor);

        // Ejecutar todas las consultas en paralelo para mejor performance
        const [
            productosResult,
            categoriasResult,
            stockBajoResult,
            ventasResult,
            clientesResult
        ] = await Promise.all([
            // Total de productos
            db.query('SELECT COUNT(*) as total FROM productos WHERE activo = true'),
            
            // Total de categorías únicas
            db.query('SELECT COUNT(DISTINCT categoria_id) as total FROM productos WHERE activo = true'),
            
            // Productos con stock bajo
            db.query('SELECT COUNT(*) as total FROM productos WHERE stock_actual < 10 AND activo = true'),
            
            // Ventas y órdenes
            db.query(`
                SELECT 
                    COUNT(*) as total_ordenes, 
                    COALESCE(SUM(total), 0) as total_ventas 
                FROM ordenes 
                WHERE fecha_creacion >= CURRENT_DATE
            `),
            
            // Total de clientes
            db.query('SELECT COUNT(*) as total FROM usuarios WHERE rol = \'cliente\' AND activo = true')
        ]);

        const estadisticas = {
            totalProductos: parseInt(productosResult.rows[0].total),
            totalCategorias: parseInt(categoriasResult.rows[0].total),
            productosStockBajo: parseInt(stockBajoResult.rows[0].total),
            ordenesHoy: parseInt(ventasResult.rows[0].total_ordenes),
            ventasHoy: parseFloat(ventasResult.rows[0].total_ventas),
            totalClientes: parseInt(clientesResult.rows[0].total)
        };

        console.log('📈 Estadísticas calculadas:', estadisticas);

        res.json({
            success: true,
            estadisticas,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error obteniendo estadísticas',
            details: error.message 
        });
    }
});

/**
 * @route   GET /api/dashboard/ultimas-ventas
 * @desc    Obtener las últimas ventas realizadas
 * @access  Privado (Admin)
 */
router.get('/ultimas-ventas', verificarAdmin, async (req, res) => {
    try {
        console.log('💰 Solicitando últimas ventas');
        
        const query = `
            SELECT 
                o.id,
                o.total,
                o.estado,
                o.fecha_creacion,
                u.nombre as cliente_nombre,
                u.email as cliente_email
            FROM ordenes o
            LEFT JOIN usuarios u ON o.usuario_id = u.id
            ORDER BY o.fecha_creacion DESC
            LIMIT 10
        `;
        
        const result = await db.query(query);
        
        console.log(`✅ Últimas ventas obtenidas: ${result.rows.length}`);
        
        res.json({
            success: true,
            ventas: result.rows
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo últimas ventas:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error obteniendo últimas ventas',
            details: error.message 
        });
    }
});

/**
 * @route   GET /api/dashboard/stock-bajo
 * @desc    Obtener productos con stock bajo
 * @access  Privado (Admin)
 */
router.get('/stock-bajo', verificarAdmin, async (req, res) => {
    try {
        console.log('📦 Solicitando productos con stock bajo');
        
        const query = `
            SELECT 
                id, 
                nombre, 
                stock_actual, 
                precio_venta,
                imagen_url
            FROM productos
            WHERE stock_actual < 10 AND activo = true
            ORDER BY stock_actual ASC
            LIMIT 15
        `;
        
        const result = await db.query(query);
        
        console.log(`✅ Productos con stock bajo obtenidos: ${result.rows.length}`);
        
        res.json({
            success: true,
            productos: result.rows
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo productos con stock bajo:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error obteniendo productos con stock bajo',
            details: error.message 
        });
    }
});

/**
 * @route   GET /api/dashboard/ventas-por-categoria
 * @desc    Obtener ventas agrupadas por categoría
 * @access  Privado (Admin)
 */
router.get('/ventas-por-categoria', verificarAdmin, async (req, res) => {
    try {
        console.log('📊 Solicitando ventas por categoría');
        
        const query = `
            SELECT 
                c.nombre as categoria, 
                COUNT(*) as total_ventas, 
                SUM(od.cantidad * od.precio) as total_ingresos,
                AVG(od.cantidad * od.precio) as promedio_venta
            FROM orden_detalles od
            JOIN productos p ON od.producto_id = p.id
            JOIN categorias c ON p.categoria_id = c.id
            GROUP BY c.nombre
            ORDER BY total_ingresos DESC
        `;
        
        const result = await db.query(query);
        
        console.log(`✅ Ventas por categoría obtenidas: ${result.rows.length} categorías`);
        
        res.json({
            success: true,
            categorias: result.rows
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo ventas por categoría:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error obteniendo ventas por categoría',
            details: error.message 
        });
    }
});

/**
 * @route   GET /api/dashboard/tendencias
 * @desc    Obtener tendencias de ventas (últimos 7 días)
 * @access  Privado (Admin)
 */
router.get('/tendencias', verificarAdmin, async (req, res) => {
    try {
        console.log('📈 Solicitando tendencias de ventas');
        
        const query = `
            SELECT 
                DATE(fecha_creacion) as fecha,
                COUNT(*) as total_ordenes,
                COALESCE(SUM(total), 0) as total_ventas
            FROM ordenes
            WHERE fecha_creacion >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY DATE(fecha_creacion)
            ORDER BY fecha DESC
        `;
        
        const result = await db.query(query);
        
        console.log(`✅ Tendencias obtenidas: ${result.rows.length} días`);
        
        res.json({
            success: true,
            tendencias: result.rows
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo tendencias:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error obteniendo tendencias',
            details: error.message 
        });
    }
});

module.exports = router;