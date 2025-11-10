// Utilitário para fazer requisições à API
import API_BASE_URL from '../config/api';

/**
 * Faz uma requisição à API
 * @param {string} endpoint - Endpoint da API (sem /api no início)
 * @param {object} options - Opções do fetch
 * @returns {Promise} Resposta da API
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultHeaders = {
    ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, config);
    return response;
  } catch (error) {
    console.error(`Erro na requisição para ${url}:`, error);
    throw error;
  }
};

/**
 * Faz uma requisição GET à API
 */
export const apiGet = async (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'GET' });
};

/**
 * Faz uma requisição POST à API
 */
export const apiPost = async (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: data instanceof FormData ? data : JSON.stringify(data),
  });
};

/**
 * Faz uma requisição PUT à API
 */
export const apiPut = async (endpoint, data, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: data instanceof FormData ? data : JSON.stringify(data),
  });
};

/**
 * Faz uma requisição DELETE à API
 */
export const apiDelete = async (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'DELETE' });
};

export default { apiRequest, apiGet, apiPost, apiPut, apiDelete };
