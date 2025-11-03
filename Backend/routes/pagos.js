import express from 'express';
import crypto from 'crypto';
import wompiConfig from '../config/wompi.js';

const router = express.Router();

// ============================================
// MIDDLEWARE: Verificar configuración de Wompi
// ============================================
function verificarConfigWompi(req, res, next) {
    if (!wompiConfig.isConfigured()) {
        return res.status(500).json({
            success: false,
            error: 'Wompi no está configurado correctamente'
        });
    }
    next();
}

// ============================================
// 1. ENDPOINT: Obtener configuración pública
// ============================================
router.get('/config', verificarConfigWompi, (req, res) => {
    try {
        console.log('📋 Solicitando configuración de Wompi');
        res.json({
            success: true,
            publicKey: wompiConfig.publicKey,
            apiUrl: wompiConfig.apiUrl,        
            environment: wompiConfig.environment,
            baseUrl: wompiConfig.baseUrl
        });
    } catch (error) {
        console.error('❌ Error en /config:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener configuración'
        });
    }
});

// ============================================
// 2. ENDPOINT: Obtener lista de bancos PSE
// ============================================
router.get('/bancos-pse', verificarConfigWompi, async (req, res) => {
    try {
        console.log('🏦 Solicitando lista de bancos PSE...');
        
        const url = `${wompiConfig.apiUrl}/pse/financial_institutions`;
        
        console.log('🔗 URL:', url);
        console.log('🔑 Public Key:', wompiConfig.publicKey.substring(0, 20) + '...');
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${wompiConfig.publicKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📊 Status de Wompi:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error de Wompi:', errorText);
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        const bancos = data.data || [];
        
        console.log(`✅ ${bancos.length} bancos obtenidos de Wompi`);
        
        res.json({
            success: true,
            banks: bancos,
            count: bancos.length
        });
        
    } catch (error) {
        console.error('❌ Error obteniendo bancos PSE:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener lista de bancos',
            message: error.message
        });
    }
});

// ============================================
// 3. ENDPOINT: Obtener acceptance token
// ============================================
router.get('/acceptance-token', verificarConfigWompi, async (req, res) => {
    try {
        console.log('📝 Obteniendo acceptance token...');
        
        const url = `${wompiConfig.apiUrl}/merchants/${wompiConfig.publicKey}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${wompiConfig.publicKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error obteniendo acceptance token:', errorText);
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        res.json({
            success: true,
            acceptanceToken: data.data?.presigned_acceptance?.acceptance_token,
            permalink: data.data?.presigned_acceptance?.permalink
        });
        
    } catch (error) {
        console.error('❌ Error en acceptance token:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener acceptance token',
            message: error.message
        });
    }
});

// ============================================
// 4. ENDPOINT: Crear transacción PSE
// ============================================
router.post('/crear-transaccion', verificarConfigWompi, async (req, res) => {
    try {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💳 CREANDO TRANSACCIÓN PSE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📦 Datos recibidos:', JSON.stringify(req.body, null, 2));
        
        const {
            acceptance_token,
            amount_in_cents,
            currency = 'COP',
            customer_email,
            payment_method,
            redirect_url,
            reference,
            customer_data
        } = req.body;

        // ============================================
        // VALIDACIONES EXHAUSTIVAS
        // ============================================
        
        const errores = [];
        
        if (!acceptance_token) errores.push('acceptance_token es requerido');
        if (!amount_in_cents) errores.push('amount_in_cents es requerido');
        if (!customer_email) errores.push('customer_email es requerido');
        if (!reference) errores.push('reference es requerido');
        
        // Validar payment_method
        if (!payment_method) {
            errores.push('payment_method es requerido');
        } else {
            if (payment_method.type !== 'PSE') {
                errores.push('payment_method.type debe ser "PSE"');
            }
            if (!payment_method.user_type) {
                errores.push('payment_method.user_type es requerido (0=Persona, 1=Empresa)');
            }
            if (!payment_method.user_legal_id_type) {
                errores.push('payment_method.user_legal_id_type es requerido (CC, CE, NIT, etc.)');
            }
            if (!payment_method.user_legal_id) {
                errores.push('payment_method.user_legal_id es requerido');
            }
            if (!payment_method.financial_institution_code) {
                errores.push('payment_method.financial_institution_code es requerido');
            }
        }
        
        if (errores.length > 0) {
            console.error('❌ Errores de validación:', errores);
            return res.status(400).json({
                success: false,
                error: 'Datos inválidos',
                errores: errores
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customer_email)) {
            return res.status(400).json({
                success: false,
                error: 'Email inválido',
                errores: ['customer_email debe ser un email válido']
            });
        }

        // Validar monto
        const amount = parseInt(amount_in_cents);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Monto inválido',
                errores: ['amount_in_cents debe ser un número positivo']
            });
        }

        // ============================================
        // GENERAR FIRMA DE INTEGRIDAD
        // ============================================
        
        const integrityKey = wompiConfig.integrityKey;
        
        if (!integrityKey) {
            console.error('❌ WOMPI_INTEGRITY_SECRET no está configurado');
            return res.status(500).json({
                success: false,
                error: 'Configuración de Wompi incompleta'
            });
        }
        
        const cadena = `${reference}${amount}${currency}${integrityKey}`;
        const signature = crypto.createHash('sha256').update(cadena).digest('hex');

        console.log('🔐 Generando firma:');
        console.log('   Referencia:', reference);
        console.log('   Monto:', amount);
        console.log('   Moneda:', currency);
        console.log('   Firma:', signature);

        // ============================================
        // PREPARAR PAYLOAD PARA WOMPI
        // ============================================
        
        const wompiPayload = {
            acceptance_token,
            amount_in_cents: amount,
            currency,
            customer_email,
            payment_method: {
                type: 'PSE',
                user_type: payment_method.user_type.toString(),
                user_legal_id_type: payment_method.user_legal_id_type,
                user_legal_id: payment_method.user_legal_id,
                financial_institution_code: payment_method.financial_institution_code,
                payment_description: payment_method.payment_description || 'Compra en línea'
            },
            redirect_url: redirect_url || wompiConfig.redirectUrl,
            reference: reference,
            customer_data: customer_data || {
                phone_number: '',
                full_name: customer_email.split('@')[0]
            },
            signature: {
                integrity: signature
            }
        };

        console.log('📤 Payload para Wompi:', JSON.stringify(wompiPayload, null, 2));

        // ============================================
        // CREAR TRANSACCIÓN EN WOMPI
        // ============================================
        
        const wompiUrl = `${wompiConfig.apiUrl}/transactions`;
        console.log('🌐 URL Wompi:', wompiUrl);
        
        const wompiResponse = await fetch(wompiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${wompiConfig.publicKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(wompiPayload)
        });

        const responseData = await wompiResponse.json();

        console.log('📥 Respuesta Wompi:');
        console.log('   Status:', wompiResponse.status);
        console.log('   Data:', JSON.stringify(responseData, null, 2));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // ============================================
        // MANEJAR RESPUESTA
        // ============================================
        
        if (!wompiResponse.ok) {
            console.error('❌ ERROR DE WOMPI:', responseData);
            
            let errorMessage = 'Error al crear transacción';
            let errorDetails = [];
            
            if (responseData.error) {
                errorMessage = responseData.error.type || responseData.error.reason || errorMessage;
                
                if (responseData.error.messages) {
                    errorDetails = Object.values(responseData.error.messages).flat();
                } else if (responseData.error.messages_list) {
                    errorDetails = responseData.error.messages_list;
                }
            }
            
            return res.status(wompiResponse.status).json({
                success: false,
                error: errorMessage,
                details: errorDetails,
                rawError: responseData
            });
        }

        // ============================================
        // RESPUESTA EXITOSA
        // ============================================
        
        console.log('✅ TRANSACCIÓN CREADA');
        
        res.json({
            success: true,
            data: responseData.data,
            transactionId: responseData.data?.id,
            paymentUrl: responseData.data?.payment_link_url || responseData.data?.async_payment_url,
            reference: responseData.data?.reference,
            status: responseData.data?.status
        });

    } catch (error) {
        console.error('❌ Error creando transacción:', error);
        console.error('Stack:', error.stack);
        
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// ============================================
// 5. ENDPOINT: Consultar transacción
// ============================================
router.get('/transaccion/:transactionId', verificarConfigWompi, async (req, res) => {
    try {
        const { transactionId } = req.params;
        
        console.log('🔍 Consultando transacción:', transactionId);
        
        const response = await fetch(`${wompiConfig.apiUrl}/transactions/${transactionId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${wompiConfig.publicKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        
        res.json({
            success: true,
            data: data.data
        });

    } catch (error) {
        console.error('❌ Error consultando transacción:', error);
        res.status(500).json({
            success: false,
            error: 'Error al consultar transacción',
            message: error.message
        });
    }
});

// ============================================
// 6. ENDPOINT: Webhook de Wompi
// ============================================
router.post('/webhook', async (req, res) => {
    try {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔔 WEBHOOK RECIBIDO');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const signature = req.headers['x-signature'];
        const event = req.body;
        
        console.log('📋 Signature:', signature);
        console.log('📦 Event:', JSON.stringify(event, null, 2));
        
        // Validar firma si existe
        if (wompiConfig.eventSecret && signature) {
            const isValid = wompiConfig.validateWebhookSignature(signature, event);
            
            if (!isValid) {
                console.error('❌ Firma inválida');
                return res.status(401).json({ success: false, error: 'Firma inválida' });
            }
            
            console.log('✅ Firma válida');
        }
        
        // Procesar evento
        if (event.event === 'transaction.updated') {
            const transaction = event.data.transaction;
            console.log('📊 Transacción actualizada:');
            console.log('   ID:', transaction.id);
            console.log('   Estado:', transaction.status);
            console.log('   Referencia:', transaction.reference);
            
            // TODO: Actualizar base de datos aquí
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        res.status(200).json({ received: true });
        
    } catch (error) {
        console.error('❌ Error en webhook:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;