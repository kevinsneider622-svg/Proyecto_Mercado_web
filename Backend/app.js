import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Importar rutas
import productosRoutes from './routes/productos.js';
import dashboardRoutes from './routes/dashboard.js';
import authRoutes from './routes/auth.js';
import pagosRoutes from './routes/pagos.js';

dotenv.config();

const app = express();
const PORT = 3000;

// Fix para __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONFIGURACIÓN DE MIDDLEWARES
// ============================================

// Configuración de CORS mejorada
app.use(cors({
    origin: function (origin, callback) {
        // Permitir todos los orígenes en desarrollo
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        
        // En producción, permitir orígenes específicos
        const allowedOrigins = [
            'https://proyecto-mercado-web-zebx.vercel.app',
            'https://proyecto-mercado-web.omenelen.com'
        ];
        
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Manejar preflight OPTIONS requests
app.options('*', cors());

// Parsers de body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// MIDDLEWARES PERSONALIZADOS
// ============================================

// Middleware para logging de requests
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`📨 [${timestamp}] ${req.method} ${req.path}`);
    console.log(`   📦 Body:`, req.body);
    console.log(`   👤 IP: ${req.ip}`);
    next();
});

// Middleware de seguridad básica
app.use((req, res, next) => {
    // Headers de seguridad
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// ============================================
// RUTAS DE LA API
// ============================================

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Rutas de productos
app.use('/api/productos', productosRoutes);


// Rutas del dashboard
app.use('/api/dashboard', dashboardRoutes);

// Rutas de pagos PSE
app.use('/api/pagos', pagosRoutes);


// ============================================
// RUTAS DE PRUEBA Y DIAGNÓSTICO
// ============================================

// Ruta de prueba de base de datos
app.get('/api/test-db', async (req, res) => {
    try {
        const db = await import('./db.js');
        
        // Primero prueba conexión básica
        await db.default.query('SELECT 1');
        
        // Luego intenta contar productos
        try {
            const result = await db.default.query('SELECT COUNT(*) as total FROM productos');
            res.json({ 
                success: true,
                mensaje: 'Conexión a la base de datos exitosa',
                totalProductos: parseInt(result.rows[0].total),
                timestamp: new Date().toISOString()
            });
        } catch (tableError) {
            // Si falla la tabla productos, solo confirma conexión
            res.json({ 
                success: true,
                mensaje: 'Conexión a PostgreSQL exitosa',
                detalles: 'Tabla productos no disponible',
                timestamp: new Date().toISOString()
            });
        }
        
    } catch (error) {
        console.error('❌ Error en test-db:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error de conexión a la base de datos',
            details: error.message 
        });
    }
});

// Ruta de salud del servidor
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// ============================================
// SERVICIÓN DE ARCHIVOS ESTÁTICOS
// ============================================

// Servir archivos subidos
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, filePath) => {
        // Configurar headers de cache para archivos estáticos
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 día
    }
}));

// Servir el frontend
const frontendPath = path.join(__dirname, '..', 'Frontend');
app.use(express.static(frontendPath, { 
    index: false,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
        } else if (filePath.endsWith('.js')) {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        }
    }
}));

// ============================================
// MANEJO DE ERRORES
// ============================================

// Manejo de rutas API no encontradas
app.use('/api/*', (req, res) => {
    console.log(`❌ Ruta API no encontrada: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
        success: false,
        error: 'Ruta no encontrada',
        path: req.originalUrl
    });
});

// Error handler global para rutas de API
app.use('/api', (err, req, res, next) => {
    console.error('❌ Error global de API:', err);
    res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? err.message : 'Contacte al administrador'
    });
});

// Catch-all route para SPA (Single Page Application)
app.use((req, res) => {
    // Si es una ruta de API, ya fue manejada arriba
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            error: 'Ruta API no encontrada'
        });
    }
    
    // Para cualquier otra ruta, servir el frontend
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// ============================================
// INICIALIZACIÓN DEL SERVIDOR
// ============================================

// Función para inicializar la base de datos - VERSIÓN CORREGIDA
async function initializeDatabase() {
    try {
        const db = await import('./db.js');
        
        // 1. Primero prueba conexión básica
        const connectionTest = await db.default.query('SELECT NOW() as current_time');
        console.log('✅ Base de datos conectada - Hora servidor:', connectionTest.rows[0].current_time);
        
        // 2. Verificar si la tabla productos existe
        try {
            const tableCheck = await db.default.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'productos'
                );
            `);
            
            const tablaExiste = tableCheck.rows[0].exists;
            
            if (tablaExiste) {
                // 3. Si existe, contar productos (manejar posible columna 'activo')
                try {
                    const result = await db.default.query('SELECT COUNT(*) as total FROM productos WHERE activo = true');
                    console.log('📦 Productos activos:', Number(result.rows[0].total));
                } catch (columnaError) {
                    // Si no existe columna 'activo', contar todos
                    const result = await db.default.query('SELECT COUNT(*) as total FROM productos');
                    console.log('📦 Total productos:', Number(result.rows[0].total));
                }
            } else {
                console.log('⚠️  Tabla productos no encontrada - Ejecuta el SQL de inicialización');
            }
            
        } catch (tableError) {
            console.log('⚠️  Error verificando tabla productos:', tableError.message);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error conectando a la base de datos:', error.message);
        return false;
    }
}

// Iniciar servidor
async function startServer() {
    console.log('🚀 Iniciando servidor...');
    
    // Verificar conexión a la base de datos
    const dbConnected = await initializeDatabase();
    
    if (!dbConnected) {
        console.warn('⚠️  Servidor iniciado sin conexión a base de datos');
    }
    
    //REDIRECCION AUTOMATICA

    app.use((req, res, next) => {
        if (req.hostname === 'localhost') {
            const newUrl = `http://127.0.0.1:${PORT}${req.originalUrl}`;
            console.log(`🔄 Redirigiendo automáticamente: localhost → 127.0.0.1`);
             return res.redirect(newUrl);
        }
        next();
    });
   
    app.listen(PORT, () => {
        console.log('='.repeat(50));    
        console.log(`🎉 Servidor ejecutándose en: http://localhost:${PORT}`);
        console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🗄️  Base de datos: ${dbConnected ? '✅ Conectada' : '❌ Desconectada'}`);
        console.log('='.repeat(50));
        console.log('📋 Rutas disponibles:');
        console.log('   🔐 /api/auth/* - Autenticación');
        console.log('   📦 /api/productos/* - Productos');
        console.log('   📊 /api/dashboard/* - Dashboard');
        console.log('   🩺 /api/health - Salud del servidor');
        console.log('   🧪 /api/test-db - Prueba de base de datos');
        console.log('='.repeat(50));
    });
}

// Manejo graceful de cierre
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor gracefulmente...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Servidor recibió SIGTERM, cerrando...');
    process.exit(0);
});

// Iniciar la aplicación
startServer().catch(error => {
    console.error('💥 Error fatal iniciando servidor:', error);
    process.exit(1);
});

export default app;