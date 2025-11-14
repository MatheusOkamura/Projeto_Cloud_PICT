/**
 * Utilitários para fazer requisições fetch com tratamento de erro robusto
 */

/**
 * Parse seguro de resposta JSON
 * @param {Response} response - Objeto Response do fetch
 * @returns {Promise<any>} - Dados parseados ou null
 */
export const safeJsonParse = async (response) => {
  try {
    const text = await response.text();
    if (!text || text.trim() === '') {
      return null;
    }
    return JSON.parse(text);
  } catch (parseError) {
    console.error('❌ Erro ao fazer parse da resposta JSON:', parseError);
    throw new Error('Erro na comunicação com o servidor. Resposta inválida.');
  }
};

/**
 * Fetch com tratamento de erro completo
 * @param {string} url - URL da requisição
 * @param {object} options - Opções do fetch
 * @returns {Promise<any>} - Dados da resposta
 */
export const safeFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    
    // Parse da resposta
    const data = await safeJsonParse(response);
    
    // Verificar se teve erro HTTP
    if (!response.ok) {
      const errorMessage = data?.detail || data?.message || `Erro HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    
    // Verificar se resposta está vazia quando não deveria
    if (!data && response.status === 200) {
      throw new Error('Resposta vazia do servidor');
    }
    
    return data;
    
  } catch (error) {
    // Erro de rede
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão.');
    }
    
    // Timeout
    if (error.name === 'AbortError') {
      throw new Error('Requisição demorou muito e foi cancelada.');
    }
    
    // Propagar outros erros
    throw error;
  }
};

/**
 * POST com tratamento de erro
 * @param {string} url - URL da requisição
 * @param {object} body - Corpo da requisição
 * @param {object} headers - Headers adicionais
 * @returns {Promise<any>} - Dados da resposta
 */
export const safePost = async (url, body, headers = {}) => {
  return safeFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
};

/**
 * GET com tratamento de erro
 * @param {string} url - URL da requisição
 * @param {object} headers - Headers adicionais
 * @returns {Promise<any>} - Dados da resposta
 */
export const safeGet = async (url, headers = {}) => {
  return safeFetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
};

/**
 * PUT com tratamento de erro
 * @param {string} url - URL da requisição
 * @param {object} body - Corpo da requisição
 * @param {object} headers - Headers adicionais
 * @returns {Promise<any>} - Dados da resposta
 */
export const safePut = async (url, body, headers = {}) => {
  return safeFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
};

/**
 * DELETE com tratamento de erro
 * @param {string} url - URL da requisição
 * @param {object} headers - Headers adicionais
 * @returns {Promise<any>} - Dados da resposta
 */
export const safeDelete = async (url, headers = {}) => {
  return safeFetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
};
