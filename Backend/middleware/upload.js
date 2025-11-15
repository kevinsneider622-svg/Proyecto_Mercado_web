import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Para usar __dirname con ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Asegurar que existan las carpetas
const ensureUploadDirs = () => {
  const dirs = [
    'uploads/perfiles',
    'uploads/productos',
    'uploads/temp'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Carpeta creada: ${dir}`);
    }
  });
};

// Llamar al inicio
ensureUploadDirs();

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'temp';
    
    if (req.body.tipo === 'perfil') {
      folder = 'perfiles';
    } else if (req.body.tipo === 'producto') {
      folder = 'productos';
    }
    
    cb(null, `uploads/${folder}/`);
  },
  
  filename: (req, file, cb) => {
    // Generar nombre único: timestamp-random.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = `img-${uniqueSuffix}${fileExtension}`;
    
    cb(null, fileName);
  }
});

// Filtros de archivos
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  // Verificar tipo
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Tipo de archivo no permitido. Solo JPG, PNG, GIF, WebP'), false);
  }
  
  // Verificar tamaño (se hará después en el controlador)
  cb(null, true);
};

// Configurar multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Middleware para subir archivos
const uploadMiddleware = upload.single('archivo');

// Middleware para manejar errores de multer
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'El archivo es demasiado grande. Máximo 5MB'
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Campo de archivo incorrecto'
      });
    }
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  
  next();
};

export {
  uploadMiddleware,
  handleUploadErrors,
  ensureUploadDirs
};