import { auth as AuthAPI } from './api.js';
import { CONFIG, UTILS } from './config.js';
import { showToast } from './ui.js'; // Asumiendo que tienes un módulo UI

// ============================================
// VARIABLES GLOBALES
// ============================================

let currentUser = null;

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

/**
 * Verificar estado de autenticación al cargar la aplicación
 */
export async function verificarAutenticacion() {
    const token = localStorage.getItem('auth_token');
    
    if (token) {
        try {
            const resultado = await AuthAPI.verify();
            
            if (resultado.success) {
                currentUser = resultado.data.user;
                console.log('✅ Usuario autenticado:', currentUser.nombre);
                actualizarUIUsuario();
                return true;
            }
        } catch (error) {
            console.warn('❌ Token inválido, limpiando sesión');
            limpiarSesion();
        }
    }
    
    return false;
}

/**
 * Obtener usuario actual
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Verificar si el usuario está autenticado
 */
export function estaAutenticado() {
    return currentUser !== null;
}

/**
 * Verificar si el usuario es administrador
 */
export function esAdministrador() {
    return currentUser?.rol === 'admin';
}

// ============================================
// FORMULARIOS DE AUTENTICACIÓN
// ============================================

/**
 * Mostrar formulario de login
 */
export function mostrarFormularioLogin() {
    const loginForm = `
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-4">
                <div class="card shadow-lg border-0">
                    <div class="card-header bg-primary text-white text-center">
                        <h4><i class="fas fa-sign-in-alt"></i> Iniciar Sesión</h4>
                    </div>
                    <div class="card-body p-4">
                        <form id="loginForm">
                            <div class="mb-3">
                                <label for="loginUser" class="form-label">
                                    <i class="fas fa-user"></i> Usuario o Email
                                </label>
                                <input type="text" class="form-control" id="loginUser" required 
                                       placeholder="usuario@ejemplo.com">
                            </div>
                            
                            <div class="mb-3">
                                <label for="loginPassword" class="form-label">
                                    <i class="fas fa-lock"></i> Contraseña
                                </label>
                                <div class="input-group">
                                    <input type="password" class="form-control" id="loginPassword" required
                                           placeholder="••••••">
                                    <button type="button" class="btn btn-outline-secondary" 
                                            onclick="auth.togglePassword('loginPassword', this)">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="mb-3 form-check">
                                <input type="checkbox" class="form-check-input" id="rememberMe">
                                <label class="form-check-label" for="rememberMe">
                                    Recordar sesión
                                </label>
                            </div>
                            
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary btn-lg">
                                    <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                                </button>
                            </div>
                        </form>
                        
                        <hr>
                        
                        <div class="text-center">
                            <p class="mb-2 text-muted">¿No tienes cuenta?</p>
                            <button class="btn btn-outline-primary" onclick="auth.mostrarFormularioRegistro()">
                                <i class="fas fa-user-plus"></i> Crear Cuenta
                            </button>
                        </div>
                        
                        <div class="text-center mt-3">
                            <small class="text-muted">
                                <a href="#" class="text-decoration-none" onclick="auth.mostrarRecuperarPassword()">
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('contenidoPrincipal').innerHTML = loginForm;
    
    // Agregar event listener al formulario
    document.getElementById('loginForm').addEventListener('submit', procesarLogin);
}

/**
 * Mostrar formulario de registro
 */
export function mostrarFormularioRegistro() {
    const registerForm = `
        <div class="row justify-content-center">
            <div class="col-md-8 col-lg-6">
                <div class="card shadow-lg border-0">
                    <div class="card-header bg-success text-white text-center">
                        <h4><i class="fas fa-user-plus"></i> Crear Cuenta</h4>
                    </div>
                    <div class="card-body p-4">
                        <form id="registerForm">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="regNombre" class="form-label">
                                        <i class="fas fa-user"></i> Nombre Completo
                                    </label>
                                    <input type="text" class="form-control" id="regNombre" required 
                                           placeholder="Juan Pérez">
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label for="regEmail" class="form-label">
                                        <i class="fas fa-envelope"></i> Email
                                    </label>
                                    <input type="email" class="form-control" id="regEmail" required
                                           placeholder="usuario@ejemplo.com">
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="regPassword" class="form-label">
                                        <i class="fas fa-lock"></i> Contraseña
                                    </label>
                                    <div class="input-group">
                                        <input type="password" class="form-control" id="regPassword" required 
                                               minlength="6" 
                                               placeholder="Mínimo 6 caracteres">
                                        <button type="button" class="btn btn-outline-secondary" 
                                                onclick="auth.togglePassword('regPassword', this)">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                    <div class="form-text">
                                        La contraseña debe tener al menos 6 caracteres
                                    </div>
                                </div>
                                
                                <div class="col-md-6 mb-3">
                                    <label for="regPasswordConfirm" class="form-label">
                                        <i class="fas fa-lock"></i> Confirmar Contraseña
                                    </label>
                                    <input type="password" class="form-control" id="regPasswordConfirm" required
                                           placeholder="Repite tu contraseña">
                                </div>
                            </div>
                            
                            <div class="mb-3 form-check">
                                <input type="checkbox" class="form-check-input" id="acceptTerms" required>
                                <label class="form-check-label" for="acceptTerms">
                                    Acepto los <a href="#" class="text-decoration-none" 
                                    onclick="auth.mostrarTerminos()">términos y condiciones</a>
                                </label>
                            </div>
                            
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-success btn-lg">
                                    <i class="fas fa-user-plus"></i> Crear Cuenta
                                </button>
                            </div>
                        </form>
                        
                        <hr>
                        
                        <div class="text-center">
                            <p class="mb-2 text-muted">¿Ya tienes cuenta?</p>
                            <button class="btn btn-outline-success" onclick="auth.mostrarFormularioLogin()">
                                <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('contenidoPrincipal').innerHTML = registerForm;
    
    // Agregar event listener y validaciones en tiempo real
    const form = document.getElementById('registerForm');
    form.addEventListener('submit', procesarRegistro);
    
    // Validaciones en tiempo real
    configurarValidacionesRegistro();
}

// ============================================
// PROCESAMIENTO DE FORMULARIOS
// ============================================

/**
 * Procesar formulario de login
 */
async function procesarLogin(event) {
    event.preventDefault();
    
    const user = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Validaciones básicas
    if (!user || !password) {
        showToast('Por favor completa todos los campos', 'warning');
        return;
    }
    
    try {
        // Mostrar loading
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
        submitBtn.disabled = true;
        
        const resultado = await AuthAPI.login({
            email: user.includes('@') ? user : undefined,
            nombre: !user.includes('@') ? user : undefined,
            password: password
        });
        
        if (resultado.success) {
            // Guardar token
            AuthAPI.setToken(resultado.data.token);
            currentUser = resultado.data.user;
            
            showToast(CONFIG.MESSAGES.SUCCESS.LOGIN_SUCCESS, 'success');
            
            // Actualizar UI
            actualizarUIUsuario();
            
            // Redirigir o recargar
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
            
        } else {
            throw new Error(resultado.error || 'Error en el login');
        }
        
    } catch (error) {
        console.error('❌ Error en login:', error);
        showToast(error.message || CONFIG.MESSAGES.ERROR.INVALID_CREDENTIALS, 'danger');
    } finally {
        // Restaurar botón
        const submitBtn = event.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
            submitBtn.disabled = false;
        }
    }
}

/**
 * Procesar formulario de registro
 */
async function procesarRegistro(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('regNombre').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    
    // Validaciones
    if (!nombre || !email || !password || !passwordConfirm) {
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
    
    if (password.length < 6) {
        showToast('La contraseña debe tener al menos 6 caracteres', 'warning');
        return;
    }
    
    try {
        // Mostrar loading
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';
        submitBtn.disabled = true;
        
        const resultado = await AuthAPI.register({
            nombre: nombre,
            email: email,
            password: password
        });
        
        if (resultado.success) {
            showToast('✅ Cuenta creada exitosamente. Ya puedes iniciar sesión.', 'success');
            
            // Redirigir al login después de 2 segundos
            setTimeout(() => {
                mostrarFormularioLogin();
            }, 2000);
            
        } else {
            throw new Error(resultado.error || 'Error en el registro');
        }
        
    } catch (error) {
        console.error('❌ Error en registro:', error);
        showToast(error.message || 'Error al crear la cuenta', 'danger');
    } finally {
        // Restaurar botón
        const submitBtn = event.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Crear Cuenta';
            submitBtn.disabled = false;
        }
    }
}

/**
 * Cerrar sesión del usuario
 */
export async function cerrarSesion() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        try {
            await AuthAPI.logout();
            limpiarSesion();
            showToast(CONFIG.MESSAGES.SUCCESS.LOGOUT_SUCCESS, 'info');
            
            // Redirigir al login
            setTimeout(() => {
                mostrarFormularioLogin();
            }, 1000);
            
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            // Limpiar sesión localmente aunque falle en el servidor
            limpiarSesion();
            mostrarFormularioLogin();
        }
    }
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

/**
 * Limpiar sesión del usuario
 */
function limpiarSesion() {
    currentUser = null;
    AuthAPI.removeToken();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    actualizarUIUsuario();
}

/**
 * Actualizar la UI según el estado de autenticación
 */
function actualizarUIUsuario() {
    const authElements = document.querySelectorAll('[data-auth]');
    const userElements = document.querySelectorAll('[data-user]');
    const adminElements = document.querySelectorAll('[data-admin]');
    
    if (estaAutenticado()) {
        // Usuario autenticado
        authElements.forEach(el => {
            if (el.dataset.auth === 'true') el.style.display = '';
            if (el.dataset.auth === 'false') el.style.display = 'none';
        });
        
        // Información del usuario
        userElements.forEach(el => {
            const field = el.dataset.user;
            if (currentUser[field]) {
                el.textContent = currentUser[field];
            }
        });
        
        // Elementos de admin
        if (esAdministrador()) {
            adminElements.forEach(el => el.style.display = '');
        } else {
            adminElements.forEach(el => el.style.display = 'none');
        }
        
    } else {
        // Usuario no autenticado
        authElements.forEach(el => {
            if (el.dataset.auth === 'true') el.style.display = 'none';
            if (el.dataset.auth === 'false') el.style.display = '';
        });
        
        userElements.forEach(el => el.textContent = '');
        adminElements.forEach(el => el.style.display = 'none');
    }
}

/**
 * Toggle mostrar/ocultar contraseña
 */
export function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
        button.title = 'Ocultar contraseña';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
        button.title = 'Mostrar contraseña';
    }
}

/**
 * Configurar validaciones en tiempo real para el registro
 */
function configurarValidacionesRegistro() {
    const emailInput = document.getElementById('regEmail');
    const passwordInput = document.getElementById('regPassword');
    const confirmInput = document.getElementById('regPasswordConfirm');
    
    if (emailInput) {
        emailInput.addEventListener('blur', () => {
            const email = emailInput.value.trim();
            if (email && !UTILS.isValidEmail(email)) {
                emailInput.classList.add('is-invalid');
            } else if (email) {
                emailInput.classList.remove('is-invalid');
                emailInput.classList.add('is-valid');
            }
        });
    }
    
    if (passwordInput && confirmInput) {
        confirmInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const confirm = confirmInput.value;
            
            if (confirm && password !== confirm) {
                confirmInput.classList.add('is-invalid');
                confirmInput.classList.remove('is-valid');
            } else if (confirm) {
                confirmInput.classList.remove('is-invalid');
                confirmInput.classList.add('is-valid');
            }
        });
    }
}

/**
 * Mostrar modal de términos y condiciones
 */
export function mostrarTerminos() {
    // Implementación del modal de términos
    showToast('📄 Términos y condiciones - Funcionalidad en desarrollo', 'info');
}

/**
 * Mostrar recuperación de contraseña
 */
export function mostrarRecuperarPassword() {
    showToast('🔐 Recuperación de contraseña - Funcionalidad en desarrollo', 'info');
}

// ============================================
// INICIALIZACIÓN
// ============================================

/**
 * Inicializar módulo de autenticación
 */
export function inicializarAuth() {
    console.log('🔐 Inicializando módulo de autenticación...');
    
    // Verificar autenticación al cargar
    verificarAutenticacion();
    
    // Exponer funciones globalmente si es necesario
    window.auth = {
        mostrarFormularioLogin,
        mostrarFormularioRegistro,
        cerrarSesion,
        togglePassword,
        mostrarTerminos,
        mostrarRecuperarPassword,
        getCurrentUser,
        estaAutenticado,
        esAdministrador
    };
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarAuth);
} else {
    inicializarAuth();
}

// Exportar objeto principal para uso global
export default {
    verificarAutenticacion,
    mostrarFormularioLogin,
    mostrarFormularioRegistro,
    cerrarSesion,
    getCurrentUser,
    estaAutenticado,
    esAdministrador,
    inicializarAuth
};