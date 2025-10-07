const { Pool } = require('pg');

// Usar variable de entorno en producción, config manual en desarrollo
const isProduction = process.env.NODE_ENV === 'production';

// Configuración de conexión para producción y desarrollo
let poolConfig;

if (isProduction) {
    // En producción, usar las variables individuales de Render
    poolConfig = {
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        password: process.env.PGPASSWORD,
        port: parseInt(process.env.PGPORT || '5432'),
        ssl: {
            rejectUnauthorized: false
        }
    };
} else {
    // En desarrollo, usar configuración local
    poolConfig = {
        user: 'postgres',
        host: '127.0.0.1',
        database: 'supermercado_db',
        password: '7372546011',
        port: 5432
    };
}

console.log('Ambiente:', process.env.NODE_ENV);
console.log('Configuración de conexión:', {
    ...poolConfig,
    password: poolConfig.password ? '[HIDDEN]' : undefined
});

const pool = new Pool(poolConfig);

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