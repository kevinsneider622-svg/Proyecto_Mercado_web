const express = require('express');
const router = express.Router();
const db = require('../db');

// Asegurarnos de que la conexión a la base de datos está funcionando
const pool = require('../db');

// Middleware para verificar si es administrador
const verificarAdmin = async (req, res, next) => {
    try {
        // Aquí puedes agregar la lógica de verificación de admin
        // Por ahora pasamos directamente
        next();
    } catch (error) {
        res.status(403).json({ error: 'No autorizado' });
    }
};

// Obtener estadísticas generales
router.get('/estadisticas', async (req, res) => {
    console.log('Ruta /estadisticas accedida');
    try {
        // Asegurarnos de que la respuesta será JSON
        res.setHeader('Content-Type', 'application/json');
        
        // Verificar que podemos conectarnos a la base de datos
        const testQuery = await db.query('SELECT NOW()');
        console.log('Conexión a DB OK');

        // Obtener total de productos
        const productosQuery = await db.query('SELECT COUNT(*) as total FROM productos');
        const totalProductos = parseInt(productosQuery.rows[0].total);

        // Obtener total de categorías únicas (usando categoria_id en lugar de categoria)
        const categoriasQuery = await db.query('SELECT COUNT(DISTINCT categoria_id) as total FROM productos');
        const totalCategorias = parseInt(categoriasQuery.rows[0].total);

        // Obtener productos con stock bajo (menos de 10 unidades)
        const stockBajoQuery = await db.query('SELECT COUNT(*) as total FROM productos WHERE stock_actual < 10 AND activo = true');
        const productosStockBajo = parseInt(stockBajoQuery.rows[0].total);

        // Por ahora, obtener total de ventas (sin filtrar por fecha)
        const ventasHoyQuery = await db.query(`
            SELECT COUNT(*) as total_ordenes, COALESCE(SUM(total), 0) as total_ventas 
            FROM ordenes
        `);
        const ordenesHoy = parseInt(ventasHoyQuery.rows[0].total_ordenes);
        const ventasHoy = parseFloat(ventasHoyQuery.rows[0].total_ventas);

        // Obtener total de clientes
        const clientesQuery = await db.query('SELECT COUNT(*) as total FROM usuarios WHERE rol = \'cliente\'');
        const totalClientes = parseInt(clientesQuery.rows[0].total);

        res.json({
            totalProductos,
            totalCategorias,
            totalClientes,
            ordenesHoy,
            ventasHoy,
            productosStockBajo
        });
        
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error obteniendo estadísticas', details: error.message });
    }
});

// Obtener últimas ventas
router.get('/ultimas-ventas', verificarAdmin, async (req, res) => {
    try {
        const query = `
            SELECT o.*, u.nombre as cliente_nombre
            FROM ordenes o
            LEFT JOIN usuarios u ON o.usuario_id = u.id
            ORDER BY o.fecha_creacion DESC
            LIMIT 10
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo últimas ventas:', error);
        res.status(500).json({ error: 'Error obteniendo últimas ventas' });
    }
});

// Asegurarnos de que el router se exporta correctamente
module.exports = router;

// Obtener productos con bajo stock
router.get('/stock-bajo', verificarAdmin, async (req, res) => {
    try {
        const query = `
            SELECT id, nombre, stock_actual, precio_venta
            FROM productos
            WHERE stock_actual < 10 AND activo = true
            ORDER BY stock_actual ASC
            LIMIT 10
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo productos con stock bajo:', error);
        res.status(500).json({ error: 'Error obteniendo productos con stock bajo' });
    }
});

// Obtener ventas por categoría
router.get('/ventas-por-categoria', verificarAdmin, async (req, res) => {
    try {
        const query = `
            SELECT c.nombre as categoria, COUNT(*) as total_ventas, SUM(od.cantidad * od.precio) as total_ingresos
            FROM orden_detalles od
            JOIN productos p ON od.producto_id = p.id
            JOIN categorias c ON p.categoria_id = c.id
            GROUP BY c.nombre
            ORDER BY total_ventas DESC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo ventas por categoría:', error);
        res.status(500).json({ error: 'Error obteniendo ventas por categoría' });
    }
});

module.exports = router;