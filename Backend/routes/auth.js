const express = require ('express');
const bcrypt = require ('bcryptjs');
const jwt = require ('jsonwebtoken');
const db = require ('../db.js');
const {auth} = require ('../middleware/auth.js');


const router = express.Router();

// ============================================
// REGISTRO DE USUARIO
// ============================================
router.post('/register', async (req, res) => {
    try {
        console.log('📝 Solicitud de registro recibida:', req.body);
        
        const { nombre, email, password } = req.body;

        // Validaciones básicas
        if (!nombre || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Nombre, email y password son requeridos'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Email inválido'
            });
        }

        // Validar longitud de contraseña
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Verificar si el usuario ya existe
        const userExists = await db.query(
            'SELECT id FROM usuarios WHERE email = $1',
            [email.toLowerCase()]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'El email ya está registrado'
            });
        }

        // Hashear password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insertar nuevo usuario
        const result = await db.query(
            `INSERT INTO usuarios (nombre, email, password, rol) 
             VALUES ($1, $2, $3, 'cliente') 
             RETURNING id, nombre, email, rol, fecha_creacion`,
            [nombre, email.toLowerCase(), hashedPassword]
        );

        const newUser = result.rows[0];

        // Generar token JWT
        const token = jwt.sign(
            { 
                id: newUser.id, 
                email: newUser.email, 
                rol: newUser.rol 
            },
            process.env.JWT_SECRET || 'secreto_supermercado',
            { expiresIn: '24h' }
        );

        console.log('✅ Usuario registrado exitosamente:', newUser.email);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            user: {
                id: newUser.id,
                nombre: newUser.nombre,
                email: newUser.email,
                rol: newUser.rol
            },
            token
        });

    } catch (error) {
        console.error('❌ Error en registro:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// ============================================
// LOGIN DE USUARIO
// ============================================
router.post('/login', async (req, res) => {
    try {
        console.log('=== 🔐 INICIO LOGIN BACKEND ===');
        console.log('📨 Headers:', req.headers);
        console.log('📦 Body completo:', req.body);
        console.log('📧 Email recibido:', req.body?.email);
        console.log('🔑 Password recibido:', req.body?.password ? '***' : 'NO RECIBIDO');
        
        const { email, password } = req.body;

        // Validaciones básicas
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email y password son requeridos'
            });
        }

        // Buscar usuario
        const result = await db.query(
            `SELECT id, nombre, email, password, rol, activo 
             FROM usuarios WHERE email = $1`,
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        const user = result.rows[0];

        // Verificar si el usuario está activo
        if (!user.activo) {
            return res.status(401).json({
                success: false,
                error: 'Cuenta desactivada'
            });
        }

        // Verificar password
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        // Generar token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                rol: user.rol 
            },
            process.env.JWT_SECRET || 'secreto_supermercado',
            { expiresIn: '24h' }
        );

        console.log('✅ Login exitoso:', user.email);

        res.json({
            success: true,
            message: 'Login exitoso',
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol
            },
            token
        });

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
});

// ============================================
// VERIFICAR TOKEN
// ============================================
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token no proporcionado'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_supermercado');

        const result = await db.query(
            'SELECT id, nombre, email, rol FROM usuarios WHERE id = $1 AND activo = true',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            user: result.rows[0]
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            error: 'Token inválido o expirado'
        });
    }
});

// ============================================
// OBTENER PERFIL
// ============================================
router.get('/profile', auth, async (req, res) => {
    try {
        // ✅ EL USUARIO YA VIENE DEL MIDDLEWARE AUTH
        const usuario = req.user;
        console.log('👤 Obteniendo perfil para usuario:', usuario.id);

        const result = await db.query(
            `SELECT id, nombre, email, telefono, direccion, rol, fecha_creacion, fecha_actualizacion, foto_perfil
             FROM usuarios WHERE id = $1`,
            [usuario.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        const userData = result.rows[0];
        
        // Construir URL completa para la foto de perfil si existe
        if (userData.foto_perfil) {
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            userData.foto_perfil_url = `${baseUrl}/uploads/${userData.foto_perfil}`;
        }

        console.log('✅ Perfil obtenido exitosamente:', userData.email);

        res.json({
            success: true,
            user: userData
        });

    } catch (error) {
        console.error('❌ Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

// ============================================
// ACTUALIZAR PERFIL
// ============================================
router.put('/profile', auth, async (req, res) => {
    try {
        console.log('🔄 Solicitud de actualización de perfil:', req.body);
        
        // ✅ EL USUARIO YA VIENE DEL MIDDLEWARE AUTH
        const usuario = req.user;
        const { nombre, telefono, direccion } = req.body;

        // Validar que al menos un campo sea proporcionado
        if (!nombre && !telefono && !direccion) {
            return res.status(400).json({
                success: false,
                error: 'Debe proporcionar al menos un campo para actualizar'
            });
        }

        // Construir query dinámico
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (nombre) {
            updates.push(`nombre = $${paramCount}`);
            values.push(nombre);
            paramCount++;
        }

        if (telefono) {
            updates.push(`telefono = $${paramCount}`);
            values.push(telefono);
            paramCount++;
        }

        if (direccion) {
            updates.push(`direccion = $${paramCount}`);
            values.push(direccion);
            paramCount++;
        }

        // Agregar fecha de actualización
        updates.push(`fecha_actualizacion = $${paramCount}`);
        values.push(new Date());
        paramCount++;

        // Agregar ID del usuario
        values.push(usuario.id);

        const query = `
            UPDATE usuarios 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING id, nombre, email, telefono, direccion, rol, fecha_creacion, fecha_actualizacion, foto_perfil
        `;

        console.log('📝 Query de actualización:', query);
        console.log('🔢 Valores:', values);

        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        const usuarioActualizado = result.rows[0];
        
        // Construir URL completa para la foto de perfil si existe
        if (usuarioActualizado.foto_perfil) {
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            usuarioActualizado.foto_perfil_url = `${baseUrl}/uploads/${usuarioActualizado.foto_perfil}`;
        }

        console.log('✅ Perfil actualizado exitosamente:', usuarioActualizado.email);

        res.json({
            success: true,
            message: 'Perfil actualizado correctamente',
            user: usuarioActualizado
        });

    } catch (error) {
        console.error('❌ Error actualizando perfil:', error);
        
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor al actualizar perfil',
            details: error.message
        });
    }
});

// ============================================
// RUTA DE PRUEBA
// ============================================
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Rutas de autenticación funcionando correctamente',
        routes: [
            'POST /auth/register',
            'POST /auth/login',
            'GET /auth/verify',
            'GET /auth/profile'
        ]
    });
});

console.log('✅ Rutas de autenticación cargadas correctamente');

module.exports = router;