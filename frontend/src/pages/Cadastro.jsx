import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import API_BASE_URL from '../config/api';

const Cadastro = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    curso: '',
    tipo: 'aluno',
    telefone: '',
    // Novos campos
    unidade: '',
    matricula: '',
    departamento: '', // Para orientadores
    area_pesquisa: '', // Para orientadores
    titulacao: '' // Para orientadores
  });
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Carregar dados do usuário logado
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setFormData(prev => ({
        ...prev,
        email: userData.email || '',
        tipo: userData.tipo || 'aluno'
      }));
    } else {
      // Se não há usuário logado, redirecionar para login
      navigate('/login');
    }

    // Carregar lista de cursos do backend
    fetch(`${API_BASE_URL}/cursos`)
      .then(res => res.json())
      .then(data => setCursos(data.cursos || []))
      .catch(err => console.error('Erro ao carregar cursos:', err));
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Removido upload de proposta do cadastro. Propostas serão enviadas após o login.

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Limpar erro anterior
    setError('');
    
    setLoading(true);

    try {
      // Preparar dados para enviar ao backend
      const dadosCadastro = {
        email: formData.email,
        nome: formData.nome,
        cpf: formData.cpf,
        telefone: formData.telefone
      };

      // Adicionar campos específicos para alunos
      if (formData.tipo === 'aluno') {
        dadosCadastro.curso = formData.curso;
        dadosCadastro.unidade = formData.unidade;
        dadosCadastro.matricula = formData.matricula;
      } else if (formData.tipo === 'orientador') {
        dadosCadastro.departamento = formData.departamento;
        dadosCadastro.area_pesquisa = formData.area_pesquisa;
        dadosCadastro.titulacao = formData.titulacao;
      }

      // Enviar dados para o backend
      console.log('📤 Enviando dados para completar cadastro:', dadosCadastro);
      
      const response = await fetch(`${API_BASE_URL}/auth/completar-cadastro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosCadastro)
      });

      console.log('📥 Resposta recebida:', response.status, response.statusText);

      // Parse seguro da resposta
      let result = null;
      try {
        const text = await response.text();
        if (text) {
          result = JSON.parse(text);
        }
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse da resposta:', parseError);
        throw new Error('Erro na comunicação com o servidor. Por favor, tente novamente.');
      }

      if (!response.ok) {
        console.error('❌ Erro do servidor:', result);
        const errorMessage = result?.detail || result?.message || 'Erro ao completar cadastro';
        throw new Error(errorMessage);
      }

      if (!result) {
        throw new Error('Resposta vazia do servidor');
      }

      console.log('✅ Cadastro completado:', result);

      // Atualizar dados do usuário no localStorage E no contexto
      const updatedUser = result.user;
      console.log('👤 Atualizando usuário:', updatedUser);
      
      // Atualizar no contexto (que também atualiza o localStorage)
      updateUser(updatedUser);
      
      setSuccess(true);
      console.log('✅ Estado success atualizado para true');
      
      // Redirecionar para o dashboard após 2 segundos
      const dashboardUrl = `/dashboard-${updatedUser.tipo}`;
      console.log('🔄 Redirecionando para:', dashboardUrl);
      setTimeout(() => {
        navigate(dashboardUrl, { replace: true });
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erro ao enviar:', error);
      
      // Mensagem de erro mais específica
      let errorMessage = 'Erro ao completar cadastro. Tente novamente.';
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ibmec-blue-50 to-ibmec-gold-50 py-12 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-ibmec-blue-800 mb-4">
            Cadastro completado com sucesso!
          </h2>
          <p className="text-gray-600 mb-6">
            Seus dados foram salvos. Você será redirecionado para o dashboard.
          </p>
          <p className="text-sm text-gray-500">
            Redirecionando...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ibmec-blue-50 to-ibmec-gold-50 py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <Card>
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-ibmec-gold-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-3xl">📝</span>
            </div>
            <h1 className="text-3xl font-bold text-ibmec-blue-800 mb-2">
              Complete seu Cadastro
            </h1>
            <p className="text-gray-600">Preencha seus dados para continuar</p>
          </div>

          {/* Mensagem de Erro */}
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold">Erro ao processar cadastro</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Usuário (readonly) */}
            <div>
              <label className="label">Tipo de Conta *</label>
              <input
                type="text"
                value={formData.tipo === 'aluno' ? 'Aluno' : formData.tipo === 'orientador' ? 'Orientador' : 'Coordenador'}
                readOnly
                className="input-field bg-gray-100 cursor-not-allowed capitalize"
              />
            </div>

            {/* Nome Completo */}
            <div>
              <label htmlFor="nome" className="label">Nome Completo *</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Seu nome completo"
              />
            </div>

            {/* E-mail (readonly) e CPF */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="label">E-mail Institucional *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  className="input-field bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="cpf" className="label">CPF *</label>
                <input
                  type="text"
                  id="cpf"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="000.000.000-00"
                  maxLength="14"
                />
              </div>
            </div>

            {/* Curso/Departamento e Telefone */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="curso" className="label">
                  {formData.tipo === 'aluno' ? 'Curso *' : 'Departamento *'}
                </label>
                {formData.tipo === 'aluno' ? (
                  <select
                    id="curso"
                    name="curso"
                    value={formData.curso}
                    onChange={handleChange}
                    required
                    className="input-field"
                  >
                    <option value="">Selecione...</option>
                    {cursos.map(curso => (
                      <option key={curso.id} value={curso.nome}>{curso.nome}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    id="departamento"
                    name="departamento"
                    value={formData.departamento}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="Seu departamento"
                  />
                )}
              </div>

              <div>
                <label htmlFor="telefone" className="label">Telefone *</label>
                <input
                  type="tel"
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="(21) 99999-9999"
                />
              </div>
            </div>

            {/* Campos específicos para ORIENTADORES */}
            {formData.tipo === 'orientador' && (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="area_pesquisa" className="label">Área de Atuação *</label>
                    <input
                      type="text"
                      id="area_pesquisa"
                      name="area_pesquisa"
                      value={formData.area_pesquisa}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="Ex: Inteligência Artificial, Banco de Dados..."
                    />
                  </div>

                  <div>
                    <label htmlFor="titulacao" className="label">Titulação *</label>
                    <select
                      id="titulacao"
                      name="titulacao"
                      value={formData.titulacao}
                      onChange={handleChange}
                      required
                      className="input-field"
                    >
                      <option value="">Selecione...</option>
                      <option value="Graduado">Graduado</option>
                      <option value="Especialista">Especialista</option>
                      <option value="Mestre">Mestre</option>
                      <option value="Doutor">Doutor</option>
                      <option value="Pós-Doutor">Pós-Doutor</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Campos específicos para ALUNOS */}
            {formData.tipo === 'aluno' && (
              <>
                {/* Unidade e Matrícula */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="unidade" className="label">Unidade *</label>
                    <select
                      id="unidade"
                      name="unidade"
                      value={formData.unidade}
                      onChange={handleChange}
                      required
                      className="input-field"
                    >
                      <option value="">Selecione...</option>
                      <option value="Faria Lima">Faria Lima</option>
                      <option value="Paulista">Paulista</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="matricula" className="label">Matrícula *</label>
                    <input
                      type="text"
                      id="matricula"
                      name="matricula"
                      value={formData.matricula}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="Número da matrícula"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Upload removido do cadastro. O envio de propostas será feito após o login. */}

            {/* Termos */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="flex items-start">
                <input type="checkbox" required className="mt-1 mr-3" />
                <span className="text-sm text-gray-600">
                  Declaro que li e concordo com o{' '}
                  <a href="#" className="text-ibmec-blue-600 hover:underline">regulamento do programa</a>
                  {' '}e autorizo o uso de meus dados conforme a{' '}
                  <a href="#" className="text-ibmec-blue-600 hover:underline">política de privacidade</a>.
                </span>
              </label>
            </div>

            {/* Botões */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Salvando...' : 'Completar Cadastro'}
              </button>
              <Link to="/login" className="btn-outline flex-1 text-center">
                Voltar
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Cadastro;
