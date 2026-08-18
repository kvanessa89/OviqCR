import { useAuth } from '../../context/AuthContext';

interface TopbarProps {
  onMenuToggle: () => void;
}

export default function Topbar({ onMenuToggle }: TopbarProps) {
  const { user } = useAuth();

  const initials = user?.nombre
    ? user.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header className="topbar">
      {/* Botón hamburguesa — visible solo en mobile */}
      <button className="tb-hamburger tb-icon" onClick={onMenuToggle}>
        <i className="fa-solid fa-bars"></i>
      </button>

      {/* Búsqueda */}
      <div className="tb-search">
        <i className="fa-solid fa-magnifying-glass"></i>
        <input placeholder="Buscar tickets, proyectos, clientes..." />
        <span className="tb-kbd">⌘K</span>
      </div>

      {/* Iconos derecha */}
      <div className="tb-right">
        <button className="tb-icon" title="Notificaciones">
          <i className="fa-solid fa-bell"></i>
        </button>
        <div className="tb-user">
          <div className="tb-avatar" style={{ background: '#3B6EF5' }}>{initials}</div>
          <span className="tu-info">
            <span className="tu-name">{user?.nombre?.split(' ')[0]}</span>
            <span className="tu-role">{user?.rol}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
