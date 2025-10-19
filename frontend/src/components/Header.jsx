import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return null;
    
    switch (user.tipo) {
      case 'aluno':
        return '/dashboard/aluno';
      case 'orientador':
        return '/dashboard/orientador';
      case 'coordenador':
        return '/dashboard/coordenador';
      default:
        return '/';
    }
  };

  return (
    <header className="bg-ibmec-blue-700 text-white shadow-lg sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo e Título */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-ibmec-blue-700 font-bold text-xl">I</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Iniciação Científica</h1>
              <p className="text-xs text-ibmec-gold-300">Ibmec</p>
            </div>
          </Link>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="hover:text-ibmec-gold-300 transition">Início</Link>
            <Link to="/sobre" className="hover:text-ibmec-gold-300 transition">Sobre o Programa</Link>
            
            {user ? (
              <>
                <Link to={getDashboardLink()} className="hover:text-ibmec-gold-300 transition">
                  Meu Painel
                </Link>
                <button 
                  onClick={handleLogout}
                  className="bg-ibmec-gold-500 hover:bg-ibmec-gold-600 px-4 py-2 rounded-lg transition"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:text-ibmec-gold-300 transition">Login</Link>
                <Link 
                  to="/cadastro" 
                  className="bg-ibmec-gold-500 hover:bg-ibmec-gold-600 px-4 py-2 rounded-lg transition"
                >
                  Inscrever-se
                </Link>
              </>
            )}
          </div>

          {/* Botão Menu Mobile */}
          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Menu Mobile */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-3 pb-4">
            <Link to="/" className="block hover:text-ibmec-gold-300 transition" onClick={() => setIsMenuOpen(false)}>
              Início
            </Link>
            <Link to="/sobre" className="block hover:text-ibmec-gold-300 transition" onClick={() => setIsMenuOpen(false)}>
              Sobre o Programa
            </Link>
            
            {user ? (
              <>
                <Link 
                  to={getDashboardLink()} 
                  className="block hover:text-ibmec-gold-300 transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Meu Painel
                </Link>
                <button 
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left bg-ibmec-gold-500 hover:bg-ibmec-gold-600 px-4 py-2 rounded-lg transition"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block hover:text-ibmec-gold-300 transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/cadastro" 
                  className="block bg-ibmec-gold-500 hover:bg-ibmec-gold-600 px-4 py-2 rounded-lg transition text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Inscrever-se
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
