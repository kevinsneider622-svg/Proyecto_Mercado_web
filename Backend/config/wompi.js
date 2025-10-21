import 'dotenv/config';

const wompiConfig = {
  // Llaves principales
  publicKey: process.env.WOMPI_PUBLIC_KEY,
  privateKey: process.env.WOMPI_PRIVATE_KEY,
  
  // Secretos para webhooks e integridad
  eventSecret: process.env.WOMPI_EVENT_SECRET,
  integritySecret: process.env.WOMPI_INTEGRITY_SECRET,
  
  // URL de la API de Wompi
  apiUrl: process.env.WOMPI_ENV === 'production' 
    ? 'https://production.wompi.co/v1' 
    : 'https://sandbox.wompi.co/v1',
  
  // URL base de tu aplicación
  baseUrl: process.env.BASE_URL || 'http://127.0.0.1:3000',
  
  // Información del entorno
  environment: process.env.WOMPI_ENV || 'production'
};

// Validar configuración
if (!wompiConfig.publicKey || !wompiConfig.privateKey) {
  console.error('❌ ERROR: Llaves de Wompi no configuradas');
  process.exit(1);
}

console.log('🔑 Wompi configurado en modo:', wompiConfig.environment);
console.log('🔑 Llave pública:', wompiConfig.publicKey.substring(0, 20) + '...');

export default wompiConfig;