// ============================================
// WOMPI.JS - FRONTEND (Widget de Wompi) - CORREGIDO
// ============================================

// ============================================
// VARIABLES GLOBALES
// ============================================
let wompiPublicKey = '';
let compraInfo = null;

// ============================================
// ELEMENTOS DEL DOM
// ============================================
const form = document.getElementById('customerForm');
const wompiButton = document.getElementById('wompi-button');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');

// ============================================
// CARGAR CONFIGURACIÓN DE WOMPI
// ============================================
async function loadWompiConfig() {
    try {
        console.log('🔑 Cargando configuración de Wompi...');
        
        const response = await fetch('/api/pagos/config');
        const data = await response.json();
        
        if (!data.success) {
            throw new Error('Error en respuesta del servidor');
        }
        
        wompiPublicKey = data.publicKey;
        
        console.log('✅ Configuración de Wompi cargada');
        console.log('   Public Key:', wompiPublicKey.substring(0, 20) + '...');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error cargando configuración:', error);
        mostrarError('Error al inicializar el sistema de pagos.');
        return false;
    }
}

// ============================================
// CARGAR RESUMEN DE COMPRA
// ============================================
function cargarResumenCompra() {
    try {
        compraInfo = JSON.parse(localStorage.getItem('compra_pendiente'));
        
        if (!compraInfo || !compraInfo.items || !compraInfo.total) {
            throw new Error('No hay información de compra válida');
        }
        
        console.log('✅ Información de compra cargada');
        console.log('   Total:', compraInfo.total, 'COP');
        
        // Actualizar display del monto
        const displayAmount = document.getElementById('displayAmount');
        if (displayAmount) {
            displayAmount.textContent = compraInfo.total.toLocaleString('es-CO');
        }
        
        // Mostrar resumen de productos
        mostrarResumenProductos();
        
        return true;
        
    } catch (error) {
        console.error('❌ Error cargando compra:', error);
        mostrarError('Error al cargar información de la compra');
        return false;
    }
}

// ============================================
// MOSTRAR RESUMEN DE PRODUCTOS
// ============================================
function mostrarResumenProductos() {
    try {
        const container = document.getElementById('resumenProductos');
        if (!container) return;
        
        const html = `
            <div class="resumen-compra">
                <h3><i class="fas fa-shopping-bag"></i> Resumen de tu pedido</h3>
                ${compraInfo.items.map(item => `
                    <div class="item-compra">
                        <span>${item.nombre} <small>(x${item.cantidad})</small></span>
                        <strong>$${(item.precio * item.cantidad).toLocaleString('es-CO')}</strong>
                    </div>
                `).join('')}
                <div class="item-compra">
                    <span>TOTAL</span>
                    <span>$${compraInfo.total.toLocaleString('es-CO')} COP</span>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('❌ Error mostrando resumen:', error);
    }
}

// ============================================
// GENERAR TRANSACCIÓN CON SIGNATURE - CORREGIDO
// ============================================
async function generarTransaccionConSignature() {
    try {
        // Obtener datos del formulario
        const customerEmail = document.getElementById('customerEmail').value;
        const customerName = document.getElementById('customerName').value;
        const customerPhone = document.getElementById('customerPhone').value;
        const customerLegalId = document.getElementById('customerLegalId').value;
        const customerLegalIdType = document.getElementById('customerLegalIdType').value;

        // Validar campos
        if (!customerEmail || !customerName || !customerPhone || !customerLegalId || !customerLegalIdType) {
            mostrarError('Por favor completa todos los campos');
            return null;
        }

        console.log('🔐 Solicitando transacción con signature al backend...');
        
        setLoading(true);

        // ✅ SOLICITAR AL BACKEND QUE GENERE LA SIGNATURE
        const response = await fetch('/api/pagos/generar-transaccion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                monto: compraInfo.total,
                emailCliente: customerEmail,
                nombreCliente: customerName,
                telefonoCliente: customerPhone,
                documentoCliente: customerLegalId,
                tipoDocumento: customerLegalIdType
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Error generando transacción');
        }

        console.log('✅ Transacción generada:', {
            referencia: data.data.referencia,
            signature: data.data.signature?.substring(0, 20) + '...',
            monto: data.data.amountInCents / 100
        });

        setLoading(false);
        return data.data;

    } catch (error) {
        console.error('❌ Error generando transacción:', error);
        mostrarError('Error: ' + error.message);
        setLoading(false);
        return null;
    }
}

// ============================================
// CREAR WIDGET DE WOMPI - CORREGIDO
// ============================================
async function crearWompiWidget() {
    try {
        // Generar transacción con signature desde el backend
        const transaccionData = await generarTransaccionConSignature();
        
        if (!transaccionData) {
            return false;
        }

        console.log('🎯 Creando widget Wompi con signature');

        // Limpiar contenedor anterior
        const container = document.getElementById('wompiButtonContainer');
        if (!container) {
            throw new Error('Contenedor del widget no encontrado');
        }
        
        container.innerHTML = '';

        // ✅ CREAR ELEMENTO SCRIPT CON SIGNATURE
        const wompiScript = document.createElement('script');
        wompiScript.src = 'https://checkout.wompi.co/widget.js';
        wompiScript.setAttribute('data-render', 'button');
        wompiScript.setAttribute('data-public-key', transaccionData.publicKey);
        wompiScript.setAttribute('data-currency', transaccionData.currency);
        wompiScript.setAttribute('data-amount-in-cents', transaccionData.amountInCents.toString());
        wompiScript.setAttribute('data-reference', transaccionData.referencia);
        
        // ⚠️ CRITICAL: Signature de integridad
        wompiScript.setAttribute('data-signature:integrity', transaccionData.signature);
        
        wompiScript.setAttribute('data-redirect-url', transaccionData.redirectUrl);
        
        // Datos del cliente
        wompiScript.setAttribute('data-customer-data:email', transaccionData.customerEmail);
        wompiScript.setAttribute('data-customer-data:full-name', transaccionData.customerName);
        wompiScript.setAttribute('data-customer-data:phone-number', transaccionData.customerPhone.replace(/\D/g, ''));
        wompiScript.setAttribute('data-customer-data:phone-number-prefix', '+57');
        wompiScript.setAttribute('data-customer-data:legal-id', transaccionData.customerLegalId);
        wompiScript.setAttribute('data-customer-data:legal-id-type', transaccionData.customerLegalIdType);

        // Crear formulario para el widget
        const form = document.createElement('form');
        form.id = 'wompiPaymentForm';
        form.appendChild(wompiScript);
        container.appendChild(form);

        console.log('✅ Widget de Wompi creado correctamente');

        // Guardar referencia
        localStorage.setItem('ultima_referencia_pago', transaccionData.referencia);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error creando widget:', error);
        mostrarError('Error al crear el widget de pago');
        return false;
    }
}

// ============================================
// CONFIGURAR VALIDACIÓN DE FORMULARIO
// ============================================
function setupFormValidation() {
    const inputs = document.querySelectorAll('#customerForm input, #customerForm select');
    const wompiButton = document.getElementById('wompi-button');
    
    if (!wompiButton) return;
    
    function validateForm() {
        const email = document.getElementById('customerEmail')?.value;
        const name = document.getElementById('customerName')?.value;
        const phone = document.getElementById('customerPhone')?.value;
        const legalId = document.getElementById('customerLegalId')?.value;
        const legalIdType = document.getElementById('customerLegalIdType')?.value;
        
        return email && name && phone && legalId && legalIdType;
    }
    
    function updateButtonState() {
        if (validateForm()) {
            wompiButton.disabled = false;
            wompiButton.innerHTML = '<i class="fas fa-lock"></i> Pagar $' + compraInfo.total.toLocaleString('es-CO');
            wompiButton.onclick = iniciarPago;
        } else {
            wompiButton.disabled = true;
            wompiButton.innerHTML = '<i class="fas fa-lock"></i> Completa tus datos';
            wompiButton.onclick = null;
        }
    }
    
    inputs.forEach(input => {
        input.addEventListener('input', updateButtonState);
    });
    
    updateButtonState();
    console.log('✅ Validación configurada');
}

// ============================================
// INICIAR PROCESO DE PAGO
// ============================================
async function iniciarPago() {
    try {
        console.log('🚀 Iniciando pago...');
        const success = await crearWompiWidget();
        
        if (success) {
            console.log('✅ Widget listo');
        }
        
    } catch (error) {
        console.error('❌ Error iniciando pago:', error);
        mostrarError('Error: ' + error.message);
    }
}

// ============================================
// FUNCIONES DE UI
// ============================================
function setLoading(isLoading) {
    if (!loading) return;
    
    if (isLoading) {
        loading.classList.add('active');
    } else {
        loading.classList.remove('active');
    }
}

function mostrarError(mensaje) {
    if (errorMessage) {
        errorMessage.textContent = mensaje;
        errorMessage.classList.add('active');
        
        setTimeout(() => {
            errorMessage.classList.remove('active');
        }, 8000);
    }
    console.error('❌', mensaje);
}

function mostrarExito(transaccion) {
    localStorage.removeItem('compra_pendiente');
    window.location.href = `/confirmacion.html?reference=${transaccion.reference}&status=approved`;
}

function volverAlCarrito() {
    if (confirm('¿Deseas volver al carrito?')) {
        window.location.href = '/';
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================
(async function initWompiWidget() {
    console.log('🚀 Inicializando Wompi Widget...');
    
    try {
        // 1. Cargar config
        const configLoaded = await loadWompiConfig();
        if (!configLoaded) throw new Error('Error cargando config');
        
        // 2. Cargar compra
        const compraCargada = cargarResumenCompra();
        if (!compraCargada) throw new Error('Error cargando compra');
        
        // 3. Configurar validación
        setupFormValidation();
        
        console.log('✅ Widget inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando:', error);
        mostrarError('Error: ' + error.message);
    }
})();