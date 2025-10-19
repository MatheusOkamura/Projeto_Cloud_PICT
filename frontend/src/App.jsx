import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import DashboardAluno from './pages/DashboardAluno';
import DashboardOrientador from './pages/DashboardOrientador';
import DashboardCoordenador from './pages/DashboardCoordenador';
import Sobre from './pages/Sobre';
import SubmeterProposta from './pages/SubmeterProposta';
import EnviarRelatorioParcial from './pages/EnviarRelatorioParcial';
import EnviarApresentacaoAmostra from './pages/EnviarApresentacaoAmostra';
import EnviarArtigoFinal from './pages/EnviarArtigoFinal';
import ProtectedRoute from './components/ProtectedRoute';
import CoordenadorStatus from './pages/CoordenadorStatus';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="cadastro" element={<Cadastro />} />
            <Route path="sobre" element={<Sobre />} />
            
            {/* Rotas Protegidas */}
            <Route 
              path="submeter-proposta" 
              element={
                <ProtectedRoute allowedRoles={['aluno']}>
                  <SubmeterProposta />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="enviar-relatorio-parcial" 
              element={
                <ProtectedRoute allowedRoles={['aluno']}>
                  <EnviarRelatorioParcial />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="enviar-apresentacao-amostra" 
              element={
                <ProtectedRoute allowedRoles={['aluno']}>
                  <EnviarApresentacaoAmostra />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="enviar-artigo-final" 
              element={
                <ProtectedRoute allowedRoles={['aluno']}>
                  <EnviarArtigoFinal />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="dashboard/aluno" 
              element={
                <ProtectedRoute allowedRoles={['aluno']}>
                  <DashboardAluno />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="dashboard/orientador" 
              element={
                <ProtectedRoute allowedRoles={['orientador']}>
                  <DashboardOrientador />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="coordenador/status" 
              element={
                <ProtectedRoute allowedRoles={['coordenador']}>
                  <CoordenadorStatus />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="dashboard/coordenador" 
              element={
                <ProtectedRoute allowedRoles={['coordenador']}>
                  <DashboardCoordenador />
                </ProtectedRoute>
              } 
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
