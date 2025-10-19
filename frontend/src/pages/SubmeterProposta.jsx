import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';

const SubmeterProposta = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    titulo_projeto: '',
    area_conhecimento: '',
    descricao: '',
    objetivos: '',
    metodologia: '',
    resultados_esperados: '',
    arquivo: null
  });

  const areasConhecimento = [
    'Administração',
    'Ciência da Computação',
    'Direito',
    'Economia',
    'Engenharia',
    'Relações Internacionais',
    'Comunicação Social',
    'Psicologia',
    'Outro'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validar tipo de arquivo
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('Por favor, envie apenas arquivos PDF ou Word (.doc, .docx)');
        e.target.value = '';
        return;
      }
      
      // Validar tamanho (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('O arquivo deve ter no máximo 10MB');
        e.target.value = '';
        return;
      }
      
      setError('');
      setFormData(prev => ({
        ...prev,
        arquivo: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validação básica
      if (!formData.titulo_projeto || !formData.area_conhecimento || !formData.descricao) {
        setError('Por favor, preencha todos os campos obrigatórios');
        setLoading(false);
        return;
      }

      // Criar FormData para enviar arquivo
      const submitData = new FormData();
      submitData.append('usuario_id', user.id);
      submitData.append('titulo_projeto', formData.titulo_projeto);
      submitData.append('area_conhecimento', formData.area_conhecimento);
      submitData.append('descricao', formData.descricao);
      submitData.append('objetivos', formData.objetivos);
      submitData.append('metodologia', formData.metodologia);
      submitData.append('resultados_esperados', formData.resultados_esperados);
      
      if (formData.arquivo) {
        submitData.append('projeto', formData.arquivo);
      }

      // Enviar para API
      const response = await fetch('http://localhost:8000/api/inscricoes/proposta', {
        method: 'POST',
        body: submitData
      });

      if (!response.ok) {
        throw new Error('Erro ao submeter proposta');
      }

      const result = await response.json();
      
      // Redirecionar para dashboard do aluno
      navigate('/dashboard/aluno');
      
    } catch (err) {
      setError(err.message || 'Erro ao submeter proposta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ibmec-blue-50 to-gray-100 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-ibmec-blue-800 mb-2">
            📝 Submeter Proposta de Iniciação Científica
          </h1>
          <p className="text-gray-600">
            Preencha os dados abaixo para submeter sua proposta de projeto
          </p>
        </div>

        {/* Informações do Aluno */}
        <Card className="mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="text-4xl">👤</div>
            <div>
              <h2 className="text-xl font-bold text-ibmec-blue-800">{user?.nome}</h2>
              <p className="text-gray-600">{user?.email}</p>
              <p className="text-sm text-gray-500">Curso: {user?.curso}</p>
            </div>
          </div>
        </Card>

        {/* Formulário */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <p className="text-red-700">⚠️ {error}</p>
              </div>
            )}

            {/* Título do Projeto */}
            <div>
              <label className="label">
                Título do Projeto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="titulo_projeto"
                value={formData.titulo_projeto}
                onChange={handleChange}
                className="input-field"
                placeholder="Ex: Análise do Impacto da Tecnologia no Mercado Financeiro"
                required
                maxLength={200}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.titulo_projeto.length}/200 caracteres
              </p>
            </div>

            {/* Área de Conhecimento */}
            <div>
              <label className="label">
                Área de Conhecimento <span className="text-red-500">*</span>
              </label>
              <select
                name="area_conhecimento"
                value={formData.area_conhecimento}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Selecione uma área</option>
                {areasConhecimento.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            {/* Descrição */}
            <div>
              <label className="label">
                Descrição do Projeto <span className="text-red-500">*</span>
              </label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                className="input-field"
                rows="4"
                placeholder="Descreva brevemente seu projeto de pesquisa..."
                required
                maxLength={1000}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.descricao.length}/1000 caracteres
              </p>
            </div>

            {/* Objetivos */}
            <div>
              <label className="label">
                Objetivos da Pesquisa
              </label>
              <textarea
                name="objetivos"
                value={formData.objetivos}
                onChange={handleChange}
                className="input-field"
                rows="3"
                placeholder="Quais são os objetivos principais desta pesquisa?"
                maxLength={500}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.objetivos.length}/500 caracteres
              </p>
            </div>

            {/* Metodologia */}
            <div>
              <label className="label">
                Metodologia
              </label>
              <textarea
                name="metodologia"
                value={formData.metodologia}
                onChange={handleChange}
                className="input-field"
                rows="3"
                placeholder="Como você pretende desenvolver a pesquisa?"
                maxLength={500}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.metodologia.length}/500 caracteres
              </p>
            </div>

            {/* Resultados Esperados */}
            <div>
              <label className="label">
                Resultados Esperados
              </label>
              <textarea
                name="resultados_esperados"
                value={formData.resultados_esperados}
                onChange={handleChange}
                className="input-field"
                rows="3"
                placeholder="Quais resultados você espera alcançar com esta pesquisa?"
                maxLength={500}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.resultados_esperados.length}/500 caracteres
              </p>
            </div>

            {/* Upload de Arquivo */}
            <div>
              <label className="label">
                Documento do Projeto (Opcional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-ibmec-blue-400 transition">
                <div className="text-4xl mb-2">📄</div>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  id="arquivo"
                />
                <label htmlFor="arquivo" className="cursor-pointer">
                  {formData.arquivo ? (
                    <div>
                      <p className="text-green-600 font-semibold mb-1">
                        ✅ {formData.arquivo.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(formData.arquivo.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className="text-sm text-ibmec-blue-600 mt-2 hover:underline">
                        Clique para alterar
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-700 font-semibold mb-1">
                        Clique para selecionar um arquivo
                      </p>
                      <p className="text-sm text-gray-500">
                        PDF ou Word (.doc, .docx) - Máx. 10MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                💡 Você pode anexar uma versão completa do seu projeto em PDF ou Word
              </p>
            </div>

            {/* Informações Importantes */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-bold text-ibmec-blue-800 mb-2">ℹ️ Informações Importantes</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Após submeter, sua proposta será analisada pela coordenação</li>
                <li>• O prazo de análise é de até 30 dias</li>
                <li>• Você receberá feedback sobre sua proposta</li>
                <li>• Os campos marcados com * são obrigatórios</li>
              </ul>
            </div>

            {/* Botões */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard/aluno')}
                className="btn-outline flex-1"
                disabled={loading}
              >
                ← Voltar
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  '✉️ Submeter Proposta'
                )}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SubmeterProposta;
