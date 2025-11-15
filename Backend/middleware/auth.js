import jwt from 'jsonwebtoken';
import db from '../db.js';

/**
 * Middleware de autenticación JWT
 * Verifica el token y agrega el usuario a la request
 */
const auth = async (req, res, next) => {
    try {
        console.log('🔐 Verificando autenticación...');
        console.log('📨 Headers:', req.headers);
        
        // Obtener token del header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ No se proporcionó token Bearer');
            return res.status(401).json({
                success: false,
                error: 'Token de acceso requerido. Formato: Bearer <token>'
            });
        }

        const token = authHeader.replace('Bearer ', '').trim();
        
        if (!token) {
            console.log('❌ Token vacío después de Bearer');
            return res.status(401).json({
                success: false,
                error: 'Token no puede estar vacío'
            });
        }

        console.log('🔑 Token recibido:', token.substring(0, 20) + '...');

        // Verificar y decodificar el token
        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || 'secreto_supermercado'
        );

        console.log('✅ Token decodificado:', {
            id: decoded.id,
            email: decoded.email,
            rol: decoded.rol
        });

        // Verificar que el usuario aún existe en la base de datos
        const userResult = await db.query(
            `SELECT id, nombre, email, rol, activo 
             FROM usuarios 
             WHERE id = $1 AND activo = true`,
            [decoded.id]
        );

        if (userResult.rows.length === 0) {
            console.log('❌ Usuario no encontrado o inactivo en BD');
            return res.status(401).json({
                success: false,
                error: 'Usuario no encontrado o cuenta desactivada'
            });
        }

        const user = userResult.rows[0];
        
        // Agregar usuario a la request
        req.user = {
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            rol: user.rol
        };

        console.log('✅ Usuario autenticado:', {
            id: user.id,
            email: user.email,
            rol: user.rol
        });

        // Continuar al siguiente middleware/controlador
        next();

    } catch (error) {
        console.error('❌ Error en middleware auth:', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Token inválido'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expirado'
            });
        }

        if (error.name === 'SyntaxError') {
            return res.status(401).json({
                success: false,
                error: 'Token con formato inválido'
            });
        }

        // Error del servidor
        console.error('💥 Error inesperado en auth middleware:', error);
        return res.status(500).json({
            success: false,
            error: 'Error interno del servidor en autenticación'
        });
    }
};

/**
 * Middleware para verificar roles específicos
 */
const requireRole = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no autenticado'
            });
        }

        if (!rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para esta acción'
            });
        }

        next();
    };
};

/**
 * Middleware opcional - No requiere autenticación pero la usa si existe
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '').trim();
            
            if (token) {
                const decoded = jwt.verify(
                    token, 
                    process.env.JWT_SECRET || 'secreto_supermercado'
                );

                const userResult = await db.query(
                    `SELECT id, nombre, email, rol, activo 
                     FROM usuarios 
                     WHERE id = $1 AND activo = true`,
                    [decoded.id]
                );

                if (userResult.rows.length > 0) {
                    const user = userResult.rows[0];
                    req.user = {
                        id: user.id,
                        email: user.email,
                        nombre: user.nombre,
                        rol: user.rol
                    };
                    console.log('✅ Usuario opcional autenticado:', user.email);
                }
            }
        }
        
        next();
    } catch (error) {
        // En auth opcional, ignoramos errores y continuamos
        console.log('ℹ️ Auth opcional - Token inválido, continuando sin usuario');
        next();
    }
};

// Exportar middlewares
export default auth;
export {
    requireRole,
    optionalAuth
};