import express from 'express';
import db from '../db.js';

const router = express.Router();

// ============================================
// MIDDLEWARES
// ============================================

/**
 * Middleware para validar parámetros de paginación
 */
const validarPaginacion = (req, res, next) => {
    const limit = parseInt(req.query.limit) || 12;
    const page = parseInt(req.query.page) || 1;
    
    if (limit < 1 || limit > 100) {
        return res.status(400).json({ 
            error: 'El límite debe estar entre 1 y 100' 
        });
    }
    
    if (page < 1) {
        return res.status(400).json({ 
            error: 'La página debe ser mayor a 0' 
        });
    }
    
    req.paginacion = { limit, page };
    next();
};

// ============================================
// RUTAS DE CONSULTA
// ⚠️ IMPORTANTE: Las rutas específicas deben ir ANTES de las dinámicas (/:id)
// ============================================

/**
 * @route   GET /api/productos/test
 * @desc    RUTA DE PRUEBA
 * @access  Público
 */
router.get('/test', async (req, res) => {
    try {
        console.log('🧪 Ruta de prueba /test');
        const result = await db.query('SELECT * FROM productos LIMIT 5');
        res.json({ 
            success: true,
            message: 'Ruta de prueba funcionando',
            productos: result.rows 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

/**
 * @route   GET /api/productos/destacados
 * @desc    Obtener productos destacados
 * @access  Público
 */
router.get('/destacados', async (req, res) => {
    try {
        console.log('📦 Solicitando productos destacados');
        
        const result = await db.query(`
            SELECT 
                id, 
                nombre, 
                precio_venta AS "precioVenta", 
                stock_actual AS "stockActual", 
                imagen_url AS "imagenUrl"
            FROM productos 
            WHERE activo = true 
            ORDER BY id 
            LIMIT 8 
        `);
        
        console.log(`✅ Productos destacados obtenidos: ${result.rows.length}`);
        
        res.json({ 
            success: true,
            productos: result.rows 
        });
        
    } catch (error) {
        console.error('❌ Error al obtener productos destacados:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener productos destacados',
            details: error.message 
        });
    }
});

/**
 * @route   GET /api/productos/categoria/:categoriaId
 * @desc    Obtener productos por categoría
 * @access  Público
 */
router.get('/categoria/:categoriaId', validarPaginacion, async (req, res) => {
    const { categoriaId } = req.params;
    const { limit, page } = req.paginacion;
    const offset = (page - 1) * limit;
    
    try {
        console.log(`📦 Solicitando productos categoría: ${categoriaId}`);
        
        // 1. Obtener conteo por categoría
        const countQuery = `
            SELECT COUNT(*) 
            FROM productos 
            WHERE categoria_id = $1 AND activo = true
        `;
        const totalCountResult = await db.query(countQuery, [categoriaId]);
        const totalProducts = parseInt(totalCountResult.rows[0].count);
        const totalPages = Math.ceil(totalProducts / limit);
        
        // 2. Obtener productos de la categoría
        const productsQuery = `
            SELECT 
                id, 
                nombre,
                precio_venta AS "precioVenta", 
                stock_actual AS "stockActual", 
                imagen_url AS "imagenUrl",
                descripcion
            FROM productos
            WHERE categoria_id = $1 AND activo = true
            ORDER BY id
            LIMIT $2
            OFFSET $3
        `;
        
        const productsResult = await db.query(productsQuery, [categoriaId, limit, offset]);
        
        console.log(`✅ Productos por categoría obtenidos: ${productsResult.rows.length}`);
        
        res.json({
            success: true,
            productos: productsResult.rows,
            pagination: { 
                page: page,
                limit: limit,
                total: totalProducts,
                pages: totalPages
            }
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo productos por categoría:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error obteniendo productos por categoría',
            details: error.message 
        });
    }
});

/**
 * @route   GET /api/productos
 * @desc    Obtener todos los productos con paginación
 * @access  Público
 */
router.get('/', validarPaginacion, async (req, res) => {
    const { limit, page } = req.paginacion;
    const offset = (page - 1) * limit;
    
    try {
        console.log(`📦 Solicitando productos - Página: ${page}, Límite: ${limit}`);
        
        // 1. Obtener conteo total
        const totalCountResult = await db.query('SELECT COUNT(*) FROM productos WHERE activo = true');
        const totalProducts = parseInt(totalCountResult.rows[0].count);
        const totalPages = Math.ceil(totalProducts / limit);
        
        // 2. Obtener productos paginados
        const productsQuery = `
            SELECT 
                id, 
                nombre,
                precio_venta AS "precioVenta", 
                stock_actual AS "stockActual", 
                imagen_url AS "imagenUrl",
                categoria_id AS "categoriaId",
                descripcion,
                activo
            FROM productos
            WHERE activo = true
            ORDER BY id
            LIMIT $1
            OFFSET $2
        `;
        
        const productsResult = await db.query(productsQuery, [limit, offset]);
        
        console.log(`✅ Productos obtenidos: ${productsResult.rows.length} de ${totalProducts}`);
        
        // 3. Devolver respuesta
        res.json({
            success: true,
            productos: productsResult.rows,
            pagination: { 
                page: page,
                limit: limit,
                total: totalProducts,
                pages: totalPages
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo productos:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error obteniendo productos',
            details: error.message 
        });
    }
});

/**
 * @route   GET /api/productos/:id
 * @desc    Obtener un producto por ID
 * @access  Público
 * ⚠️ IMPORTANTE: Esta ruta debe ir AL FINAL porque captura cualquier parámetro
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        console.log(`📦 Solicitando producto ID: ${id}`);
        
        const query = `
            SELECT 
                id, 
                nombre,
                precio_venta AS "precioVenta", 
                stock_actual AS "stockActual", 
                imagen_url AS "imagenUrl",
                categoria_id AS "categoriaId",
                descripcion,
                activo
            FROM productos
            WHERE id = $1 AND activo = true
        `;
        
        const result = await db.query(query, [id]);
        
        if (result.rows.length === 0) {
            console.log(`❌ Producto no encontrado: ${id}`);
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }
        
        console.log(`✅ Producto obtenido: ${result.rows[0].nombre}`);
        
        res.json({
            success: true,
            producto: result.rows[0]
        });
        
    } catch (error) {
        console.error(`❌ Error obteniendo producto ${id}:`, error);
        res.status(500).json({ 
            success: false,
            error: 'Error obteniendo producto',
            details: error.message 
        });
    }
});

export default router;