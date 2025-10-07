const { Pool } = require('pg');
require('dotenv').config();

// Verificar el ambiente
const isProduction = process.env.NODE_ENV === 'production';
console.log('🌍 Ambiente:', process.env.NODE_ENV);

let pool;

try {
    if (isProduction) {
        // PRODUCCIÓN: Usa DATABASE_URL de Render
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL no está definida');
        }
        
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
        
        console.log('🚀 Producción: Conectado a PostgreSQL de Render');
    } else {
        // DESARROLLO: Usa PostgreSQL local
        pool = new Pool({
            user: 'postgres',
            host: 'localhost',
            database: 'supermercado_db',
            password: '7372546011',
            port: 5432
        });
        
        console.log('💻 Desarrollo: Conectado a PostgreSQL local');
    }
} catch (error) {
    console.error('❌ Error al configurar la conexión:', error.message);
    process.exit(1);
}

// Probar la conexión
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Error al conectar a PostgreSQL:', err.message);
    } else {
        console.log('✅ PostgreSQL conectado:', res.rows[0].now);
    }
});

pool.on('error', (err) => {
    console.error('Error inesperado en el pool:', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};