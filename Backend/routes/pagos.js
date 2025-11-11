import express from 'express';
import crypto from 'crypto';
import wompiConfig from '../config/wompi.js';

const router = express.Router();

// ============================================
// 1. ENDPOINT: Obtener configuración pública (MANTENER)
// ============================================
router.get('/config', (req, res) => {
    try {
        console.log('📋 Solicitando configuración para Widget Wompi');
        res.json({
            success: true,
            publicKey: wompiConfig.publicKey,
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
// 2. ENDPOINT: Webhook de Wompi (MANTENER Y MEJORAR)
// ============================================
router.post('/webhook', async (req, res) => {
    try {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔔 WEBHOOK RECIBIDO - WOMPI CHECKOUT');
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
            
            console.log('💰 Transacción actualizada:');
            console.log('   ID:', transaction.id);
            console.log('   Estado:', transaction.status);
            console.log('   Referencia:', transaction.reference);
            console.log('   Monto:', transaction.amount_in_cents);
            console.log('   Método:', transaction.payment_method_type);
            
            // ✅ ACTUALIZAR BASE DE DATOS AQUÍ
            await actualizarEstadoPedido(transaction);
            
            // ✅ ENVIAR EMAIL DE CONFIRMACIÓN si el pago es aprobado
            if (transaction.status === 'APPROVED') {
                await enviarEmailConfirmacion(transaction);
            }
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        res.status(200).json({ received: true });
        
    } catch (error) {
        console.error('❌ Error en webhook:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// 3. ENDPOINT: Consultar transacción (MANTENER)
// ============================================
router.get('/transaccion/:transactionId', async (req, res) => {
    try {
        const { transactionId } = req.params;
        
        console.log('🔍 Consultando transacción:', transactionId);
        
        const response = await fetch(`${wompiConfig.apiUrl}/transactions/${transactionId}`, {
            method: 'GET',
            headers: wompiConfig.getHeaders()
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
// FUNCIONES AUXILIARES PARA EL WEBHOOK
// ============================================

async function actualizarEstadoPedido(transaction) {
    try {
        // ✅ ACTUALIZAR TU BASE DE DATOS
        console.log('📊 Actualizando pedido en base de datos...');
        
        // Aquí tu lógica para actualizar el pedido
        // Ejemplo:
        // await Pedido.findByIdAndUpdate(
        //     { referencia: transaction.reference },
        //     { 
        //         estado: mapearEstadoWompi(transaction.status),
        //         idTransaccion: transaction.id,
        //         metodoPago: transaction.payment_method_type,
        //         fechaActualizacion: new Date()
        //     }
        // );
        
        console.log('✅ Pedido actualizado en base de datos');
        
    } catch (error) {
        console.error('❌ Error actualizando pedido:', error);
    }
}

async function enviarEmailConfirmacion(transaction) {
    try {
        // ✅ ENVIAR EMAIL DE CONFIRMACIÓN
        console.log('📧 Enviando email de confirmación...');
        
        // Aquí tu lógica para enviar email
        // Ejemplo:
        // await emailService.send({
        //     to: transaction.customer_email,
        //     subject: '¡Pago confirmado!',
        //     template: 'pago-exitoso',
        //     data: {
        //         referencia: transaction.reference,
        //         monto: (transaction.amount_in_cents / 100).toLocaleString('es-CO'),
        //         metodo: transaction.payment_method_type
        //     }
        // });
        
        console.log('✅ Email de confirmación enviado');
        
    } catch (error) {
        console.error('❌ Error enviando email:', error);
    }
}

function mapearEstadoWompi(estadoWompi) {
    const estados = {
        'PENDING': 'pendiente',
        'APPROVED': 'aprobado',
        'DECLINED': 'rechazado',
        'ERROR': 'error',
        'VOIDED': 'anulado'
    };
    return estados[estadoWompi] || 'desconocido';
}

export default router;