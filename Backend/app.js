const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5432;
// No necesitas importar productosRouter aquí si lo vas a requerir en app.use()
// const productosRouter = require('./routes/productos'); // Se puede comentar/eliminar

app.use(helmet());
app.use(cors({
  origin: '*',  
  credentials: true
}));

// ✅ ESTAS LÍNEAS DEBEN IR ANTES DE CUALQUIER OTRA LÍNEA app.use(express.json()) O app.use(express.urlencoded()) 
// si tu router usa middlewares específicos. Pero en este caso, se pueden dejar.

app.use(express.json()); // Necesario para parsear el body de POST/PUT
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

//app.use(limiter);

// ❌ LÍNEA ELIMINADA: app.use('./api/productos', productosRouter);

app.use('/uploads', express.static('uploads'));

// ✅ CONEXIÓN DE LOS ROUTERS (¡SOLO UNA VEZ Y SIN EL PUNTO!)
app.use('/api/productos', require('./routes/productos')); 
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/', (req, res) => {
    res.json({ 
        mensaje: '🚀 API Supermercado funcionando!',
        version: '1.0.0',
        fecha: new Date().toISOString(),
        endpoints: ['GET /', 'GET /api/productos', 'GET /test-db']
    });
});

app.get('/test-db', async (req, res) => {
  try {
    // ⚠️ Nota: Esta prueba usa Prisma, mientras que la API de productos usa PG.
    // Asumiremos que ambas conexiones son válidas, pero es mejor usar solo una lib.
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const totalProductos = await prisma.producto.count();
    res.json({ mensaje: '✅ Conexión exitosa', totalProductos });
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: '❌ Error BD', detalle: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor en puerto ${PORT}`);
});