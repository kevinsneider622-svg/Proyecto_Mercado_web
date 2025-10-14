const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

async function initializeDatabase() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Iniciando configuración de la base de datos...');

        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'init_db.sql');
        const sqlContent = await fs.readFile(sqlPath, 'utf8');

        // Ejecutar las consultas
        await pool.query(sqlContent);

        console.log('Base de datos inicializada correctamente');
    } catch (error) {
        console.error('Error inicializando la base de datos:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Si este archivo se ejecuta directamente (no es importado)
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('Inicialización completada');
            process.exit(0);
        })
        .catch(err => {
            console.error('Error en la inicialización:', err);
            process.exit(1);
        });
}

module.exports = initializeDatabase;