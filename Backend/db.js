// db.js (o donde manejes tu conexión)
const { Pool } = require('pg');

// Crea una pool de conexiones. 
// Es la forma recomendada para aplicaciones web.
const pool = new Pool({
    user: 'postgres', // ej: postgres
    host: '127.0.0.7',         // Si estás en local, suele ser localhost
    database: 'supermercado_db',
    password: '7372546011',
    port: 5432,                // Puerto por defecto de PostgreSQL
});

// Verifica la conexión (opcional, pero buena práctica)
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error al conectar a PostgreSQL:', err);
    } else {
        console.log('Conexión a PostgreSQL exitosa:', res.rows[0].now);
    }
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};