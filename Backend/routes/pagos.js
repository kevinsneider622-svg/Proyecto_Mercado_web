import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import wompiConfig from '../config/wompi.js';

const router = express.Router();

// Obtener llave pública
router.get('/config', (req, res) => {
  res.json({
    publicKey: wompiConfig.publicKey
  });
});

// Crear transacción PSE
router.post('/crear-transaccion', async (req, res) => {
  try {
    const {
      amount,
      currency,
      customerEmail,
      reference,
      customerData
    } = req.body;

    // Validaciones
    if (!amount || !customerEmail || !reference) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios'
      });
    }

    // Crear la transacción en Wompi
    const transactionData = {
      acceptance_token: req.body.acceptance_token,
      amount_in_cents: Math.round(amount * 100), // Convertir a centavos
      currency: currency || 'COP',
      customer_email: customerEmail,
      payment_method: {
        type: 'PSE',
        user_type: customerData.userType, // 0 = Persona Natural, 1 = Persona Jurídica
        user_legal_id_type: customerData.legalIdType, // CC, CE, NIT, etc.
        user_legal_id: customerData.legalId,
        financial_institution_code: customerData.bankCode,
        payment_description: customerData.description || 'Pago mediante PSE'
      },
      reference: reference,
      redirect_url: `${wompiConfig.baseUrl}/confirmacion-pago.html`
    };

    // Generar firma de integridad
    const integritySignature = generateIntegritySignature(
      reference,
      transactionData.amount_in_cents,
      transactionData.currency
    );

    transactionData.signature = {
      integrity: integritySignature
    };

    // Hacer petición a Wompi
    const response = await axios.post(
      `${wompiConfig.apiUrl}/transactions`,
      transactionData,
      {
        headers: {
          'Authorization': `Bearer ${wompiConfig.privateKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Error al crear transacción:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Error al procesar la transacción',
      details: error.response?.data || error.message
    });
  }
});

// Consultar estado de transacción
router.get('/transaccion/:id', async (req, res) => {
  try {
    const response = await axios.get(
      `${wompiConfig.apiUrl}/transactions/${req.params.id}`,
      {
        headers: {
          'Authorization': `Bearer ${wompiConfig.publicKey}`
        }
      }
    );

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Error al consultar transacción:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Error al consultar la transacción',
      details: error.response?.data || error.message
    });
  }
});

// Obtener lista de bancos PSE
router.get('/bancos-pse', async (req, res) => {
  try {
    const response = await axios.get(
      `${wompiConfig.apiUrl}/pse/financial_institutions`,
      {
        headers: {
          'Authorization': `Bearer ${wompiConfig.publicKey}`
        }
      }
    );

    res.json({
      success: true,
      banks: response.data.data
    });

  } catch (error) {
    console.error('Error al obtener bancos:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Error al obtener lista de bancos',
      details: error.response?.data || error.message
    });
  }
});

// Webhook para recibir notificaciones de Wompi
router.post('/webhook', (req, res) => {
  try {
    const event = req.body;
    
    // Verificar firma del webhook
    const signature = req.headers['x-wompi-signature'];
    if (!verifyWebhookSignature(event, signature)) {
      return res.status(401).json({ error: 'Firma inválida' });
    }

    // Procesar según el tipo de evento
    console.log('Evento recibido:', event.event);
    console.log('Datos:', event.data);

    switch (event.event) {
      case 'transaction.updated':
        // Aquí actualizarías tu base de datos con el estado del pago
        console.log('Transacción actualizada:', event.data.transaction);
        break;
      
      default:
        console.log('Evento no manejado:', event.event);
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Error en webhook:', error);
    res.status(500).json({ error: 'Error al procesar webhook' });
  }
});

// Función para generar firma de integridad
function generateIntegritySignature(reference, amountInCents, currency) {
  const data = `${reference}${amountInCents}${currency}${wompiConfig.privateKey}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Función para verificar firma del webhook
function verifyWebhookSignature(event, signature) {
  // Implementar verificación según documentación de Wompi
  return true; // Por ahora devolvemos true, implementar verificación real
}

export default router;