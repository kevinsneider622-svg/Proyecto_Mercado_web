import express from 'express';

const app = express();
const PORT = 3000;

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
});

// Configuración de CORS básica
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Manejar preflight OPTIONS
app.options('*', (req, res) => {
    res.sendStatus(200);
});

// ============================================
// RUTAS DE PRUEBA
// ============================================

/**
 * @route   GET /api/test
 * @desc    Ruta básica de prueba
 * @access  Público
 */
app.get('/api/test', (req, res) => {
    console.log('✅ Ruta /api/test accedida');
    res.json({ 
        success: true,
        mensaje: '¡Servidor de prueba funcionando correctamente!',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

/**
 * @route   GET /api/test/db
 * @desc    Ruta de prueba para base de datos (si existe)
 * @access  Público
 */
app.get('/api/test/db', async (req, res) => {
    try {
        // Intentar importar la base de datos si existe
        const db = await import('./db.js');
        const result = await db.default.query('SELECT NOW() as server_time');
        
        res.json({
            success: true,
            mensaje: 'Conexión a base de datos exitosa',
            serverTime: result.rows[0].server_time,
            database: 'PostgreSQL'
        });
    } catch (error) {
        res.json({
            success: false,
            mensaje: 'Base de datos no disponible en modo prueba',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/test/echo
 * @desc    Ruta para probar envío de datos
 * @access  Público
 */
app.post('/api/test/echo', (req, res) => {
    console.log('📦 Datos recibidos:', req.body);
    
    res.json({
        success: true,
        mensaje: 'Datos recibidos correctamente',
        datosRecibidos: req.body,
        timestamp: new Date().toISOString()
    });
});

/**
 * @route   GET /api/test/error
 * @desc    Ruta para probar manejo de errores
 * @access  Público
 */
app.get('/api/test/error', (req, res) => {
    try {
        // Simular un error
        throw new Error('Este es un error de prueba controlado');
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error de prueba',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * @route   GET /api/test/params/:id
 * @desc    Ruta para probar parámetros de URL
 * @access  Público
 */
app.get('/api/test/params/:id', (req, res) => {
    const { id } = req.params;
    const { query } = req.query;
    
    res.json({
        success: true,
        parametros: {
            id: id,
            query: query,
            todosLosQuery: req.query
        }
    });
});

// ============================================
// MANEJO DE RUTAS NO ENCONTRADAS
// ============================================

app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada',
        path: req.originalUrl
    });
});

// ============================================
// MANEJO DE ERRORES GLOBAL
// ============================================

app.use((error, req, res, next) => {
    console.error('❌ Error global:', error);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: error.message
    });
});

// ============================================
// INICIALIZACIÓN DEL SERVIDOR
// ============================================

app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🧪 SERVIDOR DE PRUEBA INICIADO');
    console.log('='.repeat(50));
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`⚡ Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log('='.repeat(50));
    console.log('📋 Rutas de prueba disponibles:');
    console.log('   ✅ GET  /api/test           - Prueba básica');
    console.log('   🗄️  GET  /api/test/db       - Prueba base de datos');
    console.log('   📨 POST /api/test/echo      - Prueba envío de datos');
    console.log('   🚨 GET  /api/test/error     - Prueba de errores');
    console.log('   🔗 GET  /api/test/params/123 - Prueba parámetros');
    console.log('='.repeat(50));
});

// Manejo graceful de cierre
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor de prueba...');
    process.exit(0);
});

export default app;