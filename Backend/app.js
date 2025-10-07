const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://proyecto-mercado-web-zebx.vercel.app']  // URL del frontend en Vercel
        : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para logging
app.use((req, res, next) => {
  console.log(`→ ${req.method} ${req.path}`);
  next();
});

// API Routes
// Rutas de la API
const productosRoutes = require('./routes/productos');
const dashboardRoutes = require('./routes/dashboard');

app.use('/api/productos', productosRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Logging de rutas no encontradas
app.use('/api/*', (req, res) => {
    console.log(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error handler para rutas de API
app.use('/api', (err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ 
    error: 'Error en el servidor', 
    details: err.message 
  });
});

app.get('/test-db', async (req, res) => {
  const db = require('./db');
  const result = await db.query('SELECT COUNT(*) as total FROM productos');
  res.json({ mensaje: 'OK', totalProductos: parseInt(result.rows[0].total) });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const frontendPath = path.join(__dirname, '..', 'Frontend');
app.use(express.static(frontendPath, { 
  index: false,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) res.setHeader('Content-Type', 'text/html');
  }
}));

app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});