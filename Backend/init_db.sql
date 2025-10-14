-- Añadir columna categoria_id a la tabla productos si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='productos' AND column_name='categoria_id') THEN
        ALTER TABLE productos ADD COLUMN categoria_id INTEGER REFERENCES categorias(id);
    END IF;
END $$;

-- Insertar algunas categorías por defecto si la tabla está vacía
INSERT INTO categorias (nombre, descripcion)
SELECT 'Frutas y Verduras', 'Productos frescos del campo'
WHERE NOT EXISTS (SELECT 1 FROM categorias);


# Modificaciones adicionales a la tabla productos
ALTER TABLE productos 
ADD COLUMN subcategoria VARCHAR(100),
ADD COLUMN marca VARCHAR(100),
ADD COLUMN destacado BOOLEAN DEFAULT false,
ADD COLUMN fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


# Modificaciones adicionales a la tabla usuarios
ALTER TABLE usuarios 
   ADD COLUMN telefono VARCHAR(20),
   ADD COLUMN direccion TEXT,
   ADD COLUMN fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


   -- 1. Eliminar la tabla existente (CUIDADO: borra todos los datos)
DROP TABLE IF EXISTS usuarios CASCADE;

-- 2. Crear la tabla con la estructura correcta
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    rol VARCHAR(20) DEFAULT 'cliente',
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Crear índice para búsquedas rápidas
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- 4. Verificar que se creó correctamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- 5. Ver la tabla vacía
SELECT * FROM usuarios;

#ACTUALIZACION PARA SISTEMA DE PUNTOS Y NIVELES
-- 1. Agregar columnas nuevas a la tabla usuarios
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS foto_perfil VARCHAR(500),
ADD COLUMN IF NOT EXISTS puntos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS nivel INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_compras DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cantidad_compras INTEGER DEFAULT 0;

-- 2. Crear tabla de historial de compras
CREATE TABLE IF NOT EXISTS compras (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    total DECIMAL(10,2) NOT NULL,
    puntos_ganados INTEGER DEFAULT 0,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'completada'
);

-- 3. Crear tabla de niveles con descuentos
CREATE TABLE IF NOT EXISTS niveles (
    id SERIAL PRIMARY KEY,
    nivel INTEGER UNIQUE NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    puntos_requeridos INTEGER NOT NULL,
    descuento_porcentaje DECIMAL(5,2) DEFAULT 0,
    beneficio TEXT
);

-- 4. Insertar niveles predefinidos
INSERT INTO niveles (nivel, nombre, puntos_requeridos, descuento_porcentaje, beneficio) VALUES
(1, 'Bronce', 0, 0, 'Cliente nuevo'),
(2, 'Plata', 100, 5, '5% de descuento en todas tus compras'),
(3, 'Oro', 500, 10, '10% de descuento + envío gratis'),
(4, 'Platino', 1500, 15, '15% de descuento + envío gratis + regalos'),
(5, 'Diamante', 5000, 20, '20% de descuento + todos los beneficios')
ON CONFLICT (nivel) DO NOTHING;

-- 5. Verificar cambios
SELECT * FROM usuarios LIMIT 1;
SELECT * FROM niveles ORDER BY nivel;
SELECT * FROM compras LIMIT 1;