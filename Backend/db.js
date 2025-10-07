const { Pool } = require('pg');

// Usar variable de entorno en producción, config manual en desarrollo
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool(
    isProduction
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    }
    : {
        user: process.env.PGUSER || 'postgres',
        host: process.env.PGHOST || '127.0.0.1',
        database: process.env.PGDATABASE || 'supermercado_db',
        password: process.env.PGPASSWORD || '7372546011',
        port: parseInt(process.env.PGPORT || '5432'),
    }
);

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Error al conectar a PostgreSQL:', err);
    } else {
        console.log('✅ Conexión a PostgreSQL exitosa:', res.rows[0].now);
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};