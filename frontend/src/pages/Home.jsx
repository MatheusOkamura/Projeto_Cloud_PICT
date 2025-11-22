import { Link } from 'react-router-dom';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-ibmec-blue-700 to-ibmec-blue-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              Iniciação Científica Ibmec
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-200">
              Desperte seu potencial acadêmico e contribua para o avanço da ciência
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
              {!user && (
                <>
                  <Link 
                    to="/login" 
                    className="flex-1 bg-white hover:bg-gray-100 text-ibmec-blue-700 font-bold py-4 px-8 rounded-lg transition transform hover:scale-105 shadow-lg"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-3xl mb-2">🎓</span>
                      <span className="text-lg">Área do Aluno</span>
                    </div>
                  </Link>
                  <Link 
                    to="/login" 
                    className="flex-1 bg-ibmec-gold-500 hover:bg-ibmec-gold-600 text-white font-bold py-4 px-8 rounded-lg transition transform hover:scale-105 shadow-lg"
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-3xl mb-2">👨‍🏫</span>
                      <span className="text-lg">Área do Professor</span>
                    </div>
                  </Link>
                </>
              )}
              {user && (
                <Link to={`/dashboard-${user.tipo}`} className="btn-secondary text-lg">
                  🎯 Acessar Meu Painel
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* O que é Iniciação Científica */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-ibmec-blue-800">
              O que é Iniciação Científica?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <div className="text-center">
                  <div className="text-5xl mb-4">🔬</div>
                  <h3 className="text-xl font-bold mb-3 text-ibmec-blue-700">Pesquisa Acadêmica</h3>
                  <p className="text-gray-600">
                    Desenvolva projetos de pesquisa sob orientação de professores experientes
                  </p>
                </div>
              </Card>
              
              <Card>
                <div className="text-center">
                  <div className="text-5xl mb-4">🎓</div>
                  <h3 className="text-xl font-bold mb-3 text-ibmec-blue-700">Desenvolvimento Acadêmico</h3>
                  <p className="text-gray-600">
                    Amplie seus conhecimentos e desenvolva habilidades essenciais para sua carreira
                  </p>
                </div>
              </Card>
              
              <Card>
                <div className="text-center">
                  <div className="text-5xl mb-4">🏆</div>
                  <h3 className="text-xl font-bold mb-3 text-ibmec-blue-700">Certificação</h3>
                  <p className="text-gray-600">
                    Receba certificado reconhecido e destaque-se no mercado de trabalho
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-ibmec-blue-800">
              Por que participar?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex items-start space-x-4">
                <div className="text-3xl">✅</div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-ibmec-blue-700">Bolsa de Estudos</h3>
                  <p className="text-gray-600">Receba apoio financeiro durante sua pesquisa</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="text-3xl">✅</div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-ibmec-blue-700">Networking Acadêmico</h3>
                  <p className="text-gray-600">Conecte-se com pesquisadores e especialistas</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="text-3xl">✅</div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-ibmec-blue-700">Publicações Científicas</h3>
                  <p className="text-gray-600">Oportunidade de publicar seus trabalhos</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="text-3xl">✅</div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-ibmec-blue-700">Preparação para Pós-Graduação</h3>
                  <p className="text-gray-600">Experiência fundamental para mestrado e doutorado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Calendário/Prazos */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 text-ibmec-blue-800">
              Calendário 2025
            </h2>
            <Card className="bg-gradient-to-r from-ibmec-blue-50 to-ibmec-gold-50">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="font-bold text-lg text-ibmec-blue-700">Inscrições Abertas</h3>
                    <p className="text-gray-600">Submissão de propostas de projeto</p>
                  </div>
                  <span className="bg-ibmec-blue-600 text-white px-4 py-2 rounded-lg font-semibold">
                    15/03 - 30/04
                  </span>
                </div>
                
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h3 className="font-bold text-lg text-ibmec-blue-700">Avaliação das Propostas</h3>
                    <p className="text-gray-600">Análise pela comissão científica</p>
                  </div>
                  <span className="bg-ibmec-gold-500 text-white px-4 py-2 rounded-lg font-semibold">
                    01/05 - 31/05
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-ibmec-blue-700">Resultado Final</h3>
                    <p className="text-gray-600">Divulgação dos aprovados</p>
                  </div>
                  <span className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold">
                    15/06
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ...existing code... */}
    </div>
  );
};

export default Home;
