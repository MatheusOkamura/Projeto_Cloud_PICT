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
  const { login, loginWithOAuth } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleOAuthLogin = () => {
    setError('');
    setLoading(true);
    
    // Redirecionar para endpoint OAuth
    loginWithOAuth();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Login legado (com formulário)
      const result = await login(formData.email, formData.senha);
      const userData = result.user;
      
      // Verificar se precisa completar cadastro
      const alunoSemDados = userData.tipo === 'aluno' && (
        !userData.curso || 
        !userData.matricula || 
        !userData.cpf || 
        !userData.telefone
      );
      
      const orientadorSemDados = userData.tipo === 'orientador' && (
        !userData.nome ||
        !userData.departamento ||
        !userData.telefone
      );
      
      const precisaCompletarCadastro = alunoSemDados || orientadorSemDados;
      
      // Redirecionar baseado em se precisa completar cadastro
      if (precisaCompletarCadastro) {
        // Usuário sem dados completos -> formulário de completar cadastro
        navigate('/cadastro', { state: { email: userData.email, nome: userData.nome } });
      } else {
        // Usuário com dados completos -> dashboard
        switch (userData.tipo) {
          case 'aluno':
            navigate('/dashboard-aluno');
            break;
          case 'orientador':
            navigate('/dashboard-orientador');
            break;
          case 'coordenador':
            navigate('/dashboard-coordenador');
            break;
          default:
            navigate('/');
        }
      }
      
    } catch (err) {
      console.error('Erro no login:', err);
      setError(err.message || 'Erro ao fazer login. Tente novamente.');
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

          {/* Login OAuth com Microsoft Entra ID */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleOAuthLogin}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-3 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Redirecionando...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 23 23">
                    <path d="M0 0h11v11H0z" fill="#f25022" />
                    <path d="M12 0h11v11H12z" fill="#7fba00" />
                    <path d="M0 12h11v11H0z" fill="#00a4ef" />
                    <path d="M12 12h11v11H12z" fill="#ffb900" />
                  </svg>
                  <span>Entrar com Microsoft</span>
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              ✅ Recomendado: Login seguro com sua conta institucional
            </p>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Ou use o formulário</span>
            </div>
          </div>

          {/* Formulário de Login Legado */}
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
              Não tem uma conta? Use seu e-mail institucional para criar.
            </p>
          </div>

          {/* Dica de demonstração */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2">
              <strong>💡 Para demonstração:</strong>
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• <strong>Usuários existentes:</strong> aluno@alunos.ibmec.edu.br, orientador@orientador.ibmec.edu.br, coordenador@coordenador.ibmec.edu.br</li>
              <li>• <strong>Novos usuários:</strong> Use qualquer e-mail com @alunos, @professores ou @coordenador</li>
              <li>• <strong>Tipo detectado automaticamente:</strong> @alunos → aluno, @professores/@orientador → orientador, @coordenador → coordenador</li>
              <li className="mt-2">Senha: qualquer valor (ex: 123456)</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
