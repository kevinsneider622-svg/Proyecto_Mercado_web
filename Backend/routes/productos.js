// productos.js
const express = require('express');
const router = express.Router();
// 💡 IMPORTANTE: Importa tu conexión a la base de datos
const db = require('../db'); 

// Obtener todos los productos (AHORA DESDE POSTGRES con alias)
router.get('/', async (req, res) => {
    // Nota: El 'req.query' se puede usar aquí si quieres implementar paginación o filtros
    // const { limit = 10, page = 1 } = req.query; 

    try {
        // ✅ 1. Definición de la consulta SQL con los alias (camelCase)
        // Usamos AS "NombreCamelCase" para que el frontend reconozca las propiedades.
        const consultaSQL = `
            SELECT 
                id, 
                nombre, 
                precio_venta AS "precioVenta", 
                stock_actual AS "stockActual", 
                imagen_url AS "imagenUrl" 
            FROM productos
        `;
        
        // 📞 2. Ejecutar la consulta SQL usando la variable 'consultaSQL'
        const resultado = await db.query(consultaSQL); 
        
        // Los productos vienen en el array `resultado.rows`
        const productosDeDB = resultado.rows;

        // Devuelve los datos de la DB como respuesta JSON
        res.json({
            productos: productosDeDB, // ¡Ahora son los datos reales!
            pagination: { 
                page: 1, // Placeholder, si no implementas paginación avanzada
                limit: productosDeDB.length,
                total: productosDeDB.length,
                pages: 1
            }
        });

    } catch (error) {
        // Si hay un error, lo registramos y devolvemos un error 500
        console.error('❌ Error al obtener productos de la base de datos:', error);
        res.status(500).json({ 
            error: 'Error obteniendo productos de PostgreSQL',
            details: error.message 
        });
    }
});

// ... (Aquí irían las demás rutas como GET /:id, POST, PUT, DELETE)

module.exports = router;