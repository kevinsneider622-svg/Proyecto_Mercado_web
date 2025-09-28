// Funciones de autenticación

// Verificar estado de autenticación al cargar
async function verificarAutenticacion() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            await AuthAPI.verifyToken();
        } catch (error) {
            console.log('Token inválido, limpiando sesión');
        }
    }
}

// Mostrar formulario de login
function mostrarFormularioLogin() {
    const loginForm = `
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-4">
                <div class="card shadow-lg border-0">
                    <div class="card-header bg-primary text-white text-center">
                        <h4><i class="fas fa-sign-in-alt"></i> Iniciar Sesión</h4>
                    </div>
                    <div class="card-body p-4">
                        <form id="loginForm" onsubmit="procesarLogin(event)">
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="fas fa-user"></i> Usuario o Email
                                </label>
                                <input type="text" class="form-control" id="loginUser" required>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="fas fa-lock"></i> Contraseña
                                </label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="loginPassword" required>
                                    <button type="button" class="btn btn-outline-secondary" onclick="togglePassword('loginPassword', this)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="mb-3 form-check">
                                <input type="checkbox" class="form-check-input" id="rememberMe">
                                <label class="form-check-label" for="rememberMe">
                                    Recordarme
                                </label>
                            </div>
                            
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                                </button>
                            </div>
                        </form>
                        
                        <hr>
                        
                        <div class="text-center">
                            <p class="mb-2">¿No tienes cuenta?</p>
                            <button class="btn btn-outline-primary" onclick="mostrarFormularioRegistro()">
                                <i class="fas fa-user-plus"></i> Registrarse
                            </button>
                        </div>
                        
                        <div class="text-center mt-3">
                            <small class="text-muted">
                                <a href="#" onclick="mostrarRecuperarPassword()">¿Olvidaste tu contraseña?</a>
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('contenidoPrincipal').innerHTML = loginForm;
}

// Mostrar formulario de registro
function mostrarFormularioRegistro() {
    const registerForm = `
        <div class="row justify-content-center">
            <div class="col-md-8 col-lg-6">
                <div class="card shadow-lg border-0">
                    <div class="card-header bg-success text-white text-center">
                        <h4><i class="fas fa-user-plus"></i> Crear Cuenta</h4>
                    </div>
                    <div class="card-body p-4">
                        <form id="registerForm" onsubmit="procesarRegistro(event)">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">
                                        <i class="fas fa-user"></i> Nombre de Usuario
                                    </label>
                                    <input type="text" class="form-control" id="regUsername" required 
                                           pattern="[a-zA-Z0-9_]{3,20}" 
                                           title="3-20 caracteres, solo letras, números y guión bajo">
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">
                                        <i class="fas fa-envelope"></i> Email
                                    </label>
                                    <input type="email" class="form-control" id="regEmail" required>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">
                                        <i class="fas fa-lock"></i> Contraseña
                                    </label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" id="regPassword" required 
                                               minlength="6" pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}"
                                               title="Mínimo 6 caracteres, debe incluir mayúscula, minúscula y número">
                                        <button type="button" class="btn btn-outline-secondary" onclick="togglePassword('regPassword', this)">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                    <div class="form-text">
                                        Mínimo 6 caracteres con mayúscula, minúscula y número
                                    </div>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">
                                        <i class="fas fa-lock"></i> Confirmar Contraseña
                                    </label>
                                    <input type="password" class="form-control" id="regPasswordConfirm" required>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="fas fa-user-tag"></i> Rol
                                </label>
                                <select class="form-select" id="regRole">
                                    <option value="empleado">Empleado</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            
                            <div class="mb-3 form-check">
                                <input type="checkbox" class="form-check-input" id="acceptTerms" required>
                                <label class="form-check-label" for="acceptTerms">
                                    Acepto los <a href="#" onclick="mostrarTerminos()">términos y condiciones</a>
                                </label>
                            </div>
                            
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-success">
                                    <i class="fas fa-user-plus"></i> Crear Cuenta
                                </button>
                            </div>
                        </form>
                        
                        <hr>
                        
                        <div class="text-center">
                            <p class="mb-2">¿Ya tienes cuenta?</p>
                            <button class="btn btn-outline-success" onclick="mostrarFormularioLogin()">
                                <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('contenidoPrincipal').innerHTML = registerForm;
}

// Procesar login
async function procesarLogin(event) {
    event.preventDefault();
    
    const user = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!user || !password) {
        showToast('Por favor completa todos los campos', 'warning');
        return;
    }
    
    try {
        const response = await AuthAPI.login({
            username: user,
            email: user, // El backend debería manejar ambos
            password: password
        });
        
        showToast(CONFIG.MESSAGES.SUCCESS.LOGIN_SUCCESS, 'success');
        cargarPagina('inicio');
        
    } catch (error) {
        console.error('Error en login:', error);
        showToast(error.message || CONFIG.MESSAGES.ERROR.INVALID_CREDENTIALS, 'danger');
    }
}

// Procesar registro
async function procesarRegistro(event) {
    event.preventDefault();
    
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    const role = document.getElementById('regRole').value;
    
    // Validaciones
    if (!username || !email || !password || !passwordConfirm) {
        showToast('Por favor completa todos los campos', 'warning');
        return;
    }
    
    if (password !== passwordConfirm) {
        showToast('Las contraseñas no coinciden', 'warning');
        return;
    }
    
    if (!UTILS.isValidEmail(email)) {
        showToast('Por favor ingresa un email válido', 'warning');
        return;
    }
    
    try {
        const response = await AuthAPI.register({
            username: username,
            email: email,
            password: password,
            rol: role
        });
        
        showToast('Cuenta creada exitosamente. Puedes iniciar sesión.', 'success');
        mostrarFormularioLogin();
        
    } catch (error) {
        console.error('Error en registro:', error);
        showToast(error.message || 'Error al crear la cuenta', 'danger');
    }
}

// Cerrar sesión
function cerrarSesion() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        AuthAPI.logout();
    }
}

// Toggle mostrar/ocultar contraseña
function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Mostrar recuperar contraseña (placeholder)
function mostrarRecuperarPassword() {
    showToast('Funcionalidad de recuperación de contraseña en desarrollo', 'info');
}

// Mostrar términos y condiciones (placeholder)
function mostrarTerminos() {
    const modal = `
        <div class="modal fade" id="terminosModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Términos y Condiciones</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <h6>1. Uso del Sistema</h6>
                        <p>Este sistema está destinado exclusivamente para la gestión del supermercado.</p>
                        
                        <h6>2. Responsabilidades del Usuario</h6>
                        <p>El usuario es responsable de mantener la confidencialidad de sus credenciales.</p>
                        
                        <h6>3. Privacidad de Datos</h6>
                        <p>Los datos personales serán tratados conforme a las leyes de protección de datos vigentes.</p>
                        
                        <h6>4. Modificaciones</h6>
                        <p>Nos reservamos el derecho de modificar estos términos en cualquier momento.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Entendido</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Agregar modal al DOM si no existe
    if (!document.getElementById('terminosModal')) {
        document.body.insertAdjacentHTML('beforeend', modal);
    }
    
    // Mostrar modal
    const modalElement = new bootstrap.Modal(document.getElementById('terminosModal'));
    modalElement.show();
}

// Validación en tiempo real para el registro
document.addEventListener('DOMContentLoaded', function() {
    // Escuchar cambios en los campos de registro cuando el formulario exista
    document.addEventListener('input', function(e) {
        if (e.target.id === 'regPassword' || e.target.id === 'regPasswordConfirm') {
            const password = document.getElementById('regPassword')?.value;
            const confirm = document.getElementById('regPasswordConfirm')?.value;
            const confirmField = document.getElementById('regPasswordConfirm');
            
            if (confirmField && confirm) {
                if (password === confirm) {
                    confirmField.classList.remove('is-invalid');
                    confirmField.classList.add('is-valid');
                } else {
                    confirmField.classList.remove('is-valid');
                    confirmField.classList.add('is-invalid');
                }
            }
        }
        
        if (e.target.id === 'regEmail') {
            const email = e.target.value;
            const emailField = e.target;
            
            if (email && UTILS.isValidEmail(email)) {
                emailField.classList.remove('is-invalid');
                emailField.classList.add('is-valid');
            } else if (email) {
                emailField.classList.remove('is-valid');
                emailField.classList.add('is-invalid');
            }
        }
    });
});