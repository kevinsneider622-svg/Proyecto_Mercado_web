import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import wompiConfig from '../config/wompi.js';
import {crearTransaccion} from '../controllers/pagosController.js';
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
            amount_in_cents,
            currency = 'COP',
            customer_email,
            payment_method,
            redirect_url,
            reference,
            customer_data
        } = req.body;

        // ============================================
        // VALIDACIONES
        // ============================================
        
        if (!amount_in_cents || !customer_email || !reference) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: amount_in_cents, customer_email, reference'
            });
        }

        if (!payment_method?.type || payment_method.type !== 'PSE') {
            return res.status(400).json({
                success: false,
                error: 'payment_method.type debe ser "PSE"'
            });
        }

        // ============================================
        // GENERAR FIRMA DE INTEGRIDAD
        // ============================================
        
        // Ahora wompiConfig.integrityKey existe ✅
        const integrityKey = wompiConfig.integrityKey;
        const cadena = `${reference}${amount_in_cents}${currency}${integrityKey}`;
        const signature = crypto.createHash('sha256').update(cadena).digest('hex');

        console.log('🔐 Cadena:', cadena);
        console.log('🔐 Firma generada:', signature);

        // ============================================
        // PREPARAR PAYLOAD PARA WOMPI
        // ============================================
        
        const wompiPayload = {
            acceptance_token,
            amount_in_cents: parseInt(amount_in_cents),
            currency,
            customer_email,
            payment_method: {
                type: 'PSE',
                user_type: payment_method.user_type || '0',
                user_legal_id_type: payment_method.user_legal_id_type || 'CC',
                user_legal_id: payment_method.user_legal_id,
                financial_institution_code: payment_method.financial_institution_code,
                payment_description: payment_method.payment_description || 'Compra en línea'
            },
            redirect_url: redirect_url || wompiConfig.redirectUrl,
            reference,
            customer_data: customer_data || {
                phone_number: '',
                full_name: ''
            },
            signature: {
                integrity: signature
            }
        };

        console.log('📤 Enviando a Wompi:', JSON.stringify(wompiPayload, null, 2));

        // ============================================
        // CREAR TRANSACCIÓN EN WOMPI
        // ============================================
        
        const wompiResponse = await fetch(`${wompiConfig.apiUrl}/transactions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${wompiConfig.publicKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(wompiPayload)
        });

        const responseData = await wompiResponse.json();

        console.log('📥 Respuesta de Wompi:', JSON.stringify(responseData, null, 2));
        console.log('📊 Status Code:', wompiResponse.status);

        // ============================================
        // MANEJAR RESPUESTA DE WOMPI
        // ============================================
        
        if (!wompiResponse.ok) {
            console.error('❌ Error de Wompi:', responseData);
            return res.status(wompiResponse.status).json({
                success: false,
                error: responseData.error?.type || 'Error al crear transacción',
                message: responseData.error?.messages_list || responseData.error?.reason,
                details: responseData
            });
        }

        // Respuesta exitosa
        console.log('✅ Transacción creada exitosamente');
        
        res.json({
            success: true,
            data: responseData.data,
            transactionId: responseData.data?.id,
            paymentUrl: responseData.data?.payment_link_url || responseData.data?.async_payment_url,
            reference: responseData.data?.reference,
            status: responseData.data?.status
        });

    } catch (error) {
        console.error('❌ Error creando transacción PSE:', error);
        console.error('Stack trace:', error.stack);
        
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

export default router;