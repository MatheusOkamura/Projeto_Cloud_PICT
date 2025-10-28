import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';

const DashboardOrientador = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('propostas');
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAluno, setSelectedAluno] = useState(null);
  const [entregas, setEntregas] = useState([]);
  const [relatorios, setRelatorios] = useState([]);
  const [uploadState, setUploadState] = useState({ mes: '', descricao: '', arquivo: null, sending: false });
  const [etapaAtual, setEtapaAtual] = useState('');
  
  // Estados para propostas pendentes
  const [propostasPendentes, setPropostasPendentes] = useState([]);
  const [loadingPropostas, setLoadingPropostas] = useState(false);
  const [selectedProposta, setSelectedProposta] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [avaliando, setAvaliando] = useState(false);

  useEffect(() => {
    const fetchAlunos = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/orientadores/${user?.id}/alunos`);
        if (!res.ok) throw new Error('Falha ao carregar alunos');
        const data = await res.json();
        setAlunos(data.alunos || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchAlunos();
  }, [user]);

  // Buscar propostas pendentes
  useEffect(() => {
    const fetchPropostasPendentes = async () => {
      if (!user?.id) return;
      setLoadingPropostas(true);
      try {
        const res = await fetch(`http://localhost:8000/api/inscricoes/orientador/${user.id}/pendentes`);
        if (!res.ok) throw new Error('Falha ao carregar propostas');
        const data = await res.json();
        setPropostasPendentes(data.propostas || []);
      } catch (err) {
        console.error('Erro ao carregar propostas:', err);
      } finally {
        setLoadingPropostas(false);
      }
    };
    
    fetchPropostasPendentes();
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchPropostasPendentes, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const abrirModalProposta = (proposta) => {
    setSelectedProposta(proposta);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setSelectedProposta(null);
  };

  const avaliarProposta = async (aprovar, feedback = '') => {
    if (!selectedProposta) return;
    
    setAvaliando(true);
    try {
      const formData = new URLSearchParams();
      formData.append('aprovar', aprovar.toString());
      if (feedback) formData.append('feedback', feedback);

      console.log('Enviando avaliação:', {
        proposta_id: selectedProposta.id,
        aprovar: aprovar,
        feedback: feedback
      });

      const res = await fetch(
        `http://localhost:8000/api/inscricoes/${selectedProposta.id}/orientador/avaliar`,
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
      alert(data.message);
      
      // Recarregar lista de propostas
      const resProp = await fetch(`http://localhost:8000/api/inscricoes/orientador/${user.id}/pendentes`);
      const dataProp = await resProp.json();
      setPropostasPendentes(dataProp.propostas || []);
      
      fecharModal();
    } catch (err) {
      console.error('Erro ao avaliar:', err);
      alert('Erro: ' + err.message);
    } finally {
      setAvaliando(false);
    }
  };

  const openAluno = async (aluno) => {
    setSelectedAluno(aluno);
    setEntregas([]);
    setRelatorios([]);
    try {
      const [resEnt, resRel, resEtapa] = await Promise.all([
        fetch(`http://localhost:8000/api/orientadores/${user?.id}/alunos/${aluno.aluno_id}/entregas`),
        fetch(`http://localhost:8000/api/orientadores/${user?.id}/alunos/${aluno.aluno_id}/relatorios-mensais`),
        fetch(`http://localhost:8000/api/orientadores/${user?.id}/alunos/${aluno.aluno_id}/status-etapa`),
      ]);
      const dataEnt = await resEnt.json();
      const dataRel = await resRel.json();
      const dataEtapa = await resEtapa.json();
      setEntregas(dataEnt.entregas || []);
      setRelatorios(dataRel.relatorios || []);
      setEtapaAtual(dataEtapa.etapa || 'proposta');
      setActiveTab('detalhes');
    } catch (err) {
      setError('Falha ao carregar detalhes do aluno');
    }
  };

  const handleUploadChange = (e) => {
    const { name, value, files } = e.target;
    setUploadState((prev) => ({ ...prev, [name]: files ? files[0] : value }));
  };

  const enviarRelatorioMensal = async (e) => {
    e.preventDefault();
    if (!selectedAluno) return;
    setUploadState((p) => ({ ...p, sending: true }));
    const fd = new FormData();
    fd.append('mes', uploadState.mes);
    fd.append('descricao', uploadState.descricao);
    fd.append('arquivo', uploadState.arquivo);
    try {
      const res = await fetch(`http://localhost:8000/api/orientadores/${user?.id}/alunos/${selectedAluno.aluno_id}/relatorios-mensais`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) throw new Error('Falha ao enviar relatório');
      const data = await res.json();
      // Recarregar lista
      const resRel = await fetch(`http://localhost:8000/api/orientadores/${user?.id}/alunos/${selectedAluno.aluno_id}/relatorios-mensais`);
      const dataRel = await resRel.json();
      setRelatorios(dataRel.relatorios || []);
      setUploadState({ mes: '', descricao: '', arquivo: null, sending: false });
      alert('Relatório enviado com sucesso!');
    } catch (err) {
      alert(err.message);
      setUploadState((p) => ({ ...p, sending: false }));
    }
  };

  const enviarEntregaEtapa = async (e) => {
    e.preventDefault();
    if (!selectedAluno || !uploadState.arquivo) return;
    setUploadState((p) => ({ ...p, sending: true }));
    const fd = new FormData();
    fd.append('etapa', etapaAtual);
    fd.append('descricao', uploadState.descricao);
    fd.append('arquivo', uploadState.arquivo);
    try {
      const res = await fetch(`http://localhost:8000/api/orientadores/${user?.id}/alunos/${selectedAluno.aluno_id}/entrega-etapa`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) throw new Error('Falha ao enviar entrega da etapa');
      // reload entregas
      const resEnt = await fetch(`http://localhost:8000/api/orientadores/${user?.id}/alunos/${selectedAluno.aluno_id}/entregas`);
      const dataEnt = await resEnt.json();
      setEntregas(dataEnt.entregas || []);
      setUploadState({ mes: '', descricao: '', arquivo: null, sending: false });
      alert('Entrega da etapa enviada com sucesso!');
    } catch (err) {
      alert(err.message);
      setUploadState((p) => ({ ...p, sending: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ibmec-blue-50 to-gray-100 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-ibmec-blue-800 mb-2">
            Olá, {user?.nome?.split(' ')[1]}! 👨‍🏫
          </h1>
          <p className="text-gray-600">Painel de Orientação - {user?.departamento}</p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="text-center">
              <div className="text-4xl mb-2">👨‍🎓</div>
              <p className="text-3xl font-bold text-ibmec-blue-700">{alunos.filter(a => a.status === 'ativo').length}</p>
              <p className="text-gray-600 text-sm">Alunos Ativos</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="text-4xl mb-2">⏳</div>
              <p className="text-3xl font-bold text-yellow-600">{propostasPendentes.length}</p>
              <p className="text-gray-600 text-sm">Propostas Pendentes</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-3xl font-bold text-green-600">
                {alunos.length ? Math.round(alunos.reduce((acc, a) => acc + (a.progresso || 0), 0) / alunos.length) : 0}%
              </p>
              <p className="text-gray-600 text-sm">Progresso Médio</p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <div className="text-4xl mb-2">🎓</div>
              <p className="text-3xl font-bold text-ibmec-gold-600">2</p>
              <p className="text-gray-600 text-sm">Concluídos</p>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-300">
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('propostas')}
                className={`px-6 py-3 font-semibold transition relative ${
                  activeTab === 'propostas'
                    ? 'border-b-4 border-ibmec-blue-600 text-ibmec-blue-700'
                    : 'text-gray-600 hover:text-ibmec-blue-600'
                }`}
              >
                📝 Propostas Pendentes
                {propostasPendentes.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {propostasPendentes.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('alunos')}
                className={`px-6 py-3 font-semibold transition ${
                  activeTab === 'alunos'
                    ? 'border-b-4 border-ibmec-blue-600 text-ibmec-blue-700'
                    : 'text-gray-600 hover:text-ibmec-blue-600'
                }`}
              >
                👨‍🎓 Alunos Orientados
              </button>
              <button
                onClick={() => setActiveTab('detalhes')}
                className={`px-6 py-3 font-semibold transition ${
                  activeTab === 'detalhes'
                    ? 'border-b-4 border-ibmec-blue-600 text-ibmec-blue-700'
                    : 'text-gray-600 hover:text-ibmec-blue-600'
                }`}
                disabled={!selectedAluno}
                title={!selectedAluno ? 'Selecione um aluno na lista' : ''}
              >
                📦 Entregas & Relatórios
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === 'propostas' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-ibmec-blue-800">Propostas Aguardando sua Aprovação</h2>
              {propostasPendentes.length > 0 && (
                <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-semibold">
                  {propostasPendentes.length} {propostasPendentes.length === 1 ? 'proposta' : 'propostas'}
                </span>
              )}
            </div>

            {loadingPropostas ? (
              <Card>
                <div className="text-center py-8 text-gray-600">Carregando propostas...</div>
              </Card>
            ) : propostasPendentes.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Nenhuma proposta pendente
                  </h3>
                  <p className="text-gray-600">
                    Você não tem propostas aguardando avaliação no momento.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-6">
                {propostasPendentes.map((proposta) => (
                  <Card key={proposta.id}>
                    <div className="flex flex-col gap-4">
                      {/* Header da proposta */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-ibmec-blue-700">
                              {proposta.titulo_projeto}
                            </h3>
                            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
                              ⏳ Pendente
                            </span>
                          </div>
                          <p className="text-gray-600 mb-1">
                            <strong>Aluno:</strong> {proposta.nome}
                          </p>
                          <p className="text-gray-600 mb-1">
                            <strong>Email:</strong> {proposta.email}
                          </p>
                          <p className="text-gray-600 mb-1">
                            <strong>Curso:</strong> {proposta.curso}
                          </p>
                          <p className="text-gray-600 mb-1">
                            <strong>Área:</strong> {proposta.area_conhecimento}
                          </p>
                          <p className="text-gray-500 text-sm">
                            <strong>Submetida em:</strong>{' '}
                            {new Date(proposta.data_submissao).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      {/* Resumo da proposta */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-700 mb-2">📝 Descrição:</h4>
                        <p className="text-gray-600 text-sm mb-3">
                          {proposta.descricao.length > 200
                            ? proposta.descricao.substring(0, 200) + '...'
                            : proposta.descricao}
                        </p>

                        {proposta.objetivos && (
                          <>
                            <h4 className="font-semibold text-gray-700 mb-2 mt-3">🎯 Objetivos:</h4>
                            <p className="text-gray-600 text-sm">
                              {proposta.objetivos.length > 150
                                ? proposta.objetivos.substring(0, 150) + '...'
                                : proposta.objetivos}
                            </p>
                          </>
                        )}
                      </div>

                      {/* Botões de ação */}
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => abrirModalProposta(proposta)}
                          className="flex-1 bg-ibmec-blue-600 hover:bg-ibmec-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                        >
                          📋 Ver Detalhes Completos
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'alunos' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-ibmec-blue-800">Alunos sob sua Orientação</h2>
            
            {loading ? (
              <Card><div className="text-center py-8 text-gray-600">Carregando alunos...</div></Card>
            ) : (
              <div className="grid gap-6">
              {alunos.map(aluno => (
                <Card key={aluno.id}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-ibmec-blue-700">{aluno.nome}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          aluno.status === 'ativo' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {aluno.status === 'ativo' ? '✓ Ativo' : '⏳ Pendente'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-1">
                        <strong>Curso:</strong> {aluno.curso}
                      </p>
                      <p className="text-gray-600 mb-3">
                        <strong>Projeto:</strong> {aluno.projeto_titulo}
                      </p>
                      
                      {aluno.status === 'ativo' && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Progresso</span>
                            <span className="font-semibold text-ibmec-blue-700">{aluno.progresso}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-ibmec-blue-500 to-ibmec-gold-500 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${aluno.progresso}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 md:w-48">
                      <button onClick={() => openAluno(aluno)} className="btn-primary text-sm py-2">
                        � Ver Entregas & Relatórios
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            )}
          </div>
        )}

        {activeTab === 'detalhes' && selectedAluno && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-ibmec-blue-800">Entregas & Relatórios - {selectedAluno.nome}</h2>

            {/* Entregas do aluno */}
            <Card>
              <h3 className="text-xl font-bold text-ibmec-blue-700 mb-4">📦 Entregas do Aluno</h3>
              {entregas.length === 0 ? (
                <p className="text-gray-600">Nenhuma entrega registrada.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600 border-b">
                        <th className="py-2 pr-4">Tipo</th>
                        <th className="py-2 pr-4">Data</th>
                        <th className="py-2 pr-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entregas.map((e) => (
                        <tr key={e.id} className="border-b last:border-0">
                          <td className="py-2 pr-4">{e.tipo}</td>
                          <td className="py-2 pr-4">{new Date(e.data).toLocaleDateString('pt-BR')}</td>
                          <td className="py-2 pr-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              e.status === 'aprovada' ? 'bg-green-100 text-green-700' :
                              e.status === 'em revisão' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {e.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>


            {/* Relatórios mensais - envio */}
            <Card>
              <h3 className="text-xl font-bold text-ibmec-blue-700 mb-4">🗓️ Enviar Relatório Mensal</h3>
              <form onSubmit={enviarRelatorioMensal} className="grid md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="label">Mês (AAAA-MM)</label>
                  <input type="month" name="mes" value={uploadState.mes} onChange={handleUploadChange} required className="input-field" />
                </div>
                <div className="md:col-span-1">
                  <label className="label">Arquivo (PDF/DOC)</label>
                  <input type="file" name="arquivo" accept=".pdf,.doc,.docx" onChange={handleUploadChange} required className="input-field" />
                </div>
                <div className="md:col-span-3">
                  <label className="label">Descrição (opcional)</label>
                  <textarea name="descricao" value={uploadState.descricao} onChange={handleUploadChange} className="input-field" rows="3" placeholder="Breve resumo das atividades do mês..."></textarea>
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <button type="submit" disabled={uploadState.sending} className="btn-primary">
                    {uploadState.sending ? 'Enviando...' : 'Enviar Relatório'}
                  </button>
                </div>
              </form>
            </Card>

            {/* Relatórios mensais - lista */}
            <Card>
              <h3 className="text-xl font-bold text-ibmec-blue-700 mb-4">📚 Relatórios Enviados</h3>
              {relatorios.length === 0 ? (
                <p className="text-gray-600">Nenhum relatório enviado ainda.</p>
              ) : (
                <ul className="space-y-3">
                  {relatorios.map((r) => (
                    <li key={r.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                      <div>
                        <p className="font-semibold text-ibmec-blue-700">{r.mes} — {r.descricao || 'Sem descrição'}</p>
                        <p className="text-xs text-gray-500">Enviado em {new Date(r.data_envio).toLocaleString('pt-BR')}</p>
                      </div>
                      <a className="btn-outline text-sm" href="#" onClick={(e) => e.preventDefault()}>
                        ⬇️ Baixar
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Modal de Avaliação de Proposta */}
      {modalAberto && selectedProposta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="sticky top-0 bg-gradient-to-r from-ibmec-blue-600 to-ibmec-blue-700 text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedProposta.titulo_projeto}</h2>
                  <p className="text-ibmec-blue-100">Avaliação de Proposta de Iniciação Científica</p>
                </div>
                <button
                  onClick={fecharModal}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 space-y-6">
              {/* Informações do Aluno */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-bold text-ibmec-blue-700 mb-3">👨‍🎓 Informações do Aluno</h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Nome:</span>
                    <p className="font-semibold text-gray-800">{selectedProposta.nome}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-semibold text-gray-800">{selectedProposta.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Curso:</span>
                    <p className="font-semibold text-gray-800">{selectedProposta.curso}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Matrícula:</span>
                    <p className="font-semibold text-gray-800">{selectedProposta.matricula || 'N/A'}</p>
                  </div>
                  {selectedProposta.cr && (
                    <div>
                      <span className="text-gray-600">CR:</span>
                      <p className="font-semibold text-gray-800">{selectedProposta.cr.toFixed(2)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Data de Submissão:</span>
                    <p className="font-semibold text-gray-800">
                      {new Date(selectedProposta.data_submissao).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detalhes do Projeto */}
              <div>
                <h3 className="text-lg font-bold text-ibmec-blue-700 mb-3">📋 Detalhes do Projeto</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Área de Conhecimento:
                    </label>
                    <p className="bg-gray-50 p-3 rounded text-gray-800">{selectedProposta.area_conhecimento}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Descrição:
                    </label>
                    <p className="bg-gray-50 p-3 rounded text-gray-800 whitespace-pre-wrap">
                      {selectedProposta.descricao}
                    </p>
                  </div>

                  {selectedProposta.objetivos && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Objetivos:
                      </label>
                      <p className="bg-gray-50 p-3 rounded text-gray-800 whitespace-pre-wrap">
                        {selectedProposta.objetivos}
                      </p>
                    </div>
                  )}

                  {selectedProposta.metodologia && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Metodologia:
                      </label>
                      <p className="bg-gray-50 p-3 rounded text-gray-800 whitespace-pre-wrap">
                        {selectedProposta.metodologia}
                      </p>
                    </div>
                  )}

                  {selectedProposta.resultados_esperados && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Resultados Esperados:
                      </label>
                      <p className="bg-gray-50 p-3 rounded text-gray-800 whitespace-pre-wrap">
                        {selectedProposta.resultados_esperados}
                      </p>
                    </div>
                  )}

                  {selectedProposta.arquivo_projeto && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Arquivo Anexado:
                      </label>
                      <a
                        href={`http://localhost:8000/uploads/propostas/${selectedProposta.arquivo_projeto}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded transition"
                      >
                        📎 {selectedProposta.arquivo_projeto}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Área de Feedback */}
              <div>
                <h3 className="text-lg font-bold text-ibmec-blue-700 mb-3">💬 Feedback (opcional)</h3>
                <textarea
                  id="feedback-orientador"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-ibmec-blue-500 focus:border-transparent"
                  rows="4"
                  placeholder="Digite aqui seus comentários sobre a proposta (opcional)..."
                ></textarea>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-4 pt-4 border-t">
                <button
                  onClick={() => {
                    const feedback = document.getElementById('feedback-orientador').value;
                    if (window.confirm('Tem certeza que deseja APROVAR esta proposta? Ela será encaminhada para o coordenador.')) {
                      avaliarProposta(true, feedback);
                    }
                  }}
                  disabled={avaliando}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {avaliando ? '⏳ Processando...' : '✅ Aprovar Proposta'}
                </button>

                <button
                  onClick={() => {
                    const feedback = document.getElementById('feedback-orientador').value;
                    if (!feedback.trim()) {
                      alert('Por favor, forneça um feedback explicando o motivo da rejeição.');
                      return;
                    }
                    if (window.confirm('Tem certeza que deseja REJEITAR esta proposta? Esta ação não pode ser desfeita.')) {
                      avaliarProposta(false, feedback);
                    }
                  }}
                  disabled={avaliando}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {avaliando ? '⏳ Processando...' : '❌ Rejeitar Proposta'}
                </button>

                <button
                  onClick={fecharModal}
                  disabled={avaliando}
                  className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 font-semibold py-4 px-6 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOrientador;
