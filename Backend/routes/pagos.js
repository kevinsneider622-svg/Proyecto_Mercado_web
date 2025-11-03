import express from 'express';
import axios from 'axios';
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
// GET /api/pagos/config
// ============================================


router.get('/config', verificarConfigWompi, (req, res) => {
 
  try{
 
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
// GET /api/pagos/bancos-pse
// ============================================
router.get('/bancos-pse', verificarConfigWompi, async (req, res) => {
    try {
        console.log('🏦 Solicitando lista de bancos PSE...');
        
        // URL del endpoint de Wompi para obtener bancos
        const url = `${wompiConfig.apiUrl}/pse/financial_institutions`;
        
        console.log('🔗 URL:', url);
        console.log('🔑 Public Key:', wompiConfig.publicKey.substring(0, 20) + '...');
        
        // Hacer request a Wompi
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
        
        // Wompi retorna los bancos en data.data
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
// 3. ENDPOINT: Crear transacción PSE
// POST /api/pagos/crear-transaccion
// ============================================
router.post('/crear-transaccion', verificarConfigWompi, async (req, res) => {
    try {
        console.log('💳 Creando transacción PSE...');
        console.log('📦 Datos recibidos:', JSON.stringify(req.body, null, 2));
        
        const {
            acceptance_token,
            amount,
            currency,
            customerEmail,
            reference,
            customerData
        } = req.body;
        
        // ============================================
        // VALIDACIONES
        // ============================================
        
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Monto inválido'
            });
        }
        
        if (!customerEmail) {
            return res.status(400).json({
                success: false,
                error: 'Email del cliente es requerido'
            });
        }
        
        if (!reference) {
            return res.status(400).json({
                success: false,
                error: 'Referencia de transacción es requerida'
            });
        }
        
        if (!customerData || !customerData.bankCode) {
            return res.status(400).json({
                success: false,
                error: 'Datos del cliente y banco son requeridos'
            });
        }
        
        // ============================================
        // PREPARAR PAYLOAD PARA WOMPI
        // ============================================
        
        // Convertir amount a centavos (Wompi trabaja en centavos)
        const amountInCents = Math.round(amount * 100);
        
        // Generar signature de integridad
        const integritySignature = wompiConfig.generateIntegritySignature(
            reference,
            amountInCents
        );
        
        console.log('🔐 Integrity Signature generada');
        
        // Construir payload según documentación de Wompi
        const wompiPayload = {
            acceptance_token: acceptance_token,
            amount_in_cents: amountInCents,
            currency: currency || 'COP',
            customer_email: customerEmail,
            reference: reference,
            signature: integritySignature,
            redirect_url: wompiConfig.redirectUrl,
            payment_method: {
                type: 'PSE',
                user_type: customerData.userType, // 0: Persona Natural, 1: Persona Jurídica
                user_legal_id_type: customerData.legalIdType, // CC, CE, NIT, PP
                user_legal_id: customerData.legalId,
                financial_institution_code: customerData.bankCode,
                payment_description: customerData.description || 'Compra en SuperMarket'
            }
        };
        
        console.log('📤 Payload para Wompi:', JSON.stringify({
            ...wompiPayload,
            signature: '***'
        }, null, 2));
        
        // ============================================
        // ENVIAR REQUEST A WOMPI
        // ============================================
        
        const url = `${wompiConfig.apiUrl}/transactions`;
        
        console.log('🔗 URL de Wompi:', url);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${wompiConfig.publicKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(wompiPayload)
        });
        
        console.log('📊 Status de Wompi:', response.status);
        
        const responseText = await response.text();
        
        // Intentar parsear como JSON
        let wompiResponse;
        try {
            wompiResponse = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ Respuesta de Wompi no es JSON:', responseText);
            throw new Error('Respuesta inválida de Wompi');
        }
        
        console.log('📥 Respuesta de Wompi:', JSON.stringify(wompiResponse, null, 2));
        
        // ============================================
        // PROCESAR RESPUESTA
        // ============================================
        
        if (!response.ok) {
            // Wompi retornó error
            const errorMessage = wompiResponse.error?.reason || 
                                wompiResponse.error?.messages?.join(', ') || 
                                'Error desconocido de Wompi';
            
            console.error('❌ Error de Wompi:', errorMessage);
            
            return res.status(response.status).json({
                success: false,
                error: errorMessage,
                wompiResponse: wompiResponse
            });
        }
        
        // Transacción creada exitosamente
        console.log('✅ Transacción creada exitosamente');
        console.log('   ID:', wompiResponse.data?.id);
        console.log('   Status:', wompiResponse.data?.status);
        console.log('   Reference:', wompiResponse.data?.reference);
        
        // Verificar que haya URL de redirección
        const paymentUrl = wompiResponse.data?.payment_method?.extra?.async_payment_url;
        
        if (!paymentUrl) {
            console.warn('⚠️  No se recibió URL de pago de PSE');
        } else {
            console.log('🔗 URL de pago PSE:', paymentUrl);
        }
        
        // ============================================
        // OPCIONAL: Guardar transacción en base de datos
        // ============================================
        
        // TODO: Aquí puedes guardar la transacción en tu base de datos
        // await db.transactions.create({
        //     wompi_id: wompiResponse.data.id,
        //     reference: reference,
        //     amount: amount,
        //     status: wompiResponse.data.status,
        //     customer_email: customerEmail,
        //     created_at: new Date()
        // });
        
        // ============================================
        // RETORNAR RESPUESTA AL FRONTEND
        // ============================================
        
        res.json({
            success: true,
            data: wompiResponse,
            message: 'Transacción creada exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error creando transacción:', error);
        
        res.status(500).json({
            success: false,
            error: 'Error al crear transacción',
            message: error.message
        });
    }
});

// ============================================
// 4. ENDPOINT: Webhook de Wompi (opcional pero recomendado)
// POST /api/pagos/webhook
// ============================================
router.post('/webhook', async (req, res) => {
    try {
        console.log('🪝 Webhook recibido de Wompi');
        console.log('📦 Payload:', JSON.stringify(req.body, null, 2));
        
        const signature = req.headers['x-event-signature'];
        const payload = req.body;
        
        // Validar signature
        if (!wompiConfig.validateWebhookSignature(signature, payload)) {
            console.error('❌ Signature inválida en webhook');
            return res.status(401).json({
                success: false,
                error: 'Signature inválida'
            });
        }
        
        console.log('✅ Signature válida');
        
        const event = payload.event;
        const transaction = payload.data?.transaction;
        
        console.log('📋 Evento:', event);
        console.log('💳 Transacción:', transaction?.id);
        console.log('📊 Status:', transaction?.status);
        
        // Procesar según el evento
        switch (event) {
            case 'transaction.updated':
                console.log('🔄 Transacción actualizada');
                
                // TODO: Actualizar estado en tu base de datos
                // await db.transactions.update({
                //     wompi_id: transaction.id
                // }, {
                //     status: transaction.status,
                //     updated_at: new Date()
                // });
                
                break;
                
            case 'transaction.approved':
                console.log('✅ Transacción aprobada');
                
                // TODO: Marcar pedido como pagado
                // TODO: Enviar email de confirmación
                // TODO: Actualizar inventario
                
                break;
                
            case 'transaction.declined':
                console.log('❌ Transacción rechazada');
                
                // TODO: Notificar al usuario
                
                break;
                
            default:
                console.log('ℹ️  Evento no manejado:', event);
        }
        
        // Siempre responder 200 OK a Wompi
        res.status(200).json({
            success: true,
            message: 'Webhook procesado'
        });
        
    } catch (error) {
        console.error('❌ Error procesando webhook:', error);
        
        // Siempre responder 200 para que Wompi no reintente
        res.status(200).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// 5. ENDPOINT: Consultar estado de transacción
// GET /api/pagos/transaccion/:id
// ============================================
router.get('/transaccion/:id', verificarConfigWompi, async (req, res) => {
    try {
        const transactionId = req.params.id;
        
        console.log('🔍 Consultando transacción:', transactionId);
        
        const url = `${wompiConfig.apiUrl}/transactions/${transactionId}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${wompiConfig.publicKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('✅ Transacción consultada:', data.data?.status);
        
        res.json({
            success: true,
            data: data
        });
        
    } catch (error) {
        console.error('❌ Error consultando transacción:', error);
        
        res.status(500).json({
            success: false,
            error: 'Error al consultar transacción'
        });
    }
});

// ============================================
// EXPORTAR ROUTER
// ============================================

export default router;