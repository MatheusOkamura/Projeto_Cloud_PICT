import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';

const DashboardCoordenador = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inscricoes');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [inscricoes, setInscricoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackModal, setFeedbackModal] = useState({ open: false, id: null, status: 'aprovado', mensagem: '' });
  const [selectedAlunoEntregas, setSelectedAlunoEntregas] = useState(null);
  const [entregasAluno, setEntregasAluno] = useState([]);
  const [propostaDetalhada, setPropostaDetalhada] = useState(null);
  const [orientadores, setOrientadores] = useState([]);
  const [relatoriosMensais, setRelatoriosMensais] = useState([]);
  const [selectedOrientador, setSelectedOrientador] = useState(null);
  const [loadingRelatorios, setLoadingRelatorios] = useState(false);
  const [respostaModal, setRespostaModal] = useState({ open: false, relatorioId: null, resposta: '', relatorioInfo: null });

  const loadInscricoes = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8000/api/inscricoes');
      const data = await res.json();
      setInscricoes(data || []);
    } catch (err) {
      setError('Falha ao carregar propostas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInscricoes();
    loadOrientadores();
  }, []);

  const loadOrientadores = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/orientadores');
      const data = await res.json();
      setOrientadores(data.orientadores || []);
    } catch (err) {
      console.error('Erro ao carregar orientadores:', err);
    }
  };

  const carregarRelatoriosMensais = async (orientadorId) => {
    try {
      setLoadingRelatorios(true);
      setSelectedOrientador(orientadorId);
      const res = await fetch(`http://localhost:8000/api/coordenadores/orientadores/${orientadorId}/relatorios-mensais`);
      if (!res.ok) throw new Error('Falha ao carregar relatórios');
      const data = await res.json();
      setRelatoriosMensais(data.relatorios || []);
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err);
      alert('Erro ao carregar relatórios mensais');
    } finally {
      setLoadingRelatorios(false);
    }
  };

  const carregarEntregasAluno = async (alunoId, nomeAluno = null) => {
    try {
      const res = await fetch(`http://localhost:8000/api/coordenadores/alunos/${alunoId}/entregas`);
      if (!res.ok) throw new Error('Falha ao carregar entregas do aluno');
      const data = await res.json();
      setSelectedAlunoEntregas({ id: alunoId, nome: nomeAluno || `Aluno #${alunoId}` });
      setEntregasAluno(data.entregas || []);
    } catch (e) {
      alert('Erro ao carregar entregas do aluno');
    }
  };

  const validarEntrega = async (projetoId, entregaId, novoStatus) => {
    try {
      const res = await fetch(`http://localhost:8000/api/coordenadores/entregas/${projetoId}/${entregaId}/status?novo_status=${encodeURIComponent(novoStatus)}`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Falha ao validar entrega');
      // Atualiza localmente
      setEntregasAluno((prev) => prev.map(e => e.id === entregaId ? { ...e, status: novoStatus } : e));
    } catch (e) {
      alert('Erro ao validar entrega');
    }
  };

  const abrirModalResposta = (relatorio) => {
    setRespostaModal({
      open: true,
      relatorioId: relatorio.id,
      resposta: relatorio.feedback_coordenador || '',
      relatorioInfo: relatorio
    });
  };

  const enviarRespostaRelatorio = async () => {
    try {
      if (!respostaModal.resposta.trim()) {
        alert('Por favor, escreva uma resposta');
        return;
      }

      const res = await fetch(
        `http://localhost:8000/api/coordenadores/relatorios-mensais/${respostaModal.relatorioId}/responder`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feedback_coordenador: respostaModal.resposta,
            coordenador_id: user?.id
          })
        }
      );

      if (!res.ok) throw new Error('Falha ao enviar resposta');

      const data = await res.json();
      alert(data.message || 'Mensagem enviada com sucesso!');

      // Atualizar lista de relatórios
      if (selectedOrientador) {
        await carregarRelatoriosMensais(selectedOrientador);
      }

      // Fechar modal
      setRespostaModal({ open: false, relatorioId: null, resposta: '', relatorioInfo: null });
    } catch (err) {
      console.error('Erro ao enviar resposta:', err);
      alert('Erro ao enviar resposta: ' + err.message);
    }
  };

  const verDetalhesProposta = (inscricao) => {
    setPropostaDetalhada(inscricao);
  };

  const fecharDetalhes = () => {
    setPropostaDetalhada(null);
  };

  const estatisticas = {
    total: inscricoes.length,
    aprovados: inscricoes.filter(i => i.status === 'aprovada').length,
    pendentes: inscricoes.filter(i => i.status === 'pendente' || i.status === 'em_analise' || i.status === 'pendente_coordenador' || i.status === 'pendente_orientador').length,
    rejeitados: inscricoes.filter(i => i.status === 'rejeitada' || i.status === 'rejeitada_orientador' || i.status === 'rejeitada_coordenador').length,
    alunos: inscricoes.filter(i => i.tipo === 'aluno' || i.usuario_id).length,
    orientadores: inscricoes.filter(i => i.tipo === 'orientador').length
  };

  const filteredInscricoes = filterStatus === 'todos' 
    ? inscricoes 
    : filterStatus === 'em_analise'
    ? inscricoes.filter(i => 
        i.status === 'em_analise' || 
        i.status === 'pendente_orientador' || 
        i.status === 'pendente_coordenador' ||
        i.status === 'pendente'
      )
    : filterStatus === 'rejeitada'
    ? inscricoes.filter(i => 
        i.status === 'rejeitada' || 
        i.status === 'rejeitada_orientador' || 
        i.status === 'rejeitada_coordenador'
      )
    : inscricoes.filter(i => i.status === filterStatus);

  const getStatusColor = (status) => {
    switch (status) {
      case 'aprovada':
        return 'bg-green-100 text-green-800';
      case 'pendente':
      case 'pendente_orientador':
      case 'pendente_coordenador':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejeitada':
      case 'rejeitada_orientador':
      case 'rejeitada_coordenador':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const openFeedback = (id, status) => {
    setFeedbackModal({ open: true, id, status, mensagem: '' });
  };

  const enviarDecisao = async () => {
    try {
      const aprovar = feedbackModal.status === 'aprovado';
      
      const formData = new URLSearchParams();
      formData.append('aprovar', aprovar.toString());
      if (feedbackModal.mensagem) {
        formData.append('feedback', feedbackModal.mensagem);
      }

      console.log('Coordenador avaliando proposta:', {
        proposta_id: feedbackModal.id,
        aprovar: aprovar,
        feedback: feedbackModal.mensagem
      });

      const res = await fetch(
        `http://localhost:8000/api/inscricoes/${feedbackModal.id}/coordenador/avaliar`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        }
      );

      console.log('Resposta:', res.status);

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Erro:', errorData);
        throw new Error(errorData.detail || 'Falha ao avaliar proposta');
      }

      const data = await res.json();
      console.log('Sucesso:', data);
      
      setFeedbackModal({ open: false, id: null, status: 'aprovado', mensagem: '' });
      await loadInscricoes();
      alert(data.message || 'Decisão registrada com sucesso!');
    } catch (err) {
      console.error('Erro ao avaliar:', err);
      alert('Erro: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ibmec-blue-50 to-gray-100 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-ibmec-blue-800 mb-2">
            Painel Administrativo 🎯
          </h1>
          <p className="text-gray-600">{user?.nome} - {user?.departamento}</p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid md:grid-cols-6 gap-4 mb-8">
          <Card>
            <div className="text-center">
              <div className="text-3xl mb-1">📊</div>
              <p className="text-2xl font-bold text-ibmec-blue-700">{estatisticas.total}</p>
              <p className="text-gray-600 text-xs">Total</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="text-3xl mb-1">✅</div>
              <p className="text-2xl font-bold text-green-600">{estatisticas.aprovados}</p>
              <p className="text-gray-600 text-xs">Aprovados</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="text-3xl mb-1">⏳</div>
              <p className="text-2xl font-bold text-yellow-600">{estatisticas.pendentes}</p>
              <p className="text-gray-600 text-xs">Pendentes</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="text-3xl mb-1">❌</div>
              <p className="text-2xl font-bold text-red-600">{estatisticas.rejeitados}</p>
              <p className="text-gray-600 text-xs">Rejeitados</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="text-3xl mb-1">👨‍🎓</div>
              <p className="text-2xl font-bold text-ibmec-blue-700">{estatisticas.alunos}</p>
              <p className="text-gray-600 text-xs">Alunos</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="text-3xl mb-1">👨‍🏫</div>
              <p className="text-2xl font-bold text-ibmec-gold-600">{estatisticas.orientadores}</p>
              <p className="text-gray-600 text-xs">Orientadores</p>
            </div>
          </Card>
        </div>

        {/* Acesso rápido à Gestão de Status */}
        <Card>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-ibmec-blue-700">⚙️ Gestão de Status dos Projetos</h2>
              <p className="text-gray-600 text-sm mt-1">
                Atualize a etapa/estado dos projetos dos alunos (proposta, relatório parcial, apresentação na amostra, artigo final, finalizado).
              </p>
            </div>
            <div className="shrink-0">
              <button className="btn-primary" onClick={() => navigate('/coordenador/status')}>
                Abrir Gestão de Status
              </button>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-300">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('inscricoes')}
                className={`px-6 py-3 font-semibold transition ${
                  activeTab === 'inscricoes'
                    ? 'border-b-4 border-ibmec-blue-600 text-ibmec-blue-700'
                    : 'text-gray-600 hover:text-ibmec-blue-600'
                }`}
              >
                📋 Gerenciar Inscrições
              </button>
              <button
                onClick={() => setActiveTab('relatorios')}
                className={`px-6 py-3 font-semibold transition ${
                  activeTab === 'relatorios'
                    ? 'border-b-4 border-ibmec-blue-600 text-ibmec-blue-700'
                    : 'text-gray-600 hover:text-ibmec-blue-600'
                }`}
              >
                📈 Relatórios
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === 'inscricoes' && (
          <div className="space-y-6">
            {/* Filtros */}
            <Card>
              <div className="flex flex-wrap gap-4 items-center">
                <span className="font-semibold text-gray-700">Filtrar por status:</span>
                <button
                  onClick={() => setFilterStatus('todos')}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    filterStatus === 'todos'
                      ? 'bg-ibmec-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Todos ({inscricoes.length})
                </button>
                <button
                  onClick={() => setFilterStatus('em_analise')}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    filterStatus === 'em_analise'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Em Análise ({estatisticas.pendentes})
                </button>
                <button
                  onClick={() => setFilterStatus('aprovada')}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    filterStatus === 'aprovada'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Aprovados ({estatisticas.aprovados})
                </button>
                <button
                  onClick={() => setFilterStatus('rejeitada')}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    filterStatus === 'rejeitada'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Rejeitados ({estatisticas.rejeitados})
                </button>
              </div>
            </Card>

            {/* Lista de Inscrições */}
            <div className="space-y-4">
              {loading ? (
                <Card><div className="text-center py-8 text-gray-600">Carregando propostas...</div></Card>
              ) : (
              filteredInscricoes.map((inscricao) => (
                <Card key={inscricao.id}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-ibmec-blue-700">
                          {inscricao.nome || `Usuário #${inscricao.usuario_id}`}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(inscricao.status)}`}>
                          {inscricao.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                        <p><strong>Projeto:</strong> {inscricao.titulo_projeto}</p>
                        <p><strong>Área:</strong> {inscricao.area_conhecimento}</p>
                        {inscricao.orientador_nome && <p><strong>Orientador:</strong> {inscricao.orientador_nome}</p>}
                        {inscricao.email && <p><strong>Email:</strong> {inscricao.email}</p>}
                        {inscricao.curso && <p><strong>Curso:</strong> {inscricao.curso}</p>}
                        {inscricao.matricula && <p><strong>Matrícula:</strong> {inscricao.matricula}</p>}
                        {inscricao.unidade && <p><strong>Unidade:</strong> {inscricao.unidade}</p>}
                        {inscricao.cr && <p><strong>CR:</strong> {inscricao.cr}</p>}
                        <p><strong>Data:</strong> {inscricao.data_submissao ? new Date(inscricao.data_submissao).toLocaleString('pt-BR') : '-'}</p>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p className="mb-2"><strong>Descrição:</strong> {inscricao.descricao?.substring(0, 150)}{inscricao.descricao?.length > 150 ? '...' : ''}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:w-60">
                      <button 
                        onClick={() => verDetalhesProposta(inscricao)} 
                        className="btn-primary text-sm py-2"
                      >
                        👁️ Ver Detalhes Completos
                      </button>
                      {/* Mostrar botões de aprovar/rejeitar apenas se o status for pendente_coordenador */}
                      {inscricao.status === 'pendente_coordenador' && (
                        <>
                          <button onClick={() => setFeedbackModal({ open: true, id: inscricao.id, status: 'aprovado', mensagem: '' })} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm">
                            ✅ Aprovar
                          </button>
                          <button onClick={() => setFeedbackModal({ open: true, id: inscricao.id, status: 'rejeitado', mensagem: '' })} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm">
                            ❌ Rejeitar
                          </button>
                        </>
                      )}
                      {inscricao.usuario_id && (
                        <button onClick={() => carregarEntregasAluno(inscricao.usuario_id, inscricao.nome)} className="btn-outline text-sm py-2">
                          📦 Ver Entregas do Aluno
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              )))
              }
            </div>

            {selectedAlunoEntregas && (
              <Card>
                <h3 className="text-xl font-bold text-ibmec-blue-700 mb-4">📦 Entregas do Aluno {selectedAlunoEntregas.nome}</h3>
                {entregasAluno.length === 0 ? (
                  <p className="text-gray-600">Nenhuma entrega registrada.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600 border-b">
                          <th className="py-2 pr-4">ID</th>
                          <th className="py-2 pr-4">Tipo</th>
                          <th className="py-2 pr-4">Data</th>
                          <th className="py-2 pr-4">Status</th>
                          <th className="py-2 pr-4">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entregasAluno.map((e) => (
                          <tr key={e.id} className="border-b last:border-0">
                            <td className="py-2 pr-4">{e.id}</td>
                            <td className="py-2 pr-4">{e.tipo}</td>
                            <td className="py-2 pr-4">{e.data ? new Date(e.data).toLocaleString('pt-BR') : '-'}</td>
                            <td className="py-2 pr-4">{e.status}</td>
                            <td className="py-2 pr-4 space-x-2">
                              <button className="btn-secondary text-xs" onClick={() => validarEntrega(e.projeto_id || 0, e.id, 'aprovado')}>Aprovar</button>
                              <button className="btn-outline text-xs" onClick={() => validarEntrega(e.projeto_id || 0, e.id, 'em revisão')}>Em revisão</button>
                              <button className="btn-outline text-xs" onClick={() => validarEntrega(e.projeto_id || 0, e.id, 'rejeitado')}>Rejeitar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {activeTab === 'relatorios' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-ibmec-blue-800">Relatórios e Análises</h2>
            
            {/* Relatórios Mensais por Orientador */}
            <Card>
              <h3 className="text-xl font-bold text-ibmec-blue-700 mb-4">
                📅 Relatórios Mensais dos Orientadores
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Selecione um orientador para visualizar os relatórios mensais enviados por ele e seus alunos.
              </p>

              {/* Lista de Orientadores */}
              <div className="mb-6">
                <label className="label">Selecione o Orientador:</label>
                <select 
                  className="input-field"
                  onChange={(e) => carregarRelatoriosMensais(e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>-- Escolha um orientador --</option>
                  {orientadores.map((orientador) => (
                    <option key={orientador.id} value={orientador.id}>
                      {orientador.nome} - {orientador.departamento || 'Sem departamento'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Relatórios do Orientador Selecionado */}
              {loadingRelatorios && (
                <div className="text-center py-8 text-gray-600">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ibmec-blue-600 mx-auto mb-4"></div>
                  Carregando relatórios...
                </div>
              )}

              {!loadingRelatorios && selectedOrientador && relatoriosMensais.length === 0 && (
                <div className="text-center py-8 text-gray-600">
                  <p className="text-lg">📭 Nenhum relatório mensal encontrado para este orientador.</p>
                </div>
              )}

              {!loadingRelatorios && relatoriosMensais.length > 0 && (
                <div className="space-y-4">
                  {/* Agrupar relatórios por aluno */}
                  {(() => {
                    // Criar objeto para agrupar por aluno
                    const porAluno = relatoriosMensais.reduce((acc, rel) => {
                      const alunoKey = rel.aluno_nome || `Aluno #${rel.aluno_id}`;
                      if (!acc[alunoKey]) {
                        acc[alunoKey] = [];
                      }
                      acc[alunoKey].push(rel);
                      return acc;
                    }, {});

                    return Object.entries(porAluno).map(([alunoNome, relatorios]) => (
                      <div key={alunoNome} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                        <h4 className="font-bold text-ibmec-blue-800 mb-3 flex items-center gap-2">
                          <span className="text-2xl">👨‍🎓</span>
                          <span>Aluno: {alunoNome}</span>
                          <span className="text-sm font-normal text-gray-600">
                            ({relatorios.length} {relatorios.length === 1 ? 'relatório' : 'relatórios'})
                          </span>
                        </h4>
                        
                        <div className="space-y-2">
                          {relatorios
                            .sort((a, b) => new Date(b.mes) - new Date(a.mes))
                            .map((rel) => (
                              <div key={rel.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-lg font-semibold text-ibmec-blue-700">
                                        📆 {(() => {
                                          // Corrigir interpretação do mês para evitar problemas de fuso horário
                                          const [ano, mes] = rel.mes.split('-');
                                          const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                                                        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
                                          return `${meses[parseInt(mes) - 1]} de ${ano}`;
                                        })()}
                                      </span>
                                    </div>
                                    {rel.descricao && (
                                      <p className="text-sm text-gray-700 mb-2">
                                        <strong>Descrição:</strong> {rel.descricao}
                                      </p>
                                    )}
                                    
                                    {/* Histórico de Mensagens */}
                                    {rel.mensagens && rel.mensagens.length > 0 && (
                                      <div className="mt-3 space-y-3">
                                        <p className="text-sm font-semibold text-gray-800 mb-2">
                                          💬 Histórico de Mensagens:
                                        </p>
                                        {rel.mensagens.map((msg, idx) => (
                                          <div 
                                            key={msg.id || idx}
                                            className={`p-3 rounded border-l-4 ${
                                              msg.tipo_usuario === 'coordenador'
                                                ? 'bg-green-50 border-green-500'
                                                : 'bg-blue-50 border-blue-500'
                                            }`}
                                          >
                                            <p className={`text-sm font-semibold mb-1 ${
                                              msg.tipo_usuario === 'coordenador'
                                                ? 'text-green-800'
                                                : 'text-blue-800'
                                            }`}>
                                              {msg.tipo_usuario === 'coordenador' ? '✅ Coordenador' : '↩️ Orientador'}:
                                            </p>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.mensagem}</p>
                                            {msg.data_criacao && (
                                              <p className="text-xs text-gray-500 mt-1">
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
                                    )}
                                    
                                    <p className="text-xs text-gray-500 mt-2">
                                      Enviado em: {new Date(rel.data_envio).toLocaleString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    {rel.arquivo_url ? (
                                      <a 
                                        href={rel.arquivo_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn-primary text-sm py-2 px-4 text-center"
                                      >
                                        📎 Baixar Arquivo
                                      </a>
                                    ) : (
                                      <span className="text-xs text-gray-500 italic">
                                        Sem arquivo anexado
                                      </span>
                                    )}
                                    <button
                                      onClick={() => abrirModalResposta(rel)}
                                      className="btn-secondary text-sm py-2 px-4"
                                    >
                                      💬 Enviar Mensagem
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-xl font-bold text-ibmec-blue-700 mb-4">
                  📊 Distribuição por Status
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Aprovados</span>
                      <span className="text-sm font-semibold">{estatisticas.aprovados} ({Math.round(estatisticas.aprovados/estatisticas.total*100)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-green-500 h-3 rounded-full" style={{width: `${estatisticas.aprovados/estatisticas.total*100}%`}}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Pendentes</span>
                      <span className="text-sm font-semibold">{estatisticas.pendentes} ({Math.round(estatisticas.pendentes/estatisticas.total*100)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-yellow-500 h-3 rounded-full" style={{width: `${estatisticas.pendentes/estatisticas.total*100}%`}}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Rejeitados</span>
                      <span className="text-sm font-semibold">{estatisticas.rejeitados} ({Math.round(estatisticas.rejeitados/estatisticas.total*100)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-red-500 h-3 rounded-full" style={{width: `${estatisticas.rejeitados/estatisticas.total*100}%`}}></div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <h3 className="text-xl font-bold text-ibmec-blue-700 mb-4">
                  👥 Distribuição por Tipo
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-ibmec-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Alunos</p>
                      <p className="text-2xl font-bold text-ibmec-blue-700">{estatisticas.alunos}</p>
                    </div>
                    <div className="text-4xl">👨‍🎓</div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-ibmec-gold-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Orientadores</p>
                      <p className="text-2xl font-bold text-ibmec-gold-700">{estatisticas.orientadores}</p>
                    </div>
                    <div className="text-4xl">👨‍🏫</div>
                  </div>
                </div>
              </Card>
            </div>

            <Card>
              <h3 className="text-xl font-bold text-ibmec-blue-700 mb-4">
                📥 Exportar Relatórios
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <button className="btn-primary">
                  📄 Exportar PDF
                </button>
                <button className="btn-secondary">
                  📊 Exportar Excel
                </button>
                <button className="btn-outline">
                  📧 Enviar por Email
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Modal de Feedback */}
      {feedbackModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
            <h3 className="text-xl font-bold text-ibmec-blue-800 mb-4">
              {feedbackModal.status === 'aprovado' ? 'Aprovar Proposta' : 'Rejeitar Proposta'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">Mensagem para o aluno</label>
                <textarea
                  className="input-field"
                  rows="5"
                  placeholder={feedbackModal.status === 'aprovado' ? 'Parabéns! Sua proposta foi aprovada...' : 'Sua proposta foi rejeitada pelos seguintes motivos...'}
                  value={feedbackModal.mensagem}
                  onChange={(e) => setFeedbackModal((p) => ({ ...p, mensagem: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">Esta mensagem será enviada ao aluno junto com a decisão.</p>
              </div>
              <div className="flex justify-end gap-3">
                <button className="btn-outline" onClick={() => setFeedbackModal({ open: false, id: null, status: 'aprovado', mensagem: '' })}>Cancelar</button>
                <button className="btn-primary" onClick={enviarDecisao}>Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Proposta */}
      {propostaDetalhada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl shadow-xl my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-ibmec-blue-800">
                📋 Detalhes Completos da Proposta
              </h3>
              <button 
                onClick={fecharDetalhes}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {/* Informações do Aluno */}
              <div className="bg-ibmec-blue-50 p-4 rounded-lg">
                <h4 className="font-bold text-ibmec-blue-800 mb-3 text-lg">👤 Informações do Aluno</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 font-semibold">Nome:</p>
                    <p className="text-gray-800">{propostaDetalhada.nome || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Email:</p>
                    <p className="text-gray-800">{propostaDetalhada.email || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">CPF:</p>
                    <p className="text-gray-800">{propostaDetalhada.cpf || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Telefone:</p>
                    <p className="text-gray-800">{propostaDetalhada.telefone || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Curso:</p>
                    <p className="text-gray-800">{propostaDetalhada.curso || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Matrícula:</p>
                    <p className="text-gray-800">{propostaDetalhada.matricula || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Unidade:</p>
                    <p className="text-gray-800">{propostaDetalhada.unidade || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">CR (Coeficiente de Rendimento):</p>
                    <p className="text-gray-800">{propostaDetalhada.cr || 'Não informado'}</p>
                  </div>
                  {propostaDetalhada.orientador_nome && (
                    <div className="md:col-span-2">
                      <p className="text-gray-600 font-semibold">Orientador Selecionado:</p>
                      <p className="text-gray-800 font-bold text-ibmec-blue-700">{propostaDetalhada.orientador_nome}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Feedback do Orientador */}
              {propostaDetalhada.feedback_orientador && (
                <div className={`p-4 rounded-lg border-l-4 ${
                  propostaDetalhada.status_aprovacao_orientador === 'rejeitado'
                    ? 'bg-red-50 border-red-500'
                    : 'bg-green-50 border-green-500'
                }`}>
                  <h4 className={`font-bold mb-3 text-lg ${
                    propostaDetalhada.status_aprovacao_orientador === 'rejeitado'
                      ? 'text-red-800'
                      : 'text-green-800'
                  }`}>
                    {propostaDetalhada.status_aprovacao_orientador === 'rejeitado' ? '❌' : '✅'} Avaliação do Orientador
                  </h4>
                  <div className="space-y-2 text-sm">
                    {propostaDetalhada.data_avaliacao_orientador && (
                      <div>
                        <p className="text-gray-600 font-semibold">Data da Avaliação:</p>
                        <p className="text-gray-800">
                          {new Date(propostaDetalhada.data_avaliacao_orientador).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600 font-semibold">Parecer do Orientador:</p>
                      <p className={`text-gray-800 whitespace-pre-wrap bg-white p-3 rounded border mt-1 ${
                        propostaDetalhada.status_aprovacao_orientador === 'rejeitado'
                          ? 'border-red-200'
                          : 'border-green-200'
                      }`}>
                        {propostaDetalhada.feedback_orientador}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Informações do Projeto */}
              <div className="bg-ibmec-gold-50 p-4 rounded-lg">
                <h4 className="font-bold text-ibmec-blue-800 mb-3 text-lg">🔬 Informações do Projeto</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-600 font-semibold">Título do Projeto:</p>
                    <p className="text-gray-800 text-base">{propostaDetalhada.titulo_projeto}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Área de Conhecimento:</p>
                    <p className="text-gray-800">{propostaDetalhada.area_conhecimento}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Descrição:</p>
                    <p className="text-gray-800 whitespace-pre-wrap">{propostaDetalhada.descricao || 'Não informado'}</p>
                  </div>
                  {propostaDetalhada.objetivos && (
                    <div>
                      <p className="text-gray-600 font-semibold">Objetivos:</p>
                      <p className="text-gray-800 whitespace-pre-wrap">{propostaDetalhada.objetivos}</p>
                    </div>
                  )}
                  {propostaDetalhada.metodologia && (
                    <div>
                      <p className="text-gray-600 font-semibold">Metodologia:</p>
                      <p className="text-gray-800 whitespace-pre-wrap">{propostaDetalhada.metodologia}</p>
                    </div>
                  )}
                  {propostaDetalhada.resultados_esperados && (
                    <div>
                      <p className="text-gray-600 font-semibold">Resultados Esperados:</p>
                      <p className="text-gray-800 whitespace-pre-wrap">{propostaDetalhada.resultados_esperados}</p>
                    </div>
                  )}
                  {propostaDetalhada.arquivo_projeto && (
                    <div>
                      <p className="text-gray-600 font-semibold">Arquivo Anexado:</p>
                      <p className="text-gray-800">📎 {propostaDetalhada.arquivo_projeto}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-600 font-semibold">Data de Submissão:</p>
                    <p className="text-gray-800">
                      {propostaDetalhada.data_submissao 
                        ? new Date(propostaDetalhada.data_submissao).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 font-semibold">Status:</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(propostaDetalhada.status)}`}>
                      {propostaDetalhada.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button className="btn-outline" onClick={fecharDetalhes}>
                Fechar
              </button>
              {/* Mostrar botões de aprovar/rejeitar apenas se o status for pendente_coordenador */}
              {propostaDetalhada.status === 'pendente_coordenador' && (
                <>
                  <button 
                    onClick={() => {
                      fecharDetalhes();
                      setFeedbackModal({ open: true, id: propostaDetalhada.id, status: 'aprovado', mensagem: '' });
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    ✅ Aprovar
                  </button>
                  <button 
                    onClick={() => {
                      fecharDetalhes();
                      setFeedbackModal({ open: true, id: propostaDetalhada.id, status: 'rejeitado', mensagem: '' });
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    ❌ Rejeitar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Mensagem ao Relatório Mensal */}
      {respostaModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-ibmec-blue-800">
                💬 Enviar Mensagem sobre o Relatório
              </h3>
              <button 
                onClick={() => setRespostaModal({ open: false, relatorioId: null, resposta: '', relatorioInfo: null })}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {respostaModal.relatorioInfo && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Aluno:</strong> {respostaModal.relatorioInfo.aluno_nome}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Mês:</strong> {new Date(respostaModal.relatorioInfo.mes + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
                {respostaModal.relatorioInfo.descricao && (
                  <p className="text-sm text-gray-600">
                    <strong>Descrição:</strong> {respostaModal.relatorioInfo.descricao}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="label">Sua Mensagem</label>
                <textarea
                  className="input-field"
                  rows="8"
                  placeholder="Escreva sua mensagem sobre o relatório mensal do orientador..."
                  value={respostaModal.resposta}
                  onChange={(e) => setRespostaModal((prev) => ({ ...prev, resposta: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Esta mensagem será adicionada ao histórico de conversas sobre este relatório.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  className="btn-outline" 
                  onClick={() => setRespostaModal({ open: false, relatorioId: null, resposta: '', relatorioInfo: null })}
                >
                  Cancelar
                </button>
                <button 
                  className="btn-primary" 
                  onClick={enviarRespostaRelatorio}
                >
                  Enviar Resposta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardCoordenador;

