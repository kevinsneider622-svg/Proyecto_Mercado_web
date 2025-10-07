const { Pool } = require('pg');
require('dotenv').config();

// Verificar el ambiente
const isProduction = process.env.NODE_ENV === 'production';
console.log('Ambiente:', process.env.NODE_ENV);

// Configuración de la base de datos
let pool;

try {
    if (isProduction) {
        // Configuración para producción usando DATABASE_URL
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL no está definida en el ambiente de producción');
        }
        
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        
        console.log('Configuración de producción: Usando DATABASE_URL con SSL');
    } else {
        // Configuración para desarrollo local
        pool = new Pool({
            user: 'postgres',
            host: 'localhost',
            database: 'supermercado_db',
            password: '7372546011',
            port: 5432
        });
        
        console.log('Configuración de desarrollo: Usando conexión local');
    }
} catch (error) {
    console.error('Error al configurar la conexión:', error.message);
    process.exit(1); // Terminar el proceso si hay un error de configuración
}

// Probar la conexión
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Error al conectar a PostgreSQL:', err);
        console.error('Detalles de la conexión:', {
            isProduction,
            hasConnectionString: !!process.env.DATABASE_URL,
            error: err.message
        });
    } else {
        console.log('✅ Conexión a PostgreSQL exitosa:', res.rows[0].now);
    }
});

// Manejar errores de conexión
pool.on('error', (err) => {
    console.error('Error inesperado en el pool de conexiones:', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};