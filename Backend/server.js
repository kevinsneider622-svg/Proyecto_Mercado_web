// ============================================
// SERVER.JS - Servidor Principal Mejorado
// ============================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar rutas
import pagosRoutes from './routes/pagos.js';
import productosRoutes from './routes/productos.js';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear app de Express
const app = express();
const PORT = process.env.PORT || 3000;

// Determinar entorno
const isProduction = process.env.NODE_ENV === 'production';
const isRender = !!process.env.RENDER_EXTERNAL_URL;
const isVercel = !!process.env.VERCEL_URL;

// ============================================
// CONFIGURACIÓN DE CORS
// ============================================

const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requests sin origin (como Postman, curl, etc.)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:5173', // Vite dev server
            'https://proyecto-mercado-web.onrender.com',
            'https://proyecto-mercado-web-zebx.vercel.app'
        ];
        
        // En desarrollo, permitir cualquier localhost
        if (!isProduction && origin.includes('localhost')) {
            return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn('⚠️  CORS bloqueado para origen:', origin);
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// ============================================
// MIDDLEWARES GLOBALES
// ============================================

// Parser de JSON y URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging de requests (solo en desarrollo)
if (!isProduction) {
    app.use((req, res, next) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${req.method} ${req.path}`);
        next();
    });
}

// Headers de seguridad
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// ============================================
// SERVIR ARCHIVOS ESTÁTICOS
// ============================================

// Servir carpeta de uploads (imágenes de productos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '1d', // Cache de 1 día en producción
    etag: true
}));

// Servir frontend
app.use(express.static(path.join(__dirname, '../frontend'), {
    maxAge: isProduction ? '1h' : '0',
    etag: true,
    index: 'index.html'
}));

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
    const healthCheck = {
        status: 'OK',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        platform: isRender ? 'Render' : isVercel ? 'Vercel' : 'Local',
        wompiEnv: process.env.WOMPI_ENV || 'sandbox',
        nodeVersion: process.version,
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
        }
    };
    
    res.status(200).json(healthCheck);
});

// ============================================
// API ROUTES
// ============================================

// Rutas de productos
app.use('/api/productos', productosRoutes);

// Rutas de pagos Wompi
app.use('/api/pagos', pagosRoutes);

// TODO: Agregar más rutas aquí
// app.use('/api/auth', authRoutes);
// app.use('/api/usuarios', usuariosRoutes);
// app.use('/api/pedidos', pedidosRoutes);

// ============================================
// RUTA PRINCIPAL (SPA)
// ============================================

// Catch-all para servir index.html en cualquier ruta no API
app.get('*', (req, res) => {
    // Si la ruta empieza con /api, no servir el HTML
    if (req.path.startsWith('/api')) {
        return res.status(404).json({
            success: false,
            error: 'Ruta API no encontrada'
        });
    }
    
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ============================================
// MANEJO DE ERRORES
// ============================================

// 404 para rutas API no encontradas
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint no encontrado',
        path: req.path
    });
});

// Error handler global
app.use((err, req, res, next) => {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERROR NO MANEJADO:');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Ruta:', req.method, req.path);
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const statusCode = err.status || err.statusCode || 500;
    
    res.status(statusCode).json({
        success: false,
        error: isProduction ? 'Error interno del servidor' : err.message,
        ...((!isProduction) && { 
            stack: err.stack,
            details: err 
        })
    });
});

// ============================================
// MANEJO DE SEÑALES DE CIERRE
// ============================================

process.on('SIGTERM', () => {
    console.log('\n⚠️  SIGTERM recibido. Cerrando servidor gracefully...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n⚠️  SIGINT recibido. Cerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
    });
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('💥 UNCAUGHT EXCEPTION:');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('💥 UNHANDLED REJECTION:');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Razón:', reason);
    console.error('Promesa:', promise);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

// ============================================
// INICIAR SERVIDOR
// ============================================

const server = app.listen(PORT, () => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 SERVIDOR INICIADO CORRECTAMENTE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Información del servidor
    console.log('📍 Puerto:', PORT);
    console.log('🌍 Entorno:', process.env.NODE_ENV || 'development');
    console.log('🏠 Plataforma:', isRender ? 'Render' : isVercel ? 'Vercel' : 'Local');
    console.log('🔑 Wompi:', process.env.WOMPI_ENV || 'sandbox');
    console.log('📦 Node:', process.version);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // URLs disponibles
    if (!isProduction) {
        console.log('🔗 URLs disponibles:');
        console.log(`   Local:    http://localhost:${PORT}`);
        console.log(`   Network:  http://127.0.0.1:${PORT}`);
    } else if (isRender) {
        console.log('🔗 URL:', process.env.RENDER_EXTERNAL_URL);
    } else if (isVercel) {
        console.log('🔗 URL:', `https://${process.env.VERCEL_URL}`);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Rutas disponibles
    console.log('📋 Rutas API disponibles:');
    console.log('   GET    /health');
    console.log('   GET    /api/productos');
    console.log('   GET    /api/productos/destacados');
    console.log('   GET    /api/productos/ofertas');
    console.log('   GET    /api/pagos/config');
    console.log('   GET    /api/pagos/bancos-pse');
    console.log('   POST   /api/pagos/crear-transaccion');
    console.log('   POST   /api/pagos/webhook');
    console.log('   GET    /api/pagos/transaccion/:id');
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Warnings importantes
    if (!isProduction) {
        console.log('⚠️  MODO DESARROLLO - Logs detallados activados');
    }
    
    if (!process.env.WOMPI_PUBLIC_KEY) {
        console.log('⚠️  WARNING: WOMPI_PUBLIC_KEY no configurado');
    }
    
    if (!process.env.WOMPI_PRIVATE_KEY) {
        console.log('⚠️  WARNING: WOMPI_PRIVATE_KEY no configurado');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Servidor listo para recibir peticiones\n');
});

// ============================================
// EXPORTAR APP (para testing)
// ============================================

export default app;