const express = require('express');
const router = express.Router();
const db = require('../db');

// Ruta para productos destacados
router.get('/destacados', async (req, res) => {
    try {
        const query = `
            SELECT id, nombre, precio_venta AS "precioVenta", 
                   stock_actual AS "stockActual", imagen_url AS "imagenUrl"
            FROM productos 
            WHERE activo = true 
            ORDER BY id 
            LIMIT 8`;
        
        const result = await db.query(query);
        res.json({ productos: result.rows });
    } catch (error) {
        console.error('Error al obtener productos destacados:', error);
        res.status(500).json({ 
            error: 'Error al obtener productos destacados',
            details: error.message 
        });
    }
});

router.get('/', async (req, res) => {
    const limit = parseInt(req.query.limit) || 12; // Por defecto 12 productos
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    
    try {
        // --- 1. CONSULTA PARA OBTENER EL CONTEO TOTAL ---
        const totalCountResult = await db.query('SELECT COUNT(*) FROM productos WHERE activo = true');
        const totalProducts = parseInt(totalCountResult.rows[0].count);
        const totalPages = Math.ceil(totalProducts / limit);
        
        // --- 2. CONSULTA PARA OBTENER LOS PRODUCTOS PAGINADOS ---
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
        
        console.log(`Petición recibida en /api/productos. Página: ${page}, Límite: ${limit}. Productos devueltos: ${productsResult.rows.length}`);
        
        // 3. Devolver la respuesta paginada y formateada
        res.json({
            productos: productsResult.rows,
            pagination: { 
                page: page,
                limit: limit,
                total: totalProducts,
                pages: totalPages
            }
        });

    } catch (error) {
        console.error('Error obteniendo productos:', error);
        res.status(500).json({ 
            error: 'Error obteniendo productos',
            details: error.message 
        });
    }
});

module.exports = router;