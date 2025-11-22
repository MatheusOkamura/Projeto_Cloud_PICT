import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import Card from '../components/Card';
import EnviarRelatorioParcial from './EnviarRelatorioParcial';
import EnviarApresentacaoAmostra from './EnviarApresentacaoAmostra';
import EnviarArtigoFinal from './EnviarArtigoFinal';
import API_BASE_URL from '../config/api';

const DashboardAluno = () => {
  const { user, updateUser } = useAuth();
  const userIdRef = useRef(user?.id);
  const hasFetchedRef = useRef(false);
  const navigate = useNavigate();
  const [inscricao, setInscricao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [etapaAtual, setEtapaAtual] = useState('');
  const [userData, setUserData] = useState(user);
  const [relatoriosMensais, setRelatoriosMensais] = useState([]);
  const [mesSelecionado, setMesSelecionado] = useState('');
  const [loadingRelatorios, setLoadingRelatorios] = useState(false);
  const [entregaRelatorioParcial, setEntregaRelatorioParcial] = useState(null);
  const [inscricoesAbertas, setInscricoesAbertas] = useState(true);
  const [loadingInscricoesStatus, setLoadingInscricoesStatus] = useState(true);
  const [apresentacaoInfo, setApresentacaoInfo] = useState(null);
  const [amostraInfo, setAmostraInfo] = useState(null);
  const [feedbackApresentacao, setFeedbackApresentacao] = useState(null);
  const [filtroFeedback, setFiltroFeedback] = useState('todos'); // Estado para filtro de feedbacks
  const [entregaArtigoFinal, setEntregaArtigoFinal] = useState(null);
  const [certificadoInfo, setCertificadoInfo] = useState(null);
  const [orientadores, setOrientadores] = useState([]);
  const [loadingOrientadores, setLoadingOrientadores] = useState(false);


  // Verificar status das inscrições
  useEffect(() => {
    const verificarStatusInscricoes = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/inscricoes/status`);
        if (response.ok) {
          const data = await response.json();
          setInscricoesAbertas(data.inscricoes_abertas);
        }
      } catch (error) {
        console.error('Erro ao verificar status das inscrições:', error);
      } finally {
        setLoadingInscricoesStatus(false);
      }
    };

    verificarStatusInscricoes();
  }, []);

  // Buscar status da entrega do relatório parcial
  const fetchStatusRelatorioParcial = async () => {
    if (!user?.id) return;
    try {
      console.log('🔍 Buscando status do relatório parcial...');
      const res = await fetch(`${API_BASE_URL}/alunos/${user.id}/verificar-entrega/relatorio_parcial`);
      if (res.ok) {
        try {
          const text = await res.text();
          const data = text ? JSON.parse(text) : null;
          console.log('📦 Dados do relatório parcial:', data);
          if (data?.ja_enviou && data.entrega) {
            console.log('✅ Status aprovação orientador:', data.entrega.status_aprovacao_orientador);
            console.log('✅ Status aprovação coordenador:', data.entrega.status_aprovacao_coordenador);
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

  // Buscar status da entrega do artigo final
  const fetchStatusArtigoFinal = async () => {
    if (!user?.id) return;
    try {
      console.log('🔍 Buscando status do artigo final...');
      const res = await fetch(`${API_BASE_URL}/alunos/${user.id}/verificar-entrega/artigo_final`);
      if (res.ok) {
        try {
          const text = await res.text();
          const data = text ? JSON.parse(text) : null;
          console.log('📦 Dados do artigo final:', data);
          if (data?.ja_enviou && data.entrega) {
            console.log('✅ Status aprovação orientador:', data.entrega.status_aprovacao_orientador);
            console.log('✅ Status aprovação coordenador:', data.entrega.status_aprovacao_coordenador);
            setEntregaArtigoFinal(data.entrega);
          }
        } catch (parseError) {
          console.error('Erro ao fazer parse da resposta:', parseError);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status do artigo final:', error);
    }
  };

  // Buscar informações do certificado
  const fetchCertificado = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/alunos/${user.id}/certificado`);
      if (res.ok) {
        const data = await res.json();
        if (data.tem_certificado) {
          setCertificadoInfo(data);
        }
      } else if (res.status === 404) {
        // 404 é esperado quando não há certificado ainda
        console.log('Certificado ainda não disponível');
      }
    } catch (error) {
      console.error('Erro ao verificar certificado:', error);
    }
  };

  // Buscar lista de orientadores
  const fetchOrientadores = async () => {
    setLoadingOrientadores(true);
    try {
      const res = await fetch(`${API_BASE_URL}/orientadores`);
      if (res.ok) {
        const data = await res.json();
        setOrientadores(data.orientadores || []);
      }
    } catch (error) {
      console.error('Erro ao buscar orientadores:', error);
    } finally {
      setLoadingOrientadores(false);
    }
  };

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
              // NÃO atualizar o contexto global aqui para evitar loop infinito
              // O contexto já tem os dados necessários do login
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
            
            // Buscar informações do projeto (apresentação e amostra)
            try {
              const projetoRes = await fetch(`${API_BASE_URL}/projetos/aluno/${user?.id}`);
              if (projetoRes.ok) {
                const projetoData = await projetoRes.json();
                
                // Buscar informações da apresentação da proposta
                if (projetoData.apresentacao_data) {
                  setApresentacaoInfo({
                    data: projetoData.apresentacao_data,
                    hora: projetoData.apresentacao_hora,
                    campus: projetoData.apresentacao_campus,
                    sala: projetoData.apresentacao_sala
                  });
                }
                
                // Buscar feedback da apresentação se houver
                if (projetoData.feedback_apresentacao) {
                  setFeedbackApresentacao(projetoData.feedback_apresentacao);
                }
                
                // Buscar informações da apresentação na amostra
                if (projetoData.amostra_data) {
                  setAmostraInfo({
                    data: projetoData.amostra_data,
                    hora: projetoData.amostra_hora,
                    campus: projetoData.amostra_campus,
                    sala: projetoData.amostra_sala
                  });
                }
              }
            } catch (error) {
              console.error('Erro ao buscar informações do projeto:', error);
            }
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
      // Verificar se já fez fetch ou se o ID mudou
      if (!hasFetchedRef.current || userIdRef.current !== user.id) {
        console.log('👤 Usuário atual:', user);
        userIdRef.current = user.id;
        hasFetchedRef.current = true;
        
        fetchUserData();
        fetchInscricao();
        fetchStatusRelatorioParcial();
        fetchStatusArtigoFinal();
        fetchCertificado();
        fetchOrientadores();
      }
    } else {
      setLoading(false);
      hasFetchedRef.current = false;
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
  
  // Verificar se a proposta foi rejeitada (por orientador, coordenador ou apresentação)
  const propostaRejeitada = inscricao?.status === 'rejeitada_orientador' || 
                            inscricao?.status === 'rejeitada_coordenador' ||
                            inscricao?.status === 'rejeitada_apresentacao' ||
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
                      inscricao.status === 'pendente_apresentacao' ? '🎤' :
                      inscricao.status === 'em_analise' ? '⏳' : '📋'
                    ) : '📝'}
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Status</p>
                    <p className="text-xl font-bold text-ibmec-blue-700">
                      {temProposta 
                        ? (propostaRejeitada ? 'Rejeitado' :
                           inscricao.status === 'em_analise' ? 'Em Análise' : 
                           inscricao.status === 'pendente_apresentacao' ? 'Apresentação' :
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
              <>
                {loadingInscricoesStatus ? (
                  <Card className="mb-8 bg-gray-100">
                    <div className="flex items-center justify-center py-6">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ibmec-blue-600 mr-3"></div>
                      <p className="text-gray-600">Verificando status das inscrições...</p>
                    </div>
                  </Card>
                ) : inscricao?.status === 'rejeitada_apresentacao' ? (
                  /* Card profissional para resultado da avaliação da apresentação */
                  <Card className="mb-8 border-l-4 border-orange-400 bg-white">
                    <div className="p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-orange-600 text-xl">📋</span>
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl font-semibold text-gray-800 mb-1">
                            Resultado da Avaliação da Apresentação
                          </h2>
                          <p className="text-gray-600 text-sm">
                            Sua apresentação foi avaliada pela coordenação do programa.
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-sm font-medium text-gray-700">Parecer da Coordenação:</p>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {feedbackApresentacao || 'Nenhum parecer foi fornecido.'}
                        </p>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-2 mb-3">
                          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm text-blue-800 mb-3">
                              O período de inscrições para o programa foi encerrado. Para mais informações sobre futuras oportunidades, entre em contato com a coordenação.
                            </p>
                            <button
                              onClick={async () => {
                                if (window.confirm('Deseja resetar sua inscrição? Isso permitirá que você se inscreva novamente quando as inscrições forem reabertas.')) {
                                  try {
                                    const res = await fetch(`${API_BASE_URL}/inscricoes/${inscricao.id}`, {
                                      method: 'DELETE'
                                    });
                                    if (res.ok) {
                                      alert('Inscrição resetada com sucesso! Você poderá se inscrever novamente quando as inscrições forem reabertas.');
                                      window.location.reload();
                                    } else {
                                      alert('Erro ao resetar inscrição. Tente novamente.');
                                    }
                                  } catch (error) {
                                    console.error('Erro ao resetar inscrição:', error);
                                    alert('Erro ao resetar inscrição. Tente novamente.');
                                  }
                                }
                              }}
                              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Resetar Inscrição para Futuras Oportunidades
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ) : !inscricoesAbertas ? (
                  <Card className="mb-8">
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4">🔒</div>
                      <h2 className="text-3xl font-bold text-gray-800 mb-3">
                        Inscrições Fechadas
                      </h2>
                      <p className="text-gray-700 text-lg mb-2">
                        As inscrições para iniciação científica estão temporariamente fechadas.
                      </p>
                      <p className="text-gray-600">
                        Por favor, aguarde até que o coordenador reabra o período de inscrições.
                      </p>
                    </div>
                  </Card>
                ) : (
                  <>
                    {/* Card de Submeter Proposta */}
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
                              : '📝 Pronto para começar?'
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

                    {/* Seção de Orientadores Disponíveis */}
                    <Card className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-ibmec-blue-800">
                          👨‍🏫 Orientadores Disponíveis
                        </h2>
                        {orientadores.length > 0 && (
                          <span className="text-sm text-gray-500">
                            {orientadores.length} {orientadores.length === 1 ? 'orientador' : 'orientadores'}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-4">
                        Escolha um orientador cuja área de atuação se alinhe com sua proposta de pesquisa.
                      </p>
                      
                      {loadingOrientadores ? (
                        <div className="text-center py-6">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ibmec-blue-600 mx-auto mb-2"></div>
                          <p className="text-gray-600 text-sm">Carregando...</p>
                        </div>
                      ) : orientadores.length === 0 ? (
                        <div className="text-center py-6">
                          <p className="text-gray-500 text-sm">Nenhum orientador disponível no momento</p>
                        </div>
                      ) : (
                        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Orientador</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">Área de Atuação</th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-700 border-b w-24">Contato</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {orientadores.map((orientador, index) => (
                                <tr 
                                  key={orientador.id}
                                  className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                >
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 bg-gradient-to-br from-ibmec-blue-500 to-ibmec-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        {orientador.nome ? orientador.nome.charAt(0).toUpperCase() : '?'}
                                      </div>
                                      <span className="font-medium text-gray-800">{orientador.nome || 'Nome não informado'}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-gray-700">
                                    {orientador.area_pesquisa || <span className="text-gray-400 italic">Não informado</span>}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <a
                                      href={`mailto:${orientador.email}`}
                                      className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs text-white bg-ibmec-blue-600 hover:bg-ibmec-blue-700 rounded-md font-medium transition-colors"
                                      title={orientador.email}
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                      </svg>
                                      Email
                                    </a>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      
                      <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                        <p className="text-xs text-blue-700">
                          <span className="font-semibold">💡 Dica:</span> Entre em contato com o orientador antes de submeter sua proposta para alinhar expectativas sobre o tema.
                        </p>
                      </div>

                      <div className="mt-3 bg-amber-50 border-l-4 border-amber-500 p-3 rounded">
                        <p className="text-xs text-amber-800">
                          <span className="font-semibold">⚠️ Orientador não encontrado?</span> Entre em contato com o orientador desejado e solicite que ele realize o cadastro no site.
                        </p>
                      </div>
                    </Card>
                  </>
                )}
              </>
            )}

            {/* Status da Inscrição e Entrega de Etapa - Aparece apenas se tiver proposta */}
            {temProposta && (
              <>
                {/* Card de Apresentação Agendada - Aparece quando na etapa apresentacao_proposta E tem dados agendados, mas NÃO se já foi avaliada */}
                {etapaAtual === 'apresentacao_proposta' && apresentacaoInfo && 
                 inscricao?.status !== 'aprovada' && inscricao?.status !== 'rejeitada_apresentacao' && (
                  <Card className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
                    <div className="flex items-center gap-4">
                      <div className="text-6xl">🎤</div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-green-800 mb-2">
                          ✅ Apresentação Agendada!
                        </h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <p className="text-xs text-gray-600 font-semibold mb-1">📅 DATA</p>
                            <p className="text-lg font-bold text-green-800">
                              {new Date(apresentacaoInfo.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <p className="text-xs text-gray-600 font-semibold mb-1">🕐 HORÁRIO</p>
                            <p className="text-lg font-bold text-green-800">{apresentacaoInfo.hora}</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <p className="text-xs text-gray-600 font-semibold mb-1">🏫 CAMPUS</p>
                            <p className="text-lg font-bold text-green-800">{apresentacaoInfo.campus}</p>
                          </div>
                          {apresentacaoInfo.sala && (
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                              <p className="text-xs text-gray-600 font-semibold mb-1">🚪 SALA</p>
                              <p className="text-lg font-bold text-green-800">{apresentacaoInfo.sala}</p>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-green-700 mt-3 font-medium">
                          💡 Prepare sua apresentação com antecedência e esteja no local no horário indicado.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Card de Apresentação na Amostra Agendada - Só aparece na etapa apresentacao_amostra */}
                {temProposta && amostraInfo && etapaAtual === 'apresentacao_amostra' && (
                  <Card className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300">
                    <div className="flex items-center gap-4">
                      <div className="text-6xl">✅</div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-blue-800 mb-2">
                          Apresentação na Amostra Agendada!
                        </h2>
                        <p className="text-sm text-blue-700 mb-3">
                          Sua apresentação na mostra científica foi agendada pelo coordenador.
                        </p>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <p className="text-xs text-gray-600 font-semibold mb-1">📅 DATA</p>
                            <p className="text-lg font-bold text-blue-800">
                              {new Date(amostraInfo.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <p className="text-xs text-gray-600 font-semibold mb-1">🕐 HORÁRIO</p>
                            <p className="text-lg font-bold text-blue-800">{amostraInfo.hora}</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <p className="text-xs text-gray-600 font-semibold mb-1">🏫 CAMPUS</p>
                            <p className="text-lg font-bold text-blue-800">{amostraInfo.campus}</p>
                          </div>
                          {amostraInfo.sala && (
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                              <p className="text-xs text-gray-600 font-semibold mb-1">🚪 SALA</p>
                              <p className="text-lg font-bold text-blue-800">{amostraInfo.sala}</p>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-blue-700 mt-3 font-medium">
                          💡 Prepare seu material de apresentação e esteja no local no horário indicado para a mostra científica.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <Card>
                    <h2 className="text-2xl font-bold text-ibmec-blue-800 mb-4">
                      {inscricao.status === 'aprovada' ? '📋 Status da Iniciação Científica' : '📋 Status da Inscrição'}
                    </h2>
                  
                    {/* Timeline 1: Processo de Inscrição (só aparece se ainda não foi aprovado OU se está na etapa de apresentação) */}
                    {(inscricao.status !== 'aprovada' || !etapaAtual || etapaAtual === 'apresentacao_proposta') && (
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
                              inscricao.status === 'pendente_apresentacao' ? '75%' :
                              inscricao.status_aprovacao_coordenador === 'pendente' && inscricao.status_aprovacao_orientador === 'aprovado' ? '66%' :
                              inscricao.status_aprovacao_orientador === 'aprovado' ? '66%' :
                              inscricao.status_aprovacao_orientador === 'pendente' && temProposta ? '33%' :
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
                              inscricao.status_aprovacao_coordenador === 'aprovado' || inscricao.status === 'pendente_apresentacao' || inscricao.status === 'aprovada'
                                ? 'bg-green-500 text-white' 
                                : inscricao.status_aprovacao_coordenador === 'rejeitado'
                                ? 'bg-red-500 text-white'
                                : inscricao.status_aprovacao_coordenador === 'pendente' && inscricao.status_aprovacao_orientador === 'aprovado'
                                ? 'bg-yellow-500 text-white animate-pulse'
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              {inscricao.status_aprovacao_coordenador === 'aprovado' || inscricao.status === 'pendente_apresentacao' || inscricao.status === 'aprovada' ? '✓' : 
                               inscricao.status_aprovacao_coordenador === 'rejeitado' ? '✗' : '3'}
                            </div>
                            <p className="text-xs mt-2 text-center font-medium w-24">Aprovação Coordenador</p>
                          </div>

                          {/* 4. Apresentação */}
                          <div className="flex flex-col items-center z-10">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              inscricao.status === 'aprovada'
                                ? 'bg-green-500 text-white' 
                                : inscricao.status === 'pendente_apresentacao'
                                ? 'bg-yellow-500 text-white animate-pulse'
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              {inscricao.status === 'aprovada' ? '✓' : '4'}
                            </div>
                            <p className="text-xs mt-2 text-center font-medium w-24">Apresentação</p>
                          </div>
                        </div>
                      </div>

                      {/* Legenda da etapa atual de inscrição */}
                      <div className="mt-4 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm font-semibold text-blue-800">
                          📍 Status: {
                            inscricao.status_aprovacao_coordenador === 'rejeitado' ? 'Proposta rejeitada pelo coordenador' :
                            inscricao.status_aprovacao_orientador === 'rejeitado' ? 'Proposta rejeitada pelo orientador' :
                            inscricao.status === 'pendente_apresentacao' ? 'Aguardando apresentação e avaliação final' :
                            inscricao.status_aprovacao_coordenador === 'pendente' && inscricao.status_aprovacao_orientador === 'aprovado' ? 'Aguardando aprovação do coordenador' :
                            inscricao.status_aprovacao_orientador === 'pendente' ? 'Aguardando aprovação do orientador' :
                            temProposta ? 'Proposta em análise' : 'Aguardando envio da proposta'
                          }
                        </p>
                      </div>
                      </div>
                    )}

                    {/* Timeline 2: Progresso da Iniciação Científica (só aparece após a apresentação) */}
                    {inscricao.status === 'aprovada' && etapaAtual && etapaAtual !== 'apresentacao_proposta' && (
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
                              etapaAtual === 'concluido' || (entregaArtigoFinal?.status_aprovacao_orientador === 'aprovado' && entregaArtigoFinal?.status_aprovacao_coordenador === 'aprovado') ? '100%' :
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
                              // Se ambos aprovaram, sempre verde
                              entregaRelatorioParcial?.status_aprovacao_orientador === 'aprovado' && entregaRelatorioParcial?.status_aprovacao_coordenador === 'aprovado'
                                ? 'bg-green-500 text-white'
                                // Se está em etapa posterior, verde
                                : etapaAtual === 'apresentacao_amostra' || etapaAtual === 'artigo_final' || etapaAtual === 'concluido'
                                ? 'bg-green-500 text-white'
                                // Se orientador rejeitou (e coordenador ainda não aprovou)
                                : entregaRelatorioParcial?.status_aprovacao_orientador === 'rejeitado' && entregaRelatorioParcial?.status_aprovacao_coordenador !== 'aprovado'
                                ? 'bg-red-500 text-white' 
                                // Se orientador aprovou mas coordenador rejeitou
                                : entregaRelatorioParcial?.status_aprovacao_orientador === 'aprovado' && entregaRelatorioParcial?.status_aprovacao_coordenador === 'rejeitado'
                                ? 'bg-red-500 text-white'
                                // Se está na etapa atual (aguardando ou em andamento)
                                : etapaAtual === 'relatorio_parcial'
                                ? 'bg-blue-500 text-white animate-pulse' 
                                // Padrão: cinza
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              {/* Ícone baseado no status real */}
                              {entregaRelatorioParcial?.status_aprovacao_orientador === 'aprovado' && entregaRelatorioParcial?.status_aprovacao_coordenador === 'aprovado'
                                ? '✓'
                                : etapaAtual === 'apresentacao_amostra' || etapaAtual === 'artigo_final' || etapaAtual === 'concluido' 
                                ? '✓'
                                : (entregaRelatorioParcial?.status_aprovacao_orientador === 'rejeitado' && entregaRelatorioParcial?.status_aprovacao_coordenador !== 'aprovado') ||
                                  (entregaRelatorioParcial?.status_aprovacao_orientador === 'aprovado' && entregaRelatorioParcial?.status_aprovacao_coordenador === 'rejeitado')
                                ? '✗'
                                : '1'}
                            </div>
                            <p className={`text-xs mt-2 text-center font-medium w-20 ${
                              entregaRelatorioParcial?.status_aprovacao_orientador === 'aprovado' && entregaRelatorioParcial?.status_aprovacao_coordenador === 'aprovado'
                                ? 'text-green-600 font-semibold'
                                : (entregaRelatorioParcial?.status_aprovacao_orientador === 'rejeitado' && entregaRelatorioParcial?.status_aprovacao_coordenador !== 'aprovado') || 
                                  (entregaRelatorioParcial?.status_aprovacao_orientador === 'aprovado' && entregaRelatorioParcial?.status_aprovacao_coordenador === 'rejeitado')
                                ? 'text-red-500'
                                : ''
                            }`}>
                              Relatório Parcial
                              {entregaRelatorioParcial?.status_aprovacao_orientador === 'rejeitado' && entregaRelatorioParcial?.status_aprovacao_coordenador !== 'aprovado' && (
                                <span className="block text-red-500 text-xs">Recusado pelo orientador</span>
                              )}
                              {entregaRelatorioParcial?.status_aprovacao_orientador === 'aprovado' && entregaRelatorioParcial?.status_aprovacao_coordenador === 'rejeitado' && (
                                <span className="block text-red-500 text-xs">Recusado pelo coordenador</span>
                              )}
                              {entregaRelatorioParcial?.status_aprovacao_orientador === 'aprovado' && entregaRelatorioParcial?.status_aprovacao_coordenador === 'aprovado' && (
                                <span className="block text-green-600 text-xs">✓ Aprovado</span>
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
                              entregaArtigoFinal?.status_aprovacao_orientador === 'aprovado' && entregaArtigoFinal?.status_aprovacao_coordenador === 'aprovado'
                                ? 'bg-green-500 text-white'
                                : etapaAtual === 'artigo_final'
                                ? 'bg-blue-500 text-white animate-pulse' 
                                : etapaAtual === 'concluido'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              {entregaArtigoFinal?.status_aprovacao_orientador === 'aprovado' && entregaArtigoFinal?.status_aprovacao_coordenador === 'aprovado' ? '✓' : etapaAtual === 'concluido' ? '✓' : '3'}
                            </div>
                            <p className={`text-xs mt-2 text-center font-medium w-20 ${
                              entregaArtigoFinal?.status_aprovacao_orientador === 'aprovado' && entregaArtigoFinal?.status_aprovacao_coordenador === 'aprovado'
                                ? 'text-green-600 font-semibold'
                                : ''
                            }`}>
                              Artigo Final
                              {entregaArtigoFinal?.status_aprovacao_orientador === 'aprovado' && entregaArtigoFinal?.status_aprovacao_coordenador === 'aprovado' && (
                                <span className="block text-green-600 text-xs">✓ Aprovado</span>
                              )}
                            </p>
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

                      {/* Timeline 3: Relatórios Mensais para Orientador */}
                      <div className="mt-8">
                        <h4 className="text-xs font-semibold text-gray-500 mb-3">📅 Relatórios Mensais ao Orientador</h4>
                        <div className="relative">
                          {/* Linha de fundo cinza */}
                          <div className="absolute top-3 left-0 w-full h-0.5 bg-gray-200"></div>
                          
                          {/* Linha de progresso dos relatórios mensais */}
                          <div 
                            className="absolute top-3 left-0 h-0.5 bg-purple-500 transition-all duration-500"
                            style={{ width: '0%' }}
                          ></div>
                          
                          {/* 5 Relatórios Mensais */}
                          <div className="relative flex justify-between px-2">
                            {[1, 2, 3, 4, 5].map((num) => {
                              // Verificar se está na etapa do relatório mensal correspondente
                              const isEtapaAtual = etapaAtual === `relatorio_mensal_${num}`;
                              
                              // Mapear número sequencial para mês (1=março=3, 2=abril=4, 3=maio=5, 4=junho=6, 5=setembro=9)
                              const mesesMap = { 1: 3, 2: 4, 3: 5, 4: 6, 5: 9 };
                              const mesEsperado = mesesMap[num];
                              
                              // Verificar se o relatório foi enviado
                              const relatorioEnviado = relatoriosMensais.some(rel => rel.mes_numero === mesEsperado);
                              
                              // Extrair número da etapa atual (ex: relatorio_mensal_2 -> 2)
                              const etapaAtualNum = etapaAtual?.startsWith('relatorio_mensal_') 
                                ? parseInt(etapaAtual.split('_').pop()) 
                                : 0;
                              
                              // Se a etapa atual passou deste relatório e não foi enviado, está atrasado
                              const estaAtrasado = etapaAtualNum > num && !relatorioEnviado;
                              
                              return (
                                <div key={num} className="flex flex-col items-center z-10">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                                    relatorioEnviado
                                      ? 'bg-green-500 text-white shadow-lg' 
                                      : estaAtrasado
                                        ? 'bg-red-500 text-white shadow-lg'
                                        : isEtapaAtual 
                                          ? 'bg-yellow-400 text-yellow-900 shadow-lg animate-pulse' 
                                          : 'bg-gray-300 text-gray-600'
                                  }`}>
                                    {relatorioEnviado ? '✓' : estaAtrasado ? '✕' : num}
                                  </div>
                                  <p className="text-[10px] mt-1 text-center font-medium text-gray-600 w-12">
                                    Mês {num}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Alerta para relatórios atrasados */}
                        {(() => {
                          const mesesMap = { 1: 3, 2: 4, 3: 5, 4: 6, 5: 9 };
                          const etapaAtualNum = etapaAtual?.startsWith('relatorio_mensal_') 
                            ? parseInt(etapaAtual.split('_').pop()) 
                            : 0;
                          
                          const relatoriosAtrasados = [1, 2, 3, 4, 5].filter(num => {
                            const mesEsperado = mesesMap[num];
                            const relatorioEnviado = relatoriosMensais.some(rel => rel.mes_numero === mesEsperado);
                            return etapaAtualNum > num && !relatorioEnviado;
                          });
                          
                          if (relatoriosAtrasados.length > 0) {
                            return (
                              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-sm font-bold text-red-800 mb-2">
                                  ⚠️ Relatório{relatoriosAtrasados.length > 1 ? 's' : ''} Mensal{relatoriosAtrasados.length > 1 ? 'is' : ''} Não Enviado{relatoriosAtrasados.length > 1 ? 's' : ''}
                                </p>
                                <p className="text-sm text-red-700 mb-2">
                                  O{relatoriosAtrasados.length > 1 ? 's' : ''} seguinte{relatoriosAtrasados.length > 1 ? 's' : ''} relatório{relatoriosAtrasados.length > 1 ? 's' : ''} não foi{relatoriosAtrasados.length > 1 ? 'ram' : ''} enviado{relatoriosAtrasados.length > 1 ? 's' : ''} pelo seu orientador no prazo: 
                                  <span className="font-semibold"> Mês {relatoriosAtrasados.join(', ')}</span>
                                </p>
                                <p className="text-xs text-red-600">
                                  📞 Prazo de entrega finalizado. Entre em contato com o coordenador para solicitar o reenvio.
                                </p>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Legenda da etapa atual do progresso */}
                      {(!etapaAtual || etapaAtual === 'apresentacao_proposta') && (
                        <div className="mt-4">
                          {apresentacaoInfo ? (
                            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                              <p className="text-sm font-bold text-green-800 mb-3">
                                ✅ Apresentação Agendada!
                              </p>
                              <div className="space-y-2 text-sm text-green-700">
                                <p className="flex items-center">
                                  <span className="font-semibold mr-2">📅 Data:</span>
                                  {new Date(apresentacaoInfo.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                                </p>
                                <p className="flex items-center">
                                  <span className="font-semibold mr-2">🕐 Horário:</span>
                                  {apresentacaoInfo.hora}
                                </p>
                                <p className="flex items-center">
                                  <span className="font-semibold mr-2">🏫 Campus:</span>
                                  {apresentacaoInfo.campus}
                                </p>
                                {apresentacaoInfo.sala && (
                                  <p className="flex items-center">
                                    <span className="font-semibold mr-2">🚪 Sala:</span>
                                    {apresentacaoInfo.sala}
                                  </p>
                                )}
                              </div>
                              <p className="text-xs text-green-600 mt-3">
                                Prepare sua apresentação e esteja no local no horário indicado.
                              </p>
                            </div>
                          ) : (
                            <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-500">
                              <p className="text-sm font-semibold text-yellow-800">
                                ⏳ Aguardando Agendamento - O coordenador agendará a data da sua apresentação em breve
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                    {etapaAtual === 'apresentacao_amostra' && (
                      <div className="mt-4">
                        {amostraInfo ? (
                          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                            <p className="text-sm font-bold text-blue-800 mb-3">
                              ✅ Apresentação na Amostra Agendada!
                            </p>
                            <div className="space-y-2 text-sm text-blue-700">
                              <p className="flex items-center">
                                <span className="font-semibold mr-2">📅 Data:</span>
                                {new Date(amostraInfo.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                              </p>
                              <p className="flex items-center">
                                <span className="font-semibold mr-2">🕐 Horário:</span>
                                {amostraInfo.hora}
                              </p>
                              <p className="flex items-center">
                                <span className="font-semibold mr-2">🏫 Campus:</span>
                                {amostraInfo.campus}
                              </p>
                              {amostraInfo.sala && (
                                <p className="flex items-center">
                                  <span className="font-semibold mr-2">🚪 Sala:</span>
                                  {amostraInfo.sala}
                                </p>
                              )}
                            </div>
                            <p className="text-xs text-blue-600 mt-3">
                              Prepare seu material de apresentação para a mostra científica.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-500">
                            <p className="text-sm font-semibold text-yellow-800">
                              ⏳ Aguardando Agendamento - O coordenador agendará a data da sua apresentação na amostra em breve
                            </p>
                          </div>
                        )}
                      </div>
                    )}                      {etapaAtual && etapaAtual !== 'concluido' && etapaAtual !== 'apresentacao_proposta' && etapaAtual !== 'apresentacao_amostra' && (
                        <div className="mt-4 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                          <p className="text-sm font-semibold text-blue-800">
                            📍 Etapa Atual: {
                              etapaAtual === 'relatorio_parcial' ? 'Envio do Relatório Parcial' :
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
                        
                        {/* Status de Aprovação do Relatório Parcial */}
                        {entregaRelatorioParcial && (
                          <div className="mt-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-bold text-ibmec-blue-800">📋 Status da Avaliação</h3>
                              <button
                                onClick={fetchStatusRelatorioParcial}
                                className="text-sm bg-ibmec-blue-600 hover:bg-ibmec-blue-700 text-white px-3 py-1.5 rounded-lg transition flex items-center gap-2"
                              >
                                🔄 Atualizar Status
                              </button>
                            </div>
                            
                            {/* Status Orientador */}
                            <div className={`p-4 rounded-lg border-2 ${
                              entregaRelatorioParcial.status_aprovacao_orientador === 'aprovado' 
                                ? 'bg-green-50 border-green-500' 
                                : entregaRelatorioParcial.status_aprovacao_orientador === 'rejeitado'
                                ? 'bg-red-50 border-red-500'
                                : 'bg-yellow-50 border-yellow-500'
                            }`}>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">
                                  {entregaRelatorioParcial.status_aprovacao_orientador === 'aprovado' ? '✅' :
                                   entregaRelatorioParcial.status_aprovacao_orientador === 'rejeitado' ? '❌' : '⏳'}
                                </span>
                                <div>
                                  <p className="font-bold text-sm">Avaliação do Orientador</p>
                                  <p className={`text-xs font-semibold ${
                                    entregaRelatorioParcial.status_aprovacao_orientador === 'aprovado' 
                                      ? 'text-green-800' 
                                      : entregaRelatorioParcial.status_aprovacao_orientador === 'rejeitado'
                                      ? 'text-red-800'
                                      : 'text-yellow-800'
                                  }`}>
                                    {entregaRelatorioParcial.status_aprovacao_orientador === 'aprovado' ? 'Aprovado' :
                                     entregaRelatorioParcial.status_aprovacao_orientador === 'rejeitado' ? 'Rejeitado' : 'Aguardando Avaliação'}
                                  </p>
                                </div>
                              </div>
                              {entregaRelatorioParcial.feedback_orientador && (
                                <p className="text-sm text-gray-700 mt-2 italic">
                                  "{entregaRelatorioParcial.feedback_orientador}"
                                </p>
                              )}
                            </div>

                            {/* Status Coordenador - Só mostra se orientador aprovou */}
                            {entregaRelatorioParcial.status_aprovacao_orientador === 'aprovado' && (
                              <div className={`p-4 rounded-lg border-2 ${
                                entregaRelatorioParcial.status_aprovacao_coordenador === 'aprovado' 
                                  ? 'bg-green-50 border-green-500' 
                                  : entregaRelatorioParcial.status_aprovacao_coordenador === 'rejeitado'
                                  ? 'bg-red-50 border-red-500'
                                  : 'bg-yellow-50 border-yellow-500'
                              }`}>
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-2xl">
                                    {entregaRelatorioParcial.status_aprovacao_coordenador === 'aprovado' ? '✅' :
                                     entregaRelatorioParcial.status_aprovacao_coordenador === 'rejeitado' ? '❌' : '⏳'}
                                  </span>
                                  <div>
                                    <p className="font-bold text-sm">Avaliação do Coordenador</p>
                                    <p className={`text-xs font-semibold ${
                                      entregaRelatorioParcial.status_aprovacao_coordenador === 'aprovado' 
                                        ? 'text-green-800' 
                                        : entregaRelatorioParcial.status_aprovacao_coordenador === 'rejeitado'
                                        ? 'text-red-800'
                                        : 'text-yellow-800'
                                    }`}>
                                      {entregaRelatorioParcial.status_aprovacao_coordenador === 'aprovado' ? 'Aprovado' :
                                       entregaRelatorioParcial.status_aprovacao_coordenador === 'rejeitado' ? 'Rejeitado' : 'Aguardando Avaliação'}
                                    </p>
                                  </div>
                                </div>
                                {entregaRelatorioParcial.feedback_coordenador && (
                                  <p className="text-sm text-gray-700 mt-2 italic">
                                    "{entregaRelatorioParcial.feedback_coordenador}"
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Mensagem de sucesso se ambos aprovaram */}
                            {entregaRelatorioParcial.status_aprovacao_orientador === 'aprovado' && 
                             entregaRelatorioParcial.status_aprovacao_coordenador === 'aprovado' && (
                              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <span className="text-3xl">🎉</span>
                                  <div>
                                    <p className="font-bold text-lg">Parabéns!</p>
                                    <p className="text-sm">Seu relatório parcial foi aprovado pelo orientador e coordenador!</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {etapaAtual === 'apresentacao_amostra' && (
                      <>
                        {amostraInfo && (
                          <div className="mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg p-6">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="text-5xl">✅</div>
                              <div className="flex-1">
                                <h3 className="text-2xl font-bold text-blue-800 mb-1">
                                  Apresentação na Amostra Agendada!
                                </h3>
                                <p className="text-sm text-blue-700">
                                  Sua apresentação na mostra científica foi agendada pelo coordenador.
                                </p>
                              </div>
                            </div>
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="bg-white p-3 rounded-lg shadow-sm">
                                <p className="text-xs text-gray-600 font-semibold mb-1">📅 DATA</p>
                                <p className="text-lg font-bold text-blue-800">
                                  {new Date(amostraInfo.data + 'T00:00:00').toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                              <div className="bg-white p-3 rounded-lg shadow-sm">
                                <p className="text-xs text-gray-600 font-semibold mb-1">🕐 HORÁRIO</p>
                                <p className="text-lg font-bold text-blue-800">{amostraInfo.hora}</p>
                              </div>
                              <div className="bg-white p-3 rounded-lg shadow-sm">
                                <p className="text-xs text-gray-600 font-semibold mb-1">🏫 CAMPUS</p>
                                <p className="text-lg font-bold text-blue-800">{amostraInfo.campus}</p>
                              </div>
                              {amostraInfo.sala && (
                                <div className="bg-white p-3 rounded-lg shadow-sm">
                                  <p className="text-xs text-gray-600 font-semibold mb-1">🚪 SALA</p>
                                  <p className="text-lg font-bold text-blue-800">{amostraInfo.sala}</p>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-blue-700 mt-3 font-medium">
                              💡 Prepare seu material de apresentação e esteja no local no horário indicado para a mostra científica.
                            </p>
                          </div>
                        )}
                        <div className="mt-8">
                          <EnviarApresentacaoAmostra />
                        </div>
                      </>
                    )}
                    {etapaAtual === 'artigo_final' && (
                      <div className="mt-8">
                        <EnviarArtigoFinal />
                      </div>
                    )}
                  </Card>

                  {/* Card de Conclusão - Aparece quando artigo final é aprovado */}
                  {entregaArtigoFinal && 
                   entregaArtigoFinal.status_aprovacao_orientador === 'aprovado' && 
                   entregaArtigoFinal.status_aprovacao_coordenador === 'aprovado' && (
                    <Card>
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 rounded-lg shadow-xl">
                        <div className="text-center space-y-4">
                          <div className="text-6xl mb-4">🎓🎉</div>
                          <h2 className="text-3xl font-bold">
                            Parabéns! Você concluiu todas as etapas!
                          </h2>
                          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 my-6">
                            <p className="text-lg font-semibold mb-3">
                              ✅ Todas as etapas da Iniciação Científica foram concluídas com sucesso!
                            </p>
                            <div className="space-y-2 text-left max-w-2xl mx-auto">
                              <p className="flex items-start gap-2">
                                <span className="text-xl">📝</span>
                                <span>Relatório Parcial aprovado</span>
                              </p>
                              <p className="flex items-start gap-2">
                                <span className="text-xl">🎨</span>
                                <span>Apresentação na Amostra aprovada</span>
                              </p>
                              <p className="flex items-start gap-2">
                                <span className="text-xl">📚</span>
                                <span>Artigo Científico Final aprovado</span>
                              </p>
                              <p className="flex items-start gap-2">
                                <span className="text-xl">📅</span>
                                <span>5 Relatórios Mensais entregues ao orientador</span>
                              </p>
                            </div>
                          </div>
                          <div className="bg-white text-gray-900 rounded-lg p-6 shadow-lg">
                            <p className="text-2xl font-bold mb-2">🏆 Certificado de Conclusão</p>
                            {certificadoInfo ? (
                              <>
                                <p className="text-base mb-4">
                                  Seu <strong>Certificado de Conclusão da Iniciação Científica</strong> está disponível!
                                </p>
                                <p className="text-sm text-gray-600 mb-4">
                                  Emitido em: {new Date(certificadoInfo.data_emissao).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </p>
                                <a
                                  href={`${API_BASE_URL}/uploads/certificados/${certificadoInfo.certificado_arquivo}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg"
                                >
                                  <span className="text-xl">📥</span>
                                  Baixar Certificado (PDF)
                                </a>
                              </>
                            ) : (
                              <>
                                <p className="text-base">
                                  Seu <strong>Certificado de Conclusão da Iniciação Científica</strong> será emitido em breve pela coordenação do programa.
                                </p>
                                <p className="text-sm mt-3 font-semibold">
                                  Você receberá o certificado em PDF diretamente pelo site quando estiver disponível.
                                </p>
                              </>
                            )}
                          </div>
                          <div className="pt-4">
                            <p className="text-lg font-medium">
                              Obrigado por sua dedicação e empenho no programa de Iniciação Científica! 🚀
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )}

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
              </>
            )}

            {/* Mensagens/Feedbacks - Aparece apenas se tiver proposta */}
            {temProposta && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-ibmec-blue-800">
                    💬 Mensagens e Feedbacks
                  </h2>
                  
                  {/* Filtro por etapa */}
                  <select
                    value={filtroFeedback}
                    onChange={(e) => setFiltroFeedback(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ibmec-blue-500 focus:border-ibmec-blue-500"
                  >
                    <option value="todos">Todos os Feedbacks</option>
                    <option value="proposta">Proposta Inicial</option>
                    <option value="apresentacao">Apresentação</option>
                    <option value="relatorio_parcial">Relatório Parcial</option>
                  </select>
                </div>
                
                {(() => {
                  // Organizar feedbacks por categoria
                  const feedbacks = [];
                  
                  // Feedback do Orientador (Proposta Inicial)
                  if (inscricao.feedback_orientador && (filtroFeedback === 'todos' || filtroFeedback === 'proposta')) {
                    feedbacks.push({
                      tipo: 'proposta',
                      categoria: 'Proposta Inicial',
                      autor: 'Orientador',
                      status: inscricao.status_aprovacao_orientador,
                      feedback: inscricao.feedback_orientador,
                      data: inscricao.data_avaliacao_orientador
                    });
                  }
                  
                  // Feedback do Coordenador - verificar se é da proposta inicial ou da apresentação
                  if (inscricao.feedback_coordenador) {
                    // Se o status é rejeitada_apresentacao ou aprovada, o feedback é da apresentação
                    if ((inscricao.status === 'rejeitada_apresentacao' || inscricao.status === 'aprovada') && (filtroFeedback === 'todos' || filtroFeedback === 'apresentacao')) {
                      feedbacks.push({
                        tipo: 'apresentacao',
                        categoria: 'Apresentação',
                        autor: 'Coordenador',
                        status: inscricao.status === 'rejeitada_apresentacao' ? 'rejeitado' : 'aprovado',
                        feedback: inscricao.feedback_coordenador,
                        data: inscricao.data_avaliacao_coordenador
                      });
                    }
                    // Senão, é da proposta inicial
                    else if (inscricao.status !== 'rejeitada_apresentacao' && inscricao.status !== 'aprovada' && (filtroFeedback === 'todos' || filtroFeedback === 'proposta')) {
                      feedbacks.push({
                        tipo: 'proposta',
                        categoria: 'Proposta Inicial',
                        autor: 'Coordenador',
                        status: inscricao.status_aprovacao_coordenador,
                        feedback: inscricao.feedback_coordenador,
                        data: inscricao.data_avaliacao_coordenador
                      });
                    }
                  }
                  
                  // Feedback da Apresentação adicional (se vier do campo feedback_apresentacao do projeto)
                  if (feedbackApresentacao && feedbackApresentacao !== inscricao.feedback_coordenador && (filtroFeedback === 'todos' || filtroFeedback === 'apresentacao')) {
                    feedbacks.push({
                      tipo: 'apresentacao',
                      categoria: 'Apresentação',
                      autor: 'Coordenador',
                      status: inscricao.status === 'rejeitada_apresentacao' ? 'rejeitado' : 'aprovado',
                      feedback: feedbackApresentacao,
                      data: inscricao.data_avaliacao_coordenador
                    });
                  }
                  
                  // Feedback do Relatório Parcial (se houver)
                  if (entregaRelatorioParcial?.feedback_orientador && (filtroFeedback === 'todos' || filtroFeedback === 'relatorio_parcial')) {
                    feedbacks.push({
                      tipo: 'relatorio_parcial',
                      categoria: 'Relatório Parcial',
                      autor: 'Orientador',
                      status: entregaRelatorioParcial.status_aprovacao_orientador,
                      feedback: entregaRelatorioParcial.feedback_orientador,
                      data: entregaRelatorioParcial.data_avaliacao_orientador
                    });
                  }
                  
                  if (entregaRelatorioParcial?.feedback_coordenador && (filtroFeedback === 'todos' || filtroFeedback === 'relatorio_parcial')) {
                    feedbacks.push({
                      tipo: 'relatorio_parcial',
                      categoria: 'Relatório Parcial',
                      autor: 'Coordenador',
                      status: entregaRelatorioParcial.status_aprovacao_coordenador,
                      feedback: entregaRelatorioParcial.feedback_coordenador,
                      data: entregaRelatorioParcial.data_avaliacao_coordenador
                    });
                  }
                  
                  // Se não houver feedbacks
                  if (feedbacks.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-gray-500">
                          {filtroFeedback === 'todos' 
                            ? 'Nenhuma mensagem no momento' 
                            : `Nenhum feedback encontrado para ${filtroFeedback === 'proposta' ? 'Proposta Inicial' : filtroFeedback === 'apresentacao' ? 'Apresentação' : 'Relatório Parcial'}`
                          }
                        </p>
                      </div>
                    );
                  }
                  
                  // Renderizar feedbacks
                  return (
                    <div className="space-y-4">
                      {feedbacks.map((fb, index) => (
                        <div 
                          key={index}
                          className={`p-4 rounded-lg border-l-4 ${
                            fb.status === 'rejeitado' 
                              ? 'bg-red-50 border-red-500' 
                              : fb.autor === 'Orientador'
                              ? 'bg-green-50 border-green-500'
                              : 'bg-blue-50 border-blue-500'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">
                                {fb.status === 'rejeitado' ? '❌' : fb.autor === 'Orientador' ? '✅' : '🎓'}
                              </span>
                              <div>
                                <p className={`font-bold ${
                                  fb.status === 'rejeitado' 
                                    ? 'text-red-800' 
                                    : fb.autor === 'Orientador'
                                    ? 'text-green-800'
                                    : 'text-blue-800'
                                }`}>
                                  {fb.status === 'rejeitado' 
                                    ? `Rejeitado - ${fb.categoria}` 
                                    : `Avaliação ${fb.categoria}`
                                  }
                                </p>
                                <p className="text-xs text-gray-500 font-medium">
                                  {fb.autor}
                                </p>
                                {fb.data && (
                                  <p className="text-sm text-gray-600">
                                    {new Date(fb.data).toLocaleString('pt-BR', {
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
                            fb.status === 'rejeitado' 
                              ? 'border-red-200' 
                              : fb.autor === 'Orientador'
                              ? 'border-green-200'
                              : 'border-blue-200'
                          }`}>
                            <p className="text-gray-800 whitespace-pre-wrap">{fb.feedback}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
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
