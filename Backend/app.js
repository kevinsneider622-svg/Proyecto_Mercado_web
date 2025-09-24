const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting - limita peticiones por IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP cada 15 min
});
app.use(limiter);

// Servir archivos estáticos (imágenes)
app.use('/uploads', express.static('uploads'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    mensaje: '🚀 API Supermercado funcionando!',
    version: '1.0.0',
    fecha: new Date().toISOString()
  });
});

// Ruta para probar conexión a base de datos
app.get('/test-db', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Contar productos (debería ser 0 al inicio)
    const totalProductos = await prisma.producto.count();
    
    res.json({
      mensaje: '✅ Conexión a base de datos exitosa',
      totalProductos: totalProductos
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error de conexión:', error);
    res.status(500).json({
      error: '❌ Error de conexión a base de datos',
      detalle: error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📡 http://localhost:${PORT}`);
  console.log(`🔍 Prueba: http://localhost:${PORT}/test-db`);
});