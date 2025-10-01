const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener estadísticas generales
router.get('/estadisticas', async (req, res) => {
    try {
        // Contar productos
        const totalProductos = await prisma.producto.count({
            where: { activo: true }
        });

        // Contar categorías
        const totalCategorias = await prisma.categoria.count({
            where: { activo: true }
        });

        // Contar clientes
        const totalClientes = await prisma.cliente.count();

        // Contar órdenes de hoy
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        const ordenesHoy = await prisma.orden.count({
            where: {
                fechaOrden: {
                    gte: hoy
                }
            }
        });

        // Calcular ventas de hoy
        const ordenes = await prisma.orden.findMany({
            where: {
                fechaOrden: {
                    gte: hoy
                }
            }
        });

        const ventasHoy = ordenes.reduce((sum, orden) => sum + parseFloat(orden.total), 0);

        // Productos con stock bajo
        const productosStockBajo = await prisma.producto.count({
            where: {
                stockActual: {
                    lte: prisma.producto.fields.stockMinimo
                },
                activo: true
            }
        });

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
        res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }
});

module.exports = router;