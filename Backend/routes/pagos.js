import express from 'express';
import crypto from 'crypto';
import wompiConfig from '../config/wompi.js';
import db from '../db.js';

const router = express.Router();

// ============================================
// MIDDLEWARE: Verificar configuración de Wompi
// ============================================
const verificarConfigWompi = (req, res, next) => {
    if (!wompiConfig.privateKey || !wompiConfig.publicKey) {
        return res.status(500).json({
            success: false,
            error: 'Configuración de Wompi no disponible'
        });
    }
    next();
};

// ============================================
// 1. ENDPOINT: Obtener configuración pública
// ============================================
router.get('/config', (req, res) => {
    try {
        console.log('📋 Solicitando configuración para Widget Wompi');
        res.json({
            success: true,
            publicKey: wompiConfig.publicKey,
            environment: wompiConfig.environment,
            baseUrl: wompiConfig.baseUrl,
            currency: 'COP',
            phoneNumberPrefix: '+57',
            country: 'CO'
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
// 2. ENDPOINT: Generar transacción con signature - CORREGIDO
// ============================================
router.post('/generar-transaccion', verificarConfigWompi, async (req, res) => {
    try {
        const { 
            monto, 
            emailCliente, 
            nombreCliente, 
            telefonoCliente,
            documentoCliente,
            tipoDocumento = 'CC'
        } = req.body;

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('💰 GENERANDO TRANSACCIÓN CON SIGNATURE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 Datos recibidos:');
        console.log('   Monto:', monto, 'COP');
        console.log('   Email:', emailCliente);
        console.log('   Nombre:', nombreCliente);
        console.log('   Teléfono:', telefonoCliente);
        console.log('   Documento:', documentoCliente, '-', tipoDocumento);
        
        // Validar datos requeridos
        if (!monto || !emailCliente || !nombreCliente || !telefonoCliente || !documentoCliente) {
            console.error('❌ Faltan datos requeridos');
            return res.status(400).json({
                success: false,
                error: 'Faltan datos requeridos: monto, email, nombre, teléfono y documento son obligatorios'
            });
        }

        // Validar que el monto sea válido
        if (isNaN(monto) || monto <= 0) {
            console.error('❌ Monto inválido:', monto);
            return res.status(400).json({
                success: false,
                error: 'El monto debe ser un número mayor a 0'
            });
        }

        // Generar referencia única
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substr(2, 9);
        const referencia = `SUPER-${timestamp}-${randomStr}`;
        
        // Convertir monto a centavos (Wompi requiere el monto en centavos)
        const amountInCents = Math.round(monto * 100);

        console.log('📦 Datos de la transacción:');
        console.log('   Referencia:', referencia);
        console.log('   Monto original:', monto, 'COP');
        console.log('   Monto en centavos:', amountInCents);

        // ✅ GENERAR SIGNATURE CORRECTAMENTE
        // La signature debe generarse con la integrityKey, NO con eventSecret
        const signature = generateSignature(
            referencia, 
            amountInCents, 
            'COP', 
            wompiConfig.integrityKey
        );

        if (!signature) {
            throw new Error('No se pudo generar la signature');
        }

        console.log('🔐 Signature generado exitosamente');
        console.log('   Signature:', signature.substring(0, 30) + '...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Responder al frontend con todos los datos necesarios
        res.json({
            success: true,
            data: {
                referencia: referencia,
                publicKey: wompiConfig.publicKey,
                amountInCents: amountInCents,
                signature: signature,
                currency: 'COP',
                customerEmail: emailCliente,
                customerName: nombreCliente,
                customerPhone: telefonoCliente,
                customerLegalId: documentoCliente,
                customerLegalIdType: tipoDocumento,
                redirectUrl: `${process.env.FRONTEND_URL || 'https://proyecto-mercado-web.onrender.com'}/confir_pago.html?reference=${referencia}`
            }
        });

    } catch (error) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ ERROR GENERANDO TRANSACCIÓN');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        res.status(500).json({
            success: false,
            error: 'Error al generar transacción',
            message: error.message
        });
    }
});

// ============================================
// 3. ENDPOINT: Buscar transacción por referencia
// ============================================
router.get('/buscar-por-referencia/:reference', verificarConfigWompi, async (req, res) => {
    try {
        const { reference } = req.params;
        
        console.log('🔍 Buscando transacción por referencia:', reference);
        
        const response = await fetch(`${wompiConfig.apiUrl}/transactions?reference=${reference}`, {
            method: 'GET',
            headers: wompiConfig.getHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error de Wompi:', errorText);
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        let transaccionEncontrada = null;
        
        if (data.data && data.data.length > 0) {
            transaccionEncontrada = data.data.find(tx => tx.reference === reference);
            console.log(`✅ Transacción encontrada:`, transaccionEncontrada?.id || 'N/A');
        } else {
            console.log('⚠️ No se encontraron transacciones');
        }

        res.json({
            success: true,
            data: transaccionEncontrada,
            metadata: {
                totalTransacciones: data.data ? data.data.length : 0,
                referenciaBuscada: reference,
                encontrada: !!transaccionEncontrada
            }
        });

    } catch (error) {
        console.error('❌ Error buscando por referencia:', error);
        res.status(500).json({
            success: false,
            error: 'Error al buscar transacción por referencia',
            message: error.message,
            referencia: req.params.reference
        });
    }
});

// ============================================
// 4. ENDPOINT: Webhook de Wompi
// ============================================
router.post('/webhook', async (req, res) => {
    try {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔔 WEBHOOK RECIBIDO DE WOMPI');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const signature = req.headers['x-signature'];
        const event = req.body;
        
        console.log('📋 Evento:', event.event);
        console.log('📋 Timestamp:', event.timestamp);
        
        // Validar firma del webhook si existe
        if (wompiConfig.eventSecret && signature) {
            const isValid = wompiConfig.validateWebhookSignature(signature, event);
            
            if (!isValid) {
                console.error('❌ Firma del webhook inválida');
                return res.status(401).json({ 
                    success: false, 
                    error: 'Firma inválida' 
                });
            }
            console.log('✅ Firma del webhook válida');
        }
        
        // Procesar evento de actualización de transacción
        if (event.event === 'transaction.updated') {
            const transaction = event.data.transaction;
            
            console.log('💳 Detalles de la transacción:');
            console.log('   ID Wompi:', transaction.id);
            console.log('   Estado:', transaction.status);
            console.log('   Referencia:', transaction.reference);
            console.log('   Monto:', transaction.amount_in_cents / 100, 'COP');
            console.log('   Método:', transaction.payment_method_type);
            console.log('   Email:', transaction.customer_email);
            
            // Actualizar estado del pedido en la base de datos
            const pedidoActualizado = await actualizarEstadoPedido(transaction);
            
            if (pedidoActualizado) {
                console.log('✅ Pedido actualizado en BD:', pedidoActualizado.id);
                
                // Si el pago fue aprobado, enviar email de confirmación
                if (transaction.status === 'APPROVED') {
                    console.log('📧 Enviando email de confirmación...');
                    await enviarEmailConfirmacion(transaction, pedidoActualizado);
                }
            } else {
                console.log('⚠️ No se pudo actualizar el pedido');
            }
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        // Siempre responder 200 a Wompi
        res.status(200).json({ received: true });
        
    } catch (error) {
        console.error('❌ Error en webhook:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// ============================================
// 5. ENDPOINT: Consultar transacción por ID
// ============================================
router.get('/transaccion/:transactionId', verificarConfigWompi, async (req, res) => {
    try {
        const { transactionId } = req.params;
        
        console.log('🔍 Consultando transacción:', transactionId);
        
        const response = await fetch(`${wompiConfig.apiUrl}/transactions/${transactionId}`, {
            method: 'GET',
            headers: wompiConfig.getHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error de Wompi:', errorText);
            throw new Error(`Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        console.log('✅ Transacción consultada:', data.data?.status || 'N/A');
        
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
// 6. ENDPOINT: Verificar estado de pago
// ============================================
router.get('/verificar-estado/:reference', verificarConfigWompi, async (req, res) => {
    try {
        const { reference } = req.params;
        
        console.log('🔍 Verificando estado para referencia:', reference);
        
        const response = await fetch(`${wompiConfig.apiUrl}/transactions?reference=${reference}`, {
            method: 'GET',
            headers: wompiConfig.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        
        let transaccion = null;
        let estado = 'NO_ENCONTRADO';
        
        if (data.data && data.data.length > 0) {
            transaccion = data.data.find(tx => tx.reference === reference);
            
            if (transaccion) {
                estado = transaccion.status;
                console.log(`✅ Estado: ${estado}`);
            }
        }

        res.json({
            success: true,
            data: {
                transaccion,
                estado,
                referencia: reference,
                encontrado: !!transaccion,
                estadoLegible: mapearEstadoWompi(estado)
            }
        });

    } catch (error) {
        console.error('❌ Error verificando estado:', error);
        res.status(500).json({
            success: false,
            error: 'Error al verificar estado del pago',
            message: error.message
        });
    }
});

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Genera la signature de integridad para Wompi
 * CRITICAL: Debe usar integrityKey, NO eventSecret
 */
function generateSignature(reference, amountInCents, currency, integrityKey) {
    try {
        if (!integrityKey) {
            console.error('❌ CRITICAL: No hay integrityKey configurada');
            console.error('   Verifica que WOMPI_INTEGRITY_KEY esté en tus variables de entorno');
            throw new Error('Integrity key no configurada');
        }
        
        // ✅ FORMATO CORRECTO DE WOMPI
        // Concatenar: referencia + monto_en_centavos + moneda + llave_integridad
        const data = `${reference}${amountInCents}${currency}${integrityKey}`;
        
        console.log('🔐 Generando signature:');
        console.log('   Referencia:', reference);
        console.log('   Monto (centavos):', amountInCents);
        console.log('   Moneda:', currency);
        console.log('   Integrity Key:', integrityKey.substring(0, 15) + '...');
        
        // Generar hash SHA256
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        
        console.log('✅ Hash generado:', hash.substring(0, 30) + '...');
        
        return hash;
        
    } catch (error) {
        console.error('❌ Error generando signature:', error);
        throw error;
    }
}

/**
 * Actualiza el estado de un pedido en la base de datos
 */
async function actualizarEstadoPedido(transaction) {
    try {
        console.log('📊 Actualizando pedido en BD...');
        console.log('   Referencia:', transaction.reference);
        
        const estadoMapeado = mapearEstadoWompi(transaction.status);
        
        // Datos de la transacción en formato JSON
        const datosTransaccion = {
            id_transaccion_wompi: transaction.id,
            metodo_pago: transaction.payment_method_type,
            referencia_wompi: transaction.reference,
            monto_wompi: transaction.amount_in_cents / 100,
            email_cliente: transaction.customer_email || transaction.email,
            estado_wompi: transaction.status,
            fecha_actualizacion: new Date().toISOString(),
            datos_completos: transaction
        };
        
        // Query para actualizar
        const query = `
            UPDATE pedidos 
            SET 
                estado = $1,
                fecha_actualizacion = CURRENT_TIMESTAMP,
                datos_pago = $2
            WHERE id = $3
            RETURNING *;
        `;
        
        const values = [
            estadoMapeado,
            JSON.stringify(datosTransaccion),
            transaction.reference
        ];
        
        const result = await db.query(query, values);
        
        if (result.rows.length === 0) {
            console.log('⚠️ Pedido no encontrado, intentando crear...');
            return await crearPedidoDesdeTransaccion(transaction);
        }
        
        console.log('✅ Pedido actualizado:', result.rows[0].id);
        return result.rows[0];
        
    } catch (error) {
        console.error('❌ Error actualizando pedido:', error);
        return null;
    }
}

/**
 * Crea un pedido desde una transacción de Wompi
 */
async function crearPedidoDesdeTransaccion(transaction) {
    try {
        console.log('📝 Creando nuevo pedido desde transacción...');
        
        const estadoMapeado = mapearEstadoWompi(transaction.status);
        const datosTransaccion = {
            id_transaccion_wompi: transaction.id,
            metodo_pago: transaction.payment_method_type,
            referencia_wompi: transaction.reference,
            monto_wompi: transaction.amount_in_cents / 100,
            email_cliente: transaction.customer_email || transaction.email,
            datos_completos: transaction
        };
        
        const query = `
            INSERT INTO pedidos (
                id,
                total,
                estado,
                datos_pago,
                telefono_contacto,
                email_cliente,
                fecha_pedido,
                fecha_actualizacion
            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *;
        `;
        
        const values = [
            transaction.reference,
            transaction.amount_in_cents / 100,
            estadoMapeado,
            JSON.stringify(datosTransaccion),
            transaction.customer_phone || 'No especificado',
            transaction.customer_email || 'No especificado'
        ];
        
        const result = await db.query(query, values);
        console.log('✅ Nuevo pedido creado:', result.rows[0].id);
        return result.rows[0];
        
    } catch (error) {
        console.error('❌ Error creando pedido:', error);
        return null;
    }
}

/**
 * Envía email de confirmación (placeholder)
 */
async function enviarEmailConfirmacion(transaction, pedido) {
    try {
        console.log('📧 Preparando email de confirmación...');
        console.log('   Para:', transaction.customer_email);
        console.log('   Pedido:', pedido.id);
        console.log('   Monto:', (transaction.amount_in_cents / 100).toLocaleString('es-CO'), 'COP');
        
        // TODO: Implementar envío de email
        // Ejemplo con nodemailer:
        /*
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: transaction.customer_email,
            subject: `Confirmación de pago - Pedido ${pedido.id}`,
            html: `
                <h1>¡Pago confirmado!</h1>
                <p>Tu pedido ${pedido.id} ha sido procesado exitosamente.</p>
                <p>Monto: $${(transaction.amount_in_cents / 100).toLocaleString('es-CO')} COP</p>
            `
        });
        */
        
        console.log('✅ Email preparado (implementar envío real)');
        
    } catch (error) {
        console.error('❌ Error enviando email:', error);
    }
}

/**
 * Mapea estados de Wompi a estados internos
 */
function mapearEstadoWompi(estadoWompi) {
    const estados = {
        'PENDING': 'pendiente',
        'APPROVED': 'aprobado',
        'DECLINED': 'rechazado',
        'ERROR': 'error',
        'VOIDED': 'anulado',
        'NO_ENCONTRADO': 'no_encontrado'
    };
    return estados[estadoWompi] || 'desconocido';
}

export default router;