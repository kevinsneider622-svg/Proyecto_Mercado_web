
// ============================================
// WOMPI.JS - FRONTEND (Lógica de Pago)
// Compatible con Backend PSE
// ============================================

// ============================================
// VARIABLES GLOBALES
// ============================================
let wompiPublicKey = '';
let wompiApiUrl = '';
let wompiEnvironment = '';
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
    console.error('❌ Elementos del DOM no encontrados');
}

// ============================================
// CARGAR CONFIGURACIÓN DE WOMPI
// ============================================
async function loadWompiConfig() {
    try {
        console.log('🔑 Cargando configuración de Wompi...');
        
        const data = await fetchAPI('/api/pagos/config');
        
        if (!data.publicKey) {
            throw new Error('No se recibió la llave pública');
        }
        
        wompiPublicKey = data.publicKey;
        wompiApiUrl = data.apiUrl || 'https://sandbox.wompi.co/v1';
        wompiEnvironment = data.environment || 'sandbox';
        
        console.log('✅ Configuración de Wompi cargada:');
        console.log('   Public Key:', wompiPublicKey.substring(0, 20) + '...');
        console.log('   API URL:', wompiApiUrl);
        console.log('   Entorno:', wompiEnvironment.toUpperCase());
        
        // Obtener token de aceptación
        await getAcceptanceToken();
        
        return true;
        
    } catch (error) {
        console.error('❌ Error cargando configuración:', error);
        mostrarError('Error al inicializar el sistema de pagos.');
        return false;
    }
}

// ============================================
// OBTENER TOKEN DE ACEPTACIÓN
// ============================================
async function getAcceptanceToken() {
    try {
        console.log('📝 Obteniendo acceptance token...');
        
        const data = await fetchAPI('/api/pagos/acceptance-token');
        
        if (data.success && data.acceptanceToken) {
            acceptanceToken = data.acceptanceToken;
            console.log('✅ Acceptance token obtenido');
            return true;
        } else {
            console.warn('⚠️ No se pudo obtener acceptance token');
            return false;    
        }
    } catch (error) {
        console.error('❌ Error obteniendo acceptance token:', error);
        return false;
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
    
    form.addEventListener('submit', handlePaymentSubmit);
    
    if (emailInput) {
        emailInput.addEventListener('blur', validateEmail);
    }
    
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
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
}

// ============================================
// DEBUG: Verificar elementos al cargar
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Verificando elementos del formulario:');
    console.log('   email:', !!document.getElementById('email'));
    console.log('   userType:', !!document.getElementById('userType'));
    console.log('   legalIdType:', !!document.getElementById('legalIdType'));
    console.log('   legalId:', !!document.getElementById('legalId'));
    console.log('   bank:', !!document.getElementById('bank'));
    console.log('   paymentForm:', !!document.getElementById('paymentForm'));
    console.log('   submitBtn:', !!document.getElementById('submitBtn'));
});


// ============================================
// PROCESAR FORMULARIO DE PAGO
// ============================================
async function handlePaymentSubmit(e) {
    e.preventDefault();
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💳 PROCESANDO PAGO PSE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
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

    setLoading(true);

    try {

        // ✅ PASO 1: Obtener datos del formulario CON VALIDACIÓN

        const emailElement = document.getElementById('email');
        const userTypeElement = document.getElementById('userType'); // 0=Natural, 1=Jurídica
        const legalIdTypeElement = document.getElementById('legalIdType');
        const legalIdElement = document.getElementById('legalId');
        const bankElement = document.getElementById('bank');

        if (!emailElement || !userTypeElement || !legalIdTypeElement || !legalIdElement || !bankElement) {

            console.error('❌ Elementos del formulario no encontrados');
            console.error('    email:', !!emailElement);
            console.error('    userType:', !!userTypeElement);
            console.error('    legalIdType:', !!legalIdTypeElement);
            console.error('    legalId:', !!legalIdElement);
            console.error('    bank:', !!bankElement);
            throw new Error ('Elementos del formulario no encontrados');
        }

    
        const email = emailElement.value.trim();
        const userType = userTypeElement.value; // 0=Natural, 1=Jurídica
        const legalIdType = legalIdTypeElement.value;
        const legalId = legalIdElement.value.trim();
        const bankCode = bankElement.value;


        // Validar que todos tengan valores

        if (!emailElement || !userTypeElement || !legalIdTypeElement || !legalIdElement || !bankElement) {

            console.error('❌ Campos Vacios');
            console.error('    email:', email || 'VACIO');
            console.error('    userType:', userType || 'VACIO');
            console.error('    legalIdType:', legalIdType || 'VACIO');
            console.error('    legalId:', legalId || 'VACIO');
            console.error('    bankCode:', bankCode || 'VACIO');
            
            mostrarError('Por favor completa todos los campos requeridos');
            setLoading(false);
            return;
        }

        // / ✅ PASO 2: Convertir a centavos
        const amountInCents = Math.round(compraInfo.total * 100);
    
    
        // ✅ // ✅ PASO 3: VALIDAR MONTO MÍNIMO (1,500 COP = 150,000 centavos)
        if (amountInCents < 150000) {
            mostrarError('El monto mínimo para PSE es $1,500 COP. Tu compra es de $' + compraInfo.total.toLocaleString('es-CO') + ' COP');
            setLoading(false);
            return;
            }    
        

            // ✅ PASO 4: Generar referencia 
            const reference = generateReference();
            
                            
            console.log('📋 Datos del formulario:');
            console.log('   Email:', email);
            console.log('   Tipo persona:', userType, '(0=Natural, 1=Jurídica)');
            console.log('   Tipo doc:', legalIdType);
            console.log('   Num doc:', legalId);
            console.log('   Banco:', bankCode);
            console.log('   Monto:', compraInfo.total, 'COP');
            console.log('   Monto centavos:', amountInCents);
            console.log('   Referencia:', reference);
            console.log('   Acceptance token:', acceptanceToken ? '✅' : '❌');


    // ✅ PASO 5: Crear payload
            const transactionData = {
                acceptance_token: acceptanceToken,
                amount_in_cents: amountInCents,
                currency: 'COP',
                customer_email: email,
                payment_method: {
                    type: 'PSE',
                    user_type: userType,
                    user_legal_id_type: legalIdType,
                    user_legal_id: legalId,
                    financial_institution_code: bankCode,
                    payment_description: `Compra en Tu Despensa Online - ${compraInfo.items?.length || 0} productos`
                },
                reference: reference,
                customer_data: {
                    phone_number: '3001234567',
                    full_name: email.split('@')[0]
                }
            };
            
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📤 ENVIANDO A BACKEND:');
        console.log(JSON.stringify(transactionData, null, 2));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Enviar al backend
        const result = await fetchAPI('/api/pagos/crear-transaccion', {
            method: 'POST',
            body: JSON.stringify(transactionData)
        });
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📥 RESPUESTA DEL BACKEND:');
        console.log(JSON.stringify(result, null, 2));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (result.success) {
            const paymentUrl = result.paymentUrl;

            console.log('🔗 Payment URL recibida:', paymentUrl);
            
            if (!paymentUrl) {
                console.error('❌ No se recibió URL de pago');
                throw new Error('No se recibió URL de pago del banco');
            }
            
            // Guardar info de transacción
            localStorage.setItem('transaction_id', result.transactionId);
            localStorage.setItem('transaction_reference', reference);
            localStorage.setItem('transaction_status', 'PENDING');
            
            console.log('✅ TRANSACCIÓN CREADA EXITOSAMENTE');
            console.log('   ID:', result.transactionId);
            console.log('   Status:', result.status);
            console.log('   URL Pago:', paymentUrl);
            console.log('🔗 Redirigiendo al banco en 2 segundos...');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            
            // Mostrar mensaje de éxito
            const loadingText = loading.querySelector('p');
            if (loadingText) {
                loadingText.innerHTML = '<strong>✅ Transacción creada!</strong><br>Redirigiendo al banco...';
            }
            
            // Redirigir al banco
            setTimeout(() => {
                window.location.href = paymentUrl;
            }, 2000);
            
        } else {
            throw new Error(result.error || result.message || 'Error al procesar el pago');
        }
        
    } catch (error) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ ERROR AL PROCESAR PAGO:');
        console.error('   Mensaje:', error.message);
        console.error('   Stack:', error.stack);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        let errorMessage = 'Error al procesar el pago. ';
        
        if (error.message.includes('400')) {
            errorMessage += 'Verifica que todos los datos sean correctos.';
        } else if (error.message.includes('401')) {
            errorMessage += 'Error de autenticación con Wompi.';
        } else if (error.message.includes('500')) {
            errorMessage += 'Error del servidor. Intenta nuevamente.';
        } else {
            errorMessage += error.message;
        }
        
        mostrarError(errorMessage);
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

// Definir mostrarError si no existe
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
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎨 Wompi PSE Integration v5.0');
    console.log('📦 Compatible con Backend PSE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    async function init() {
        try {
            console.log('🚀 Inicializando sistema de pago...');
            
            // Esperar CONFIG
            if (!window.CONFIG?.api?.baseUrl) {
                console.log('⏳ Esperando CONFIG...');
                await new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        console.warn('⚠️ Timeout esperando CONFIG');
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
            
            console.log('✅ CONFIG disponible');
            
            // Cargar configuración de Wompi
            const configLoaded = await loadWompiConfig();
            
            if (!configLoaded) {
                throw new Error('Error cargando configuración de Wompi');
            }
            
            // Configurar event listeners
            setupPaymentListeners();
            
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✅ Sistema de pago listo');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            
        } catch (error) {
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('❌ Error inicializando:', error);
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            mostrarError('Error al inicializar: ' + error.message);
        }
    }
})();