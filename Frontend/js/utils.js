// ============================================
// FUNCIONES DE UTILIDAD PRINCIPALES
// ============================================

/**
 * Retrasa la ejecución de una función hasta que haya pasado cierto tiempo
 * sin que se haya llamado de nuevo (útil para eventos como resize, input de búsqueda).
 * @param {function} func - La función a ejecutar.
 * @param {number} delay - El tiempo de espera en milisegundos.
 * @param {boolean} immediate - Si se ejecuta inmediatamente la primera vez.
 * @returns {function} Una función debounced que envuelve la original.
 */
export const debounce = (func, delay, immediate = false) => {
    let timeoutId;
    return function(...args) {
        const later = () => {
            timeoutId = null;
            if (!immediate) func.apply(this, args);
        };
        const callNow = immediate && !timeoutId;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(later, delay);
        if (callNow) func.apply(this, args);
    };
};

/**
 * Limita la ejecución de una función a una vez cada cierto tiempo.
 * @param {function} func - La función a ejecutar.
 * @param {number} limit - El tiempo mínimo entre ejecuciones en milisegundos.
 * @returns {function} Una función throttled que envuelve la original.
 */
export const throttle = (func, limit) => {
    let inThrottle;
    let lastResult;
    return function(...args) {
        if (!inThrottle) {
            inThrottle = true;
            lastResult = func.apply(this, args);
            setTimeout(() => inThrottle = false, limit);
        }
        return lastResult;
    };
};

// ============================================
// FUNCIONES DE FORMATEO
// ============================================

/**
 * Formatea un número como una cadena de texto de moneda.
 * @param {number} price - El valor numérico a formatear.
 * @param {string} locale - El código de localización (por defecto 'es-CO').
 * @param {string} currency - El código de moneda (por defecto 'COP').
 * @param {object} options - Opciones adicionales para el formateo.
 * @returns {string} El precio formateado como string.
 */
export const formatPrice = (price, locale = 'es-CO', currency = 'COP', options = {}) => {
    if (typeof price !== 'number' || isNaN(price)) {
        return options.placeholder || '---';
    }
    
    const defaultOptions = {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        ...options
    };
    
    return new Intl.NumberFormat(locale, defaultOptions).format(price);
};

/**
 * Formatea un número como una cadena de texto de moneda con decimales.
 * @param {number} price - El valor numérico a formatear.
 * @param {string} locale - El código de localización (por defecto 'es-CO').
 * @param {string} currency - El código de moneda (por defecto 'COP').
 * @returns {string} El precio formateado con decimales.
 */
export const formatPriceDecimal = (price, locale = 'es-CO', currency = 'COP') => {
    return formatPrice(price, locale, currency, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

/**
 * Formatea una fecha en un formato legible.
 * @param {Date|string|number} date - La fecha a formatear.
 * @param {string} locale - El código de localización (por defecto 'es-CO').
 * @param {object} options - Opciones para el formateo de fecha.
 * @returns {string} La fecha formateada.
 */
export const formatDate = (date, locale = 'es-CO', options = {}) => {
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            return '---';
        }
        
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            ...options
        };
        
        return d.toLocaleDateString(locale, defaultOptions);
    } catch (error) {
        console.error('Error formateando fecha:', error);
        return '---';
    }
};

/**
 * Formatea una fecha y hora en un formato legible.
 * @param {Date|string|number} date - La fecha a formatear.
 * @param {string} locale - El código de localización (por defecto 'es-CO').
 * @returns {string} La fecha y hora formateada.
 */
export const formatDateTime = (date, locale = 'es-CO') => {
    return formatDate(date, locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

/**
 * Formatea una fecha como tiempo relativo (ej: "hace 2 horas").
 * @param {Date|string|number} date - La fecha a formatear.
 * @param {string} locale - El código de localización (por defecto 'es-CO').
 * @returns {string} El tiempo relativo formateado.
 */
export const formatRelativeTime = (date, locale = 'es-CO') => {
    try {
        const now = new Date();
        const target = new Date(date);
        const diffMs = now - target;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
        
        if (diffSeconds < 60) {
            return rtf.format(-diffSeconds, 'second');
        } else if (diffMinutes < 60) {
            return rtf.format(-diffMinutes, 'minute');
        } else if (diffHours < 24) {
            return rtf.format(-diffHours, 'hour');
        } else if (diffDays < 30) {
            return rtf.format(-diffDays, 'day');
        } else {
            return formatDate(date, locale);
        }
    } catch (error) {
        console.error('Error formateando tiempo relativo:', error);
        return '---';
    }
};

/**
 * Formatea el tamaño de un archivo en bytes a formato legible.
 * @param {number} bytes - Tamaño en bytes.
 * @param {number} decimals - Número de decimales a mostrar.
 * @returns {string} Tamaño formateado (ej: "1.5 MB").
 */
export const formatFileSize = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================

/**
 * Valida si un string es un email válido.
 * @param {string} email - El email a validar.
 * @returns {boolean} True si es válido, false si no.
 */
export const isValidEmail = (email) => {
    if (typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

/**
 * Valida si un string es un número de teléfono válido.
 * @param {string} phone - El teléfono a validar.
 * @returns {boolean} True si es válido, false si no.
 */
export const isValidPhone = (phone) => {
    if (typeof phone !== 'string') return false;
    // Permite formatos internacionales y locales
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Valida si un string es una URL válida.
 * @param {string} url - La URL a validar.
 * @returns {boolean} True si es válido, false si no.
 */
export const isValidUrl = (url) => {
    if (typeof url !== 'string') return false;
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

/**
 * Valida si un valor es un número válido.
 * @param {any} value - El valor a validar.
 * @returns {boolean} True si es un número válido.
 */
export const isValidNumber = (value) => {
    if (typeof value === 'number') return !isNaN(value);
    if (typeof value === 'string') {
        const num = parseFloat(value);
        return !isNaN(num) && isFinite(num);
    }
    return false;
};

/**
 * Valida si un string tiene longitud mínima.
 * @param {string} str - El string a validar.
 * @param {number} minLength - Longitud mínima requerida.
 * @returns {boolean} True si cumple con la longitud mínima.
 */
export const hasMinLength = (str, minLength = 1) => {
    return typeof str === 'string' && str.trim().length >= minLength;
};

/**
 * Valida si un string tiene longitud máxima.
 * @param {string} str - El string a validar.
 * @param {number} maxLength - Longitud máxima permitida.
 * @returns {boolean} True si cumple con la longitud máxima.
 */
export const hasMaxLength = (str, maxLength = 255) => {
    return typeof str === 'string' && str.length <= maxLength;
};

// ============================================
// FUNCIONES DE MANIPULACIÓN DE STRINGS
// ============================================

/**
 * Capitaliza la primera letra de un string.
 * @param {string} str - El string a capitalizar.
 * @returns {string} El string capitalizado.
 */
export const capitalize = (str) => {
    if (typeof str !== 'string' || !str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Capitaliza cada palabra de un string.
 * @param {string} str - El string a capitalizar.
 * @returns {string} El string con cada palabra capitalizada.
 */
export const capitalizeWords = (str) => {
    if (typeof str !== 'string' || !str) return '';
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

/**
 * Limpia una cadena de texto para evitar inyecciones HTML básicas (XSS).
 * @param {string} str - La cadena a limpiar.
 * @returns {string} La cadena limpia.
 */
export const sanitizeHtml = (str) => {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

/**
 * Convierte un string a slug (URL amigable).
 * @param {string} str - El string a convertir.
 * @returns {string} El slug generado.
 */
export const slugify = (str) => {
    if (typeof str !== 'string') return '';
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

/**
 * Trunca un string a una longitud máxima agregando puntos suspensivos.
 * @param {string} str - El string a truncar.
 * @param {number} maxLength - Longitud máxima.
 * @returns {string} El string truncado.
 */
export const truncate = (str, maxLength = 100) => {
    if (typeof str !== 'string') return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
};

// ============================================
// FUNCIONES DE MANEJO DE STORAGE
// ============================================

/**
 * Wrapper para localStorage con manejo de JSON y errores.
 */
export const storage = {
    /**
     * Obtiene un valor del localStorage.
     * @param {string} key - La clave del valor.
     * @returns {any} El valor parseado o null si no existe.
     */
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Error leyendo del localStorage (${key}):`, error);
            return null;
        }
    },
    
    /**
     * Guarda un valor en el localStorage.
     * @param {string} key - La clave del valor.
     * @param {any} value - El valor a guardar.
     * @returns {boolean} True si se guardó correctamente.
     */
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error guardando en localStorage (${key}):`, error);
            return false;
        }
    },
    
    /**
     * Elimina un valor del localStorage.
     * @param {string} key - La clave del valor a eliminar.
     * @returns {boolean} True si se eliminó correctamente.
     */
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error eliminando del localStorage (${key}):`, error);
            return false;
        }
    },
    
    /**
     * Limpia todo el localStorage.
     * @returns {boolean} True si se limpió correctamente.
     */
    clear: () => {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error limpiando localStorage:', error);
            return false;
        }
    }
};

// ============================================
// FUNCIONES DE AYUDA GENERALES
// ============================================

/**
 * Devuelve una promesa que se resuelve después de un tiempo.
 * @param {number} ms - Milisegundos a esperar.
 * @returns {Promise<void>}
 */
export const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Genera un ID único.
 * @param {number} length - Longitud del ID (por defecto 8).
 * @returns {string} Un ID único.
 */
export const generateId = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Clona profundamente un objeto o array.
 * @param {any} obj - El objeto a clonar.
 * @returns {any} El objeto clonado.
 */
export const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (obj instanceof Object) {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
};

/**
 * Une dos objetos de forma profunda.
 * @param {object} target - Objeto target.
 * @param {object} source - Objeto source.
 * @returns {object} Objeto fusionado.
 */
export const deepMerge = (target, source) => {
    const output = { ...target };
    
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    output[key] = source[key];
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                output[key] = source[key];
            }
        });
    }
    
    return output;
};

/**
 * Verifica si un valor es un objeto plano.
 * @param {any} item - El valor a verificar.
 * @returns {boolean} True si es un objeto plano.
 */
export const isObject = (item) => {
    return item && typeof item === 'object' && !Array.isArray(item);
};

/**
 * Obtiene parámetros de la URL actual.
 * @returns {object} Objeto con los parámetros de la URL.
 */
export const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
};

/**
 * Actualiza los parámetros de la URL sin recargar la página.
 * @param {object} params - Objeto con los parámetros a actualizar.
 */
export const updateUrlParams = (params) => {
    const url = new URL(window.location);
    Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === '' || params[key] === undefined) {
            url.searchParams.delete(key);
        } else {
            url.searchParams.set(key, params[key]);
        }
    });
    window.history.replaceState({}, '', url);
};

/**
 * Scroll suave a un elemento.
 * @param {string|HTMLElement} target - Selector o elemento a scrollear.
 * @param {number} offset - Offset adicional en píxeles.
 */
export const smoothScroll = (target, offset = 0) => {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;
    
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
};

/**
 * Copia texto al portapapeles.
 * @param {string} text - Texto a copiar.
 * @returns {Promise<boolean>} True si se copió correctamente.
 */
export const copyToClipboard = async (text) => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback para navegadores antiguos
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        }
    } catch (error) {
        console.error('Error copiando al portapapeles:', error);
        return false;
    }
};

// ============================================
// FUNCIONES DE DETECCIÓN DE DISPOSITIVOS
// ============================================

/**
 * Detecta si el dispositivo es móvil.
 * @returns {boolean} True si es móvil.
 */
export const isMobile = () => {
    return window.innerWidth <= 768;
};

/**
 * Detecta si el dispositivo es tablet.
 * @returns {boolean} True si es tablet.
 */
export const isTablet = () => {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
};

/**
 * Detecta si el dispositivo es desktop.
 * @returns {boolean} True si es desktop.
 */
export const isDesktop = () => {
    return window.innerWidth > 1024;
};

/**
 * Detecta si el dispositivo tiene touch.
 * @returns {boolean} True si tiene capacidad touch.
 */
export const isTouchDevice = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// ============================================
// OBJETO UTILS COMPLETO (para compatibilidad)
// ============================================

/**
 * Objeto completo de utilidades para exportación por defecto.
 */
const UTILS = {
    // Funciones de timing
    debounce,
    throttle,
    sleep,
    
    // Funciones de formateo
    formatPrice,
    formatPriceDecimal,
    formatDate,
    formatDateTime,
    formatRelativeTime,
    formatFileSize,
    
    // Funciones de validación
    isValidEmail,
    isValidPhone,
    isValidUrl,
    isValidNumber,
    hasMinLength,
    hasMaxLength,
    
    // Funciones de strings
    capitalize,
    capitalizeWords,
    sanitizeHtml,
    slugify,
    truncate,
    
    // Storage
    storage,
    
    // Funciones generales
    generateId,
    deepClone,
    deepMerge,
    isObject,
    getUrlParams,
    updateUrlParams,
    smoothScroll,
    copyToClipboard,
    
    // Detección de dispositivos
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice
};

// ============================================
// EXPORTACIONES
// ============================================

// Exportar todas las funciones individualmente
export {
    debounce,
    throttle,
    formatPrice,
    formatPriceDecimal,
    formatDate,
    formatDateTime,
    formatRelativeTime,
    formatFileSize,
    isValidEmail,
    isValidPhone,
    isValidUrl,
    isValidNumber,
    hasMinLength,
    hasMaxLength,
    capitalize,
    capitalizeWords,
    sanitizeHtml,
    slugify,
    truncate,
    storage,
    sleep,
    generateId,
    deepClone,
    deepMerge,
    isObject,
    getUrlParams,
    updateUrlParams,
    smoothScroll,
    copyToClipboard,
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice
};

// Exportar el objeto completo para compatibilidad
export default UTILS;