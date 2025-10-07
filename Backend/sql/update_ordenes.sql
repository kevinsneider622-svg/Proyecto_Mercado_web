-- Verificar si la tabla ordenes existe
CREATE TABLE IF NOT EXISTS ordenes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Si la tabla ya existe pero no tiene la columna fecha_creacion, agregarla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='ordenes' AND column_name='fecha_creacion'
    ) THEN
        ALTER TABLE ordenes ADD COLUMN fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Actualizar registros existentes que no tengan fecha_creacion
UPDATE ordenes 
SET fecha_creacion = CURRENT_TIMESTAMP 
WHERE fecha_creacion IS NULL;