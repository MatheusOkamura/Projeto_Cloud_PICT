import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-ibmec-blue-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sobre */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-ibmec-gold-300">Sobre o Programa</h3>
            <p className="text-sm text-gray-300">
              O programa de Iniciação Científica do Ibmec promove a pesquisa acadêmica 
              e o desenvolvimento científico dos alunos.
            </p>
          </div>

          {/* Links Rápidos */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-ibmec-gold-300">Links Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-ibmec-gold-300 transition">Início</Link>
              </li>
              <li>
                <Link to="/sobre" className="hover:text-ibmec-gold-300 transition">Sobre o Programa</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-ibmec-gold-300 transition">Login</Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-ibmec-gold-300">Contato</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>📧 iniciacao.cientifica@ibmec.edu.br</li>
              <li>📞 (21) 2189-9000</li>
              <li>📍 Av. Presidente Wilson, 118 - Rio de Janeiro</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-ibmec-blue-600 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Ibmec - Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
