import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';

const etapaLabels = {
  proposta: 'Envio e apresentação da proposta',
  relatorio_parcial: 'Envio do relatório parcial',
  apresentacao_amostra: 'Apresentação de amostra',
  artigo_final: 'Envio do artigo final',
  finalizado: 'Finalizado',
};

const CoordenadorStatus = () => {
  const { user } = useAuth();
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [bulkEtapa, setBulkEtapa] = useState('proposta');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkCount, setBulkCount] = useState(0);

  const fetchAlunos = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/coordenadores/alunos');
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
  }, []);

  const atualizarEtapa = async (alunoId, etapa) => {
    try {
      setSavingId(alunoId);
      const res = await fetch(`http://localhost:8000/api/coordenadores/alunos/${alunoId}/status-etapa?novo_status=${etapa}`, {
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

  const aplicarEtapaParaTodos = async () => {
    if (!alunos || alunos.length === 0) return;
    const confirmar = confirm(`Aplicar a etapa selecionada ("${etapaLabels[bulkEtapa]}") para ${alunos.length} aluno(s)?`);
    if (!confirmar) return;
    setBulkSaving(true);
    setBulkCount(0);
    let failures = 0;
    for (const a of alunos) {
      try {
        const res = await fetch(`http://localhost:8000/api/coordenadores/alunos/${a.aluno_id}/status-etapa?novo_status=${bulkEtapa}`, {
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
          <h1 className="text-3xl font-bold text-ibmec-blue-800">Gerenciar Etapas dos Projetos (Coordenação)</h1>
          <p className="text-gray-600">Defina a etapa atual de cada aluno. As páginas exibidas para aluno/orientador seguirão a etapa definida.</p>
        </div>

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
                      value={aluno.etapa || 'proposta'}
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
      </div>
    </div>
  );
};

export default CoordenadorStatus;
