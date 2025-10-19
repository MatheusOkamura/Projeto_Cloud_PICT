import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';

const EnviarArtigoFinal = () => {
  const { user } = useAuth();
  const [descricao, setDescricao] = useState('');
  const [arquivo, setArquivo] = useState(null);
  const [sending, setSending] = useState(false);

  const handleFileChange = (e) => {
    setArquivo(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!arquivo) return alert('Selecione o arquivo do artigo final.');
    setSending(true);
    const fd = new FormData();
    fd.append('etapa', 'artigo_final');
    fd.append('descricao', descricao);
    fd.append('arquivo', arquivo);
    try {
      const res = await fetch(`http://localhost:8000/api/alunos/${user?.id}/entrega-etapa`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) throw new Error('Falha ao enviar artigo final');
      alert('Artigo final enviado com sucesso!');
      setDescricao('');
      setArquivo(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ibmec-blue-50 to-gray-100 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <h2 className="text-2xl font-bold text-ibmec-blue-800 mb-4">Enviar Artigo Final</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Arquivo do Artigo Final</label>
              <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} required className="input-field" />
            </div>
            <div>
              <label className="label">Descrição (opcional)</label>
              <textarea value={descricao} onChange={e => setDescricao(e.target.value)} className="input-field" rows="3" placeholder="Observações ou instruções adicionais..."></textarea>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={sending} className="btn-primary">
                {sending ? 'Enviando...' : 'Enviar Artigo Final'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default EnviarArtigoFinal;
