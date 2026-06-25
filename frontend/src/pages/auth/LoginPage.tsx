import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login as loginApi } from '../../api/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginApi({ email, password });
      login(data);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      {/* Panel izquierdo — hero oscuro con logo */}
      <div className="login-hero">
        <img src="/logo-oviq.png" alt="OVIQ" className="login-logo" />
        <div className="login-wordmark">OVIQ</div>
        <div className="login-tagline">Plataforma de gestión de proyectos y facturación</div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="login-panel">
        <div className="login-card">
          {/* Logo visible solo en mobile cuando el hero se oculta */}
          <div className="login-card-brand">
            <img src="/logo-oviq.png" alt="OVIQ" />
          </div>

          <div className="login-title">Iniciar sesión</div>
          <div className="login-sub">Ingresá tus credenciales para continuar</div>

          {error && (
            <div style={{
              background: '#FDECEC', color: '#B91C1C', borderRadius: 8,
              padding: '10px 14px', fontSize: 13.5, marginBottom: 14,
              border: '1px solid #FECACA'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <span>Email</span>
              <div className="login-input">
                <i className="fa-regular fa-envelope"></i>
                <input
                  type="email"
                  placeholder="usuario@oviq.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-field">
              <span>Contraseña</span>
              <div className="login-input">
                <i className="fa-solid fa-lock"></i>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="login-eye" onClick={() => setShowPw(p => !p)}>
                  <i className={`fa-regular ${showPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading
                ? <><i className="fa-solid fa-spinner fa-spin"></i> Ingresando...</>
                : <><i className="fa-solid fa-arrow-right-to-bracket"></i> Ingresar</>
              }
            </button>
          </form>

          <div className="login-hint">
            ¿Olvidaste tu contraseña? Contactá al administrador.
          </div>
        </div>
      </div>
    </div>
  );
}
