import { generateIntegritySignature } from '../config/wompi.js';

export const crearTransaccion = async (req, res) => {
  try {
    const { amount, reference, customerEmail, currency = 'COP' } = req.body;

    // Validaciones
    if (!amount || !reference || !customerEmail) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos requeridos'
      });
    }

    // Genera la firma de integridad
    const integritySignature = generateIntegritySignature(
      reference,
      amount,
      currency,
      process.env.WOMPI_INTEGRITY_KEY
    );

    // Crea la transacción en Wompi
    const wompiResponse = await fetch('https://production.wompi.co/v1/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WOMPI_PUBLIC_KEY}`
      },
      body: JSON.stringify({
        amount_in_cents: amount,
        currency: currency,
        customer_email: customerEmail,
        reference: reference,
        signature: {
          integrity: integritySignature
        }
      })
    });

    const data = await wompiResponse.json();

    if (!wompiResponse.ok) {
      return res.status(400).json({
        success: false,
        error: data.error?.reason || 'Error al crear la transacción'
      });
    }

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Error en crearTransaccion:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};