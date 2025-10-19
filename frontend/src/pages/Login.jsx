import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simulação de login - em produção, usar API real
      // Por enquanto, vamos simular baseado no email
      let userData = null;
      
      if (formData.email.includes('aluno')) {
        userData = {
          id: 1,
          nome: 'João Silva',
          email: formData.email,
          tipo: 'aluno',
          curso: 'Administração',
          status: 'ativo'
        };
      } else if (formData.email.includes('orientador')) {
        userData = {
          id: 2,
          nome: 'Prof. Maria Santos',
          email: formData.email,
          tipo: 'orientador',
          departamento: 'Gestão'
        };
      } else if (formData.email.includes('coordenador')) {
        userData = {
          id: 3,
          nome: 'Prof. Dr. Carlos Oliveira',
          email: formData.email,
          tipo: 'coordenador',
          departamento: 'Coordenação de Pesquisa'
        };
      } else {
        throw new Error('Usuário não encontrado');
      }

      // Salvar no contexto
      localStorage.setItem('user', JSON.stringify(userData));
      window.location.href = `/dashboard/${userData.tipo}`;
      
    } catch (err) {
      setError('Email ou senha inválidos. Tente: aluno@ibmec.edu.br, orientador@ibmec.edu.br ou coordenador@ibmec.edu.br');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ibmec-blue-50 to-ibmec-gold-50 py-12 px-4">
      <div className="container mx-auto max-w-md">
        <Card>
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-ibmec-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-3xl">🔐</span>
            </div>
            <h1 className="text-3xl font-bold text-ibmec-blue-800 mb-2">Login</h1>
            <p className="text-gray-600">Acesse sua conta</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="label">
                E-mail Institucional
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="seu.email@ibmec.edu.br"
              />
            </div>

            <div>
              <label htmlFor="senha" className="label">
                Senha
              </label>
              <input
                type="password"
                id="senha"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-gray-600">Lembrar-me</span>
              </label>
              <a href="#" className="text-ibmec-blue-600 hover:text-ibmec-blue-700">
                Esqueceu a senha?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-gray-600">
              Não tem uma conta?{' '}
              <Link to="/cadastro" className="text-ibmec-blue-600 hover:text-ibmec-blue-700 font-semibold">
                Inscreva-se aqui
              </Link>
            </p>
          </div>

          {/* Dica de demonstração */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">
              <strong>💡 Para demonstração, use:</strong>
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• <strong>Aluno:</strong> aluno@ibmec.edu.br</li>
              <li>• <strong>Orientador:</strong> orientador@ibmec.edu.br</li>
              <li>• <strong>Coordenador:</strong> coordenador@ibmec.edu.br</li>
              <li className="mt-2">Senha: qualquer valor</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
