// ============================================
// WOMPI.JS - FRONTEND (Lógica de Pago)
// Compatible con pago.html corregido
// ============================================

// ============================================
// VARIABLES GLOBALES
// ============================================
let wompiPublicKey = '';
let acceptanceToken = '';
let compraInfo = null;

// ============================================
// ELEMENTOS DEL DOM
// ============================================
const form = document.getElementById('paymentForm');
const submitBtn = document.getElementById('submitBtn');
const loading = document.getElementById('loading');
const emailInput = document.getElementById('email');
const legalIdInput = document.getElementById('legalId');

// ============================================
// VERIFICAR QUE LOS ELEMENTOS EXISTAN
// ============================================
if (!form || !submitBtn || !loading) {
    console.error('❌ Elementos del DOM no encontrados. Verifica que estés en pago.html');
}

// ============================================
// CARGAR CONFIGURACIÓN DE WOMPI
// ============================================
async function loadWompiConfig() {
    try {
        console.log('🔑 Cargando configuración de Wompi...');
        
        // Usar fetchAPI que ya está definida en pago.html
        const data = await fetchAPI('/api/pagos/config');
        
        if (!data.publicKey) {
            throw new Error('No se recibió la llave pública');
        }
        
        wompiPublicKey = data.publicKey;
        console.log('✅ Llave pública cargada:', wompiPublicKey.substring(0, 20) + '...');
        
        // Obtener token de aceptación
        await getAcceptanceToken();
        
        return true;
        
    } catch (error) {
        console.error('❌ Error cargando configuración de Wompi:', error);
        mostrarError('Error al inicializar el sistema de pagos. Verifica tu conexión.');
        return false;
    }
}

// ============================================
// OBTENER TOKEN DE ACEPTACIÓN DE WOMPI
// ============================================
async function getAcceptanceToken() {
    try {
        console.log('📝 Obteniendo token de aceptación...');
        
        const response = await fetch(`https://sandbox.wompi.co/v1/merchants/${wompiPublicKey}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status} al obtener token`);
        }
        
        const data = await response.json();
        
        if (data.data && data.data.presigned_acceptance) {
            acceptanceToken = data.data.presigned_acceptance.acceptance_token;
            console.log('✅ Token de aceptación obtenido');
        } else {
            console.warn('⚠️  No se pudo obtener el token de aceptación');
        }
    } catch (error) {
        console.error('❌ Error obteniendo token de aceptación:', error);
        // No es crítico, continuar sin él
    }
}

// ============================================
// CONFIGURAR EVENT LISTENERS
// ============================================
function setupPaymentListeners() {
    if (!form) {
        console.error('❌ Formulario no encontrado');
        return;
    }
    
    // Enviar formulario
    form.addEventListener('submit', handlePaymentSubmit);
    
    // Validación en tiempo real del email
    if (emailInput) {
        emailInput.addEventListener('blur', validateEmail);
    }
    
    // Validación del documento (solo números)
    if (legalIdInput) {
        legalIdInput.addEventListener('input', validateLegalId);
    }
    
    console.log('✅ Event listeners configurados');
}

// ============================================
// VALIDACIONES
// ============================================
function validateEmail() {
    if (!emailInput) return false;
    
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailRegex.test(email)) {
        emailInput.style.borderColor = '#e74c3c';
        return false;
    } else if (email) {
        emailInput.style.borderColor = '#2ecc71';
        return true;
    }
    return false;
}

function validateLegalId(e) {
    // Solo permitir números
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
}

// ============================================
// PROCESAR FORMULARIO DE PAGO
// ============================================
async function handlePaymentSubmit(e) {
    e.preventDefault();
    
    console.log('💳 Procesando pago...');
    
    // Validar formulario
    if (!form.checkValidity()) {
        mostrarError('Por favor completa todos los campos requeridos');
        return;
    }
    
    if (!validateEmail()) {
        mostrarError('Por favor ingresa un email válido');
        return;
    }
    
    // Cargar info de compra
    try {
        compraInfo = JSON.parse(localStorage.getItem('compra_pendiente'));
        
        if (!compraInfo || !compraInfo.total) {
            throw new Error('Información de compra no válida');
        }
    } catch (error) {
        console.error('❌ Error cargando compra:', error);
        mostrarError('Error al cargar información de la compra');
        return;
    }
    
    if (!acceptanceToken) {
        console.warn('⚠️  No hay token de aceptación, continuando sin él');
    }
    
    // Mostrar loading
    setLoading(true);
    
    try {
        // Generar referencia única
        const reference = generateReference();
        
        // Preparar datos de la transacción
        const transactionData = {
            acceptance_token: acceptanceToken || '',
            amount: compraInfo.total,
            currency: 'COP',
            customerEmail: document.getElementById('email').value.trim(),
            reference: reference,
            customerData: {
                userType: document.getElementById('userType').value,
                legalIdType: document.getElementById('legalIdType').value,
                legalId: document.getElementById('legalId').value.trim(),
                bankCode: document.getElementById('bank').value,
                description: `Compra SuperMarket - ${compraInfo.items?.length || 0} producto(s)`
            }
        };
        
        console.log('📤 Enviando transacción:', {
            ...transactionData,
            acceptance_token: transactionData.acceptance_token ? '***' : 'NO_TOKEN'
        });
        
        // Crear transacción en Wompi usando fetchAPI de pago.html
        const result = await fetchAPI('/api/pagos/crear-transaccion', {
            method: 'POST',
            body: JSON.stringify(transactionData)
        });
        
        console.log('📥 Respuesta de Wompi:', result);
        
        if (result.success && result.data) {
            const paymentUrl = result.data.data?.payment_method?.extra?.async_payment_url;
            
            if (paymentUrl) {
                // Guardar info de transacción
                localStorage.setItem('transaction_id', result.data.data.id);
                localStorage.setItem('transaction_reference', reference);
                
                console.log('✅ Redirigiendo al banco...');
                console.log('🔗 URL:', paymentUrl);
                
                // Redirigir al banco después de 1 segundo
                setTimeout(() => {
                    window.location.href = paymentUrl;
                }, 1000);
            } else {
                throw new Error('No se recibió URL de redirección del banco');
            }
        } else {
            throw new Error(result.error || result.message || 'Error al procesar el pago');
        }
        
    } catch (error) {
        console.error('❌ Error procesando pago:', error);
        mostrarError(error.message || 'Error al procesar el pago. Por favor intenta nuevamente.');
        setLoading(false);
    }
}

// ============================================
// GENERAR REFERENCIA ÚNICA
// ============================================
function generateReference() {
    const timestamp = Date.now();
    const userId = compraInfo?.userId || 'GUEST';
    const random = Math.floor(Math.random() * 10000);
    return `SUPER-${userId}-${timestamp}-${random}`;
}

// ============================================
// UI HELPERS
// ============================================
function setLoading(isLoading) {
    if (!loading || !form || !submitBtn) return;
    
    if (isLoading) {
        loading.classList.add('active');
        form.style.display = 'none';
        submitBtn.disabled = true;
    } else {
        loading.classList.remove('active');
        form.style.display = 'block';
        submitBtn.disabled = false;
    }
}

// Nota: mostrarError ya está definida en pago.html
// Pero la redefinimos aquí por si acaso
if (typeof mostrarError === 'undefined') {
    window.mostrarError = function(mensaje) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = mensaje;
            errorDiv.classList.add('active');
            
            setTimeout(() => {
                errorDiv.classList.remove('active');
            }, 8000);
        }
        console.error('❌', mensaje);
    };
}

// ============================================
// INICIALIZACIÓN AUTOMÁTICA
// ============================================
(async function initWompiPayment() {
    console.log('🎨 Wompi PSE Integration v3.0');
    
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        await init();
    }
    
    async function init() {
        try {
            console.log('🚀 Inicializando lógica de pago...');
            
            // Esperar a que CONFIG esté listo
            if (!window.CONFIG?.api?.baseUrl) {
                console.log('⏳ Esperando CONFIG...');
                await new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        console.warn('⚠️  Timeout esperando CONFIG');
                        resolve();
                    }, 5000);
                    
                    window.addEventListener('configLoaded', () => {
                        clearTimeout(timeout);
                        resolve();
                    }, { once: true });
                });
            }
            
            if (!window.CONFIG?.api?.baseUrl) {
                throw new Error('CONFIG no disponible');
            }
            
            console.log('✅ CONFIG disponible:', window.CONFIG.api.baseUrl);
            
            // Cargar configuración de Wompi
            const configLoaded = await loadWompiConfig();
            
            if (!configLoaded) {
                throw new Error('No se pudo cargar configuración de Wompi');
            }
            
            // Configurar event listeners
            setupPaymentListeners();
            
            console.log('✅ Lógica de pago lista');
            
        } catch (error) {
            console.error('❌ Error inicializando lógica de pago:', error);
            mostrarError('Error al inicializar el sistema de pagos: ' + error.message);
        }
    }
})();

// ============================================
// LOG DE VERSIÓN
// ============================================
console.log('📦 wompi.js (Frontend) cargado');
console.log('🔗 Esperando inicialización...');