import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';

const EnviarApresentacaoAmostra = () => {
  const { user } = useAuth();
  const [descricao, setDescricao] = useState('');
  const [arquivo, setArquivo] = useState(null);
  const [sending, setSending] = useState(false);
  const [jaEnviou, setJaEnviou] = useState(false);
  const [entregaExistente, setEntregaExistente] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar se já enviou a apresentação
  useState(() => {
    const verificarEntrega = async () => {
      if (!user?.id) return;
      
      try {
        const res = await fetch(`http://localhost:8000/api/alunos/${user.id}/verificar-entrega/apresentacao`);
        if (res.ok) {
          const data = await res.json();
          setJaEnviou(data.ja_enviou);
          setEntregaExistente(data.entrega);
        }
      } catch (err) {
        console.error('Erro ao verificar entrega:', err);
      } finally {
        setLoading(false);
      }
    };
    
    verificarEntrega();
  }, [user]);

  const handleFileChange = (e) => {
    setArquivo(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!arquivo) return alert('Selecione o arquivo da apresentação de amostra.');
    setSending(true);
    const fd = new FormData();
    fd.append('etapa', 'apresentacao');
    fd.append('descricao', descricao);
    fd.append('arquivo', arquivo);
    try {
      const res = await fetch(`http://localhost:8000/api/alunos/${user?.id}/entrega-etapa`, {
        method: 'POST',
        body: fd,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Falha ao enviar apresentação de amostra');
      }
      
      alert('Apresentação de amostra enviada com sucesso!');
      setJaEnviou(true);
      setEntregaExistente({
        titulo: 'Apresentação de Amostra',
        data_entrega: new Date().toISOString(),
        arquivo: data.arquivo
      });
      setDescricao('');
      setArquivo(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ibmec-blue-50 to-gray-100 py-8 px-4">
        <div className="container mx-auto max-w-3xl">
          <Card>
            <div className="text-center py-12">
              <div className="animate-spin text-6xl mb-4">⏳</div>
              <p className="text-gray-600">Carregando...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Mostrar mensagem de apresentação já enviada
  if (jaEnviou && entregaExistente) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ibmec-blue-50 to-gray-100 py-8 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">✅</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-ibmec-blue-800">Apresentação Enviada</h1>
                <p className="text-gray-600">Sua apresentação foi enviada com sucesso</p>
              </div>
            </div>
          </div>

          <Card>
            <div className="text-center py-8">
              <div className="text-6xl mb-6">🎤</div>
              <h2 className="text-2xl font-bold text-green-600 mb-4">
                Apresentação Enviada!
              </h2>
              <p className="text-gray-700 mb-6">
                Sua apresentação foi enviada em{' '}
                <strong>
                  {new Date(entregaExistente.data_entrega).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </strong>
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3">
                    <span className="text-green-600">📎</span>
                    <div>
                      <p className="font-semibold text-gray-700">Arquivo:</p>
                      <p className="text-sm text-gray-600">{entregaExistente.arquivo || 'Apresentação'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => window.history.back()}
                className="px-8 py-3 bg-ibmec-blue-600 text-white rounded-lg hover:bg-ibmec-blue-700 transition font-semibold"
              >
                ← Voltar ao Dashboard
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ibmec-blue-50 to-gray-100 py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        {/* Header com informações */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🎤</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-ibmec-blue-800">Enviar Apresentação de Amostra</h1>
              <p className="text-gray-600">Compartilhe seus slides e material da apresentação</p>
            </div>
          </div>
          
          {/* Alerta informativo */}
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <h3 className="font-semibold text-purple-800 mb-1">Sobre a Apresentação</h3>
                <p className="text-sm text-gray-700">
                  Prepare slides claros e objetivos sobre seu projeto. A apresentação deve incluir 
                  introdução, metodologia, resultados e conclusões preliminares.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Upload de arquivo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📎 Arquivo da Apresentação
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition">
                <input 
                  type="file" 
                  accept=".pdf,.ppt,.pptx" 
                  onChange={handleFileChange} 
                  required 
                  className="hidden" 
                  id="arquivo-upload"
                />
                <label htmlFor="arquivo-upload" className="cursor-pointer">
                  <div className="text-5xl mb-3">📊</div>
                  {arquivo ? (
                    <div className="space-y-2">
                      <p className="text-green-600 font-semibold">✅ Arquivo selecionado:</p>
                      <p className="text-sm text-gray-700 font-medium">{arquivo.name}</p>
                      <p className="text-xs text-gray-500">
                        {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button 
                        type="button"
                        onClick={() => setArquivo(null)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium mt-2"
                      >
                        🗑️ Remover arquivo
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-700 font-medium mb-2">
                        Clique para selecionar o arquivo
                      </p>
                      <p className="text-sm text-gray-500">
                        Formatos aceitos: PDF, PPT, PPTX
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📝 Observações e Comentários (opcional)
              </label>
              <textarea 
                value={descricao} 
                onChange={e => setDescricao(e.target.value)} 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows="4" 
                placeholder="Adicione informações sobre a apresentação, pontos de destaque, tempo estimado, etc..."
              ></textarea>
              <p className="text-xs text-gray-500 mt-1">
                ℹ️ Use este campo para dar contexto sobre sua apresentação
              </p>
            </div>

            {/* Botões */}
            <div className="flex justify-between items-center pt-4 border-t">
              <button 
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                ← Voltar
              </button>
              <button 
                type="submit" 
                disabled={sending || !arquivo} 
                className={`px-8 py-3 rounded-lg font-semibold transition transform ${
                  sending || !arquivo
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 hover:scale-105 shadow-md'
                }`}
              >
                {sending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Enviando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>📤</span>
                    Enviar Apresentação
                  </span>
                )}
              </button>
            </div>
          </form>
        </Card>

        {/* Dicas */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-5">
          <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
            <span>⚠️</span>
            Dicas para sua Apresentação
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>Mantenha os slides visuais e objetivos (10-15 slides é ideal)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>Use gráficos e imagens para ilustrar seus resultados</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>Prepare-se para responder perguntas sobre sua pesquisa</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>Pratique sua apresentação antes do evento</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EnviarApresentacaoAmostra;
