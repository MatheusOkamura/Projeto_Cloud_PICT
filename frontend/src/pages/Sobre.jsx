import Card from '../components/Card';
import { Link } from 'react-router-dom';

const Sobre = () => {
  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-ibmec-blue-700 to-ibmec-blue-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Sobre o Programa de Iniciação Científica
            </h1>
            <p className="text-xl text-gray-200">
              Conheça mais sobre esta iniciativa que transforma alunos em pesquisadores
            </p>
          </div>
        </div>
      </section>

      {/* O que é */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-ibmec-blue-800 mb-6">
                O que é Iniciação Científica?
              </h2>
              <p className="text-gray-700 text-lg mb-4">
                A Iniciação Científica é um programa que introduz estudantes de graduação 
                no universo da pesquisa acadêmica e científica. No Ibmec, incentivamos 
                nossos alunos a desenvolverem projetos inovadores sob orientação de 
                professores experientes.
              </p>
              <p className="text-gray-700 text-lg">
                O programa oferece uma oportunidade única de aprofundar conhecimentos, 
                desenvolver pensamento crítico e contribuir para a produção de conhecimento 
                em suas áreas de interesse.
              </p>
            </div>
            <div className="text-6xl text-center">
              🔬📚🎓
            </div>
          </div>
        </div>
      </section>

      {/* Objetivos */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-4xl font-bold text-ibmec-blue-800 mb-12 text-center">
            Nossos Objetivos
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <div className="flex items-start space-x-4">
                <div className="text-4xl">🎯</div>
                <div>
                  <h3 className="text-xl font-bold text-ibmec-blue-700 mb-2">
                    Desenvolvimento Acadêmico
                  </h3>
                  <p className="text-gray-600">
                    Proporcionar aos estudantes uma formação complementar de excelência, 
                    estimulando o pensamento científico e a capacidade analítica.
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-start space-x-4">
                <div className="text-4xl">🌟</div>
                <div>
                  <h3 className="text-xl font-bold text-ibmec-blue-700 mb-2">
                    Inovação e Pesquisa
                  </h3>
                  <p className="text-gray-600">
                    Fomentar a produção científica e tecnológica, contribuindo para o 
                    avanço do conhecimento em diversas áreas.
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-start space-x-4">
                <div className="text-4xl">🤝</div>
                <div>
                  <h3 className="text-xl font-bold text-ibmec-blue-700 mb-2">
                    Conexão Academia-Mercado
                  </h3>
                  <p className="text-gray-600">
                    Aproximar a academia das necessidades do mercado e da sociedade, 
                    gerando soluções práticas e inovadoras.
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-start space-x-4">
                <div className="text-4xl">🚀</div>
                <div>
                  <h3 className="text-xl font-bold text-ibmec-blue-700 mb-2">
                    Preparação para o Futuro
                  </h3>
                  <p className="text-gray-600">
                    Preparar os alunos para programas de pós-graduação e carreiras 
                    que exigem habilidades de pesquisa e análise.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-4xl font-bold text-ibmec-blue-800 mb-12 text-center">
            Como Funciona?
          </h2>
          
          <div className="space-y-8">
            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0 w-12 h-12 bg-ibmec-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                1
              </div>
              <div>
                <h3 className="text-2xl font-bold text-ibmec-blue-700 mb-2">Inscrição</h3>
                <p className="text-gray-700 text-lg">
                  O aluno ou orientador submete uma proposta de projeto através da plataforma 
                  online durante o período de inscrições.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0 w-12 h-12 bg-ibmec-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                2
              </div>
              <div>
                <h3 className="text-2xl font-bold text-ibmec-blue-700 mb-2">Avaliação</h3>
                <p className="text-gray-700 text-lg">
                  A comissão científica avalia as propostas considerando relevância, 
                  viabilidade e alinhamento com as linhas de pesquisa da instituição.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0 w-12 h-12 bg-ibmec-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                3
              </div>
              <div>
                <h3 className="text-2xl font-bold text-ibmec-blue-700 mb-2">Desenvolvimento</h3>
                <p className="text-gray-700 text-lg">
                  Projetos aprovados são desenvolvidos ao longo de 12 meses, com encontros 
                  regulares entre aluno e orientador.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="flex-shrink-0 w-12 h-12 bg-ibmec-gold-500 text-white rounded-full flex items-center justify-center text-xl font-bold">
                4
              </div>
              <div>
                <h3 className="text-2xl font-bold text-ibmec-blue-700 mb-2">Apresentação</h3>
                <p className="text-gray-700 text-lg">
                  Ao final, os resultados são apresentados em eventos acadêmicos e podem 
                  ser publicados em revistas científicas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Requisitos */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-4xl font-bold text-ibmec-blue-800 mb-12 text-center">
            Requisitos para Participar
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <h3 className="text-2xl font-bold text-ibmec-blue-700 mb-6">
                👨‍🎓 Para Alunos
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-ibmec-blue-600 mr-2">✓</span>
                  Estar regularmente matriculado no Ibmec
                </li>
                <li className="flex items-start">
                  <span className="text-ibmec-blue-600 mr-2">✓</span>
                  Ter cursado no mínimo 2 semestres
                </li>
                <li className="flex items-start">
                  <span className="text-ibmec-blue-600 mr-2">✓</span>
                  Disponibilidade de 10-12 horas semanais para o projeto
                </li>
                <li className="flex items-start">
                  <span className="text-ibmec-blue-600 mr-2">✓</span>
                  Apresentar proposta de projeto bem fundamentada
                </li>
              </ul>
            </Card>

            <Card>
              <h3 className="text-2xl font-bold text-ibmec-blue-700 mb-6">
                👨‍🏫 Para Orientadores
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-ibmec-gold-600 mr-2">✓</span>
                  Ser docente ativo do Ibmec
                </li>
                <li className="flex items-start">
                  <span className="text-ibmec-gold-600 mr-2">✓</span>
                  Ter titulação mínima de mestre
                </li>
                <li className="flex items-start">
                  <span className="text-ibmec-gold-600 mr-2">✓</span>
                  Experiência em pesquisa acadêmica
                </li>
                <li className="flex items-start">
                  <span className="text-ibmec-gold-600 mr-2">✓</span>
                  Disponibilidade para encontros semanais de orientação
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-ibmec-blue-700 to-ibmec-blue-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para fazer parte desta jornada?
          </h2>
          <p className="text-xl mb-8 text-gray-200 max-w-2xl mx-auto">
            Inscreva-se agora e comece sua trajetória na pesquisa científica
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/cadastro" className="btn-secondary text-lg">
              📝 Inscrever-se
            </Link>
            <Link to="/" className="btn-outline bg-white text-ibmec-blue-700 hover:bg-gray-100 text-lg">
              🏠 Voltar ao Início
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sobre;
