import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';

// Ruta protegida — redirige al login si no hay sesión
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      {/* Resto de rutas van acá — se agregan cuando se creen las páginas */}
      <Route
        path="*"
        element={
          <PrivateRoute>
            <div style={{ padding: 40, fontFamily: 'Manrope, sans-serif' }}>
              <h2>Bienvenida, en construcción 🚧</h2>
              <p style={{ marginTop: 8, color: '#64748b' }}>El dashboard se conecta acá.</p>
            </div>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
