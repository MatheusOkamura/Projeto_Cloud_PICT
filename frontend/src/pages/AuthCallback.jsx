import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Obter parâmetros da URL
        const token = searchParams.get('token');
        const userEncoded = searchParams.get('user');
        const isNewUser = searchParams.get('is_new_user') === 'true';

        if (!token || !userEncoded) {
          throw new Error('Token ou dados do usuário não encontrados');
        }

        // Decodificar dados do usuário
        const userJson = atob(userEncoded);
        const userData = JSON.parse(userJson);

        console.log('✅ Autenticação OAuth concluída:', userData);

        // Salvar no contexto
        handleOAuthCallback(token, userData, isNewUser);

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

        // Redirecionar baseado no tipo de usuário e status de cadastro
        if (precisaCompletarCadastro) {
          // Usuário sem dados completos - completar cadastro
          navigate('/cadastro', { 
            state: { 
              email: userData.email, 
              nome: userData.nome,
              tipo: userData.tipo 
            } 
          });
        } else {
          // Usuário com dados completos - ir para dashboard apropriado
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
        console.error('❌ Erro ao processar callback OAuth:', err);
        setError(err.message);
        
        // Redirecionar para login após 3 segundos
        setTimeout(() => {
          navigate('/login?error=' + encodeURIComponent(err.message));
        }, 3000);
      }
    };

    processCallback();
  }, [searchParams, navigate, handleOAuthCallback]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Erro na Autenticação
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Redirecionando para a página de login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-4">
          <div className="mx-auto h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Processando Autenticação
        </h2>
        <p className="text-gray-600">
          Aguarde enquanto validamos suas credenciais...
        </p>
      </div>
    </div>
  );
}
