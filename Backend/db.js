const path = require ('path'); 
const {Pool}  = require  ('pg');
const dotenv = require ('dotenv');


dotenv.config ({path: path.join(__dirname, '..', '.env')});

// Configuración del pool de conexiones
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD || ''),
  port: process.env.DB_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  
  // Configuraciones adicionales para mejor performance
  max: 20, // máximo de clientes en el pool
  idleTimeoutMillis: 30000, // cierra clientes inactivos después de 30 segundos
  connectionTimeoutMillis: 2000, // tiempo de espera para conexión
  maxUses: 7500, // máximo de usos por cliente (previte memory leaks)
});

// Manejo de eventos del pool
pool.on('connect', () => {
  console.log('✅ Nueva conexión a la base de datos establecida');
});

pool.on('error', (err, client) => {
  console.error('❌ Error inesperado en el cliente de base de datos:', err);
});

// Función query mejorada con logging
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log de consultas lentas (más de 100ms)
    if (duration > 100) {
      console.log(`🐌 Consulta lenta ejecutada en ${duration}ms:`, {
        query: text,
        duration: `${duration}ms`,
        rows: result.rowCount
      });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`❌ Error en consulta (${duration}ms):`, {
      query: text,
      params: params,
      error: error.message
    });
    throw error;
  }
};

// Función withTransaction mejorada
const withTransaction = async (callback) => {
  const client = await pool.connect();
  const start = Date.now();
  
  try {
    console.log('🔄 Iniciando transacción...');
    await client.query('BEGIN');
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    const duration = Date.now() - start;
    console.log(`✅ Transacción completada en ${duration}ms`);
    
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    const duration = Date.now() - start;
    console.error(`❌ Transacción fallida después de ${duration}ms:`, error.message);
    throw error;
  } finally {
    client.release();
  }
};

// Función getClient
const getClient = () => pool.connect();

// Función para verificar la conexión a la base de datos
const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Conexión a PostgreSQL verificada:', {
      time: result.rows[0].current_time,
      version: result.rows[0].version.split(' ').slice(1, 3).join(' ')
    });
    return true;
  } catch (error) {
    console.error('❌ Error verificando conexión a PostgreSQL:', error.message);
    return false;
  }
};

// Función para cerrar el pool gracefulmente
const closePool = async () => {
  console.log('🛑 Cerrando pool de conexiones...');
  await pool.end();
  console.log('✅ Pool de conexiones cerrado');
};

// Exportar todas las funciones
module.exports = {
  pool,
  query,
  withTransaction,
  getClient,
  testConnection,
  closePool
};