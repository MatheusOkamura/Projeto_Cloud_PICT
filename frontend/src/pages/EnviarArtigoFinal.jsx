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
      <div className="container mx-auto max-w-3xl">
        {/* Header com informações */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">📄</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-ibmec-blue-800">Enviar Artigo Final</h1>
              <p className="text-gray-600">Última etapa do projeto de iniciação científica</p>
            </div>
          </div>
          
          {/* Alerta informativo */}
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎓</span>
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 mb-1">Sobre o Artigo Final</h3>
                <p className="text-sm text-gray-700">
                  O artigo final consolida todo o trabalho realizado. Deve seguir normas acadêmicas, 
                  incluir abstract, introdução, metodologia, resultados, discussão, conclusão e referências.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Upload de arquivo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📎 Arquivo do Artigo Final
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition">
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx" 
                  onChange={handleFileChange} 
                  required 
                  className="hidden" 
                  id="arquivo-upload"
                />
                <label htmlFor="arquivo-upload" className="cursor-pointer">
                  <div className="text-5xl mb-3">📑</div>
                  {arquivo ? (
                    <div className="space-y-2">
                      <p className="text-green-600 font-semibold">✅ Arquivo selecionado:</p>
                      <p className="text-sm text-gray-700 font-medium">{arquivo.name}</p>
                      <p className="text-xs text-gray-500">
                        {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button 
                        type="button"
                        onClick={() => setArquivo(null)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium mt-2"
                      >
                        🗑️ Remover arquivo
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-700 font-medium mb-2">
                        Clique para selecionar o arquivo
                      </p>
                      <p className="text-sm text-gray-500">
                        Formatos aceitos: PDF, DOC, DOCX
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📝 Observações e Comentários (opcional)
              </label>
              <textarea 
                value={descricao} 
                onChange={e => setDescricao(e.target.value)} 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                rows="4" 
                placeholder="Adicione comentários finais, agradecimentos especiais, ou informações relevantes sobre o artigo..."
              ></textarea>
              <p className="text-xs text-gray-500 mt-1">
                ℹ️ Use este campo para contextualizar seu trabalho final
              </p>
            </div>

            {/* Botões */}
            <div className="flex justify-between items-center pt-4 border-t">
              <button 
                type="button"
                onClick={() => window.history.back()}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
              >
                ← Voltar
              </button>
              <button 
                type="submit" 
                disabled={sending || !arquivo} 
                className={`px-8 py-3 rounded-lg font-semibold transition transform ${
                  sending || !arquivo
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105 shadow-md'
                }`}
              >
                {sending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Enviando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span>📤</span>
                    Enviar Artigo Final
                  </span>
                )}
              </button>
            </div>
          </form>
        </Card>

        {/* Dicas */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-5">
          <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
            <span>⚠️</span>
            Checklist Final
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>Verifique se todas as seções obrigatórias estão presentes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>Revise a formatação conforme as normas ABNT ou padrão indicado</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>Confira se todas as referências estão citadas corretamente</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>Faça uma revisão ortográfica e gramatical completa</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600">•</span>
              <span>Peça para seu orientador revisar antes do envio final</span>
            </li>
          </ul>
        </div>

        {/* Mensagem de Parabéns */}
        <div className="mt-6 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-6 text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h3 className="text-2xl font-bold mb-2">Parabéns por chegar até aqui!</h3>
          <p className="text-green-50">
            Esta é a última etapa do seu projeto de iniciação científica. 
            Após o envio, seu trabalho será avaliado pela banca examinadora.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnviarArtigoFinal;
