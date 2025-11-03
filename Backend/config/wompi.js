// ============================================
// WOMPI.JS - BACKEND CONFIGURATION
// Compatible con Render, Vercel y Local
// ============================================

// Cargar dotenv solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
  await import('dotenv/config');
}

// ============================================
// DETECCIÓN AUTOMÁTICA DE ENTORNO
// ============================================

const isProduction = process.env.NODE_ENV === 'production';
const hostname = process.env.HOSTNAME || '';
const isRender = hostname.includes('onrender.com') || !!process.env.RENDER_EXTERNAL_URL;
const isVercel = hostname.includes('vercel.app') || !!process.env.VERCEL_URL;

// ============================================
// DETERMINAR BASE_URL CON ORDEN DE PRIORIDAD
// ============================================

let BASE_URL;

if (process.env.BASE_URL) {
  // 1. Prioridad máxima: Variable explícita
  BASE_URL = process.env.BASE_URL;
} else if (isRender && process.env.RENDER_EXTERNAL_URL) {
  // 2. Render: usar URL externa
  BASE_URL = process.env.RENDER_EXTERNAL_URL;
} else if (isVercel) {
  // 3. Vercel: construir URL con https
  if (process.env.VERCEL_URL) {
    BASE_URL = process.env.VERCEL_URL.startsWith('http') 
      ? process.env.VERCEL_URL 
      : `https://${process.env.VERCEL_URL}`;
  } else {
    BASE_URL = 'https://proyecto-mercado-web-zebx.vercel.app';
  }
} else {
  // 4. Desarrollo local
  BASE_URL = 'http://127.0.0.1:3000';
}

// ============================================
// CONFIGURACIÓN PRINCIPAL DE WOMPI
// ============================================

const wompiConfig = {
  // ✅ Llaves principales (TODAS necesarias)
  publicKey: process.env.WOMPI_PUBLIC_KEY,
  privateKey: process.env.WOMPI_PRIVATE_KEY,
  
  // ✅ Secretos para webhooks e integridad
  eventSecret: process.env.WOMPI_EVENT_SECRET,
  integritySecret: process.env.WOMPI_INTEGRITY_SECRET,
  
  // ✅ URL de la API de Wompi (sandbox por defecto)
  apiUrl: process.env.WOMPI_ENV === 'production' 
    ? 'https://production.wompi.co/v1' 
    : 'https://sandbox.wompi.co/v1',
  
  // ✅ URL base de tu aplicación
  baseUrl: BASE_URL,
  
  // ✅ Alias para compatibilidad con frontend
  API_BASE_URL: BASE_URL,
  
  // ✅ URL del webhook
  webhookUrl: process.env.WOMPI_WEBHOOK_URL || `${BASE_URL}/api/pagos/webhook`,
  
  // ✅ URLs de redirección después del pago
  redirectUrl: process.env.REDIRECT_URL || `${BASE_URL}/?payment=success`,
  cancelUrl: process.env.CANCEL_URL || `${BASE_URL}/?payment=cancelled`,
  
  // ✅ Información del entorno
  environment: process.env.WOMPI_ENV || 'sandbox',
  isProduction,
  isRender,
  isVercel
};

// ============================================
// VALIDACIONES DE CONFIGURACIÓN
// ============================================

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 DEBUG: Configuración de Entorno');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📌 NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('📌 HOSTNAME:', hostname || 'local');
console.log('📌 RENDER_EXTERNAL_URL:', process.env.RENDER_EXTERNAL_URL || 'N/A');
console.log('📌 VERCEL_URL:', process.env.VERCEL_URL || 'N/A');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('🔑 Variables de Wompi:');
console.log('   WOMPI_PUBLIC_KEY:', process.env.WOMPI_PUBLIC_KEY ? '✅ Existe' : '❌ Falta');
console.log('   WOMPI_PRIVATE_KEY:', process.env.WOMPI_PRIVATE_KEY ? '✅ Existe' : '❌ Falta');
console.log('   WOMPI_EVENT_SECRET:', process.env.WOMPI_EVENT_SECRET ? '✅ Existe' : '❌ Falta');
console.log('   WOMPI_INTEGRITY_SECRET:', process.env.WOMPI_INTEGRITY_SECRET ? '✅ Existe' : '❌ Falta');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ============================================
// VALIDAR VARIABLES CRÍTICAS
// ============================================

const missingVars = [];
if (!wompiConfig.publicKey) missingVars.push('WOMPI_PUBLIC_KEY');
if (!wompiConfig.privateKey) missingVars.push('WOMPI_PRIVATE_KEY');
if (!wompiConfig.eventSecret) missingVars.push('WOMPI_EVENT_SECRET');
if (!wompiConfig.integritySecret) missingVars.push('WOMPI_INTEGRITY_SECRET');

if (missingVars.length > 0) {
  console.error('\n❌ ERROR CRÍTICO: Variables de Wompi faltantes');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('📋 Variables faltantes:', missingVars.join(', '));
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Mostrar solución según plataforma
  if (isRender) {
    console.error('💡 SOLUCIÓN PARA RENDER:');
    console.error('   1. Ve a: https://dashboard.render.com');
    console.error('   2. Selecciona tu proyecto');
    console.error('   3. Ve a: Environment > Environment Variables');
    console.error('   4. Agrega las variables faltantes:');
    missingVars.forEach(v => console.error(`      - ${v}=tu_valor`));
    console.error('   5. Guarda y redeploy automático\n');
  } else if (isVercel) {
    console.error('💡 SOLUCIÓN PARA VERCEL:');
    console.error('   1. Ve a: https://vercel.com/dashboard');
    console.error('   2. Selecciona tu proyecto');
    console.error('   3. Ve a: Settings > Environment Variables');
    console.error('   4. Agrega las variables faltantes:');
    missingVars.forEach(v => console.error(`      - ${v}=tu_valor`));
    console.error('   5. Redeploy el proyecto\n');
  } else {
    console.error('💡 SOLUCIÓN LOCAL:');
    console.error('   1. Crea/edita archivo .env en la raíz del proyecto');
    console.error('   2. Agrega las variables faltantes:');
    missingVars.forEach(v => console.error(`      ${v}=tu_valor`));
    console.error('   3. Reinicia el servidor\n');
  }
  
  console.error('📖 Documentación de Wompi:');
  console.error('   https://docs.wompi.co/docs/en/inicio-integracion\n');
  
  // Solo salir en producción
  if (isProduction) {
    console.error('🚨 Deteniendo aplicación en PRODUCCIÓN por falta de credenciales');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  } else {
    console.warn('⚠️  CONTINUANDO EN DESARROLLO SIN CREDENCIALES');
    console.warn('⚠️  Los pagos NO funcionarán correctamente');
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}

// ============================================
// LOG DE CONFIGURACIÓN EXITOSA
// ============================================

if (missingVars.length === 0) {
  console.log('✅ Wompi configurado correctamente');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 Entorno Wompi:', wompiConfig.environment.toUpperCase());
  console.log('🌐 Modo:', isProduction ? 'PRODUCCIÓN' : 'DESARROLLO');
  console.log('🏠 Plataforma:', isRender ? 'Render' : isVercel ? 'Vercel' : 'Local');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔗 URLs configuradas:');
  console.log('   Base URL:', wompiConfig.baseUrl);
  console.log('   API Wompi:', wompiConfig.apiUrl);
  console.log('   Webhook:', wompiConfig.webhookUrl);
  console.log('   Redirect:', wompiConfig.redirectUrl);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Mostrar llaves parcialmente (seguridad)
  if (wompiConfig.publicKey) {
    const pubKey = wompiConfig.publicKey;
    console.log('🔑 Public Key:', pubKey.substring(0, 15) + '...' + pubKey.substring(pubKey.length - 5));
  }
  
  if (wompiConfig.privateKey) {
    console.log('🔐 Private Key:', '***************' + wompiConfig.privateKey.substring(wompiConfig.privateKey.length - 5));
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Verificar que la configuración está completa
 */
wompiConfig.isConfigured = function() {
  return !!(
    this.publicKey && 
    this.privateKey && 
    this.eventSecret && 
    this.integritySecret
  );
};

/**
 * Obtener headers para requests a Wompi
 */
wompiConfig.getHeaders = function() {
  return {
    'Authorization': `Bearer ${this.privateKey}`,
    'Content-Type': 'application/json'
  };
};

/**
 * Validar webhook signature
 */
wompiConfig.validateWebhookSignature = function(signature, payload) {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha256', this.eventSecret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return hash === signature;
};

/**
 * Generar signature para integridad de transacciones
 */
import crypto from 'crypto';

export const generateIntegritySignature = (reference, amountInCents, currency, integrityKey) => {
  const cadena = `${reference}${amountInCents}${currency}${integrityKey}`;
  return crypto.createHash('sha256').update(cadena).digest('hex');
};

// ============================================
// EXPORTAR CONFIGURACIÓN
// ============================================

export default wompiConfig;

// También exportar como CommonJS para compatibilidad
export const config = wompiConfig;