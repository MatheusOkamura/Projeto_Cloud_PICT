import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/Card';

const Cadastro = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    curso: '',
    tipo: 'aluno',
    telefone: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const cursos = [
    'Administração',
    'Ciências Contábeis',
    'Direito',
    'Economia',
    'Engenharia de Produção',
    'Relações Internacionais'
  ];

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
    setLoading(true);

    try {
      // Simulação de envio para API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Dados enviados:', formData);
      setSuccess(true);
      
      // Redirecionar após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao enviar:', error);
      alert('Erro ao enviar inscrição. Tente novamente.');
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
            Cadastro realizado com sucesso!
          </h2>
          <p className="text-gray-600 mb-6">
            Sua conta foi criada. Você já pode fazer login para acessar o sistema e submeter sua proposta.
          </p>
          <p className="text-sm text-gray-500">
            Redirecionando para o login...
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
              Cadastro de Conta
            </h1>
            <p className="text-gray-600">Crie sua conta para acessar o sistema</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Usuário */}
            <div>
              <label className="label">Tipo de Conta *</label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="aluno">Aluno</option>
                <option value="orientador">Orientador</option>
              </select>
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

            {/* Email e CPF */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="label">E-mail Institucional *</label>
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

            {/* Curso e Telefone */}
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
                      <option key={curso} value={curso}>{curso}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    id="curso"
                    name="curso"
                    value={formData.curso}
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
                {loading ? 'Criando...' : 'Criar Conta'}
              </button>
              <Link to="/" className="btn-outline flex-1 text-center">
                Cancelar
              </Link>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-gray-600">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-ibmec-blue-600 hover:text-ibmec-blue-700 font-semibold">
                Faça login
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Cadastro;
