import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

// Importar rutas
import productosRoutes from './routes/productos.js';
import dashboardRoutes from './routes/dashboard.js';
import authRoutes from './routes/auth.js';
import pagosRoutes from './routes/pagos.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000; // ← CORREGIDO: Usar variable de entorno

// Fix para __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONFIGURACIÓN DE MIDDLEWARES
// ============================================

app.use(express.json()); // Para parsear JSON
app.use(express.urlencoded({ extended: true })); // Para parsear form data

// Configuración de CORS mejorada
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:5173',              // Vite local
            'http://localhost:3000',              // React local
            'http://127.0.0.1:5500',             // Vite local alternativo
            'http://127.0.0.1:3000',             // Alternativo local
            'https://proyecto-mercado-web-zebx-8rx9dkm73.vercel.app',  // Tu Vercel específico
            'https://proyecto-mercado-web-zebx.vercel.app',            // Sin el ID largo
            'https://proyecto-mercado-web.vercel.app',                 // Vercel sin suffix
            'https://proyecto-mercado-web.onrender.com',               // Tu backend
            'https://*.vercel.app', 
            'https://proyecto-mercado-web.onrender.com/api/productos'                   // Permitir subdominios Vercel
        ];

        console.log('🌐 Origen de la petición:', origin);

        //Permitir requests sin origen (mismo servidor, Postman, etc.)

        if (!origin) {
            console.log('🔓 Permitiendo request sin origen');
            return callback(null, true);
        }    

        // En desarrollo, permitir todos los orígenes
        if (process.env.NODE_ENV !== 'production') {
            console.log('⚙️  Modo desarrollo - Origen permitido:', origin);
            return callback(null, true);
        }
     
        // En producción, verificar origen
        const isAllowed = allowedOrigins.some(allowed => {
            if (origin === allowed) {
                return true;
            }

            if (origin && origin.endsWith('.vercel.app')) {
                return true;
            }
                return false;
        });

            if (isAllowed) {
                console.log('✅ Origen permitido por CORS:', origin);
                callback(null, true);
            } else {
                console.log('❌ Origen bloqueado por CORS:', origin);
                console.log('📋 Orígenes permitidos:', allowedOrigins);
                callback(new Error('Not allowed by CORS'));
            }
        },

    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Aplicar CORS
app.use(cors(corsOptions));

// Permitir preflight para todas las rutas (CORS)
app.options('*', cors(corsOptions));

// Parsers de body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir el frontend correctamente (index:true para SPA)
const frontendPath = path.join(__dirname, '..', 'Frontend');
app.use(express.static(frontendPath, {
    index: 'index.html',
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

// Middleware para logging de requests
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`📨 [${timestamp}] ${req.method} ${req.path}`);
    console.log(`   🌐 Origin: ${req.get('origin') || 'No origin'}`);
    console.log(`   👤 IP: ${req.ip}`);
    if (Object.keys(req.body).length > 0) {
        console.log(`   📦 Body:`, JSON.stringify(req.body).substring(0, 100));
    }
    next();
});

// Middleware de seguridad básica
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// ============================================
// RUTAS DE LA API
// ============================================

// Ruta raíz para verificar que el servidor está funcionando
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API SuperMercado - Funcionando correctamente',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

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
        const connectionTest = await db.default.query('SELECT NOW() as current_time, version() as pg_version');
        
        // Intenta contar productos
        let productosInfo = { mensaje: 'Tabla no disponible' };
        try {
            const result = await db.default.query('SELECT COUNT(*) as total FROM productos WHERE activo = true');
            productosInfo = {
                total: parseInt(result.rows[0].total),
                tabla: 'productos',
                estado: 'activa'
            };
        } catch (tableError) {
            try {
                // Intentar sin filtro 'activo'
                const result = await db.default.query('SELECT COUNT(*) as total FROM productos');
                productosInfo = {
                    total: parseInt(result.rows[0].total),
                    tabla: 'productos',
                    estado: 'sin columna activo'
                };
            } catch {
                productosInfo = { error: 'Tabla productos no existe' };
            }
        }
        
        res.json({ 
            success: true,
            mensaje: 'Conexión a la base de datos exitosa',
            timestamp: connectionTest.rows[0].current_time,
            postgres_version: connectionTest.rows[0].pg_version.split(' ')[0],
            productos: productosInfo
        });
        
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
        version: '1.0.0',
        uptime: process.uptime()
    });
});

// ============================================
// SERVICIÓN DE ARCHIVOS ESTÁTICOS
// ============================================

// Servir archivos subidos (corrige la ruta para que funcione en producción y desarrollo)
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath, {
    setHeaders: (res, filePath) => {
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
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
        path: req.originalUrl,
        method: req.method
    });
});

// Error handler global para rutas de API
app.use('/api/*', (err, req, res, next) => {
    console.error('❌ Error global de API:', err);
    res.status(err.status || 500).json({ 
        success: false,
        error: err.message || 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Catch-all route para SPA
app.use('*', (req, res) => {
    // Si es una ruta de API, devolver error
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            error: 'Endpoint de API no encontrado'
        });
    }
    
    // Para cualquier otra ruta, intentar servir el frontend
    const indexPath = path.join(frontendPath, 'index.html');
    if (require('fs').existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).json({
            success: false,
            error: 'Frontend no disponible - Esta es una API backend',
            message: 'Accede al frontend en Vercel'
        });
    }
});

// ============================================
// INICIALIZACIÓN DEL SERVIDOR
// ============================================

// Función para inicializar la base de datos
async function initializeDatabase() {
    try {
        const db = await import('./db.js');
        
        // 1. Prueba conexión básica
        const connectionTest = await db.default.query('SELECT NOW() as current_time');
        console.log('✅ Base de datos conectada - Hora servidor:', connectionTest.rows[0].current_time);
        
        // 2. Verificar tabla productos
        try {
            const tableCheck = await db.default.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'productos'
                );
            `);
            
            if (tableCheck.rows[0].exists) {
                // 3. Contar productos
                try {
                    const result = await db.default.query('SELECT COUNT(*) as total FROM productos WHERE activo = true');
                    console.log('📦 Productos activos:', Number(result.rows[0].total));
                } catch {
                    const result = await db.default.query('SELECT COUNT(*) as total FROM productos');
                    console.log('📦 Total productos:', Number(result.rows[0].total));
                }
            } else {
                console.log('⚠️  Tabla productos no encontrada');
            }
        } catch (tableError) {
            console.log('⚠️  Error verificando tabla:', tableError.message);
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
    
    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
        console.log('='.repeat(50));    
        console.log(`🎉 Servidor ejecutándose en puerto: ${PORT}`);
        console.log(`🌐 URL externa: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
        console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🗄️  Base de datos: ${dbConnected ? '✅ Conectada' : '❌ Desconectada'}`);
        console.log('='.repeat(50));
        console.log('📋 Rutas disponibles:');
        console.log('   🏠 / - Información del servidor');
        console.log('   🔐 /api/auth/* - Autenticación');
        console.log('   📦 /api/productos/* - Productos');
        console.log('   📊 /api/dashboard/* - Dashboard');
        console.log('   💳 /api/pagos/* - Pagos PSE');
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