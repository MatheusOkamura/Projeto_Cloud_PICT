import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import API_BASE_URL from '../config/api';

const EnviarRelatorioParcial = () => {
  const { user } = useAuth();
  const [descricao, setDescricao] = useState('');
  const [arquivo, setArquivo] = useState(null);
  const [sending, setSending] = useState(false);
  const [jaEnviou, setJaEnviou] = useState(false);
  const [entregaExistente, setEntregaExistente] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar se já enviou o relatório
  useEffect(() => {
    const verificarEntrega = async () => {
      if (!user?.id) return;
      
      try {
        const res = await fetch(`${API_BASE_URL}/alunos/${user.id}/verificar-entrega/relatorio_parcial`);
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
    if (!arquivo) return alert('Selecione o arquivo do relatório parcial.');
    setSending(true);
    const fd = new FormData();
    fd.append('etapa', 'relatorio_parcial');
    fd.append('descricao', descricao);
    fd.append('arquivo', arquivo);
    try {
      const res = await fetch(`${API_BASE_URL}/alunos/${user?.id}/entrega-etapa`, {
        method: 'POST',
        body: fd,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Falha ao enviar relatório parcial');
      }
      
      alert('Relatório parcial enviado com sucesso!');
      setJaEnviou(true);
      setEntregaExistente({
        titulo: 'Relatório Parcial',
        data_entrega: new Date().toISOString(),
        arquivo: data.arquivo,
        status_aprovacao_orientador: 'pendente',
        status_aprovacao_coordenador: 'pendente'
      });
      setDescricao('');
      setArquivo(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  // Verificar se foi recusado
  const foiRecusado = entregaExistente && (
    entregaExistente.status_aprovacao_orientador === 'rejeitado' ||
    (entregaExistente.status_aprovacao_orientador === 'aprovado' && entregaExistente.status_aprovacao_coordenador === 'rejeitado')
  );

  const statusPendente = entregaExistente && (
    entregaExistente.status_aprovacao_orientador === 'pendente' ||
    (entregaExistente.status_aprovacao_orientador === 'aprovado' && entregaExistente.status_aprovacao_coordenador === 'pendente')
  );

  const foiAprovado = entregaExistente && 
    entregaExistente.status_aprovacao_orientador === 'aprovado' &&
    entregaExistente.status_aprovacao_coordenador === 'aprovado';

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

  // Mostrar mensagem de relatório já enviado
  if (jaEnviou && entregaExistente && !foiRecusado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ibmec-blue-50 to-gray-100 py-8 px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                foiAprovado ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
                <span className="text-3xl">{foiAprovado ? '✅' : '⏳'}</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-ibmec-blue-800">
                  {foiAprovado ? 'Relatório Aprovado' : 'Relatório Enviado'}
                </h1>
                <p className="text-gray-600">
                  {foiAprovado 
                    ? 'Seu relatório parcial foi aprovado' 
                    : 'Aguardando avaliação do orientador e coordenador'}
                </p>
              </div>
            </div>
          </div>

          {/* Card de Confirmação */}
          <Card>
            <div className="text-center py-8">
              <div className="text-6xl mb-6">📄</div>
              <h2 className={`text-2xl font-bold mb-4 ${
                foiAprovado ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {foiAprovado ? 'Relatório Parcial Aprovado!' : 'Relatório Parcial Enviado!'}
              </h2>
              <p className="text-gray-700 mb-6">
                Seu relatório foi enviado em{' '}
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
              
              {/* Status de Aprovação */}
              {!foiAprovado && (
                <div className="mb-6 space-y-3">
                  <div className="flex items-center justify-center gap-4">
                    <div className={`px-4 py-2 rounded-lg border-2 ${
                      entregaExistente.status_aprovacao_orientador === 'aprovado'
                        ? 'bg-green-50 border-green-500 text-green-800'
                        : entregaExistente.status_aprovacao_orientador === 'pendente'
                        ? 'bg-yellow-50 border-yellow-500 text-yellow-800'
                        : 'bg-gray-50 border-gray-300 text-gray-600'
                    }`}>
                      <p className="text-sm font-semibold">Orientador:</p>
                      <p className="text-xs">
                        {entregaExistente.status_aprovacao_orientador === 'aprovado' ? '✅ Aprovado' :
                         entregaExistente.status_aprovacao_orientador === 'pendente' ? '⏳ Pendente' : '⚪ Aguardando'}
                      </p>
                    </div>
                    {/* Só mostra status do coordenador se o orientador já aprovou */}
                    {entregaExistente.status_aprovacao_orientador === 'aprovado' && (
                      <div className={`px-4 py-2 rounded-lg border-2 ${
                        entregaExistente.status_aprovacao_coordenador === 'aprovado'
                          ? 'bg-green-50 border-green-500 text-green-800'
                          : entregaExistente.status_aprovacao_coordenador === 'pendente'
                          ? 'bg-yellow-50 border-yellow-500 text-yellow-800'
                          : 'bg-gray-50 border-gray-300 text-gray-600'
                      }`}>
                        <p className="text-sm font-semibold">Coordenador:</p>
                        <p className="text-xs">
                          {entregaExistente.status_aprovacao_coordenador === 'aprovado' ? '✅ Aprovado' :
                           entregaExistente.status_aprovacao_coordenador === 'pendente' ? '⏳ Pendente' : '⚪ Aguardando'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Informações da entrega */}
              <div className={`border rounded-lg p-6 mb-6 ${
                foiAprovado ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3">
                    <span className={foiAprovado ? 'text-green-600' : 'text-yellow-600'}>📎</span>
                    <div>
                      <p className="font-semibold text-gray-700">Arquivo:</p>
                      <p className="text-sm text-gray-600">{entregaExistente.arquivo || 'Relatório Parcial'}</p>
                    </div>
                  </div>
                  {entregaExistente.descricao && (
                    <div className="flex items-start gap-3">
                      <span className={foiAprovado ? 'text-green-600' : 'text-yellow-600'}>📝</span>
                      <div>
                        <p className="font-semibold text-gray-700">Observações:</p>
                        <p className="text-sm text-gray-600">{entregaExistente.descricao}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Feedback do Orientador */}
                  {entregaExistente.feedback_orientador && (
                    <div className="flex items-start gap-3">
                      <span className="text-blue-600">👨‍🏫</span>
                      <div>
                        <p className="font-semibold text-gray-700">Feedback do Orientador:</p>
                        <p className="text-sm text-gray-600 bg-white p-3 rounded border border-gray-200 mt-1">
                          {entregaExistente.feedback_orientador}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Feedback do Coordenador */}
                  {entregaExistente.feedback_coordenador && (
                    <div className="flex items-start gap-3">
                      <span className="text-green-600">👨‍💼</span>
                      <div>
                        <p className="font-semibold text-gray-700">Feedback do Coordenador:</p>
                        <p className="text-sm text-gray-600 bg-white p-3 rounded border border-gray-200 mt-1">
                          {entregaExistente.feedback_coordenador}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Alerta informativo */}
              <div className={`border-l-4 p-4 rounded text-left mb-6 ${
                foiAprovado 
                  ? 'bg-green-50 border-green-500' 
                  : 'bg-blue-50 border-blue-500'
              }`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{foiAprovado ? '🎉' : 'ℹ️'}</span>
                  <div className="flex-1">
                    <h3 className={`font-semibold mb-1 ${
                      foiAprovado ? 'text-green-800' : 'text-blue-800'
                    }`}>
                      {foiAprovado ? 'Parabéns!' : 'Próximos Passos'}
                    </h3>
                    <p className="text-sm text-gray-700">
                      {foiAprovado 
                        ? 'Seu relatório foi aprovado! Continue com a próxima etapa do programa.'
                        : 'Seu orientador receberá uma notificação e avaliará seu relatório. Você será notificado quando houver feedback.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botão Voltar */}
              <button 
                onClick={() => window.history.back()}
                className="px-8 py-3 bg-ibmec-blue-600 text-white rounded-lg hover:bg-ibmec-blue-700 transition font-semibold"
              >
                ← Voltar ao Dashboard
              </button>
            </div>
          </Card>

          {/* Card de Aviso */}
          {!foiAprovado && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-5">
              <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
                <span>⚠️</span>
                Importante
              </h3>
              <p className="text-sm text-gray-700">
                Aguarde a avaliação do seu relatório. Se for necessário fazer correções, 
                você será notificado e poderá enviar uma nova versão.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mostrar opção de reenvio quando recusado
  if (foiRecusado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ibmec-blue-50 to-gray-100 py-8 px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Header de Recusa */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">❌</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-red-700">Relatório Recusado</h1>
                <p className="text-gray-600">Seu relatório precisa de correções</p>
              </div>
            </div>
          </div>

          {/* Card de Feedback */}
          <Card>
            <div className="mb-6">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6">
                <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                  <span>📋</span>
                  Feedback Recebido
                </h3>
                
                {entregaExistente.status_aprovacao_orientador === 'rejeitado' && entregaExistente.feedback_orientador && (
                  <div className="mb-4 bg-white p-4 rounded border border-red-200">
                    <p className="text-sm font-semibold text-red-700 mb-2">❌ Recusado pelo Orientador</p>
                    <p className="text-sm text-gray-800">{entregaExistente.feedback_orientador}</p>
                  </div>
                )}
                
                {entregaExistente.status_aprovacao_orientador === 'aprovado' && entregaExistente.status_aprovacao_coordenador === 'rejeitado' && entregaExistente.feedback_coordenador && (
                  <div className="bg-white p-4 rounded border border-red-200">
                    <p className="text-sm font-semibold text-red-700 mb-2">❌ Recusado pelo Coordenador</p>
                    <p className="text-sm text-gray-800">{entregaExistente.feedback_coordenador}</p>
                  </div>
                )}
                
                {!entregaExistente.feedback_orientador && !entregaExistente.feedback_coordenador && (
                  <div className="bg-white p-4 rounded border border-red-200">
                    <p className="text-sm text-gray-600 italic">Nenhum feedback foi fornecido.</p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-800 mb-1">Próximos Passos</h3>
                    <p className="text-sm text-gray-700">
                      Faça as correções necessárias conforme o feedback recebido e envie uma nova versão do seu relatório parcial.
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold text-ibmec-blue-800 mb-4">
                📤 Enviar Nova Versão
              </h3>
            </div>

            {/* Formulário de Reenvio */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Upload de arquivo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📎 Arquivo do Relatório Parcial (Corrigido)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx" 
                    onChange={handleFileChange} 
                    required 
                    className="hidden" 
                    id="arquivo-upload"
                  />
                  <label htmlFor="arquivo-upload" className="cursor-pointer">
                    <div className="text-5xl mb-3">📄</div>
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
                          Clique para selecionar o arquivo corrigido
                        </p>
                        <p className="text-sm text-gray-500">
                          Formatos aceitos: PDF, DOC, DOCX
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📝 Descreva as Correções Realizadas
                </label>
                <textarea 
                  value={descricao} 
                  onChange={e => setDescricao(e.target.value)} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="4" 
                  placeholder="Descreva as mudanças e correções que você fez baseado no feedback recebido..."
                  required
                ></textarea>
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
                      : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-md'
                  }`}
                >
                  {sending ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Enviando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>🔄</span>
                      Reenviar Relatório Parcial
                    </span>
                  )}
                </button>
              </div>
            </form>
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
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">📊</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-ibmec-blue-800">Enviar Relatório Parcial</h1>
              <p className="text-gray-600">Etapa intermediária do projeto de iniciação científica</p>
            </div>
          </div>
          
          {/* Alerta informativo */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800 mb-1">Sobre o Relatório Parcial</h3>
                <p className="text-sm text-gray-700">
                  O relatório parcial documenta o progresso do seu projeto até o momento. 
                  Inclua os resultados preliminares, metodologia aplicada e próximas etapas planejadas.
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
                📎 Arquivo do Relatório Parcial
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx" 
                  onChange={handleFileChange} 
                  required 
                  className="hidden" 
                  id="arquivo-upload"
                />
                <label htmlFor="arquivo-upload" className="cursor-pointer">
                  <div className="text-5xl mb-3">📄</div>
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
                        Formatos aceitos: PDF, DOC, DOCX
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="4" 
                placeholder="Adicione informações relevantes sobre o relatório, dificuldades encontradas, resultados preliminares, etc..."
              ></textarea>
              <p className="text-xs text-gray-500 mt-1">
                ℹ️ Use este campo para contextualizar seu trabalho ou destacar pontos importantes
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
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-md'
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
                    Enviar Relatório Parcial
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
            Dicas Importantes
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>Certifique-se de que seu relatório está completo e revisado antes de enviar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>O arquivo deve estar em formato PDF, DOC ou DOCX</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>Inclua gráficos, tabelas e referências quando aplicável</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>Após o envio, seu orientador receberá uma notificação para avaliação</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EnviarRelatorioParcial;
