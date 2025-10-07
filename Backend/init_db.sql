-- Crear tabla de categorías si no existe
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

INSERT INTO categorias (nombre, descripcion)
SELECT 'Panadería', 'Pan fresco y productos horneados'
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre = 'Panadería');

INSERT INTO categorias (nombre, descripcion)
SELECT 'Lácteos', 'Leche, queso y derivados'
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre = 'Lácteos');

INSERT INTO categorias (nombre, descripcion)
SELECT 'Bebidas', 'Refrescos, jugos y bebidas'
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nombre = 'Bebidas');

-- Asegurarse de que las tablas necesarias para el dashboard existen
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    rol VARCHAR(20) DEFAULT 'cliente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ordenes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    total DECIMAL(10,2) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orden_detalles (
    id SERIAL PRIMARY KEY,
    orden_id INTEGER REFERENCES ordenes(id),
    producto_id INTEGER REFERENCES productos(id),
    cantidad INTEGER NOT NULL,
    precio DECIMAL(10,2) NOT NULL
);