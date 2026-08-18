import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import ClientesPage from './pages/clientes/ClientesPage';
import ProyectosPage from './pages/proyectos/ProyectosPage';
import ProyectoDetallePage from './pages/proyectos/ProyectoDetallePage';
import TicketsPage from './pages/tickets/TicketsPage';
import FacturacionPage from './pages/facturacion/FacturacionPage';
import UsuariosPage from './pages/usuarios/UsuariosPage';
import ConfiguracionPage from './pages/configuracion/ConfiguracionPage';
import TablonPage from './pages/tablero/TablonPage';
import CalendarioPage from './pages/calendario/CalendarioPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

// La Vista rápida es solo para Administradores — un Trabajador que llegue a "/"
// (por login, o escribiendo la URL a mano) va directo a Proyectos.
function HomeRoute() {
  const { user } = useAuth();
  return user?.rol === 'Administrador' ? <DashboardPage /> : <Navigate to="/proyectos" replace />;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Ruta pública */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* Rutas protegidas — todas dentro de AppLayout */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<HomeRoute />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="proyectos"    element={<ProyectosPage />} />
        <Route path="proyectos/:id" element={<ProyectoDetallePage />} />
        <Route path="tickets"      element={<TicketsPage />} />
        <Route path="tablero"      element={<TablonPage />} />
        <Route path="calendario"   element={<CalendarioPage />} />
        <Route path="trabajadores" element={<UsuariosPage />} />
        <Route path="facturacion"  element={<FacturacionPage />} />
        <Route path="configuracion" element={<ConfiguracionPage />} />
      </Route>

      {/* Cualquier otra ruta → inicio */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
