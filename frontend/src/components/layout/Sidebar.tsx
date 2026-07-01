import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  badge?: number;
  adminOnly?: boolean;
}

const NAV_PRINCIPAL: NavItem[] = [
  { label: 'Vista rápida', icon: 'fa-solid fa-gauge-high',    path: '/' },
];

const NAV_GESTION: NavItem[] = [
  { label: 'Clientes',     icon: 'fa-solid fa-building-user', path: '/clientes',   adminOnly: true },
  { label: 'Proyectos',    icon: 'fa-solid fa-diagram-project',path: '/proyectos' },
  { label: 'Tickets',      icon: 'fa-solid fa-ticket',         path: '/tickets' },
  { label: 'Tablero',      icon: 'fa-solid fa-columns',        path: '/tablero' },
  { label: 'Calendario',   icon: 'fa-solid fa-calendar-days',  path: '/calendario' },
  { label: 'Usuarios',     icon: 'fa-solid fa-users',          path: '/trabajadores', adminOnly: true },
  { label: 'Facturación',  icon: 'fa-solid fa-file-invoice',   path: '/facturacion',  adminOnly: true },
];

const NAV_CUENTA: NavItem[] = [
  { label: 'Configuración', icon: 'fa-solid fa-gear', path: '/configuracion', adminOnly: true },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onMobileClose?: () => void;
}

export default function Sidebar({ collapsed, onToggle, onMobileClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.rol === 'Administrador';
  const initials = user?.nombre
    ? user.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const renderItems = (items: NavItem[]) =>
    items
      .filter(item => !item.adminOnly || isAdmin)
      .map(item => (
        <div
          key={item.path}
          className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
          onClick={() => { navigate(item.path); onMobileClose?.(); }}
          title={collapsed ? item.label : undefined}
        >
          <span className="nav-icon"><i className={item.icon}></i></span>
          <span className="nav-label">{item.label}</span>
          {item.badge && item.badge > 0 && (
            <span className="nav-badge">{item.badge}</span>
          )}
        </div>
      ));

  return (
    <div className="sidebar">
      {/* Brand / Logo */}
      <div className="brand" onClick={onToggle}>
        <div className="brand-logo"></div>
        <span className="brand-name">OVIQ</span>
        <span className="brand-dot"></span>
      </div>

      {/* Navegación */}
      <nav className="nav">
        <div className="nav-section">Principal</div>
        {renderItems(NAV_PRINCIPAL)}

        <div className="nav-section">Gestión</div>
        {renderItems(NAV_GESTION)}

        <div className="nav-section">Cuenta</div>
        {renderItems(NAV_CUENTA)}
      </nav>

      {/* Footer con usuario */}
      <div className="sidebar-footer">
        <div className="sf-avatar">{initials}</div>
        <div className="sf-info">
          <div className="sf-name">{user?.nombre}</div>
          <div className="sf-role">{user?.rol}</div>
        </div>
        <button className="sf-btn" onClick={handleLogout} title="Cerrar sesión">
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
        </button>
      </div>
    </div>
  );
}
