import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthResponse } from '../types';

interface AuthContextType {
  user: AuthResponse | null;
  isAuthenticated: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Restaura la sesión de forma síncrona (no en un useEffect) para que "user" ya
// esté resuelto en el primer render — evita el parpadeo "no autenticado" que
// mandaba a /login (y de ahí a /) perdiendo la URL original en una recarga.
function restaurarUsuario(): AuthResponse | null {
  const stored = localStorage.getItem('oviq_user');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    localStorage.removeItem('oviq_user');
    localStorage.removeItem('oviq_token');
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(restaurarUsuario);

  const login = (data: AuthResponse) => {
    localStorage.setItem('oviq_token', data.token);
    localStorage.setItem('oviq_user', JSON.stringify(data));
    setUser(data);
  };

  const logout = () => {
    localStorage.removeItem('oviq_token');
    localStorage.removeItem('oviq_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
