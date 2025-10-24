const API_CONFIG = {
  // URL del backend según el entorno
  baseURL: import.meta.env.VITE_API_URL || 
           import.meta.env.REACT_APP_API_URL || 
           'https://proyecto-mercado-web.onrender.com',
  
  // Timeout de peticiones
  timeout: 10000,
  
  // Headers por defecto
  headers: {
    'Content-Type': 'application/json'
  }
};

export default API_CONFIG;