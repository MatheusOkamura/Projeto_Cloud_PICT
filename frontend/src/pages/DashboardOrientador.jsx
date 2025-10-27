import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';

const DashboardOrientador = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('alunos');
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAluno, setSelectedAluno] = useState(null);
  const [entregas, setEntregas] = useState([]);
  const [relatorios, setRelatorios] = useState([]);
  const [uploadState, setUploadState] = useState({ mes: '', descricao: '', arquivo: null, sending: false });
  const [etapaAtual, setEtapaAtual] = useState('');

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
              <p className="text-3xl font-bold text-yellow-600">0</p>
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
    </div>
  );
};

export default DashboardOrientador;
