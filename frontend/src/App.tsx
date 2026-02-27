import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/authContext';
import { ThemeProvider } from './context/themeContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import TurnosPage from './pages/dashboard/TurnosPage';
import ClientesPage from './pages/dashboard/ClientesPage';
import AbogadosPage from './pages/dashboard/AbogadosPage';
import ReportesPage from './pages/dashboard/ReportesPage';
import ConfiguracionPage from './pages/dashboard/ConfiguracionPage';





const ProtectedRoute = ({ children, roles }: { children: React.ReactNode; roles?: string[] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '40px', height: '40px', border: '4px solid #d97706', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.rol)) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/turnos" element={
        <ProtectedRoute>
          <TurnosPage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/clientes" element={
        <ProtectedRoute>
          <ClientesPage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/abogados" element={
        <ProtectedRoute>
          <AbogadosPage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/reportes" element={
        <ProtectedRoute>
          <ReportesPage />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/configuracion" element={
        <ProtectedRoute>
          <ConfiguracionPage />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}