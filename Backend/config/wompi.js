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
  
  // URL base de tu aplicación - Detecta entorno de Render.com
  baseUrl: process.env.BASE_URL || 
          (process.env.RENDER_EXTERNAL_URL || 'http://127.0.0.1:3000'),
  
  // URL para recibir webhooks de Wompi
  webhookUrl: process.env.WOMPI_WEBHOOK_URL || 
              `${process.env.RENDER_EXTERNAL_URL || 'http://127.0.0.1.3000'}/api/pagos/webhook`,

  // Información del entorno
  environment: process.env.WOMPI_ENV || 'production'
};


// Validar configuración

const missingVars = [];
if (!wompiConfig.publicKey) missingVars.push('WOMPI_PUBLIC_KEY');
if (!wompiConfig.privateKey) missingVars.push('WOMPI_PRIVATE_KEY');
if (!wompiConfig.eventSecret) missingVars.push('WOMPI_EVENT_SECRET');
if (!wompiConfig.integritySecret) missingVars.push('WOMPI_INTEGRITY_SECRET');

if (missingVars.length > 0) {
  console.error('❌ ERROR: Variables de Wompi faltantes:', missingVars.join(', '));
  process.exit(1);
}

console.log('✅ Wompi configurado correctamente');
console.log('🔑 Entorno:', wompiConfig.environment);
console.log('🔑 Llave pública:', wompiConfig.publicKey.substring(0, 20) + '...');
console.log('🌐 Base URL:', wompiConfig.baseUrl);
console.log('🪝 Webhook URL:', wompiConfig.webhookUrl);

export default wompiConfig;
