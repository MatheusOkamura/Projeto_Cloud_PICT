import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import API_BASE_URL from '../config/api';

const DashboardCoordenador = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inscricoes');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterEtapa, setFilterEtapa] = useState('todas');
  const [filterAno, setFilterAno] = useState('todos');
  const [filterCurso, setFilterCurso] = useState('todos');
  const [filterUnidade, setFilterUnidade] = useState('todas');
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
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [anoAtivo, setAnoAtivo] = useState(new Date().getFullYear());
  const [inscricoesAbertas, setInscricoesAbertas] = useState(true);
  const [loadingInscricoesStatus, setLoadingInscricoesStatus] = useState(false);
  const [alunosExpandidos, setAlunosExpandidos] = useState({}); // Estado para controlar quais alunos estão expandidos
  const [relatorioParcialModal, setRelatorioParcialModal] = useState({ open: false, entregaId: null, aprovar: true, feedback: '' });
  const [apresentacaoAmostraModal, setApresentacaoAmostraModal] = useState({ open: false, entregaId: null, aprovar: true, feedback: '' });
  const [artigoFinalModal, setArtigoFinalModal] = useState({ open: false, entregaId: null, aprovar: true, feedback: '' });
  const [alunosConcluidos, setAlunosConcluidos] = useState([]);
  const [certificadoFile, setCertificadoFile] = useState(null);
  const [uploadingCertificado, setUploadingCertificado] = useState(false);

  const loadInscricoes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/inscricoes`);
      
      // Parse seguro
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      
      setInscricoes(data || []);
    } catch (err) {
      console.error('Erro ao carregar inscrições:', err);
      setError('Falha ao carregar propostas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInscricoes();
    loadOrientadores();
    carregarStatusInscricoes();
  }, []);

  const loadOrientadores = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/orientadores`);
      
      // Parse seguro
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      
      setOrientadores(data?.orientadores || []);
    } catch (err) {
      console.error('Erro ao carregar orientadores:', err);
    }
  };

  const carregarStatusInscricoes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/coordenadores/configuracoes/inscricoes`);
      if (!res.ok) throw new Error('Falha ao carregar status das inscrições');
      
      const data = await res.json();
      setInscricoesAbertas(data.inscricoes_abertas);
      setAnoAtivo(data.ano_ativo || new Date().getFullYear());
      setAnoSelecionado(data.ano_ativo || new Date().getFullYear());
    } catch (err) {
      console.error('Erro ao carregar status das inscrições:', err);
    }
  };

  const alternarStatusInscricoes = async () => {
    const novoStatus = !inscricoesAbertas;
    
    if (novoStatus && !anoSelecionado) {
      alert('⚠️ Por favor, selecione um ano antes de abrir as inscrições.');
      return;
    }
    
    const confirmacao = confirm(
      novoStatus 
        ? `🔓 Tem certeza que deseja ABRIR as inscrições para o ano ${anoSelecionado}? Os alunos poderão submeter novas propostas.`
        : '🔒 Tem certeza que deseja FECHAR as inscrições? Os alunos não poderão mais submeter propostas até que sejam reabertas.'
    );
    
    if (!confirmacao) return;
    
    try {
      setLoadingInscricoesStatus(true);
      const res = await fetch(`${API_BASE_URL}/coordenadores/configuracoes/inscricoes/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordenador_id: user?.id,
          abrir: novoStatus,
          ano: parseInt(anoSelecionado)
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Falha ao alterar status das inscrições');
      }

      const data = await res.json();
      setInscricoesAbertas(novoStatus);
      if (novoStatus) {
        setAnoAtivo(parseInt(anoSelecionado));
      }
      alert(data.message || `Inscrições ${novoStatus ? 'abertas' : 'fechadas'} com sucesso!`);
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      alert('Erro: ' + err.message);
    } finally {
      setLoadingInscricoesStatus(false);
    }
  };

  const carregarRelatoriosMensais = async (orientadorId) => {
    try {
      setLoadingRelatorios(true);
      setSelectedOrientador(orientadorId);
      const res = await fetch(`${API_BASE_URL}/coordenadores/orientadores/${orientadorId}/relatorios-mensais`);
      
      if (!res.ok) throw new Error('Falha ao carregar relatórios');
      
      // Parse seguro
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      
      setRelatoriosMensais(data?.relatorios || []);
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err);
      alert('Erro ao carregar relatórios mensais');
    } finally {
      setLoadingRelatorios(false);
    }
  };

  const carregarEntregasAluno = async (alunoId, nomeAluno = null) => {
    try {
      console.log('🔍 Carregando entregas do aluno:', alunoId);
      const url = `${API_BASE_URL}/coordenadores/alunos/${alunoId}/entregas`;
      console.log('📡 URL:', url);
      
      const res = await fetch(url);
      console.log('📥 Response status:', res.status);
      
      if (!res.ok) throw new Error('Falha ao carregar entregas do aluno');
      
      // Parse seguro
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      
      console.log('📦 Entregas recebidas:', data);
      
      setSelectedAlunoEntregas({ id: alunoId, nome: nomeAluno || `Aluno #${alunoId}` });
      setEntregasAluno(data?.entregas || []);
    } catch (e) {
      console.error('❌ Erro ao carregar entregas:', e);
      alert('Erro ao carregar entregas do aluno');
    }
  };

  const validarEntrega = async (projetoId, entregaId, novoStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/coordenadores/entregas/${projetoId}/${entregaId}/status?novo_status=${encodeURIComponent(novoStatus)}`, { method: 'PATCH' });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Erro ao validar entrega:', errorText);
        throw new Error('Falha ao validar entrega');
      }
      
      // Parse seguro da resposta
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;
      
      // Atualiza localmente com o campo correto
      setEntregasAluno((prev) => prev.map(e => 
        e.id === entregaId ? { 
          ...e, 
          status_aprovacao_coordenador: novoStatus,
          data_avaliacao_coordenador: new Date().toISOString()
        } : e
      ));
      
      alert('Entrega avaliada com sucesso!');
    } catch (e) {
      console.error('Erro:', e);
      alert('Erro ao validar entrega: ' + e.message);
    }
  };

  const avaliarApresentacaoAmostra = async () => {
    try {
      if (!apresentacaoAmostraModal.aprovar && !apresentacaoAmostraModal.feedback.trim()) {
        alert('É necessário fornecer um feedback ao recusar.');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/coordenadores/apresentacao-amostra/${apresentacaoAmostraModal.entregaId}/avaliar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aprovar: apresentacaoAmostraModal.aprovar,
          feedback: apresentacaoAmostraModal.feedback || ''
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Falha ao avaliar apresentação na amostra');
      }

      const data = await res.json();
      
      // Atualiza localmente
      setEntregasAluno((prev) => prev.map(e => 
        e.id === apresentacaoAmostraModal.entregaId ? {
          ...e,
          status_aprovacao_coordenador: apresentacaoAmostraModal.aprovar ? 'aprovado' : 'rejeitado',
          feedback_coordenador: apresentacaoAmostraModal.feedback || '',
          data_avaliacao_coordenador: new Date().toISOString()
        } : e
      ));

      alert(`Apresentação na amostra ${apresentacaoAmostraModal.aprovar ? 'aprovada' : 'recusada'} com sucesso!`);
      
      // Fecha o modal
      setApresentacaoAmostraModal({ open: false, entregaId: null, aprovar: true, feedback: '' });
      
      // Recarrega as entregas para ter certeza de que está atualizado
      if (selectedAlunoEntregas) {
        await carregarEntregasAluno(selectedAlunoEntregas.id, selectedAlunoEntregas.nome);
      }
    } catch (err) {
      console.error('❌ Erro ao avaliar apresentação na amostra:', err);
      alert(`Erro ao avaliar apresentação: ${err.message}`);
    }
  };

  const avaliarArtigoFinal = async () => {
    try {
      if (!artigoFinalModal.aprovar && !artigoFinalModal.feedback.trim()) {
        alert('É necessário fornecer um feedback ao recusar.');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/coordenadores/artigo-final/${artigoFinalModal.entregaId}/avaliar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aprovar: artigoFinalModal.aprovar,
          feedback: artigoFinalModal.feedback || ''
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Falha ao avaliar artigo final');
      }

      const data = await res.json();
      
      // Atualiza localmente
      setEntregasAluno((prev) => prev.map(e => 
        e.id === artigoFinalModal.entregaId ? {
          ...e,
          status_aprovacao_coordenador: artigoFinalModal.aprovar ? 'aprovado' : 'rejeitado',
          feedback_coordenador: artigoFinalModal.feedback || '',
          data_avaliacao_coordenador: new Date().toISOString()
        } : e
      ));

      alert(`Artigo final ${artigoFinalModal.aprovar ? 'aprovado' : 'recusado'} com sucesso!`);
      
      // Fecha o modal
      setArtigoFinalModal({ open: false, entregaId: null, aprovar: true, feedback: '' });
      
      // Recarrega as entregas para ter certeza de que está atualizado
      if (selectedAlunoEntregas) {
        await carregarEntregasAluno(selectedAlunoEntregas.id, selectedAlunoEntregas.nome);
      }
    } catch (err) {
      console.error('❌ Erro ao avaliar artigo final:', err);
      alert(`Erro ao avaliar artigo final: ${err.message}`);
    }
  };

  const avaliarRelatorioParcial = async () => {
    try {
      if (!relatorioParcialModal.aprovar && !relatorioParcialModal.feedback.trim()) {
        alert('É necessário fornecer um feedback ao recusar.');
        return;
      }

      const res = await fetch(`${API_BASE_URL}/coordenadores/relatorio-parcial/${relatorioParcialModal.entregaId}/avaliar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aprovar: relatorioParcialModal.aprovar,
          feedback: relatorioParcialModal.feedback || ''
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Falha ao avaliar relatório parcial');
      }

      const data = await res.json();
      
      // Atualiza localmente
      setEntregasAluno((prev) => prev.map(e => 
        e.id === relatorioParcialModal.entregaId ? {
          ...e,
          status_aprovacao_coordenador: relatorioParcialModal.aprovar ? 'aprovado' : 'rejeitado',
          feedback_coordenador: relatorioParcialModal.feedback || '',
          data_avaliacao_coordenador: new Date().toISOString()
        } : e
      ));

      alert(`Relatório parcial ${relatorioParcialModal.aprovar ? 'aprovado' : 'recusado'} com sucesso!`);
      
      // Fecha o modal
      setRelatorioParcialModal({ open: false, entregaId: null, aprovar: true, feedback: '' });
      
      // Recarrega as entregas para ter certeza de que está atualizado
      if (selectedAlunoEntregas) {
        await carregarEntregasAluno(selectedAlunoEntregas.id, selectedAlunoEntregas.nome);
      }
    } catch (err) {
      console.error('❌ Erro ao avaliar relatório parcial:', err);
      alert(`Erro ao avaliar relatório parcial: ${err.message}`);
    }
  };

  // Funções para gerenciar certificados
  const carregarAlunosConcluidos = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/coordenadores/alunos`);
      const data = await res.json();
      
      // Acessar array de alunos corretamente
      const todosAlunos = data.alunos || [];
      
      // Filtrar apenas alunos com projeto concluído
      const concluidos = todosAlunos.filter(aluno => aluno.etapa === 'concluido');
      
      // Buscar status do certificado para cada aluno
      const alunosComCertificado = await Promise.all(
        concluidos.map(async (aluno) => {
          try {
            const certRes = await fetch(`${API_BASE_URL}/coordenadores/projetos/${aluno.projeto_id}/certificado`);
            const certData = await certRes.json();
            return { ...aluno, ...certData };
          } catch {
            return { ...aluno, tem_certificado: false };
          }
        })
      );
      
      setAlunosConcluidos(alunosComCertificado);
    } catch (err) {
      console.error('Erro ao carregar alunos concluídos:', err);
    }
  };

  const enviarCertificado = async (projetoId, alunoNome) => {
    if (!certificadoFile) {
      alert('Por favor, selecione um arquivo PDF');
      return;
    }

    if (!certificadoFile.name.toLowerCase().endsWith('.pdf')) {
      alert('Apenas arquivos PDF são permitidos');
      return;
    }

    setUploadingCertificado(true);

    try {
      const formData = new FormData();
      formData.append('certificado', certificadoFile);

      const res = await fetch(`${API_BASE_URL}/coordenadores/projetos/${projetoId}/certificado`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Falha ao enviar certificado');
      }

      const data = await res.json();
      alert(`Certificado enviado com sucesso para ${alunoNome}!`);
      
      // Limpar arquivo selecionado
      setCertificadoFile(null);
      
      // Recarregar lista de alunos concluídos
      await carregarAlunosConcluidos();
    } catch (err) {
      console.error('Erro ao enviar certificado:', err);
      alert(`Erro ao enviar certificado: ${err.message}`);
    } finally {
      setUploadingCertificado(false);
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
        `${API_BASE_URL}/coordenadores/relatorios-mensais/${respostaModal.relatorioId}/responder`,
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

  // Filtrar inscrições excluindo as rejeitadas
  const inscricoesAtivas = inscricoes.filter(i => 
    i.status !== 'rejeitada' && 
    i.status !== 'rejeitada_orientador' && 
    i.status !== 'rejeitada_coordenador'
  );

  const estatisticas = {
    total: inscricoesAtivas.length,
    aprovados: inscricoesAtivas.filter(i => i.status === 'aprovada').length,
    pendentes: inscricoesAtivas.filter(i => i.status === 'pendente' || i.status === 'em_analise' || i.status === 'pendente_coordenador' || i.status === 'pendente_orientador').length,
    rejeitados: inscricoes.filter(i => i.status === 'rejeitada' || i.status === 'rejeitada_orientador' || i.status === 'rejeitada_coordenador').length,
    alunos: [...new Set(inscricoesAtivas.filter(i => i.usuario_id).map(i => i.usuario_id))].length,
    orientadores: [...new Set(inscricoesAtivas.filter(i => i.orientador_id).map(i => i.orientador_id))].length
  };

  // Mapeamento de etapas para labels
  const etapaLabels = {
    envio_proposta: 'Submissão de Documentação e Proposta Inicial',
    apresentacao_proposta: 'Apresentação e Defesa da Proposta de Pesquisa',
    validacao: 'Avaliação e Homologação da Proposta',
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

  // Aplicar filtros de etapa, ano, curso e unidade (ANTES do filtro de status)
  let baseFiltered = inscricoes;
  
  if (filterEtapa !== 'todas') {
    baseFiltered = baseFiltered.filter(i => i.etapa === filterEtapa);
  }
  
  if (filterAno !== 'todos') {
    baseFiltered = baseFiltered.filter(i => i.ano === parseInt(filterAno));
  }
  
  if (filterCurso !== 'todos') {
    baseFiltered = baseFiltered.filter(i => i.curso && i.curso.toLowerCase().includes(filterCurso.toLowerCase()));
  }
  
  if (filterUnidade !== 'todas') {
    baseFiltered = baseFiltered.filter(i => i.unidade && i.unidade.toLowerCase() === filterUnidade.toLowerCase());
  }

  // Recalcular estatísticas com base nos filtros aplicados
  const estatisticasFiltradas = {
    total: baseFiltered.length,
    aprovados: baseFiltered.filter(i => i.status === 'aprovada').length,
    pendentes: baseFiltered.filter(i => i.status === 'pendente' || i.status === 'em_analise' || i.status === 'pendente_coordenador' || i.status === 'pendente_orientador').length,
    rejeitados: baseFiltered.filter(i => i.status === 'rejeitada' || i.status === 'rejeitada_orientador' || i.status === 'rejeitada_coordenador').length,
  };

  // Aplicar filtro de status por último
  const filteredInscricoes = filterStatus === 'todos' 
    ? baseFiltered 
    : filterStatus === 'em_analise'
    ? baseFiltered.filter(i => 
        i.status === 'em_analise' || 
        i.status === 'pendente_orientador' || 
        i.status === 'pendente_coordenador' ||
        i.status === 'pendente'
      )
    : filterStatus === 'rejeitada'
    ? baseFiltered.filter(i => 
        i.status === 'rejeitada' || 
        i.status === 'rejeitada_orientador' || 
        i.status === 'rejeitada_coordenador'
      )
    : baseFiltered.filter(i => i.status === filterStatus);

  // Lista fixa de todos os cursos disponíveis na instituição
  const cursosDisponiveis = [
    'Administração',
    'Ciência de Dados e Inteligência Artificial',
    'Ciências Econômicas',
    'Ciências Contábeis',
    'Engenharia da Computação',
    'Engenharia de Software',
    'Engenharia da Produção',
    'Relações Internacionais',
    'Direito'
  ].sort();

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
        `${API_BASE_URL}/inscricoes/${feedbackModal.id}/coordenador/avaliar`,
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
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-ibmec-blue-700">⚙️ Gestão de Status e Apresentações</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Atualize a etapa/estado dos projetos dos alunos (proposta, relatório parcial, apresentação na amostra, artigo final, finalizado).
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  Também permite  as apresentações dos projetos e as apresentações na amostra científica, definindo data, horário, campus e sala.
                </p>
              </div>
              <div className="shrink-0">
                <button className="btn-primary" onClick={() => navigate('/coordenador/status')}>
                  Abrir Gestão
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-ibmec-blue-700 mb-1">
                    {inscricoesAbertas ? '🔓 Inscrições Abertas' : '🔒 Inscrições Fechadas'}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {inscricoesAbertas 
                      ? `Os alunos podem submeter propostas para o ano ${anoAtivo}.`
                      : 'Os alunos não podem submeter novas propostas no momento.'}
                  </p>
                </div>
                <div className="shrink-0">
                  <button 
                    className={`px-6 py-3 rounded-lg font-semibold transition ${
                      loadingInscricoesStatus 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : inscricoesAbertas
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                    onClick={alternarStatusInscricoes}
                    disabled={loadingInscricoesStatus}
                  >
                    {loadingInscricoesStatus 
                      ? '⏳ Aguarde...' 
                      : inscricoesAbertas 
                        ? '🔒 Fechar Inscrições' 
                        : '🔓 Abrir Inscrições'}
                  </button>
                </div>
              </div>
              
              {/* Seletor de Ano - visível apenas quando as inscrições estão fechadas */}
              {!inscricoesAbertas && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📅 Selecione o ano para abertura das inscrições:
                  </label>
                  <div className="flex items-center gap-3">
                    <select
                      value={anoSelecionado}
                      onChange={(e) => setAnoSelecionado(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ibmec-blue-500 focus:border-transparent"
                    >
                      {Array.from({ length: 5 }, (_, i) => {
                        const ano = new Date().getFullYear() + i;
                        return (
                          <option key={ano} value={ano}>
                            {ano}
                          </option>
                        );
                      })}
                    </select>
                    <div className="text-sm text-gray-600">
                      Ano atual: <span className="font-semibold">{new Date().getFullYear()}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Ao abrir as inscrições, o ano selecionado será definido como o ano ativo para novas propostas.
                  </p>
                </div>
              )}
              
              {/* Informação do ano ativo quando inscrições estão abertas */}
              {inscricoesAbertas && (
                <div className="border-t pt-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      <span className="font-semibold">📅 Ano Ativo:</span> {anoAtivo}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Todas as propostas submetidas serão registradas para este ano.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

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
                📋 Gerenciar Etapas
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
              <button
                onClick={() => {
                  setActiveTab('certificados');
                  carregarAlunosConcluidos();
                }}
                className={`px-6 py-3 font-semibold transition ${
                  activeTab === 'certificados'
                    ? 'border-b-4 border-ibmec-blue-600 text-ibmec-blue-700'
                    : 'text-gray-600 hover:text-ibmec-blue-600'
                }`}
              >
                🎓 Certificados
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === 'inscricoes' && (
          <div className="space-y-6">
            {/* Filtros */}
            <Card>
              <div className="mb-4">
                <h3 className="text-lg font-bold text-ibmec-blue-800 mb-1 flex items-center gap-2">
                  🔍 Filtros de Pesquisa
                </h3>
                <p className="text-sm text-gray-600">Use os filtros abaixo para encontrar propostas específicas</p>
              </div>

              <div className="space-y-4">
                {/* Filtro por Status - Mantém como botões pois é o principal */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-3">Status da Proposta:</label>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setFilterStatus('todos')}
                      className={`px-4 py-2 rounded-lg font-semibold transition shadow-sm ${
                        filterStatus === 'todos'
                          ? 'bg-ibmec-blue-600 text-white shadow-md'
                          : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-ibmec-blue-400 hover:bg-gray-50'
                      }`}
                    >
                      📊 Todos ({estatisticasFiltradas.total})
                    </button>
                    <button
                      onClick={() => setFilterStatus('em_analise')}
                      className={`px-4 py-2 rounded-lg font-semibold transition shadow-sm ${
                        filterStatus === 'em_analise'
                          ? 'bg-yellow-600 text-white shadow-md'
                          : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-yellow-400 hover:bg-gray-50'
                      }`}
                    >
                      ⏳ Em Análise ({estatisticasFiltradas.pendentes})
                    </button>
                    <button
                      onClick={() => setFilterStatus('aprovada')}
                      className={`px-4 py-2 rounded-lg font-semibold transition shadow-sm ${
                        filterStatus === 'aprovada'
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-green-400 hover:bg-gray-50'
                      }`}
                    >
                      ✅ Aprovados ({estatisticasFiltradas.aprovados})
                    </button>
                    <button
                      onClick={() => setFilterStatus('rejeitada')}
                      className={`px-4 py-2 rounded-lg font-semibold transition shadow-sm ${
                        filterStatus === 'rejeitada'
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-red-400 hover:bg-gray-50'
                      }`}
                    >
                      ❌ Rejeitados ({estatisticasFiltradas.rejeitados})
                    </button>
                  </div>
                </div>

                {/* Grid com 2 colunas para os dropdowns */}
                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                  {/* Filtro por Etapa */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📋 Etapa do Projeto:
                    </label>
                    <select
                      value={filterEtapa}
                      onChange={(e) => setFilterEtapa(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ibmec-blue-500 focus:border-transparent bg-white text-gray-700 hover:border-gray-400 transition"
                    >
                      <option value="todas">Todas as Etapas</option>
                      {Object.entries(etapaLabels)
                        .filter(([key]) => !key.startsWith('relatorio_mensal_'))
                        .map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Filtro por Ano */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📅 Ano:
                    </label>
                    <select
                      value={filterAno}
                      onChange={(e) => setFilterAno(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ibmec-blue-500 focus:border-transparent bg-white text-gray-700 hover:border-gray-400 transition"
                    >
                      <option value="todos">Todos os Anos</option>
                      {Array.from({ length: 10 }, (_, i) => {
                        const ano = 2025 + i;
                        return (
                          <option key={ano} value={ano}>
                            {ano}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Filtro por Curso */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🎓 Curso:
                    </label>
                    <select
                      value={filterCurso}
                      onChange={(e) => setFilterCurso(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ibmec-blue-500 focus:border-transparent bg-white text-gray-700 hover:border-gray-400 transition"
                    >
                      <option value="todos">Todos os Cursos</option>
                      {cursosDisponiveis.map((curso) => (
                        <option key={curso} value={curso}>
                          {curso}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro por Unidade */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      🏢 Unidade:
                    </label>
                    <select
                      value={filterUnidade}
                      onChange={(e) => setFilterUnidade(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ibmec-blue-500 focus:border-transparent bg-white text-gray-700 hover:border-gray-400 transition"
                    >
                      <option value="todas">Todas as Unidades</option>
                      <option value="Faria Lima">Faria Lima</option>
                      <option value="Paulista">Paulista</option>
                    </select>
                  </div>
                </div>

                {/* Resumo dos filtros ativos */}
                {(filterEtapa !== 'todas' || filterAno !== 'todos' || filterCurso !== 'todos' || filterUnidade !== 'todas') && (
                  <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
                    <span className="text-sm font-semibold text-gray-700">Filtros ativos:</span>
                    {filterEtapa !== 'todas' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-ibmec-blue-100 text-ibmec-blue-800 rounded-full text-xs font-medium">
                        Etapa: {etapaLabels[filterEtapa].substring(0, 30)}...
                        <button onClick={() => setFilterEtapa('todas')} className="hover:text-ibmec-blue-900">✕</button>
                      </span>
                    )}
                    {filterAno !== 'todos' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-ibmec-blue-100 text-ibmec-blue-800 rounded-full text-xs font-medium">
                        Ano: {filterAno}
                        <button onClick={() => setFilterAno('todos')} className="hover:text-ibmec-blue-900">✕</button>
                      </span>
                    )}
                    {filterCurso !== 'todos' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-ibmec-blue-100 text-ibmec-blue-800 rounded-full text-xs font-medium">
                        Curso: {filterCurso}
                        <button onClick={() => setFilterCurso('todos')} className="hover:text-ibmec-blue-900">✕</button>
                      </span>
                    )}
                    {filterUnidade !== 'todas' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-ibmec-blue-100 text-ibmec-blue-800 rounded-full text-xs font-medium">
                        Unidade: {filterUnidade}
                        <button onClick={() => setFilterUnidade('todas')} className="hover:text-ibmec-blue-900">✕</button>
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setFilterEtapa('todas');
                        setFilterAno('todos');
                        setFilterCurso('todos');
                        setFilterUnidade('todas');
                      }}
                      className="ml-2 px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                    >
                      Limpar todos os filtros
                    </button>
                  </div>
                )}
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
                        {inscricao.etapa && (
                          <p className="md:col-span-2">
                            <strong>Etapa Atual:</strong>{' '}
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              inscricao.etapa === 'relatorio_parcial' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {etapaLabels[inscricao.etapa] || inscricao.etapa}
                            </span>
                          </p>
                        )}
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
                        <button 
                          onClick={() => carregarEntregasAluno(inscricao.usuario_id, inscricao.nome)} 
                          className={`font-semibold py-2.5 px-4 rounded-lg transition text-sm flex items-center justify-center gap-2 ${
                            inscricao.etapa === 'relatorio_parcial'
                              ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg animate-pulse'
                              : inscricao.etapa === 'apresentacao_amostra'
                              ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg animate-pulse'
                              : 'bg-ibmec-blue-600 hover:bg-ibmec-blue-700 text-white'
                          }`}
                        >
                          📋 {inscricao.etapa === 'relatorio_parcial' 
                              ? 'Avaliar Relatório Parcial' 
                              : inscricao.etapa === 'apresentacao_amostra'
                              ? '🎤 Avaliar Apresentação na Amostra'
                              : 'Ver Entregas e Relatórios'}
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
                  <div className="space-y-4">
                    {/* Relatórios Parciais com status especial */}
                    {entregasAluno.filter(e => e.tipo === 'relatorio_parcial').map((e) => {
                      const pendenteOrientador = e.status_aprovacao_orientador === 'pendente';
                      const pendenteCoordenador = e.status_aprovacao_orientador === 'aprovado' && e.status_aprovacao_coordenador === 'pendente';
                      const aprovadoFinal = e.status_aprovacao_orientador === 'aprovado' && e.status_aprovacao_coordenador === 'aprovado';
                      const rejeitado = e.status_aprovacao_orientador === 'rejeitado' || e.status_aprovacao_coordenador === 'rejeitado';
                      
                      return (
                        <div key={e.id} className={`border-2 rounded-lg p-4 ${
                          pendenteCoordenador ? 'border-yellow-500 bg-yellow-50' :
                          pendenteOrientador ? 'border-blue-300 bg-blue-50' :
                          aprovadoFinal ? 'border-green-500 bg-green-50' :
                          rejeitado ? 'border-red-500 bg-red-50' :
                          'border-gray-300 bg-gray-50'
                        }`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-ibmec-blue-800 mb-2">
                                📄 Relatório Parcial
                              </h4>
                              <div className="space-y-2 text-sm">
                                <p><strong>Data de Envio:</strong> {e.data_entrega ? new Date(e.data_entrega).toLocaleString('pt-BR') : '-'}</p>
                                {e.descricao && <p><strong>Descrição:</strong> {e.descricao}</p>}
                                {e.arquivo && (
                                  <p>
                                    <strong>Arquivo:</strong>{' '}
                                    <a 
                                      href={`${API_BASE_URL}/uploads/entregas/${e.arquivo}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      📎 {e.arquivo}
                                    </a>
                                  </p>
                                )}
                                
                                {/* Status de Aprovação */}
                                <div className="flex gap-4 mt-3">
                                  <div className={`px-3 py-2 rounded border-2 ${
                                    e.status_aprovacao_orientador === 'aprovado' ? 'bg-green-100 border-green-500 text-green-800' :
                                    e.status_aprovacao_orientador === 'rejeitado' ? 'bg-red-100 border-red-500 text-red-800' :
                                    'bg-yellow-100 border-yellow-500 text-yellow-800'
                                  }`}>
                                    <p className="text-xs font-semibold">Orientador:</p>
                                    <p className="text-sm">
                                      {e.status_aprovacao_orientador === 'aprovado' ? '✅ Aprovado' :
                                       e.status_aprovacao_orientador === 'rejeitado' ? '❌ Rejeitado' : '⏳ Pendente'}
                                    </p>
                                  </div>
                                  {e.status_aprovacao_orientador === 'aprovado' && (
                                    <div className={`px-3 py-2 rounded border-2 ${
                                      e.status_aprovacao_coordenador === 'aprovado' ? 'bg-green-100 border-green-500 text-green-800' :
                                      e.status_aprovacao_coordenador === 'rejeitado' ? 'bg-red-100 border-red-500 text-red-800' :
                                      'bg-yellow-100 border-yellow-500 text-yellow-800'
                                    }`}>
                                      <p className="text-xs font-semibold">Coordenador:</p>
                                      <p className="text-sm">
                                        {e.status_aprovacao_coordenador === 'aprovado' ? '✅ Aprovado' :
                                         e.status_aprovacao_coordenador === 'rejeitado' ? '❌ Rejeitado' : '⏳ Pendente'}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Feedbacks */}
                                {e.feedback_orientador && (
                                  <div className="mt-3 p-3 bg-blue-100 border-l-4 border-blue-500 rounded">
                                    <p className="text-xs font-semibold text-blue-800 mb-1">Feedback do Orientador:</p>
                                    <p className="text-sm text-gray-700">{e.feedback_orientador}</p>
                                  </div>
                                )}
                                {e.feedback_coordenador && (
                                  <div className="mt-3 p-3 bg-green-100 border-l-4 border-green-500 rounded">
                                    <p className="text-xs font-semibold text-green-800 mb-1">Seu Feedback:</p>
                                    <p className="text-sm text-gray-700">{e.feedback_coordenador}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Botões de Ação */}
                            {pendenteCoordenador && (
                              <div className="flex flex-col gap-2">
                                <button 
                                  onClick={() => setRelatorioParcialModal({ open: true, entregaId: e.id, aprovar: true, feedback: '' })}
                                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm whitespace-nowrap"
                                >
                                  ✅ Aprovar
                                </button>
                                <button 
                                  onClick={() => setRelatorioParcialModal({ open: true, entregaId: e.id, aprovar: false, feedback: '' })}
                                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm whitespace-nowrap"
                                >
                                  ❌ Recusar
                                </button>
                              </div>
                            )}
                            {pendenteOrientador && (
                              <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
                                <p className="text-sm text-blue-800 font-semibold">⏳ Aguardando aprovação do orientador</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Apresentação na Amostra com status especial */}
                    {entregasAluno.filter(e => e.tipo === 'apresentacao').map((e) => {
                      const pendenteOrientador = e.status_aprovacao_orientador === 'pendente';
                      const pendenteCoordenador = e.status_aprovacao_orientador === 'aprovado' && e.status_aprovacao_coordenador === 'pendente';
                      const aprovadoFinal = e.status_aprovacao_orientador === 'aprovado' && e.status_aprovacao_coordenador === 'aprovado';
                      const rejeitado = e.status_aprovacao_orientador === 'rejeitado' || e.status_aprovacao_coordenador === 'rejeitado';
                      
                      return (
                        <div key={e.id} className={`border-2 rounded-lg p-4 ${
                          pendenteCoordenador ? 'border-blue-500 bg-blue-50 shadow-lg animate-pulse' :
                          pendenteOrientador ? 'border-blue-300 bg-blue-50' :
                          aprovadoFinal ? 'border-green-500 bg-green-50' :
                          rejeitado ? 'border-red-500 bg-red-50' :
                          'border-gray-300 bg-gray-50'
                        }`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-blue-800 mb-2 flex items-center gap-2">
                                🎤 Apresentação na Amostra
                                {pendenteCoordenador && (
                                  <span className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full animate-pulse">
                                    ⚡ Requer sua avaliação
                                  </span>
                                )}
                              </h4>
                              <div className="space-y-2 text-sm">
                                <p><strong>Data de Envio:</strong> {e.data_entrega ? new Date(e.data_entrega).toLocaleString('pt-BR') : '-'}</p>
                                {e.descricao && <p><strong>Descrição:</strong> {e.descricao}</p>}
                                {e.arquivo && (
                                  <p>
                                    <strong>Arquivo:</strong>{' '}
                                    <a 
                                      href={`${API_BASE_URL}/uploads/entregas/${e.arquivo}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      📎 {e.arquivo}
                                    </a>
                                  </p>
                                )}
                                
                                {/* Status de Aprovação */}
                                <div className="flex gap-4 mt-3">
                                  <div className={`px-3 py-2 rounded border-2 ${
                                    e.status_aprovacao_orientador === 'aprovado' ? 'bg-green-100 border-green-500 text-green-800' :
                                    e.status_aprovacao_orientador === 'rejeitado' ? 'bg-red-100 border-red-500 text-red-800' :
                                    'bg-yellow-100 border-yellow-500 text-yellow-800'
                                  }`}>
                                    <p className="text-xs font-semibold">Orientador:</p>
                                    <p className="text-sm">
                                      {e.status_aprovacao_orientador === 'aprovado' ? '✅ Aprovado' :
                                       e.status_aprovacao_orientador === 'rejeitado' ? '❌ Rejeitado' : '⏳ Pendente'}
                                    </p>
                                  </div>
                                  {e.status_aprovacao_orientador === 'aprovado' && (
                                    <div className={`px-3 py-2 rounded border-2 ${
                                      e.status_aprovacao_coordenador === 'aprovado' ? 'bg-green-100 border-green-500 text-green-800' :
                                      e.status_aprovacao_coordenador === 'rejeitado' ? 'bg-red-100 border-red-500 text-red-800' :
                                      'bg-yellow-100 border-yellow-500 text-yellow-800'
                                    }`}>
                                      <p className="text-xs font-semibold">Coordenador:</p>
                                      <p className="text-sm">
                                        {e.status_aprovacao_coordenador === 'aprovado' ? '✅ Aprovado' :
                                         e.status_aprovacao_coordenador === 'rejeitado' ? '❌ Rejeitado' : '⏳ Pendente'}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Feedbacks */}
                                {e.feedback_orientador && (
                                  <div className="mt-3 p-3 bg-blue-100 border-l-4 border-blue-500 rounded">
                                    <p className="text-xs font-semibold text-blue-800 mb-1">Feedback do Orientador:</p>
                                    <p className="text-sm text-gray-700">{e.feedback_orientador}</p>
                                  </div>
                                )}
                                {e.feedback_coordenador && (
                                  <div className="mt-3 p-3 bg-green-100 border-l-4 border-green-500 rounded">
                                    <p className="text-xs font-semibold text-green-800 mb-1">Seu Feedback:</p>
                                    <p className="text-sm text-gray-700">{e.feedback_coordenador}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Botões de Ação */}
                            {pendenteCoordenador && (
                              <div className="flex flex-col gap-2">
                                <button 
                                  onClick={() => setApresentacaoAmostraModal({ open: true, entregaId: e.id, aprovar: true, feedback: '' })}
                                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition text-sm whitespace-nowrap shadow-lg flex items-center gap-2"
                                >
                                  ✅ Aprovar Apresentação
                                </button>
                                <button 
                                  onClick={() => setApresentacaoAmostraModal({ open: true, entregaId: e.id, aprovar: false, feedback: '' })}
                                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition text-sm whitespace-nowrap shadow-lg flex items-center gap-2"
                                >
                                  ❌ Recusar Apresentação
                                </button>
                              </div>
                            )}
                            {pendenteOrientador && (
                              <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
                                <p className="text-sm text-blue-800 font-semibold">⏳ Aguardando aprovação do orientador</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Artigo Final */}
                    {entregasAluno.filter(e => e.tipo === 'artigo_final').map((e) => {
                      const pendenteOrientador = e.status_aprovacao_orientador === 'pendente';
                      const pendenteCoordenador = e.status_aprovacao_orientador === 'aprovado' && e.status_aprovacao_coordenador === 'pendente';
                      const aprovadoFinal = e.status_aprovacao_orientador === 'aprovado' && e.status_aprovacao_coordenador === 'aprovado';
                      const rejeitado = e.status_aprovacao_orientador === 'rejeitado' || e.status_aprovacao_coordenador === 'rejeitado';
                      
                      return (
                        <div key={e.id} className={`border-2 rounded-lg p-4 ${
                          pendenteCoordenador ? 'border-yellow-500 bg-yellow-50' :
                          pendenteOrientador ? 'border-blue-300 bg-blue-50' :
                          aprovadoFinal ? 'border-green-500 bg-green-50' :
                          rejeitado ? 'border-red-500 bg-red-50' :
                          'border-gray-300 bg-gray-50'
                        }`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-bold text-ibmec-blue-800 mb-2">
                                📚 Artigo Científico Final
                              </h4>
                              <div className="space-y-2 text-sm">
                                <p><strong>Data de Envio:</strong> {e.data_entrega ? new Date(e.data_entrega).toLocaleString('pt-BR') : '-'}</p>
                                {e.descricao && <p><strong>Descrição:</strong> {e.descricao}</p>}
                                {e.arquivo && (
                                  <p>
                                    <strong>Arquivo:</strong>{' '}
                                    <a 
                                      href={`${API_BASE_URL}/uploads/entregas/${e.arquivo}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      📎 {e.arquivo}
                                    </a>
                                  </p>
                                )}
                                
                                {/* Status de Aprovação */}
                                <div className="flex gap-4 mt-3">
                                  <div className={`px-3 py-2 rounded border-2 ${
                                    e.status_aprovacao_orientador === 'aprovado' ? 'bg-green-100 border-green-500 text-green-800' :
                                    e.status_aprovacao_orientador === 'rejeitado' ? 'bg-red-100 border-red-500 text-red-800' :
                                    'bg-yellow-100 border-yellow-500 text-yellow-800'
                                  }`}>
                                    <p className="text-xs font-semibold">Orientador:</p>
                                    <p className="text-sm">
                                      {e.status_aprovacao_orientador === 'aprovado' ? '✅ Aprovado' :
                                       e.status_aprovacao_orientador === 'rejeitado' ? '❌ Rejeitado' : '⏳ Pendente'}
                                    </p>
                                  </div>
                                  {e.status_aprovacao_orientador === 'aprovado' && (
                                    <div className={`px-3 py-2 rounded border-2 ${
                                      e.status_aprovacao_coordenador === 'aprovado' ? 'bg-green-100 border-green-500 text-green-800' :
                                      e.status_aprovacao_coordenador === 'rejeitado' ? 'bg-red-100 border-red-500 text-red-800' :
                                      'bg-yellow-100 border-yellow-500 text-yellow-800'
                                    }`}>
                                      <p className="text-xs font-semibold">Coordenador:</p>
                                      <p className="text-sm">
                                        {e.status_aprovacao_coordenador === 'aprovado' ? '✅ Aprovado' :
                                         e.status_aprovacao_coordenador === 'rejeitado' ? '❌ Rejeitado' : '⏳ Pendente'}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Feedbacks */}
                                {e.feedback_orientador && (
                                  <div className="mt-3 p-3 bg-blue-100 border-l-4 border-blue-500 rounded">
                                    <p className="text-xs font-semibold text-blue-800 mb-1">Feedback do Orientador:</p>
                                    <p className="text-sm text-gray-700">{e.feedback_orientador}</p>
                                  </div>
                                )}
                                {e.feedback_coordenador && (
                                  <div className="mt-3 p-3 bg-green-100 border-l-4 border-green-500 rounded">
                                    <p className="text-xs font-semibold text-green-800 mb-1">Seu Feedback:</p>
                                    <p className="text-sm text-gray-700">{e.feedback_coordenador}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Botões de Ação para Artigo Final*/}
                            {pendenteCoordenador && (
                              <div className="flex flex-col gap-2">
                                <button 
                                  onClick={() => setArtigoFinalModal({ open: true, entregaId: e.id, aprovar: true, feedback: '' })}
                                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm whitespace-nowrap"
                                >
                                  ✅ Aprovar Artigo
                                </button>
                                <button 
                                  onClick={() => setArtigoFinalModal({ open: true, entregaId: e.id, aprovar: false, feedback: '' })}
                                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition text-sm whitespace-nowrap"
                                >
                                  ❌ Recusar Artigo
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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

                    return Object.entries(porAluno).map(([alunoNome, relatorios]) => {
                      const alunoKey = `${selectedOrientador}-${alunoNome}`;
                      const isExpanded = alunosExpandidos[alunoKey];
                      
                      return (
                        <div key={alunoNome} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                          <div 
                            className="flex items-center justify-between cursor-pointer hover:bg-gray-100 p-2 rounded transition"
                            onClick={() => setAlunosExpandidos(prev => ({
                              ...prev,
                              [alunoKey]: !prev[alunoKey]
                            }))}
                          >
                            <h4 className="font-bold text-ibmec-blue-800 flex items-center gap-2">
                              <span className="text-2xl">👨‍🎓</span>
                              <span>Aluno: {alunoNome}</span>
                              <span className="text-sm font-normal text-gray-600">
                                ({relatorios.length} {relatorios.length === 1 ? 'relatório' : 'relatórios'})
                              </span>
                            </h4>
                            <button className="text-2xl text-ibmec-blue-600 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                              ▶
                            </button>
                          </div>
                        
                        {isExpanded && (
                          <div className="space-y-2 mt-4">
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
                        )}
                        </div>
                      );
                    });
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

        {/* Aba de Certificados */}
        {activeTab === 'certificados' && (
          <div className="space-y-6">
            <Card>
              <h2 className="text-2xl font-bold text-ibmec-blue-800 mb-4">
                🎓 Gerenciar Certificados de Conclusão
              </h2>
              <p className="text-gray-600 mb-6">
                Envie os certificados de conclusão para os alunos que finalizaram todas as etapas da Iniciação Científica.
              </p>

              {alunosConcluidos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-gray-500 text-lg">Nenhum aluno com projeto concluído no momento</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alunosConcluidos.map((aluno) => (
                    <div 
                      key={aluno.aluno_id}
                      className={`border-2 rounded-lg p-6 ${
                        aluno.tem_certificado 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-blue-300 bg-blue-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-ibmec-blue-800 mb-2">
                            {aluno.nome}
                          </h3>
                          <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                            <div>
                              <p className="text-gray-600 font-semibold">Curso:</p>
                              <p className="text-gray-800">{aluno.curso}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 font-semibold">Projeto:</p>
                              <p className="text-gray-800">{aluno.projeto_titulo}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 font-semibold">Orientador:</p>
                              <p className="text-gray-800">{aluno.orientador_nome}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 font-semibold">Status:</p>
                              <p className="text-green-600 font-bold">✅ Concluído</p>
                            </div>
                          </div>

                          {aluno.tem_certificado ? (
                            <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded">
                              <p className="text-green-800 font-semibold flex items-center gap-2">
                                <span className="text-2xl">✅</span>
                                Certificado já enviado
                              </p>
                              <p className="text-sm text-green-700 mt-1">
                                Arquivo: {aluno.certificado_arquivo}
                              </p>
                              {aluno.data_emissao && (
                                <p className="text-xs text-green-600 mt-1">
                                  Emitido em: {new Date(aluno.data_emissao).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                              <p className="text-yellow-800 font-semibold mb-3">
                                ⏳ Certificado pendente
                              </p>
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Selecione o certificado (PDF):
                                  </label>
                                  <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setCertificadoFile(e.target.files[0])}
                                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none p-2"
                                  />
                                  {certificadoFile && (
                                    <p className="text-xs text-green-600 mt-1">
                                      ✓ Arquivo selecionado: {certificadoFile.name}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => enviarCertificado(aluno.projeto_id, aluno.nome)}
                                  disabled={!certificadoFile || uploadingCertificado}
                                  className={`w-full py-2 px-4 rounded-lg font-semibold transition ${
                                    !certificadoFile || uploadingCertificado
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : 'bg-green-600 hover:bg-green-700 text-white'
                                  }`}
                                >
                                  {uploadingCertificado ? (
                                    <span className="flex items-center justify-center gap-2">
                                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                      Enviando...
                                    </span>
                                  ) : (
                                    '📤 Enviar Certificado'
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Modal de Avaliação de Relatório Parcial */}
      {relatorioParcialModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-ibmec-blue-800 mb-4">
                {relatorioParcialModal.aprovar ? '✅ Aprovar Relatório Parcial' : '❌ Recusar Relatório Parcial'}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {relatorioParcialModal.aprovar ? 'Feedback (Opcional):' : 'Motivo da Recusa (Obrigatório):'}
                </label>
                <textarea
                  value={relatorioParcialModal.feedback}
                  onChange={(e) => setRelatorioParcialModal({ ...relatorioParcialModal, feedback: e.target.value })}
                  placeholder={relatorioParcialModal.aprovar 
                    ? 'Digite seu feedback sobre o relatório parcial...' 
                    : 'Explique o motivo da recusa do relatório parcial...'}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-ibmec-blue-500 focus:border-transparent"
                  rows="6"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  className="btn-outline" 
                  onClick={() => setRelatorioParcialModal({ open: false, entregaId: null, aprovar: true, feedback: '' })}
                >
                  Cancelar
                </button>
                <button 
                  className={`font-semibold py-2 px-6 rounded-lg transition ${
                    relatorioParcialModal.aprovar
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  onClick={avaliarRelatorioParcial}
                >
                  {relatorioParcialModal.aprovar ? '✅ Confirmar Aprovação' : '❌ Confirmar Recusa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Avaliação de Apresentação na Amostra */}
      {apresentacaoAmostraModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-ibmec-blue-800 mb-4">
                {apresentacaoAmostraModal.aprovar ? '✅ Aprovar Apresentação na Amostra' : '❌ Recusar Apresentação na Amostra'}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {apresentacaoAmostraModal.aprovar ? 'Feedback (Opcional):' : 'Motivo da Recusa (Obrigatório):'}
                </label>
                <textarea
                  value={apresentacaoAmostraModal.feedback}
                  onChange={(e) => setApresentacaoAmostraModal({ ...apresentacaoAmostraModal, feedback: e.target.value })}
                  placeholder={apresentacaoAmostraModal.aprovar 
                    ? 'Digite seu feedback sobre a apresentação na amostra...' 
                    : 'Explique o motivo da recusa da apresentação...'}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-ibmec-blue-500 focus:border-transparent"
                  rows="6"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  className="btn-outline" 
                  onClick={() => setApresentacaoAmostraModal({ open: false, entregaId: null, aprovar: true, feedback: '' })}
                >
                  Cancelar
                </button>
                <button 
                  className={`font-semibold py-2 px-6 rounded-lg transition ${
                    apresentacaoAmostraModal.aprovar
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  onClick={avaliarApresentacaoAmostra}
                >
                  {apresentacaoAmostraModal.aprovar ? '✅ Confirmar Aprovação' : '❌ Confirmar Recusa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Avaliação do Artigo Final */}
      {artigoFinalModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-ibmec-blue-800 mb-4">
                {artigoFinalModal.aprovar ? '✅ Aprovar Artigo Científico Final' : '❌ Recusar Artigo Científico Final'}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {artigoFinalModal.aprovar ? 'Feedback (Opcional):' : 'Motivo da Recusa (Obrigatório):'}
                </label>
                <textarea
                  value={artigoFinalModal.feedback}
                  onChange={(e) => setArtigoFinalModal({ ...artigoFinalModal, feedback: e.target.value })}
                  placeholder={artigoFinalModal.aprovar 
                    ? 'Digite seu feedback sobre o artigo final...' 
                    : 'Explique o motivo da recusa do artigo...'}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-ibmec-blue-500 focus:border-transparent"
                  rows="6"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  className="btn-outline" 
                  onClick={() => setArtigoFinalModal({ open: false, entregaId: null, aprovar: true, feedback: '' })}
                >
                  Cancelar
                </button>
                <button 
                  className={`font-semibold py-2 px-6 rounded-lg transition ${
                    artigoFinalModal.aprovar
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  onClick={avaliarArtigoFinal}
                >
                  {artigoFinalModal.aprovar ? '✅ Confirmar Aprovação' : '❌ Confirmar Recusa'}
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

