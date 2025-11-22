import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import API_BASE_URL from '../config/api';

const etapaLabels = {
  envio_proposta: 'Submissão de Documentação e Proposta Inicial',
  apresentacao_proposta: 'Apresentação e Defesa da Proposta de Pesquisa',
  relatorio_mensal_1: 'Primeiro Relatório de Atividades Mensais',
  relatorio_mensal_2: 'Segundo Relatório de Atividades Mensais',
  relatorio_mensal_3: 'Terceiro Relatório de Atividades Mensais',
  relatorio_mensal_4: 'Quarto Relatório de Atividades Mensais',
  relatorio_parcial: 'Relatório Parcial de Pesquisa',
  relatorio_mensal_5: 'Quinto Relatório de Atividades Mensais',
  apresentacao_amostra: 'Apresentação em Mostra Científica',
  artigo_final: 'Submissão do Artigo Científico Final',
  concluido: 'Projeto Concluído',
};

// Componente para card individual de aluno
const AlunoApresentacaoCard = ({ aluno, onAtualizar }) => {
  const [data, setData] = useState(aluno.apresentacao_data || '');
  const [hora, setHora] = useState(aluno.apresentacao_hora || '');
  const [campus, setCampus] = useState(aluno.apresentacao_campus || '');
  const [sala, setSala] = useState(aluno.apresentacao_sala || '');
  const [salvando, setSalvando] = useState(false);
  
  // Estados para avaliação da apresentação
  const [mostrarAvaliacao, setMostrarAvaliacao] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [avaliando, setAvaliando] = useState(false);

  const salvarApresentacao = async () => {
    if (!data || !hora || !campus || !sala) {
      alert('Preencha data, horário, campus e sala');
      return;
    }

    try {
      setSalvando(true);
      const res = await fetch(`${API_BASE_URL}/coordenadores/apresentacoes/${aluno.projeto_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, hora, campus, sala })
      });

      if (!res.ok) throw new Error('Falha ao salvar apresentação');

      alert('Apresentação agendada com sucesso!');
      onAtualizar();
    } catch (err) {
      alert(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const avaliarApresentacao = async (decisao) => {
    if (!feedback.trim()) {
      alert('Por favor, forneça um feedback sobre a apresentação');
      return;
    }

    try {
      setAvaliando(true);
      const res = await fetch(`${API_BASE_URL}/coordenadores/apresentacoes/${aluno.projeto_id}/avaliar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisao, feedback })
      });

      if (!res.ok) throw new Error('Falha ao avaliar apresentação');

      alert(`Apresentação ${decisao === 'aprovado' ? 'aprovada' : 'recusada'} com sucesso!`);
      setMostrarAvaliacao(false);
      setFeedback('');
      onAtualizar();
    } catch (err) {
      alert(err.message);
    } finally {
      setAvaliando(false);
    }
  };

  return (
    <Card>
      <div className="space-y-3">
        <div>
          <h3 className="text-xl font-bold text-ibmec-blue-700">{aluno.nome}</h3>
          <p className="text-sm text-gray-600">
            {aluno.curso} • Matrícula: {aluno.matricula}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            <span className="font-semibold">Projeto:</span> {aluno.projeto_titulo}
          </p>
          <p className="text-xs text-gray-500">
            <span className="font-semibold">Área:</span> {aluno.area_conhecimento}
          </p>
          <p className="text-xs text-gray-500">
            <span className="font-semibold">Orientador:</span> {aluno.orientador_nome}
          </p>
        </div>

        {/* Formulário de agendamento */}
        <div className="grid md:grid-cols-2 gap-3 pt-3 border-t">
          <div>
            <label className="label text-xs">Data da Apresentação</label>
            <input
              type="date"
              className="input-field text-sm"
              value={data}
              onChange={(e) => setData(e.target.value)}
              disabled={salvando}
            />
          </div>
          <div>
            <label className="label text-xs">Horário</label>
            <input
              type="time"
              className="input-field text-sm"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              disabled={salvando}
            />
          </div>
          <div>
            <label className="label text-xs">Campus</label>
            <select
              className="input-field text-sm"
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              disabled={salvando}
            >
              <option value="">Selecione o campus</option>
              <option value="Paulista">Paulista</option>
              <option value="Faria Lima">Faria Lima</option>
            </select>
          </div>
          <div>
            <label className="label text-xs">Sala</label>
            <input
              type="text"
              className="input-field text-sm"
              placeholder="Ex: 201, Lab 3, Auditório"
              value={sala}
              onChange={(e) => setSala(e.target.value)}
              disabled={salvando}
            />
          </div>
        </div>

        <button
          className={`btn-primary w-full ${salvando ? 'opacity-70 cursor-not-allowed' : ''}`}
          onClick={salvarApresentacao}
          disabled={salvando}
        >
          {salvando ? 'Salvando...' : aluno.apresentacao_data ? 'Atualizar Agendamento' : 'Agendar Apresentação'}
        </button>

        {/* Status do agendamento */}
        {aluno.apresentacao_data && (
          <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
            <p className="text-sm font-semibold text-green-800 mb-1">✅ Apresentação Agendada</p>
            <div className="text-xs text-green-700 space-y-1">
              <p>📅 Data: {aluno.apresentacao_data}</p>
              <p>🕐 Horário: {aluno.apresentacao_hora}</p>
              <p>🏫 Campus: {aluno.apresentacao_campus}</p>
              {aluno.apresentacao_sala && <p>🚪 Sala: {aluno.apresentacao_sala}</p>}
            </div>
          </div>
        )}

        {/* Avaliação da Apresentação */}
        {aluno.apresentacao_data && aluno.status_apresentacao === 'pendente' && (
          <div className="border-t pt-3">
            {!mostrarAvaliacao ? (
              <button
                className="btn-primary w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => setMostrarAvaliacao(true)}
              >
                🎤 Avaliar Apresentação
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-purple-50 p-3 rounded">
                  <p className="text-sm font-semibold text-purple-800 mb-2">
                    📝 Avaliação da Apresentação
                  </p>
                  <textarea
                    className="input-field text-sm w-full min-h-[100px]"
                    placeholder="Forneça um feedback sobre a apresentação do aluno..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    disabled={avaliando}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
                    onClick={() => avaliarApresentacao('aprovado')}
                    disabled={avaliando || !feedback.trim()}
                  >
                    ✅ Aprovar
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
                    onClick={() => avaliarApresentacao('rejeitado')}
                    disabled={avaliando || !feedback.trim()}
                  >
                    ❌ Recusar
                  </button>
                </div>
                <button
                  className="btn-outline w-full text-sm"
                  onClick={() => {
                    setMostrarAvaliacao(false);
                    setFeedback('');
                  }}
                  disabled={avaliando}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Status da Avaliação */}
        {aluno.status_apresentacao === 'aprovado' && (
          <div className="bg-green-100 border-l-4 border-green-600 p-3 rounded">
            <p className="text-sm font-semibold text-green-900 mb-1">✅ Proposta Aprovada</p>
            {aluno.feedback_apresentacao && (
              <p className="text-xs text-green-800 mt-2">
                <span className="font-semibold">Feedback:</span> {aluno.feedback_apresentacao}
              </p>
            )}
          </div>
        )}

        {aluno.status_apresentacao === 'rejeitado' && (
          <div className="bg-red-100 border-l-4 border-red-600 p-3 rounded">
            <p className="text-sm font-semibold text-red-900 mb-1">❌ Proposta Recusada</p>
            {aluno.feedback_apresentacao && (
              <p className="text-xs text-red-800 mt-2">
                <span className="font-semibold">Feedback:</span> {aluno.feedback_apresentacao}
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

// Componente para card de apresentação na amostra
const AlunoAmostraCard = ({ aluno, onAtualizar }) => {
  const [data, setData] = useState(aluno.amostra_data || '');
  const [hora, setHora] = useState(aluno.amostra_hora || '');
  const [campus, setCampus] = useState(aluno.amostra_campus || '');
  const [sala, setSala] = useState(aluno.amostra_sala || '');
  const [salvando, setSalvando] = useState(false);
  const [aprovando, setAprovando] = useState(false);
  const [mostrarAprovacao, setMostrarAprovacao] = useState(false);
  const [feedback, setFeedback] = useState('');

  const salvarApresentacaoAmostra = async () => {
    if (!data || !hora || !campus || !sala) {
      alert('Preencha data, horário, campus e sala');
      return;
    }

    try {
      setSalvando(true);
      const res = await fetch(`${API_BASE_URL}/coordenadores/apresentacoes-amostra/${aluno.projeto_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, hora, campus, sala })
      });

      if (!res.ok) throw new Error('Falha ao salvar apresentação na amostra');

      alert('Apresentação na amostra agendada com sucesso!');
      onAtualizar();
    } catch (err) {
      alert(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const aprovarApresentacaoAmostra = async (decisao) => {
    if (!feedback && decisao === 'rejeitado') {
      alert('Por favor, forneça um feedback para a rejeição.');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja ${decisao === 'aprovado' ? 'aprovar' : 'rejeitar'} a apresentação na amostra?`)) {
      return;
    }

    try {
      setAprovando(true);
      const res = await fetch(`${API_BASE_URL}/coordenadores/apresentacao-amostra/${aluno.entrega_id}/avaliar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          aprovar: decisao === 'aprovado',
          feedback: feedback || `Apresentação ${decisao === 'aprovado' ? 'aprovada' : 'rejeitada'} pela coordenação.`
        })
      });

      if (!res.ok) throw new Error('Falha ao avaliar apresentação na amostra');

      alert(`Apresentação na amostra ${decisao === 'aprovado' ? 'aprovada' : 'rejeitada'} com sucesso!`);
      setMostrarAprovacao(false);
      setFeedback('');
      onAtualizar();
    } catch (err) {
      alert(err.message);
    } finally {
      setAprovando(false);
    }
  };

  return (
    <Card>
      <div className="space-y-3">
        <div>
          <h3 className="text-xl font-bold text-ibmec-blue-700">{aluno.nome}</h3>
          <p className="text-sm text-gray-600">
            {aluno.curso} • Matrícula: {aluno.matricula}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            <span className="font-semibold">Projeto:</span> {aluno.projeto_titulo}
          </p>
          <p className="text-xs text-gray-500">
            <span className="font-semibold">Área:</span> {aluno.area_conhecimento}
          </p>
          <p className="text-xs text-gray-500">
            <span className="font-semibold">Orientador:</span> {aluno.orientador_nome}
          </p>
        </div>

        {/* Formulário de agendamento da apresentação na amostra */}
        <div className="grid md:grid-cols-2 gap-3 pt-3 border-t">
          <div>
            <label className="label text-xs">Data da Apresentação na Amostra</label>
            <input
              type="date"
              className="input-field text-sm"
              value={data}
              onChange={(e) => setData(e.target.value)}
              disabled={salvando}
            />
          </div>
          <div>
            <label className="label text-xs">Horário</label>
            <input
              type="time"
              className="input-field text-sm"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              disabled={salvando}
            />
          </div>
          <div>
            <label className="label text-xs">Campus</label>
            <select
              className="input-field text-sm"
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              disabled={salvando}
            >
              <option value="">Selecione o campus</option>
              <option value="Paulista">Paulista</option>
              <option value="Faria Lima">Faria Lima</option>
            </select>
          </div>
          <div>
            <label className="label text-xs">Sala</label>
            <input
              type="text"
              className="input-field text-sm"
              placeholder="Ex: 201, Lab 3, Auditório"
              value={sala}
              onChange={(e) => setSala(e.target.value)}
              disabled={salvando}
            />
          </div>
        </div>

        <button
          className={`btn-primary w-full ${salvando ? 'opacity-70 cursor-not-allowed' : ''}`}
          onClick={salvarApresentacaoAmostra}
          disabled={salvando}
        >
          {salvando ? 'Salvando...' : aluno.amostra_data ? 'Atualizar Agendamento' : 'Agendar Apresentação na Amostra'}
        </button>

        {/* Status do agendamento */}
        {aluno.amostra_data && (
          <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
            <p className="text-sm font-semibold text-green-800 mb-1">✅ Apresentação na Amostra Agendada</p>
            <div className="text-xs text-green-700 space-y-1">
              <p>📅 Data: {aluno.amostra_data}</p>
              <p>🕐 Horário: {aluno.amostra_hora}</p>
              <p>🏫 Campus: {aluno.amostra_campus}</p>
              {aluno.amostra_sala && <p>🚪 Sala: {aluno.amostra_sala}</p>}
            </div>
          </div>
        )}

        {/* Status da avaliação da apresentação */}
        {aluno.status_aprovacao_coordenador && aluno.status_aprovacao_coordenador !== 'pendente' && (
          <div className={`p-3 rounded border-l-4 ${
            aluno.status_aprovacao_coordenador === 'aprovado' 
              ? 'bg-green-50 border-green-500' 
              : 'bg-red-50 border-red-500'
          }`}>
            <p className={`text-sm font-semibold mb-1 ${
              aluno.status_aprovacao_coordenador === 'aprovado' 
                ? 'text-green-800' 
                : 'text-red-800'
            }`}>
              {aluno.status_aprovacao_coordenador === 'aprovado' ? '✅ Apresentação Aprovada' : '❌ Apresentação Rejeitada'}
            </p>
            {aluno.feedback_coordenador && (
              <p className="text-xs text-gray-700 mt-1 italic">"{aluno.feedback_coordenador}"</p>
            )}
          </div>
        )}

        {/* Botão para aprovar/rejeitar apresentação */}
        {aluno.amostra_data && aluno.entrega_id && (!aluno.status_aprovacao_coordenador || aluno.status_aprovacao_coordenador === 'pendente') && (
          <div className="pt-3 border-t">
            {!mostrarAprovacao ? (
              <button
                onClick={() => setMostrarAprovacao(true)}
                className="btn-primary w-full text-sm"
              >
                📋 Avaliar Apresentação na Amostra
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="label text-xs">Feedback (opcional para aprovação, obrigatório para rejeição)</label>
                  <textarea
                    className="input-field text-sm"
                    rows={3}
                    placeholder="Digite seu feedback sobre a apresentação na amostra..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    disabled={aprovando}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => aprovarApresentacaoAmostra('aprovado')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                    disabled={aprovando}
                  >
                    {aprovando ? '⏳ Processando...' : '✅ Aprovar'}
                  </button>
                  <button
                    onClick={() => aprovarApresentacaoAmostra('rejeitado')}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                    disabled={aprovando}
                  >
                    {aprovando ? '⏳ Processando...' : '❌ Rejeitar'}
                  </button>
                  <button
                    onClick={() => {
                      setMostrarAprovacao(false);
                      setFeedback('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                    disabled={aprovando}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

const CoordenadorStatus = () => {
  const { user } = useAuth();
  const [alunos, setAlunos] = useState([]);
  const [alunosApresentacao, setAlunosApresentacao] = useState([]);
  const [alunosAmostra, setAlunosAmostra] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApresentacao, setLoadingApresentacao] = useState(false);
  const [loadingAmostra, setLoadingAmostra] = useState(false);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [bulkEtapa, setBulkEtapa] = useState('envio_proposta');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkCount, setBulkCount] = useState(0);
  const [abaAtiva, setAbaAtiva] = useState('etapas'); // 'etapas', 'apresentacoes', 'amostra'

  const fetchAlunos = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/coordenadores/alunos`);
      if (!res.ok) throw new Error('Falha ao carregar alunos');
      const data = await res.json();
      setAlunos(data.alunos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlunos();
    if (abaAtiva === 'apresentacoes') {
      fetchAlunosApresentacao();
    } else if (abaAtiva === 'amostra') {
      fetchAlunosAmostra();
    }
  }, [abaAtiva]);

  const atualizarEtapa = async (alunoId, etapa) => {
    try {
      setSavingId(alunoId);
      const res = await fetch(`${API_BASE_URL}/coordenadores/alunos/${alunoId}/status-etapa?novo_status=${etapa}`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Falha ao atualizar etapa');
      setAlunos((prev) => prev.map((a) => (a.aluno_id === alunoId ? { ...a, etapa } : a)));
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const fetchAlunosApresentacao = async () => {
    try {
      setLoadingApresentacao(true);
      const res = await fetch(`${API_BASE_URL}/coordenadores/apresentacoes/alunos`);
      if (!res.ok) throw new Error('Falha ao carregar alunos para apresentação');
      const data = await res.json();
      setAlunosApresentacao(data.alunos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingApresentacao(false);
    }
  };

  const fetchAlunosAmostra = async () => {
    try {
      setLoadingAmostra(true);
      const res = await fetch(`${API_BASE_URL}/coordenadores/apresentacoes-amostra/alunos`);
      if (!res.ok) throw new Error('Falha ao carregar alunos para apresentação na amostra');
      const data = await res.json();
      setAlunosAmostra(data.alunos || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingAmostra(false);
    }
  };

  const aplicarEtapaParaTodos = async () => {
    if (!alunos || alunos.length === 0) return;
    const confirmar = confirm(`Aplicar a etapa selecionada ("${etapaLabels[bulkEtapa]}") para ${alunos.length} aluno(s)?`);
    if (!confirmar) return;
    setBulkSaving(true);
    setBulkCount(0);
    let failures = 0;
    for (const a of alunos) {
      try {
        const res = await fetch(`${API_BASE_URL}/coordenadores/alunos/${a.aluno_id}/status-etapa?novo_status=${bulkEtapa}`, {
          method: 'PATCH',
        });
        if (!res.ok) throw new Error('Falha ao atualizar a etapa');
        setAlunos((prev) => prev.map((x) => (x.aluno_id === a.aluno_id ? { ...x, etapa: bulkEtapa } : x)));
      } catch (e) {
        failures += 1;
      } finally {
        setBulkCount((c) => c + 1);
      }
    }
    setBulkSaving(false);
    if (failures > 0) {
      alert(`${failures} atualização(ões) falharam. Tente novamente para esses alunos.`);
    } else {
      alert('Etapa aplicada para todos os alunos.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ibmec-blue-50 to-gray-100 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ibmec-blue-800">Gerenciamento de Projetos (Coordenação)</h1>
          <p className="text-gray-600">Gerencie etapas dos projetos e agende apresentações</p>
        </div>
        
        {/* Abas */}
        <div className="mb-6 flex gap-2">
          <button
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              abaAtiva === 'etapas'
                ? 'bg-ibmec-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setAbaAtiva('etapas')}
          >
            📋 Gerenciar Etapas
          </button>
          <button
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              abaAtiva === 'apresentacoes'
                ? 'bg-ibmec-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setAbaAtiva('apresentacoes')}
          >
            🎤 Agendar Apresentações
          </button>
          <button
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              abaAtiva === 'amostra'
                ? 'bg-ibmec-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setAbaAtiva('amostra')}
          >
            🎨 Apresentações na Amostra
          </button>
        </div>

        {abaAtiva === 'etapas' && (
          <>
            {loading ? (
              <Card>
                <div className="text-center py-8 text-gray-600">Carregando...</div>
              </Card>
            ) : error ? (
              <Card>
                <div className="text-center py-8 text-red-600">{error}</div>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Controle de alteração em massa */}
                <Card>
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="flex-1">
                  <label className="label">Aplicar etapa para todos os alunos</label>
                  <select
                    className="input-field"
                    value={bulkEtapa}
                    onChange={(e) => setBulkEtapa(e.target.value)}
                    disabled={bulkSaving}
                  >
                    {Object.keys(etapaLabels).map((k) => (
                      <option key={k} value={k}>
                        {etapaLabels[k]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="shrink-0">
                  <button
                    className={`btn-primary ${bulkSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                    onClick={aplicarEtapaParaTodos}
                    disabled={bulkSaving}
                  >
                    {bulkSaving ? `Aplicando (${bulkCount}/${alunos.length})...` : 'Aplicar a todos'}
                  </button>
                </div>
              </div>
            </Card>

            {alunos.map((aluno) => (
              <Card key={aluno.aluno_id}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-ibmec-blue-700">{aluno.nome}</h3>
                    <p className="text-sm text-gray-600">
                      {aluno.curso} • Projeto: {aluno.projeto_titulo}
                    </p>
                    <p className="text-xs text-gray-500">Orientador ID: {aluno.orientador_id}</p>
                  </div>
                  <div className="md:w-80">
                    <label className="label">Etapa Atual</label>
                    <select
                      className="input-field"
                      value={aluno.etapa || 'envio_proposta'}
                      onChange={(e) => atualizarEtapa(aluno.aluno_id, e.target.value)}
                      disabled={savingId === aluno.aluno_id || bulkSaving}
                    >
                      {Object.keys(etapaLabels).map((k) => (
                        <option key={k} value={k}>
                          {etapaLabels[k]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>
            ))}
          </div>
            )}
          </>
        )}
        
        {/* Aba de Apresentações */}
        {abaAtiva === 'apresentacoes' && (
          <>
            {loadingApresentacao ? (
              <Card>
                <div className="text-center py-8 text-gray-600">Carregando...</div>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Informações gerais */}
                <Card>
                  <h2 className="text-xl font-bold text-ibmec-blue-800 mb-2">
                    🎤 Agendar Apresentações Individuais
                  </h2>
                  <p className="text-sm text-gray-600">
                    Configure data, horário, campus e sala para cada aluno individualmente. Total de {alunosApresentacao.length} aluno(s) aguardando agendamento.
                  </p>
                </Card>
                
                {/* Lista de alunos */}
                {alunosApresentacao.length === 0 ? (
                  <Card>
                    <div className="text-center py-8 text-gray-600">
                      <div className="text-5xl mb-3">📭</div>
                      <p className="font-semibold">Nenhum aluno na etapa de apresentação</p>
                      <p className="text-sm mt-2">Avance os alunos aprovados para a etapa "Apresentação e Defesa da Proposta"</p>
                    </div>
                  </Card>
                ) : (
                  alunosApresentacao.map((aluno) => (
                    <AlunoApresentacaoCard 
                      key={aluno.projeto_id} 
                      aluno={aluno} 
                      onAtualizar={fetchAlunosApresentacao}
                    />
                  ))
                )}
              </div>
            )}
          </>
        )}

        {/* Aba de Apresentações na Amostra */}
        {abaAtiva === 'amostra' && (
          <>
            {loadingAmostra ? (
              <Card>
                <div className="text-center py-8 text-gray-600">Carregando...</div>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Informações gerais */}
                <Card>
                  <h2 className="text-xl font-bold text-ibmec-blue-800 mb-2">
                    🎨 Agendar Apresentações na Amostra Científica
                  </h2>
                  <p className="text-sm text-gray-600">
                    Configure data, horário, campus e sala para as apresentações na amostra científica. Total de {alunosAmostra.length} aluno(s) aguardando agendamento.
                  </p>
                </Card>
                
                {/* Lista de alunos */}
                {alunosAmostra.length === 0 ? (
                  <Card>
                    <div className="text-center py-8 text-gray-600">
                      <div className="text-5xl mb-3">📭</div>
                      <p className="font-semibold">Nenhum aluno aguardando agendamento</p>
                      <p className="text-sm mt-2">Os alunos aparecerão aqui após a aprovação da apresentação na amostra pelo orientador e coordenador</p>
                    </div>
                  </Card>
                ) : (
                  alunosAmostra.map((aluno) => (
                    <AlunoAmostraCard 
                      key={aluno.projeto_id} 
                      aluno={aluno} 
                      onAtualizar={fetchAlunosAmostra}
                    />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CoordenadorStatus;
