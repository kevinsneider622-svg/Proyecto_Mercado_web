const express = require('express');
const router = express.Router();

const productosDemo = [
      {
        id: 1,
        nombre: "Coca Cola 2L",
        precioVenta: 2500,
        stockActual: 50,
        imagenUrl: null,
        categoria: { nombre: "Bebidas" }
    },
    {
        id: 2,
        nombre: "Pan Integral",
        precioVenta: 1200,
        stockActual: 30,
        imagenUrl: null,
        categoria: { nombre: "Panadería" }
    },
    {
        id: 3,
        nombre: "Leche Deslactosada 1L",
        precioVenta: 1800,
        stockActual: 25,
        imagenUrl: null,
        categoria: { nombre: "Lácteos" }
    },
    {
        id: 4,
        nombre: "Manzanas Red 1Kg",
        precioVenta: 3200,
        stockActual: 40,
        imagenUrl: null,
        categoria: { nombre: "Frutas" }
    }
];

// Obtener todos los productos
router.get('/', (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        
        res.json({
            productos: productosDemo,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: productosDemo.length,
                pages: Math.ceil(productosDemo.length / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo productos' });
    }
});


// Obtener producto por ID
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const producto = productosDemo.find(p => p.id === parseInt(id));
        
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        res.json(producto);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo producto' });
    }
});

module.exports = router;
