import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Card from '../components/Card';
import EnviarRelatorioParcial from './EnviarRelatorioParcial';
import EnviarApresentacaoAmostra from './EnviarApresentacaoAmostra';
import EnviarArtigoFinal from './EnviarArtigoFinal';
import API_BASE_URL from '../config/api';

const DashboardAluno = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [inscricao, setInscricao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [etapaAtual, setEtapaAtual] = useState('');
  const [userData, setUserData] = useState(user);
  const [relatoriosMensais, setRelatoriosMensais] = useState([]);
  const [mesSelecionado, setMesSelecionado] = useState('');
  const [loadingRelatorios, setLoadingRelatorios] = useState(false);
  const [entregaRelatorioParcial, setEntregaRelatorioParcial] = useState(null);

  useEffect(() => {
    // Função para buscar dados atualizados do usuário
    const fetchUserData = async () => {
      if (!user?.id) return;
      
      try {
        console.log('🔍 Buscando dados do usuário ID:', user.id);
        const response = await fetch(`${API_BASE_URL}/usuarios/${user.id}`);
        
        if (response.ok) {
          // Parse seguro da resposta
          try {
            const text = await response.text();
            const data = text ? JSON.parse(text) : null;
            if (data) {
              console.log('✅ Dados recebidos do backend:', data);
              setUserData(data);
              // Atualizar também o contexto global
              updateUser(data);
            }
          } catch (parseError) {
            console.error('❌ Erro ao fazer parse da resposta:', parseError);
          }
        } else {
          console.error('❌ Erro na resposta:', response.status);
        }
      } catch (error) {
        console.error('❌ Erro ao buscar dados do usuário:', error);
      }
    };

    // Buscar status da entrega do relatório parcial
    const fetchStatusRelatorioParcial = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`${API_BASE_URL}/alunos/${user.id}/verificar-entrega/relatorio_parcial`);
        if (res.ok) {
          try {
            const text = await res.text();
            const data = text ? JSON.parse(text) : null;
            if (data?.ja_enviou && data.entrega) {
              setEntregaRelatorioParcial(data.entrega);
            }
          } catch (parseError) {
            console.error('Erro ao fazer parse da resposta:', parseError);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status do relatório parcial:', error);
      }
    };

    // Buscar inscrição do aluno
    const fetchInscricao = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/inscricoes/usuario/${user?.id}`);
        
        let data = null;
        try {
          const text = await response.text();
          data = text ? JSON.parse(text) : null;
        } catch (parseError) {
          console.error('Erro ao fazer parse da resposta:', parseError);
          return;
        }
        
        if (data?.tem_proposta) {
          setInscricao(data.inscricao);
          // Buscar etapa atual do projeto
          const etapaRes = await fetch(`${API_BASE_URL}/projetos/alunos/${user?.id}/status-etapa`);
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
      console.log('👤 Usuário atual:', user);
      fetchUserData();
      fetchInscricao();
      fetchStatusRelatorioParcial();
    } else {
      setLoading(false);
    }
  }, [user?.id]); // Removido updateUser das dependências para evitar loop infinito

  // Função para buscar relatórios mensais do aluno
  const buscarRelatoriosMensais = async () => {
    if (!inscricao?.orientador_id || !user?.id) return;
    
    setLoadingRelatorios(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/orientadores/${inscricao.orientador_id}/alunos/${user.id}/relatorios-mensais`
      );
      if (response.ok) {
        const data = await response.json();
        setRelatoriosMensais(data.relatorios || []);
      }
    } catch (error) {
      console.error('Erro ao buscar relatórios mensais:', error);
    } finally {
      setLoadingRelatorios(false);
    }
  };

  // Buscar relatórios quando tiver orientador definido
  useEffect(() => {
    if (inscricao?.orientador_id && user?.id) {
      buscarRelatoriosMensais();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inscricao?.orientador_id]); // Removido user.id para evitar re-renders desnecessários

  // Simular se o aluno tem proposta submetida
  const temProposta = inscricao !== null;
  const semProposta = !temProposta;
  
  // Verificar se a proposta foi rejeitada (por orientador ou coordenador)
  const propostaRejeitada = inscricao?.status === 'rejeitada_orientador' || 
                            inscricao?.status === 'rejeitada_coordenador' ||
                            inscricao?.status_aprovacao_orientador === 'rejeitado' ||
                            inscricao?.status_aprovacao_coordenador === 'rejeitado';

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
            Olá, {userData?.nome?.split(' ')[0]}! 👋
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
                    <p className="text-xl font-bold text-ibmec-blue-700">{userData?.curso || 'Não informado'}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">📧</div>
                  <div>
                    <p className="text-gray-600 text-sm">E-mail</p>
                    <p className="text-sm font-semibold text-ibmec-blue-700 truncate">{userData?.email}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">
                    {temProposta ? (
                      propostaRejeitada ? '❌' :
                      inscricao.status === 'aprovada' ? '✅' : 
                      inscricao.status === 'em_analise' ? '⏳' : '📋'
                    ) : '📝'}
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Status</p>
                    <p className="text-xl font-bold text-ibmec-blue-700">
                      {temProposta 
                        ? (propostaRejeitada ? 'Rejeitado' :
                           inscricao.status === 'em_analise' ? 'Em Análise' : 
                           inscricao.status === 'aprovada' ? 'Aprovado' : 'Pendente')
                        : 'Sem Proposta'
                      }
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Botão de Submissão - Aparece se não tiver proposta OU se foi rejeitada */}
            {(semProposta || propostaRejeitada) && (
              <Card className={`mb-8 ${
                propostaRejeitada
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                  : 'bg-gradient-to-r from-ibmec-blue-500 to-ibmec-blue-600'
              } text-white`}>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">
                      {propostaRejeitada
                        ? '🔄 Proposta Rejeitada - Envie uma Nova'
                        : ' Pronto para começar?'
                      }
                    </h2>
                    <p className={propostaRejeitada ? 'text-orange-50' : 'text-blue-50'}>
                      {propostaRejeitada
                        ? 'Sua proposta foi rejeitada. Revise o feedback abaixo e submeta uma nova proposta melhorada!'
                        : 'Submeta sua proposta de iniciação científica e dê o primeiro passo na sua jornada de pesquisa!'
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/submeter-proposta')}
                    className="bg-white px-8 py-3 rounded-lg font-bold hover:bg-gray-50 transition transform hover:scale-105 whitespace-nowrap"  
                    style={{ color: propostaRejeitada ? '#f97316' : '#2563eb' }}
                  >
                    {propostaRejeitada ? '📝 Enviar Nova Proposta' : '📝 Submeter Proposta'}
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
                  
                  {/* Timeline 1: Processo de Inscrição */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-600 mb-4">📝 Processo de Inscrição</h3>
                    <div className="relative">
                      {/* Linha de fundo cinza */}
                      <div className="absolute top-5 left-0 w-full h-1 bg-gray-200"></div>
                      
                      {/* Linha de progresso verde */}
                      <div 
                        className="absolute top-5 left-0 h-1 bg-green-500 transition-all duration-500"
                        style={{
                          width: 
                            inscricao.status === 'aprovada' ? '100%' :
                            inscricao.status_aprovacao_coordenador === 'aprovado' ? '75%' :
                            inscricao.status_aprovacao_orientador === 'aprovado' ? '50%' :
                            temProposta ? '25%' : '0%'
                        }}
                      ></div>
                      
                      {/* Etapas da Inscrição */}
                      <div className="relative flex justify-between">
                        {/* 1. Proposta Enviada */}
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            temProposta
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {temProposta ? '✓' : '1'}
                          </div>
                          <p className="text-xs mt-2 text-center font-medium w-20">Proposta Enviada</p>
                        </div>

                        {/* 2. Aprovação Orientador */}
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            inscricao.status_aprovacao_orientador === 'aprovado'
                              ? 'bg-green-500 text-white' 
                              : inscricao.status_aprovacao_orientador === 'rejeitado'
                              ? 'bg-red-500 text-white'
                              : inscricao.status_aprovacao_orientador === 'pendente' && temProposta
                              ? 'bg-yellow-500 text-white animate-pulse'
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {inscricao.status_aprovacao_orientador === 'aprovado' ? '✓' : 
                             inscricao.status_aprovacao_orientador === 'rejeitado' ? '✗' : '2'}
                          </div>
                          <p className="text-xs mt-2 text-center font-medium w-24">Aprovação Orientador</p>
                        </div>

                        {/* 3. Aprovação Coordenador */}
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            inscricao.status_aprovacao_coordenador === 'aprovado' || inscricao.status === 'aprovada'
                              ? 'bg-green-500 text-white' 
                              : inscricao.status_aprovacao_coordenador === 'rejeitado'
                              ? 'bg-red-500 text-white'
                              : inscricao.status_aprovacao_coordenador === 'pendente' && inscricao.status_aprovacao_orientador === 'aprovado'
                              ? 'bg-yellow-500 text-white animate-pulse'
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {inscricao.status_aprovacao_coordenador === 'aprovado' || inscricao.status === 'aprovada' ? '✓' : 
                             inscricao.status_aprovacao_coordenador === 'rejeitado' ? '✗' : '3'}
                          </div>
                          <p className="text-xs mt-2 text-center font-medium w-24">Aprovação Coordenador</p>
                        </div>

                        {/* 4. Apresentação Realizada */}
                        <div className="flex flex-col items-center z-10">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            inscricao.status === 'aprovada'
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {inscricao.status === 'aprovada' ? '✓' : '4'}
                          </div>
                          <p className="text-xs mt-2 text-center font-medium w-24">Apresentação Realizada</p>
                        </div>
                      </div>
                    </div>

                    {/* Legenda da etapa atual de inscrição */}
                    {!inscricao.status || inscricao.status !== 'aprovada' ? (
                      <div className="mt-4 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm font-semibold text-blue-800">
                          📍 Status: {
                            inscricao.status_aprovacao_coordenador === 'rejeitado' ? 'Proposta rejeitada pelo coordenador' :
                            inscricao.status_aprovacao_orientador === 'rejeitado' ? 'Proposta rejeitada pelo orientador' :
                            inscricao.status_aprovacao_coordenador === 'pendente' && inscricao.status_aprovacao_orientador === 'aprovado' ? 'Aguardando aprovação do coordenador' :
                            inscricao.status_aprovacao_orientador === 'pendente' ? 'Aguardando aprovação do orientador' :
                            temProposta ? 'Proposta em análise' : 'Aguardando envio da proposta'
                          }
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {/* Timeline 2: Progresso da Iniciação Científica (só aparece se aprovado) */}
                  {inscricao.status === 'aprovada' && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-600 mb-4">🚀 Progresso da Iniciação Científica</h3>
                      <div className="relative">
                        {/* Linha de fundo cinza */}
                        <div className="absolute top-5 left-0 w-full h-1 bg-gray-200"></div>
                        
                        {/* Linha de progresso azul */}
                        <div 
                          className="absolute top-5 left-0 h-1 bg-blue-500 transition-all duration-500"
                          style={{
                            width: 
                              etapaAtual === 'concluido' ? '100%' :
                              etapaAtual === 'artigo_final' ? '75%' :
                              etapaAtual === 'apresentacao_amostra' ? '50%' :
                              etapaAtual === 'relatorio_parcial' ? '25%' : '0%'
                          }}
                        ></div>
                        
                        {/* Etapas do Progresso */}
                        <div className="relative flex justify-between">
                          {/* 1. Relatório Parcial */}
                          <div className="flex flex-col items-center z-10">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              entregaRelatorioParcial?.status_aprovacao_orientador === 'rejeitado'
                                ? 'bg-red-500 text-white' 
                                : entregaRelatorioParcial?.status_aprovacao_orientador === 'aprovado' && entregaRelatorioParcial?.status_aprovacao_coordenador === 'rejeitado'
                                ? 'bg-red-500 text-white'
                                : etapaAtual === 'relatorio_parcial'
                                ? 'bg-blue-500 text-white animate-pulse' 
                                : etapaAtual === 'apresentacao_amostra' || etapaAtual === 'artigo_final' || etapaAtual === 'concluido'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              {entregaRelatorioParcial?.status_aprovacao_orientador === 'rejeitado'
                                ? '✗'
                                : entregaRelatorioParcial?.status_aprovacao_orientador === 'aprovado' && entregaRelatorioParcial?.status_aprovacao_coordenador === 'rejeitado'
                                ? '✗'
                                : etapaAtual === 'apresentacao_amostra' || etapaAtual === 'artigo_final' || etapaAtual === 'concluido' 
                                ? '✓' 
                                : '1'}
                            </div>
                            <p className={`text-xs mt-2 text-center font-medium w-20 ${
                              entregaRelatorioParcial?.status_aprovacao_orientador === 'rejeitado' || 
                              (entregaRelatorioParcial?.status_aprovacao_orientador === 'aprovado' && entregaRelatorioParcial?.status_aprovacao_coordenador === 'rejeitado')
                                ? 'text-red-500'
                                : ''
                            }`}>
                              Relatório Parcial
                              {entregaRelatorioParcial?.status_aprovacao_orientador === 'rejeitado' && (
                                <span className="block text-red-500 text-xs">Recusado pelo orientador</span>
                              )}
                              {entregaRelatorioParcial?.status_aprovacao_orientador === 'aprovado' && entregaRelatorioParcial?.status_aprovacao_coordenador === 'rejeitado' && (
                                <span className="block text-red-500 text-xs">Recusado pelo coordenador</span>
                              )}
                            </p>
                          </div>

                          {/* 2. Apresentação na Amostra */}
                          <div className="flex flex-col items-center z-10">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              etapaAtual === 'apresentacao_amostra'
                                ? 'bg-blue-500 text-white animate-pulse' 
                                : etapaAtual === 'artigo_final' || etapaAtual === 'concluido'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              {etapaAtual === 'artigo_final' || etapaAtual === 'concluido' ? '✓' : '2'}
                            </div>
                            <p className="text-xs mt-2 text-center font-medium w-24">Apresentação na Amostra</p>
                          </div>

                          {/* 3. Artigo Final */}
                          <div className="flex flex-col items-center z-10">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              etapaAtual === 'artigo_final'
                                ? 'bg-blue-500 text-white animate-pulse' 
                                : etapaAtual === 'concluido'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              {etapaAtual === 'concluido' ? '✓' : '3'}
                            </div>
                            <p className="text-xs mt-2 text-center font-medium w-20">Artigo Final</p>
                          </div>

                          {/* 4. Certificado e Conclusão */}
                          <div className="flex flex-col items-center z-10">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              etapaAtual === 'concluido'
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              {etapaAtual === 'concluido' ? '✓' : '4'}
                            </div>
                            <p className="text-xs mt-2 text-center font-medium w-24">Certificado e Conclusão</p>
                          </div>
                        </div>
                      </div>

                      {/* Legenda da etapa atual do progresso */}
                      {etapaAtual && etapaAtual !== 'concluido' && (
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

                      {etapaAtual === 'concluido' && (
                        <div className="mt-4 bg-green-50 p-3 rounded-lg border-l-4 border-green-500">
                          <p className="text-sm font-semibold text-green-800">
                            🎉 Parabéns! Você concluiu o programa de Iniciação Científica!
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`px-4 py-3 rounded-lg border-2 mb-6 ${
                    propostaRejeitada 
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : getStatusColor(inscricao.status)
                  }`}>
                    <p className="font-bold text-lg">
                      {propostaRejeitada ? '❌ Rejeitado' : getStatusText(inscricao.status)}
                    </p>
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
                        value={userData?.nome || ''}
                        disabled
                        className="input-field bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="label">E-mail Institucional</label>
                      <input
                        type="email"
                        value={userData?.email || ''}
                        disabled
                        className="input-field bg-gray-50"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Matrícula</label>
                        <input
                          type="text"
                          value={userData?.matricula || 'Não informado'}
                          disabled
                          className="input-field bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="label">CPF</label>
                        <input
                          type="text"
                          value={userData?.cpf || 'Não informado'}
                          disabled
                          className="input-field bg-gray-50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label">Curso</label>
                      <input
                        type="text"
                        value={userData?.curso || 'Não informado'}
                        disabled
                        className="input-field bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="label">Telefone</label>
                      <input
                        type="text"
                        value={userData?.telefone || 'Não informado'}
                        disabled
                        className="input-field bg-gray-50"
                      />
                    </div>
                    <button className="btn-outline w-full">
                      ✏️ Editar Perfil
                    </button>

                    {/* Divisor */}
                    <hr className="my-6 border-gray-300" />

                    {/* Relatórios Mensais do Orientador - Dentro do mesmo card */}
                    <div>
                      <h3 className="text-xl font-bold text-ibmec-blue-800 mb-2 flex items-center gap-2">
                        <span className="text-2xl">📅</span>
                        Relatórios Mensais do Orientador
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Visualize as conversas entre seu orientador e o coordenador sobre seus relatórios mensais.
                      </p>

                      {loadingRelatorios ? (
                        <div className="text-center py-6">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ibmec-blue-600 mx-auto mb-3"></div>
                          <p className="text-gray-600 text-sm">Carregando relatórios...</p>
                        </div>
                      ) : relatoriosMensais.length === 0 ? (
                        <div className="text-center py-6">
                          <div className="text-4xl mb-2">📭</div>
                          <p className="text-gray-500 text-sm">Nenhum relatório mensal disponível ainda</p>
                        </div>
                      ) : (
                    <div className="space-y-4">
                      {/* Seletor de Mês */}
                      <div>
                        <label className="label">Selecione o Mês:</label>
                        <select
                          className="input-field"
                          value={mesSelecionado}
                          onChange={(e) => setMesSelecionado(e.target.value)}
                        >
                          <option value="">-- Escolha um mês --</option>
                          {(() => {
                            // Agrupar relatórios por mês
                            const mesesUnicos = new Map();
                            
                            relatoriosMensais.forEach((rel) => {
                              const mesMatch = rel.titulo?.match(/\d{4}-\d{2}/);
                              const mes = mesMatch ? mesMatch[0] : null;
                              if (mes && !mesesUnicos.has(mes)) {
                                mesesUnicos.set(mes, mes);
                              }
                            });

                            // Converter para array e ordenar (mais recente primeiro)
                            return Array.from(mesesUnicos.keys())
                              .sort((a, b) => b.localeCompare(a))
                              .map((mes) => {
                                const [ano, mesNum] = mes.split('-');
                                const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                                             'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
                                const mesNome = meses[parseInt(mesNum) - 1];
                                
                                return (
                                  <option key={mes} value={mes}>
                                    {mesNome} de {ano}
                                  </option>
                                );
                              });
                          })()}
                        </select>
                      </div>

                      {/* Exibir todos os relatórios do mês selecionado */}
                      {mesSelecionado && (() => {
                        // Filtrar relatórios do mês selecionado
                        const relatoriosDoMes = relatoriosMensais.filter(rel => {
                          const mesMatch = rel.titulo?.match(/\d{4}-\d{2}/);
                          return mesMatch && mesMatch[0] === mesSelecionado;
                        });

                        if (relatoriosDoMes.length === 0) return null;

                        const [ano, mesNum] = mesSelecionado.split('-');
                        const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                                     'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
                        const mesFormatado = `${meses[parseInt(mesNum) - 1]} de ${ano}`;

                        return (
                          <div className="space-y-4">
                            <div className="bg-gradient-to-r from-ibmec-blue-600 to-ibmec-blue-700 p-4 rounded-lg">
                              <div className="flex items-center gap-2 text-white">
                                <span className="text-2xl">📆</span>
                                <h3 className="text-xl font-bold">
                                  Relatórios de {mesFormatado}
                                </h3>
                                <span className="ml-auto bg-white text-ibmec-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                                  {relatoriosDoMes.length} {relatoriosDoMes.length === 1 ? 'relatório' : 'relatórios'}
                                </span>
                              </div>
                            </div>

                            {/* Listar todos os relatórios do mês */}
                            {relatoriosDoMes
                              .sort((a, b) => new Date(b.data_envio) - new Date(a.data_envio))
                              .map((relatorio, index) => (
                                <div 
                                  key={relatorio.id} 
                                  className="bg-gradient-to-r from-ibmec-blue-50 to-ibmec-gold-50 p-6 rounded-lg border border-ibmec-blue-200"
                                >
                                  <div className="flex items-center gap-2 mb-4">
                                    <span className="text-2xl">�</span>
                                    <h4 className="text-lg font-bold text-ibmec-blue-800">
                                      Relatório #{index + 1}
                                    </h4>
                                  </div>

                                  {relatorio.descricao && (
                                    <div className="mb-4 bg-white p-4 rounded-lg">
                                      <p className="text-sm font-semibold text-gray-700 mb-1">📝 Descrição:</p>
                                      <p className="text-gray-800">{relatorio.descricao}</p>
                                    </div>
                                  )}

                                  <div className="mb-4">
                                    <p className="text-xs text-gray-600">
                                      📤 Enviado em: {relatorio.data_envio 
                                        ? new Date(relatorio.data_envio).toLocaleString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })
                                        : 'Data não disponível'
                                      }
                                    </p>
                                  </div>

                                  {/* Histórico de Mensagens entre Orientador e Coordenador */}
                                  {relatorio.mensagens && relatorio.mensagens.length > 0 ? (
                                    <div className="space-y-3">
                                      <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <span className="text-lg">💬</span>
                                        Conversa entre Orientador e Coordenador:
                                      </p>
                                      {relatorio.mensagens.map((msg, idx) => (
                                        <div
                                          key={msg.id || idx}
                                          className={`p-4 rounded-lg border-l-4 ${
                                            msg.tipo_usuario === 'coordenador'
                                              ? 'bg-green-50 border-green-500'
                                              : 'bg-blue-50 border-blue-500'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className="text-lg">
                                              {msg.tipo_usuario === 'coordenador' ? '👨‍💼' : '👨‍🏫'}
                                            </span>
                                            <p className={`text-sm font-bold ${
                                              msg.tipo_usuario === 'coordenador'
                                                ? 'text-green-800'
                                                : 'text-blue-800'
                                            }`}>
                                              {msg.tipo_usuario === 'coordenador' ? 'Coordenador' : 'Orientador'}
                                            </p>
                                          </div>
                                          <p className="text-sm text-gray-800 whitespace-pre-wrap mb-2">
                                            {msg.mensagem}
                                          </p>
                                          {msg.data_criacao && (
                                            <p className="text-xs text-gray-500">
                                              {new Date(msg.data_criacao).toLocaleString('pt-BR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="bg-white p-4 rounded-lg text-center">
                                      <p className="text-gray-500 text-sm">
                                        📭 Ainda não há conversas sobre este relatório
                                      </p>
                                    </div>
                                  )}

                                  {relatorio.arquivo && (
                                    <div className="mt-4">
                                      <a
                                        href={`${API_BASE_URL.replace('/api', '')}/uploads/entregas/${relatorio.arquivo}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-primary inline-block"
                                      >
                                        📎 Baixar Arquivo do Relatório
                                      </a>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                    </div>
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
                      <div className={`p-4 rounded-lg border-l-4 ${
                        inscricao.status_aprovacao_orientador === 'rejeitado' 
                          ? 'bg-red-50 border-red-500' 
                          : 'bg-green-50 border-green-500'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">
                              {inscricao.status_aprovacao_orientador === 'rejeitado' ? '❌' : '✅'}
                            </span>
                            <div>
                              <p className={`font-bold ${
                                inscricao.status_aprovacao_orientador === 'rejeitado' 
                                  ? 'text-red-800' 
                                  : 'text-green-800'
                              }`}>
                                {inscricao.status_aprovacao_orientador === 'rejeitado' 
                                  ? 'Rejeitado pelo Orientador' 
                                  : 'Avaliação do Orientador'
                                }
                              </p>
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
                        <div className={`bg-white p-3 rounded border mt-2 ${
                          inscricao.status_aprovacao_orientador === 'rejeitado' 
                            ? 'border-red-200' 
                            : 'border-green-200'
                        }`}>
                          <p className="text-gray-800 whitespace-pre-wrap">{inscricao.feedback_orientador}</p>
                        </div>
                      </div>
                    )}

                    {/* Feedback do Coordenador */}
                    {inscricao.feedback_coordenador && (
                      <div className={`p-4 rounded-lg border-l-4 ${
                        inscricao.status_aprovacao_coordenador === 'rejeitado' 
                          ? 'bg-red-50 border-red-500' 
                          : 'bg-blue-50 border-blue-500'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">
                              {inscricao.status_aprovacao_coordenador === 'rejeitado' ? '❌' : '🎓'}
                            </span>
                            <div>
                              <p className={`font-bold ${
                                inscricao.status_aprovacao_coordenador === 'rejeitado' 
                                  ? 'text-red-800' 
                                  : 'text-blue-800'
                              }`}>
                                {inscricao.status_aprovacao_coordenador === 'rejeitado' 
                                  ? 'Rejeitado pelo Coordenador' 
                                  : 'Avaliação do Coordenador'
                                }
                              </p>
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
                        <div className={`bg-white p-3 rounded border mt-2 ${
                          inscricao.status_aprovacao_coordenador === 'rejeitado' 
                            ? 'border-red-200' 
                            : 'border-blue-200'
                        }`}>
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
