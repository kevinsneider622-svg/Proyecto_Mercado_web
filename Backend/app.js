const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: '*',  // Permitir todos los orígenes temporalmente para testing
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

app.use('/uploads', express.static('uploads'));
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