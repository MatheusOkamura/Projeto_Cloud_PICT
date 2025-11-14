import { createContext, useState, useContext, useEffect } from 'react';
import API_BASE_URL from '../config/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se há usuário e token salvos no localStorage
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    
    setLoading(false);
  }, []);

  const loginWithOAuth = () => {
    // Redirecionar para endpoint OAuth do backend
    window.location.href = `${API_BASE_URL}/auth/login`;
  };

  const handleOAuthCallback = (token, userData, isNewUser) => {
    // Salvar token e dados do usuário após OAuth callback
    setToken(token);
    setUser(userData);
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    return { user: userData, is_new_user: isNewUser };
  };

  const login = async (email, senha) => {
    // Login legado (compatibilidade)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/legacy-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });

      // Tentar fazer parse do JSON da resposta
      let data = null;
      let errorData = null;
      
      try {
        const text = await response.text();
        if (text) {
          data = JSON.parse(text);
        }
      } catch (parseError) {
        console.error('Erro ao fazer parse da resposta:', parseError);
        throw new Error('Erro na comunicação com o servidor. Por favor, tente novamente.');
      }

      if (!response.ok) {
        const errorMessage = data?.detail || data?.message || 'Credenciais inválidas';
        throw new Error(errorMessage);
      }

      if (!data) {
        throw new Error('Resposta vazia do servidor');
      }

      const userData = data.user;
      const accessToken = data.access_token;
      
      if (!userData || !accessToken) {
        throw new Error('Dados de autenticação incompletos');
      }
      
      setUser(userData);
      setToken(accessToken);
      
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', accessToken);
      
      return { user: userData, is_new_user: data.is_new_user };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      
      // Se for erro de rede
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão.');
      }
      
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const refreshUser = async () => {
    // Recarrega os dados do usuário do backend
    if (!user?.id || !token) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        // Parse seguro do JSON
        const text = await response.text();
        if (text && text.trim() !== '') {
          try {
            const userData = JSON.parse(text);
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } catch (parseError) {
            console.error('Erro ao fazer parse dos dados do usuário:', parseError);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao recarregar dados do usuário:', error);
    }
  };

  const value = {
    user,
    token,
    login,
    loginWithOAuth,
    handleOAuthCallback,
    logout,
    updateUser,
    refreshUser,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
