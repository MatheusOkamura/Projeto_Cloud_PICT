import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Card from '../components/Card';
import EnviarRelatorioParcial from './EnviarRelatorioParcial';
import EnviarApresentacaoAmostra from './EnviarApresentacaoAmostra';
import EnviarArtigoFinal from './EnviarArtigoFinal';

const DashboardAluno = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inscricao, setInscricao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [etapaAtual, setEtapaAtual] = useState('');

  useEffect(() => {
    // Buscar inscrição do aluno
    const fetchInscricao = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/inscricoes/usuario/${user?.id}`);
        const data = await response.json();
        if (data.tem_proposta) {
          setInscricao(data.inscricao);
          // Buscar etapa atual do projeto
          const etapaRes = await fetch(`http://localhost:8000/api/projetos/alunos/${user?.id}/status-etapa`);
          if (etapaRes.ok) {
            const etapaData = await etapaRes.json();
            setEtapaAtual(etapaData.etapa || '');
          }
        } else {
          setInscricao(null);
        }
      } catch (error) {
        console.error('Erro ao buscar inscrição:', error);
        setInscricao(null);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) {
      fetchInscricao();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Simular se o aluno tem proposta submetida
  const temProposta = inscricao !== null;
  const semProposta = !temProposta;

  const getStatusColor = (status) => {
    switch (status) {
      case 'aprovada':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'em_analise':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'rejeitada':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'aprovada':
        return '✅ Aprovado';
      case 'em_analise':
        return '⏳ Em Análise';
      case 'rejeitada':
        return '❌ Rejeitado';
      default:
        return '📋 Pendente';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ibmec-blue-50 to-gray-100 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-ibmec-blue-800 mb-2">
            Olá, {user?.nome?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600">Bem-vindo ao seu painel de Iniciação Científica</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-gray-500">Carregando informações...</p>
          </div>
        ) : (
          <>
            {/* Cards de Informação Rápida */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card>
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">📚</div>
                  <div>
                    <p className="text-gray-600 text-sm">Curso</p>
                    <p className="text-xl font-bold text-ibmec-blue-700">{user?.curso}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">📧</div>
                  <div>
                    <p className="text-gray-600 text-sm">E-mail</p>
                    <p className="text-sm font-semibold text-ibmec-blue-700 truncate">{user?.email}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">
                    {temProposta ? (inscricao.status === 'aprovada' ? '✅' : inscricao.status === 'em_analise' ? '⏳' : '📋') : '📝'}
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Status</p>
                    <p className="text-xl font-bold text-ibmec-blue-700">
                      {temProposta 
                        ? (inscricao.status === 'em_analise' ? 'Em Análise' : inscricao.status === 'aprovada' ? 'Aprovado' : 'Pendente')
                        : 'Sem Proposta'
                      }
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Botão de Submissão - Aparece apenas se não tiver proposta */}
            {semProposta && (
              <Card className="mb-8 bg-gradient-to-r from-ibmec-blue-500 to-ibmec-blue-600 text-white">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">🚀 Pronto para começar?</h2>
                    <p className="text-blue-50">
                      Submeta sua proposta de iniciação científica e dê o primeiro passo na sua jornada de pesquisa!
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/submeter-proposta')}
                    className="bg-white text-ibmec-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition transform hover:scale-105 whitespace-nowrap"
                  >
                    📝 Submeter Proposta
                  </button>
                </div>
              </Card>
            )}

            {/* Status da Inscrição e Entrega de Etapa - Aparece apenas se tiver proposta */}
            {temProposta && (
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card>
                  <h2 className="text-2xl font-bold text-ibmec-blue-800 mb-4">
                    📋 Status da Inscrição
                  </h2>
                  
                  {/* Linha Temporal */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-4">Progresso do Projeto</h3>
                    <div className="relative">
                      {/* Linha de fundo cinza */}
                      <div className="absolute top-5 left-0 w-full h-1 bg-gray-200"></div>
                      
                      {/* Linha de progresso verde */}
                      <div 
                        className="absolute top-5 left-0 h-1 bg-green-500 transition-all duration-500"
                        style={{
                          width: 
                            etapaAtual === 'artigo_final' ? '100%' :
                            etapaAtual === 'apresentacao_amostra' ? '75%' :
                            etapaAtual === 'relatorio_parcial' ? '50%' :
                            inscricao.status === 'aprovada' ? '25%' :
                            '0%'
                        }}
                      ></div>
                      
                      {/* Etapas */}
                      <div className="relative flex justify-between">
                        {/* 1. Proposta Enviada */}
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            inscricao.status !== 'pendente_orientador' && inscricao.status !== 'pendente_coordenador'
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {inscricao.status !== 'pendente_orientador' && inscricao.status !== 'pendente_coordenador' ? '✓' : '1'}
                          </div>
                          <p className="text-xs mt-2 text-center font-medium w-20">Proposta Enviada</p>
                        </div>

                        {/* 2. Aprovação */}
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            inscricao.status === 'aprovada' && !etapaAtual
                              ? 'bg-green-500 text-white' 
                              : inscricao.status === 'aprovada'
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {inscricao.status === 'aprovada' ? '✓' : '2'}
                          </div>
                          <p className="text-xs mt-2 text-center font-medium w-20">Aprovação</p>
                        </div>

                        {/* 3. Relatório Parcial */}
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            etapaAtual === 'relatorio_parcial'
                              ? 'bg-blue-500 text-white animate-pulse' 
                              : etapaAtual === 'apresentacao_amostra' || etapaAtual === 'artigo_final'
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {etapaAtual === 'apresentacao_amostra' || etapaAtual === 'artigo_final' ? '✓' : '3'}
                          </div>
                          <p className="text-xs mt-2 text-center font-medium w-20">Relatório Parcial</p>
                        </div>

                        {/* 4. Apresentação */}
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            etapaAtual === 'apresentacao_amostra'
                              ? 'bg-blue-500 text-white animate-pulse' 
                              : etapaAtual === 'artigo_final'
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {etapaAtual === 'artigo_final' ? '✓' : '4'}
                          </div>
                          <p className="text-xs mt-2 text-center font-medium w-20">Apresentação</p>
                        </div>

                        {/* 5. Artigo Final */}
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            etapaAtual === 'artigo_final'
                              ? 'bg-blue-500 text-white animate-pulse' 
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            5
                          </div>
                          <p className="text-xs mt-2 text-center font-medium w-20">Artigo Final</p>
                        </div>
                      </div>
                    </div>

                    {/* Legenda da etapa atual */}
                    {etapaAtual && (
                      <div className="mt-4 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm font-semibold text-blue-800">
                          📍 Etapa Atual: {
                            etapaAtual === 'relatorio_parcial' ? 'Envio do Relatório Parcial' :
                            etapaAtual === 'apresentacao_amostra' ? 'Apresentação na Amostra' :
                            etapaAtual === 'artigo_final' ? 'Envio do Artigo Final' :
                            'Aguardando início das etapas'
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  <div className={`px-4 py-3 rounded-lg border-2 mb-6 ${getStatusColor(inscricao.status)}`}>
                    <p className="font-bold text-lg">{getStatusText(inscricao.status)}</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Data de Submissão</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(inscricao.data_submissao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Título do Projeto</p>
                      <p className="font-semibold text-gray-800">{inscricao.titulo_projeto}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Área de Conhecimento</p>
                      <p className="font-semibold text-gray-800">{inscricao.area_conhecimento}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Orientador</p>
                      <p className="font-semibold text-gray-800">
                        {inscricao.orientador_id ? 'Atribuído' : 'Aguardando atribuição'}
                      </p>
                    </div>
                  </div>
                  {/* Entrega de etapa conforme etapaAtual */}
                  {etapaAtual === 'relatorio_parcial' && (
                    <div className="mt-8">
                      <EnviarRelatorioParcial />
                    </div>
                  )}
                  {etapaAtual === 'apresentacao_amostra' && (
                    <div className="mt-8">
                      <EnviarApresentacaoAmostra />
                    </div>
                  )}
                  {etapaAtual === 'artigo_final' && (
                    <div className="mt-8">
                      <EnviarArtigoFinal />
                    </div>
                  )}
                </Card>
                <Card>
                  <h2 className="text-2xl font-bold text-ibmec-blue-800 mb-4">
                    👤 Meus Dados
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="label">Nome Completo</label>
                      <input
                        type="text"
                        value={user?.nome}
                        disabled
                        className="input-field bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="label">E-mail Institucional</label>
                      <input
                        type="email"
                        value={user?.email}
                        disabled
                        className="input-field bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="label">Curso</label>
                      <input
                        type="text"
                        value={user?.curso}
                        disabled
                        className="input-field bg-gray-50"
                      />
                    </div>
                    <button className="btn-outline w-full">
                      ✏️ Editar Perfil
                    </button>
                  </div>
                </Card>
              </div>
            )}

            {/* Mensagens/Feedbacks - Aparece apenas se tiver proposta */}
            {temProposta && (
              <Card>
                <h2 className="text-2xl font-bold text-ibmec-blue-800 mb-4">
                  💬 Mensagens e Feedbacks
                </h2>
                
                {(!inscricao.feedback_orientador && !inscricao.feedback_coordenador) ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📭</div>
                    <p className="text-gray-500">Nenhuma mensagem no momento</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Feedback do Orientador */}
                    {inscricao.feedback_orientador && (
                      <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">✅</span>
                            <div>
                              <p className="font-bold text-green-800">Avaliação do Orientador</p>
                              {inscricao.data_avaliacao_orientador && (
                                <p className="text-sm text-gray-600">
                                  {new Date(inscricao.data_avaliacao_orientador).toLocaleString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border border-green-200 mt-2">
                          <p className="text-gray-800 whitespace-pre-wrap">{inscricao.feedback_orientador}</p>
                        </div>
                      </div>
                    )}

                    {/* Feedback do Coordenador */}
                    {inscricao.feedback_coordenador && (
                      <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">🎓</span>
                            <div>
                              <p className="font-bold text-blue-800">Avaliação do Coordenador</p>
                              {inscricao.data_avaliacao_coordenador && (
                                <p className="text-sm text-gray-600">
                                  {new Date(inscricao.data_avaliacao_coordenador).toLocaleString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded border border-blue-200 mt-2">
                          <p className="text-gray-800 whitespace-pre-wrap">{inscricao.feedback_coordenador}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* Recursos e Links Úteis */}
            <Card className="mt-6">
              <h2 className="text-2xl font-bold text-ibmec-blue-800 mb-4">
                🔗 Recursos Úteis
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <a href="#" className="flex items-center p-4 bg-ibmec-blue-50 rounded-lg hover:bg-ibmec-blue-100 transition">
                  <span className="text-2xl mr-3">📘</span>
                  <div>
                    <p className="font-semibold text-ibmec-blue-700">Manual do Aluno</p>
                    <p className="text-sm text-gray-600">Guia completo do programa</p>
                  </div>
                </a>

                <a href="#" className="flex items-center p-4 bg-ibmec-blue-50 rounded-lg hover:bg-ibmec-blue-100 transition">
                  <span className="text-2xl mr-3">📄</span>
                  <div>
                    <p className="font-semibold text-ibmec-blue-700">Edital 2025</p>
                    <p className="text-sm text-gray-600">Regulamento oficial</p>
                  </div>
                </a>

                <a href="#" className="flex items-center p-4 bg-ibmec-blue-50 rounded-lg hover:bg-ibmec-blue-100 transition">
                  <span className="text-2xl mr-3">📅</span>
                  <div>
                    <p className="font-semibold text-ibmec-blue-700">Calendário</p>
                    <p className="text-sm text-gray-600">Prazos e datas importantes</p>
                  </div>
                </a>

                <a href="#" className="flex items-center p-4 bg-ibmec-blue-50 rounded-lg hover:bg-ibmec-blue-100 transition">
                  <span className="text-2xl mr-3">❓</span>
                  <div>
                    <p className="font-semibold text-ibmec-blue-700">FAQ</p>
                    <p className="text-sm text-gray-600">Perguntas frequentes</p>
                  </div>
                </a>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardAluno;
