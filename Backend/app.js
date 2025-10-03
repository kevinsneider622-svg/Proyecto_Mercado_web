const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000; 

// Middlewares básicos
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Configurar frontend
const frontendPath = path.join(__dirname, '..', 'Frontend');
console.log('Sirviendo frontend desde:', frontendPath);

// Archivos estáticos del frontend
app.use(express.static(frontendPath));

// Archivos estáticos de uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas API
app.use('/api/productos', require('./routes/productos')); 
app.use('/api/dashboard', require('./routes/dashboard'));

// Test DB
app.get('/test-db', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const totalProductos = await prisma.producto.count();
    res.json({ mensaje: 'Conexion exitosa', totalProductos });
    await prisma.$disconnect();
  } catch (error) {
    res.status(500).json({ error: 'Error BD', detalle: error.message });
  }
});

// Middleware para servir index.html en cualquier otra ruta
app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});