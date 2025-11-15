import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { uploadMiddleware, handleUploadErrors } from '../middleware/upload.js';
import auth from './auth.js';

const router = express.Router();

// Para usar __dirname con ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @route   POST /api/upload/perfil
 * @desc    Subir foto de perfil
 * @access  Private
 */
router.post('/perfil', auth, uploadMiddleware, handleUploadErrors, async (req, res) => {
  try {
    // Verificar que se subió un archivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se ha seleccionado ningún archivo'
      });
    }

    // Validar que sea una imagen
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(req.file.mimetype)) {
      // Eliminar archivo subido
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'Tipo de archivo no permitido'
      });
    }

    // Validar tamaño (max 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'El archivo es demasiado grande. Máximo 5MB'
      });
    }

    // Obtener usuario de la request (del middleware auth)
    const usuario = req.user;
    
    // Ruta temporal del archivo subido
    const tempPath = req.file.path;
    
    // Nueva ruta en carpeta de perfiles
    const newFileName = `perfil-${usuario.id}-${Date.now()}${path.extname(req.file.originalname)}`;
    const newPath = path.join('uploads', 'perfiles', newFileName);
    
    // Mover archivo de temp a perfiles
    fs.renameSync(tempPath, newPath);
    
    // Ruta relativa para la base de datos
    const dbPath = `perfiles/${newFileName}`;
    
    // Importar tu modelo de usuarios (ajusta según tu estructura)
    // import Usuario from '../models/Usuario.js';
    
    // Actualizar base de datos - REEMPLAZA ESTO CON TU MODELO REAL
    const usuarioActualizado = await actualizarFotoPerfil(usuario.id, dbPath);
    
    if (!usuarioActualizado) {
      // Si falla la actualización, eliminar la imagen
      fs.unlinkSync(newPath);
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // URL completa para el frontend
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/perfiles/${newFileName}`;

    console.log(`✅ Foto de perfil actualizada para usuario: ${usuario.email}`);
    
    res.json({
      success: true,
      message: 'Foto de perfil actualizada correctamente',
      data: {
        usuario: usuarioActualizado,
        imagen: {
          nombre: newFileName,
          ruta: dbPath,
          url: imageUrl,
          tamaño: req.file.size,
          tipo: req.file.mimetype
        }
      }
    });

  } catch (error) {
    console.error('❌ Error subiendo foto de perfil:', error);
    
    // Eliminar archivo si existe
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Error del servidor al subir la imagen'
    });
  }
});

/**
 * @route   DELETE /api/upload/perfil
 * @desc    Eliminar foto de perfil
 * @access  Private
 */
router.delete('/perfil', auth, async (req, res) => {
  try {
    const usuario = req.user;
    
    // Obtener usuario actual - REEMPLAZA CON TU MODELO REAL
    const usuarioDB = await obtenerUsuarioPorId(usuario.id);
    
    if (!usuarioDB || !usuarioDB.foto_perfil) {
      return res.status(404).json({
        success: false,
        error: 'No se encontró foto de perfil para eliminar'
      });
    }
    
    // Ruta del archivo
    const filePath = path.join('uploads', usuarioDB.foto_perfil);
    
    // Eliminar archivo físico
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Foto eliminada: ${filePath}`);
    }
    
    // Actualizar base de datos - REEMPLAZA CON TU MODELO REAL
    const usuarioActualizado = await actualizarFotoPerfil(usuario.id, null);
    
    res.json({
      success: true,
      message: 'Foto de perfil eliminada correctamente',
      data: {
        usuario: usuarioActualizado
      }
    });
    
  } catch (error) {
    console.error('❌ Error eliminando foto de perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Error del servidor al eliminar la imagen'
    });
  }
});

/**
 * @route   GET /api/upload/serve/:tipo/:filename
 * @desc    Servir archivos de uploads
 * @access  Public
 */
router.get('/serve/:tipo/:filename', (req, res) => {
  try {
    const { tipo, filename } = req.params;
    const allowedTypes = ['perfiles', 'productos'];
    
    if (!allowedTypes.includes(tipo)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo de archivo no permitido'
      });
    }
    
    const filePath = path.join(__dirname, '..', 'uploads', tipo, filename);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Archivo no encontrado'
      });
    }
    
    // Servir el archivo
    res.sendFile(path.resolve(filePath));
    
  } catch (error) {
    console.error('❌ Error sirviendo archivo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al servir el archivo'
    });
  }
});

// ============================================
// FUNCIONES AUXILIARES - REEMPLAZA CON TU MODELO REAL
// ============================================

/**
 * Función auxiliar - Reemplaza con tu modelo real de usuarios
 */
async function actualizarFotoPerfil(usuarioId, fotoPath) {
  // REEMPLAZA ESTO CON TU CÓDIGO REAL DE BASE DE DATOS
  // Ejemplo:
  // return await Usuario.findByIdAndUpdate(usuarioId, { 
  //   foto_perfil: fotoPath,
  //   fecha_actualizacion: new Date()
  // }, { new: true }).select('-password');
  
  // Por ahora retornamos un objeto simulado
  return {
    id: usuarioId,
    foto_perfil: fotoPath,
    fecha_actualizacion: new Date()
  };
}

/**
 * Función auxiliar - Reemplaza con tu modelo real de usuarios
 */
async function obtenerUsuarioPorId(usuarioId) {
  // REEMPLAZA ESTO CON TU CÓDIGO REAL DE BASE DE DATOS
  // Ejemplo:
  // return await Usuario.findById(usuarioId);
  
  // Por ahora retornamos un objeto simulado
  return {
    id: usuarioId,
    foto_perfil: 'perfiles/foto-ejemplo.jpg'
  };
}

export default router;