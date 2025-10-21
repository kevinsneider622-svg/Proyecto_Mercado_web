// ============================================
// CONFIGURACIÓN
// ============================================
const API_URL = 'http://127.0.0.1:3000/api/pagos';
let wompiPublicKey = '';
let acceptanceToken = '';
let compraInfo = null;

// ============================================
// ELEMENTOS DEL DOM
// ============================================
const form = document.getElementById('paymentForm');
const submitBtn = document.getElementById('submitBtn');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const bankSelect = document.getElementById('bank');
const amountInput = document.getElementById('amount');
const displayAmount = document.getElementById('displayAmount');
const emailInput = document.getElementById('email');

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando página de pago PSE...');
    
    // 1. Cargar datos de la compra
    if (!cargarDatosCompra()) {
        return; // Si no hay compra, ya se redirigió
    }
    
    // 2. Cargar configuración de Wompi
    await loadConfig();
    
    // 3. Cargar lista de bancos PSE
    await loadBanks();
    
    // 4. Configurar event listeners
    setupEventListeners();
    
    // 5. Mostrar formulario
    form.style.display = 'block';
    
    console.log('✅ Página de pago lista');
});

// ============================================
// CARGAR DATOS DE LA COMPRA
// ============================================
function cargarDatosCompra() {
    try {
        compraInfo = JSON.parse(localStorage.getItem('compra_pendiente'));
        
        if (!compraInfo || !compraInfo.items || compraInfo.items.length === 0) {
            showError('No hay compra pendiente. Redirigiendo...');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
            return false;
        }
        
        console.log('📦 Datos de compra cargados:', compraInfo);
        
        // Prellenar email si existe
        if (emailInput && compraInfo.userEmail) {
            emailInput.value = compraInfo.userEmail;
        }
        
        // Mostrar monto
        if (displayAmount && compraInfo.total) {
            displayAmount.textContent = compraInfo.total.toLocaleString('es-CO');
        }
        
        // Mostrar resumen de productos
        mostrarResumenProductos();
        
        return true;
        
    } catch (error) {
        console.error('❌ Error cargando datos de compra:', error);
        showError('Error al cargar información de la compra');
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
        return false;
    }
}

// ============================================
// MOSTRAR RESUMEN DE PRODUCTOS
// ============================================
function mostrarResumenProductos() {
    const container = document.getElementById('resumenProductos');
    if (!container || !compraInfo) return;
    
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
}

// ============================================
// CARGAR CONFIGURACIÓN DE WOMPI
// ============================================
async function loadConfig() {
    try {
        console.log('🔑 Cargando configuración de Wompi...');
        const response = await fetch(`${API_URL}/config`);
        const data = await response.json();
        
        if (!data.publicKey) {
            throw new Error('No se recibió la llave pública');
        }
        
        wompiPublicKey = data.publicKey;
        console.log('✅ Llave pública cargada');
        
        // Obtener token de aceptación
        await getAcceptanceToken();
        
    } catch (error) {
        console.error('❌ Error cargando configuración:', error);
        showError('Error al inicializar el sistema de pagos. Verifica tu conexión.');
    }
}

// ============================================
// OBTENER TOKEN DE ACEPTACIÓN DE WOMPI
// ============================================
async function getAcceptanceToken() {
    try {
        console.log('📝 Obteniendo token de aceptación...');
        const response = await fetch(`https://sandbox.wompi.co/v1/merchants/${wompiPublicKey}`);
        const data = await response.json();
        
        if (data.data && data.data.presigned_acceptance) {
            acceptanceToken = data.data.presigned_acceptance.acceptance_token;
            console.log('✅ Token de aceptación obtenido');
        } else {
            console.warn('⚠️  No se pudo obtener el token de aceptación');
        }
    } catch (error) {
        console.error('❌ Error obteniendo token de aceptación:', error);
    }
}

// ============================================
// CARGAR LISTA DE BANCOS PSE
// ============================================
async function loadBanks() {
    try {
        console.log('🏦 Cargando bancos PSE...');
        const response = await fetch(`${API_URL}/bancos-pse`);
        const data = await response.json();
        
        if (data.success && data.banks && data.banks.length > 0) {
            bankSelect.innerHTML = '<option value="">Selecciona tu banco...</option>';
            
            data.banks.forEach(bank => {
                const option = document.createElement('option');
                option.value = bank.financial_institution_code;
                option.textContent = bank.financial_institution_name;
                bankSelect.appendChild(option);
            });
            
            console.log(`✅ ${data.banks.length} bancos cargados`);
        } else {
            throw new Error('No se recibieron bancos');
        }
    } catch (error) {
        console.error('❌ Error cargando bancos:', error);
        bankSelect.innerHTML = '<option value="">Error cargando bancos</option>';
        showError('Error al cargar la lista de bancos. Intenta recargar la página.');
    }
}

// ============================================
// CONFIGURAR EVENT LISTENERS
// ============================================
function setupEventListeners() {
    // Enviar formulario
    form.addEventListener('submit', handleSubmit);
    
    // Validación en tiempo real
    emailInput.addEventListener('blur', validateEmail);
    document.getElementById('legalId').addEventListener('input', validateLegalId);
}

// ============================================
// VALIDACIONES
// ============================================
function validateEmail() {
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailRegex.test(email)) {
        emailInput.style.borderColor = '#e74c3c';
        return false;
    } else {
        emailInput.style.borderColor = '#2ecc71';
        return true;
    }
}

function validateLegalId(e) {
    // Solo permitir números
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
}

// ============================================
// PROCESAR FORMULARIO DE PAGO
// ============================================
async function handleSubmit(e) {
    e.preventDefault();
    
    console.log('💳 Procesando pago...');
    
    // Validar formulario
    if (!form.checkValidity()) {
        showError('Por favor completa todos los campos requeridos');
        return;
    }
    
    if (!validateEmail()) {
        showError('Por favor ingresa un email válido');
        return;
    }
    
    if (!acceptanceToken) {
        showError('Error de configuración. Por favor recarga la página.');
        return;
    }
    
    // Mostrar loading
    setLoading(true);
    hideError();
    
    try {
        // Generar referencia única
        const reference = generateReference();
        
        // Preparar datos de la transacción
        const transactionData = {
            acceptance_token: acceptanceToken,
            amount: compraInfo.total,
            currency: 'COP',
            customerEmail: document.getElementById('email').value.trim(),
            reference: reference,
            customerData: {
                userType: document.getElementById('userType').value,
                legalIdType: document.getElementById('legalIdType').value,
                legalId: document.getElementById('legalId').value.trim(),
                bankCode: document.getElementById('bank').value,
                description: `Compra SuperMarket - ${compraInfo.items.length} producto(s)`
            }
        };
        
        console.log('📤 Enviando transacción:', transactionData);
        
        // Crear transacción en Wompi
        const response = await fetch(`${API_URL}/crear-transaccion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transactionData)
        });
        
        const result = await response.json();
        console.log('📥 Respuesta de Wompi:', result);
        
        if (result.success && result.data) {
            const paymentUrl = result.data.data?.payment_method?.extra?.async_payment_url;
            
            if (paymentUrl) {
                // Guardar info de transacción
                localStorage.setItem('transaction_id', result.data.data.id);
                localStorage.setItem('transaction_reference', reference);
                
                console.log('✅ Redirigiendo al banco...');
                
                // Redirigir al banco después de 1 segundo
                setTimeout(() => {
                    window.location.href = paymentUrl;
                }, 1000);
            } else {
                throw new Error('No se recibió URL de redirección del banco');
            }
        } else {
            throw new Error(result.error || 'Error al procesar el pago');
        }
        
    } catch (error) {
        console.error('❌ Error procesando pago:', error);
        showError(error.message || 'Error al procesar el pago. Por favor intenta nuevamente.');
        setLoading(false);
    }
}

// ============================================
// GENERAR REFERENCIA ÚNICA
// ============================================
function generateReference() {
    const timestamp = Date.now();
    const userId = compraInfo.userId || 'GUEST';
    const random = Math.floor(Math.random() * 10000);
    return `SUPER-${userId}-${timestamp}-${random}`;
}

// ============================================
// UI HELPERS
// ============================================
function setLoading(isLoading) {
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

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('active');
    
    setTimeout(() => {
        hideError();
    }, 8000);
}

function hideError() {
    errorMessage.classList.remove('active');
}

function volverAlCarrito() {
    if (confirm('¿Deseas volver al carrito? Los datos del formulario se perderán.')) {
        window.location.href = '/';
    }
}

// ============================================
// LOG DE VERSIÓN
// ============================================
console.log('🎨 Wompi PSE Integration v1.0 - Listo');
console.log('🔗 API:', API_URL);