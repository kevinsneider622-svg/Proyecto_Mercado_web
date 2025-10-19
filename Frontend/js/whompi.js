// Configuración
const API_URL = 'http://localhost:3000/api/pagos';
let wompiPublicKey = '';
let acceptanceToken = '';

// Elementos del DOM
const form = document.getElementById('paymentForm');
const submitBtn = document.getElementById('submitBtn');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const bankSelect = document.getElementById('bank');
const amountInput = document.getElementById('amount');
const displayAmount = document.getElementById('displayAmount');
const emailInput = document.getElementById('email');

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
    await cargarDatosCompra();
    await loadConfig();
    await loadBanks();
    setupEventListeners();
});

// Cargar datos de la compra pendiente
async function cargarDatosCompra() {
    const compra = JSON.parse(localStorage.getItem('compra_pendiente'));
    
    if (!compra) {
        showError('No hay compra pendiente. Redirigiendo...');
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
        return;
    }
    
    // Prellenar formulario con datos del usuario
    if (emailInput && compra.userEmail) {
        emailInput.value = compra.userEmail;
    }
    
    // Establecer monto
    if (amountInput && compra.total) {
        amountInput.value = compra.total;
        amountInput.readOnly = true; // No permitir cambios
        displayAmount.textContent = compra.total.toLocaleString('es-CO');
    }
    
    // Mostrar resumen de productos
    mostrarResumenProductos(compra);
}

// Mostrar resumen de productos en la página
function mostrarResumenProductos(compra) {
    const container = document.getElementById('resumenProductos');
    if (!container) return;
    
    const html = `
        <div class="card mb-3">
            <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-shopping-bag me-2"></i>Resumen de tu pedido</h6>
            </div>
            <div class="card-body">
                ${compra.items.map(item => `
                    <div class="d-flex justify-content-between mb-2">
                        <span>${item.nombre} (x${item.cantidad})</span>
                        <strong>$${(item.precio * item.cantidad).toLocaleString()}</strong>
                    </div>
                `).join('')}
                <hr>
                <div class="d-flex justify-content-between">
                    <strong>Total:</strong>
                    <strong class="text-primary">$${compra.total.toLocaleString()}</strong>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Cargar configuración
async function loadConfig() {
    try {
        const response = await fetch(`${API_URL}/config`);
        const data = await response.json();
        wompiPublicKey = data.publicKey;
        
        await getAcceptanceToken();
    } catch (error) {
        console.error('Error al cargar configuración:', error);
        showError('Error al inicializar el sistema de pagos');
    }
}

// Obtener token de aceptación de Wompi
async function getAcceptanceToken() {
    try {
        const response = await fetch('https://sandbox.wompi.co/v1/merchants/' + wompiPublicKey);
        const data = await response.json();
        
        if (data.data && data.data.presigned_acceptance) {
            acceptanceToken = data.data.presigned_acceptance.acceptance_token;
        }
    } catch (error) {
        console.error('Error al obtener acceptance token:', error);
    }
}

// Cargar lista de bancos PSE
async function loadBanks() {
    try {
        const response = await fetch(`${API_URL}/bancos-pse`);
        const data = await response.json();
        
        if (data.success && data.banks) {
            bankSelect.innerHTML = '<option value="">Selecciona tu banco...</option>';
            
            data.banks.forEach(bank => {
                const option = document.createElement('option');
                option.value = bank.financial_institution_code;
                option.textContent = bank.financial_institution_name;
                bankSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar bancos:', error);
        showError('Error al cargar la lista de bancos');
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Actualizar monto mostrado (si se permite cambios)
    if (amountInput && !amountInput.readOnly) {
        amountInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value) || 0;
            displayAmount.textContent = value.toLocaleString('es-CO');
        });
    }

    // Enviar formulario
    form.addEventListener('submit', handleSubmit);
}

// Manejar envío del formulario
async function handleSubmit(e) {
    e.preventDefault();
    
    // Validar formulario
    if (!form.checkValidity()) {
        showError('Por favor completa todos los campos requeridos');
        return;
    }

    // Validar monto mínimo
    const amount = parseInt(amountInput.value);
    if (amount < 1000) {
        showError('El monto mínimo es de $1,000 COP');
        return;
    }

    // Mostrar loading
    setLoading(true);
    hideError();

    try {
        // Obtener datos de la compra
        const compra = JSON.parse(localStorage.getItem('compra_pendiente'));
        
        // Preparar datos de la transacción
        const transactionData = {
            acceptance_token: acceptanceToken,
            amount: amount,
            currency: 'COP',
            customerEmail: document.getElementById('email').value,
            reference: generateReference(compra),
            customerData: {
                userType: document.getElementById('userType').value,
                legalIdType: document.getElementById('legalIdType').value,
                legalId: document.getElementById('legalId').value,
                bankCode: document.getElementById('bank').value,
                description: `Compra en SuperMarket - ${compra.items.length} producto(s)`
            }
        };

        // Crear transacción
        const response = await fetch(`${API_URL}/crear-transaccion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transactionData)
        });

        const result = await response.json();

        if (result.success && result.data) {
            // Redirigir a la URL de pago de PSE
            if (result.data.data && result.data.data.payment_method && 
                result.data.data.payment_method.extra && 
                result.data.data.payment_method.extra.async_payment_url) {
                
                // Guardar ID de transacción
                localStorage.setItem('transaction_id', result.data.data.id);
                localStorage.setItem('transaction_reference', transactionData.reference);
                
                // Redirigir al banco
                window.location.href = result.data.data.payment_method.extra.async_payment_url;
            } else {
                throw new Error('No se recibió URL de redirección del banco');
            }
        } else {
            throw new Error(result.error || 'Error al procesar el pago');
        }

    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Error al procesar el pago. Por favor intenta nuevamente.');
        setLoading(false);
    }
}

// Generar referencia única para la transacción
function generateReference(compra) {
    const timestamp = Date.now();
    const userId = compra.userId || 'GUEST';
    const random = Math.floor(Math.random() * 1000);
    return `SUPER-${userId}-${timestamp}-${random}`;
}

// Mostrar/ocultar loading
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

// Mostrar mensaje de error
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('active');
    
    setTimeout(() => {
        hideError();
    }, 5000);
}

// Ocultar mensaje de error
function hideError() {
    errorMessage.classList.remove('active');
}

// Función para volver
function volverAlCarrito() {
    if (confirm('¿Deseas volver al carrito? Los datos del formulario se perderán.')) {
        window.location.href = '/';
    }
}