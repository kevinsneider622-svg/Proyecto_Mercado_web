// ============================================
// WOMPI.JS - BACKEND CONFIGURATION
// ============================================

import crypto from 'crypto';

// Cargar dotenv solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
  const dotenv = await import('dotenv');
  dotenv.config();
}

// ============================================
// DEBUG: Mostrar todas las variables de Wompi
// ============================================
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 DEBUG: Variables de entorno WOMPI');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('WOMPI_PUBLIC_KEY existe:', !!process.env.WOMPI_PUBLIC_KEY);
console.log('WOMPI_PRIVATE_KEY existe:', !!process.env.WOMPI_PRIVATE_KEY);
console.log('WOMPI_EVENT_SECRET existe:', !!process.env.WOMPI_EVENT_SECRET);
console.log('WOMPI_INTEGRITY_SECRET existe:', !!process.env.WOMPI_INTEGRITY_SECRET);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ============================================
// DETECCIÓN AUTOMÁTICA DE ENTORNO
// ============================================
const isProduction = process.env.NODE_ENV === 'production';
const hostname = process.env.HOSTNAME || '';
const isRender = hostname.includes('onrender.com') || !!process.env.RENDER_EXTERNAL_URL;

// ============================================
// DETERMINAR BASE_URL
// ============================================
let BASE_URL;

if (process.env.BASE_URL) {
  BASE_URL = process.env.BASE_URL;
} else if (isRender && process.env.RENDER_EXTERNAL_URL) {
} else {
  BASE_URL = 'http://127.0.0.1:3000';
}

// ============================================
// CONFIGURACIÓN PRINCIPAL DE WOMPI
// ============================================
const wompiConfig = {
  // Llaves principales
  publicKey: process.env.WOMPI_PUBLIC_KEY,
  privateKey: process.env.WOMPI_PRIVATE_KEY,
  
  // Secretos
  eventSecret: process.env.WOMPI_EVENT_SECRET,
  integritySecret: process.env.WOMPI_INTEGRITY_SECRET,
  
  // IMPORTANTE: Alias para compatibilidad
  integrityKey: process.env.WOMPI_INTEGRITY_SECRET,
  
  // URL de la API de Wompi
  apiUrl: process.env.WOMPI_ENV === 'production' 
    ? 'https://production.wompi.co/v1' 
    : 'https://sandbox.wompi.co/v1',
  
  // URL base de tu aplicación
  baseUrl: BASE_URL,
  API_BASE_URL: BASE_URL,
  
  // URL del webhook
  webhookUrl: process.env.WOMPI_WEBHOOK_URL || `${BASE_URL}/api/pagos/webhook`,
  
  // URLs de redirección
  redirectUrl: process.env.REDIRECT_URL || `${BASE_URL}/?payment=success`,
  cancelUrl: process.env.CANCEL_URL || `${BASE_URL}/?payment=cancelled`,
  
  // Información del entorno
  environment: process.env.WOMPI_ENV || 'sandbox',
  isProduction,
  isRender,
  
  // ============================================
  // MÉTODOS
  // ============================================
  
  isConfigured() {
    const required = {
      publicKey: this.publicKey,
      privateKey: this.privateKey,
      eventSecret: this.eventSecret,
      integritySecret: this.integritySecret
    };
    
    const missing = Object.keys(required).filter(key => !required[key]);
    
    if (missing.length > 0) {
      console.error('❌ Faltan estas variables:', missing);
      return false;
    }
    
    return true;
  },
  
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.privateKey}`,
      'Content-Type': 'application/json'
    };
  },
  
  validateWebhookSignature(signature, payload) {
    const hash = crypto
      .createHmac('sha256', this.eventSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return hash === signature;
  },
  
  generateIntegritySignature(reference, amountInCents, currency) {
    if (!this.integritySecret) {
      throw new Error('WOMPI_INTEGRITY_SECRET no está configurado');
    }
    
    const cadena = `${reference}${amountInCents}${currency}${this.integritySecret}`;
    return crypto.createHash('sha256').update(cadena).digest('hex');
  }
};

// ============================================
// VALIDACIONES
// ============================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 DEBUG: Configuración de Entorno');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📌 NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('📌 HOSTNAME:', hostname || 'local');
console.log('📌 RENDER_EXTERNAL_URL:', process.env.RENDER_EXTERNAL_URL || 'N/A');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('🔑 Estado de Variables de Wompi:');
console.log('   WOMPI_PUBLIC_KEY:', process.env.WOMPI_PUBLIC_KEY ? '✅ Existe' : '❌ Falta');
console.log('   WOMPI_PRIVATE_KEY:', process.env.WOMPI_PRIVATE_KEY ? '✅ Existe' : '❌ Falta');
console.log('   WOMPI_EVENT_SECRET:', process.env.WOMPI_EVENT_SECRET ? '✅ Existe' : '❌ Falta');
console.log('   WOMPI_INTEGRITY_SECRET:', process.env.WOMPI_INTEGRITY_SECRET ? '✅ Existe' : '❌ Falta');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Validar configuración
const missingVars = [];
if (!wompiConfig.publicKey) missingVars.push('WOMPI_PUBLIC_KEY');
if (!wompiConfig.privateKey) missingVars.push('WOMPI_PRIVATE_KEY');
if (!wompiConfig.eventSecret) missingVars.push('WOMPI_EVENT_SECRET');
if (!wompiConfig.integritySecret) missingVars.push('WOMPI_INTEGRITY_SECRET');

if (missingVars.length > 0) {
  console.error('\n❌ ERROR CRÍTICO: Variables de Wompi faltantes');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('📋 Variables faltantes:', missingVars.join(', '));
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (isRender) {
    console.error('💡 SOLUCIÓN PARA RENDER:');
    console.error('   1. Ve a: https://dashboard.render.com');
    console.error('   2. Selecciona tu proyecto');
    console.error('   3. Ve a: Environment > Environment Variables');
    console.error('   4. Agrega las variables faltantes');
    console.error('   5. Guarda (redeploy automático)\n');
  }
  
  if (isProduction) {
    console.error('🚨 Deteniendo aplicación en PRODUCCIÓN');
    process.exit(1);
  } else {
    console.warn('⚠️  CONTINUANDO EN DESARROLLO SIN CREDENCIALES');
  }
}

// Log de configuración exitosa
if (missingVars.length === 0) {
  console.log('✅ Wompi configurado correctamente');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 Entorno Wompi:', wompiConfig.environment.toUpperCase());
  console.log('🌐 Modo:', isProduction ? 'PRODUCCIÓN' : 'DESARROLLO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔗 URLs configuradas:');
  console.log('   Base URL:', wompiConfig.baseUrl);
  console.log('   API Wompi:', wompiConfig.apiUrl);
  console.log('   Webhook:', wompiConfig.webhookUrl);
  console.log('   Redirect:', wompiConfig.redirectUrl);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (wompiConfig.publicKey) {
    const pubKey = wompiConfig.publicKey;
    console.log('🔑 Public Key:', pubKey.substring(0, 15) + '...' + pubKey.substring(pubKey.length - 5));
  }
  
  if (wompiConfig.privateKey) {
    console.log('🔐 Private Key:', '***************' + wompiConfig.privateKey.substring(wompiConfig.privateKey.length - 5));
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// ============================================
// EXPORTAR
// ============================================
export const generateIntegritySignature = (reference, amountInCents, currency, integrityKey) => {
  const cadena = `${reference}${amountInCents}${currency}${integrityKey}`;
  return crypto.createHash('sha256').update(cadena).digest('hex');
};

export default wompiConfig;
export const config = wompiConfig;