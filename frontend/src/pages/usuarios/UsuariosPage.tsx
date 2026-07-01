import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsuarios, eliminarUsuario } from '../../api/usuarios';
import { useAuth } from '../../context/AuthContext';
import type { UsuarioDto } from '../../types';
import NuevoUsuarioModal from './NuevoUsuarioModal';
import EditarUsuarioModal from './EditarUsuarioModal';
import UsuariosFilterSheet, { type UsuariosFilterState } from './UsuariosFilterSheet';
import ConfirmDeleteModal from '../../components/ui/ConfirmDeleteModal';

function Avatar({ nombre, rol, activo }: { nombre: string; rol: string; activo: boolean }) {
  const iniciales = nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const bg = !activo ? '#9CA3AF' : rol === 'Administrador' ? '#3B6EF5' : '#10B981';
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', background: bg, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: 12, fontWeight: 700,
    }}>
      {iniciales}
    </div>
  );
}

function RolPill({ rol }: { rol: string }) {
  const isAdmin = rol === 'Administrador';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
      background: isAdmin ? 'rgba(59,110,245,0.12)' : 'rgba(16,185,129,0.12)',
      color: isAdmin ? '#1D48B0' : '#047857', whiteSpace: 'nowrap',
    }}>
      <i className={`fa-solid ${isAdmin ? 'fa-shield-halved' : 'fa-hard-hat'}`} style={{ fontSize: 10 }}></i>
      {rol}
    </span>
  );
}

function EstadoPill({ activo }: { activo: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
      background: activo ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)',
      color: activo ? '#047857' : '#B91C1C', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}></span>
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  );
}

export default function UsuariosPage() {
  const navigate  = useNavigate();
  const { user }  = useAuth();

  const [usuarios, setUsuarios]     = useState<UsuarioDto[]>([]);
  const [loading, setLoading]       = useState(true);
  const [busqueda, setBusqueda]     = useState('');
  const [filtroRol, setFiltroRol]   = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [modalNuevo, setModalNuevo] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<UsuarioDto | null>(null);
  const [usuarioEliminando, setUsuarioEliminando] = useState<UsuarioDto | null>(null);
  const [loadingEliminar, setLoadingEliminar]     = useState(false);
  const [errorEliminar, setErrorEliminar]         = useState('');
  const [sheetOpen, setSheetOpen]   = useState(false);
  const [mobileFilters, setMobileFilters] = useState<UsuariosFilterState>({ roles: [], estados: [] });

  const cargar = () =>
    getUsuarios()
      .then(setUsuarios)
      .finally(() => setLoading(false));

  useEffect(() => { cargar(); }, []);

  const filtrados = usuarios.filter(u => {
    if (busqueda && !(u.nombre + u.email).toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (filtroRol && u.rol !== filtroRol) return false;
    if (filtroEstado === 'activo' && !u.activo) return false;
    if (filtroEstado === 'inactivo' && u.activo) return false;
    if (mobileFilters.roles.length > 0 && !mobileFilters.roles.includes(u.rol)) return false;
    if (mobileFilters.estados.length > 0 && !mobileFilters.estados.includes(u.activo ? 'Activo' : 'Inactivo')) return false;
    return true;
  });

  const totalAdmins       = usuarios.filter(u => u.rol === 'Administrador').length;
  const totalTrabajadores = usuarios.filter(u => u.rol === 'Trabajador').length;
  const totalMobileFilters = mobileFilters.roles.length + mobileFilters.estados.length;

  const confirmarEliminar = async () => {
    if (!usuarioEliminando) return;
    setLoadingEliminar(true);
    try {
      await eliminarUsuario(usuarioEliminando.id);
      setUsuarioEliminando(null);
      cargar();
    } catch (err: any) {
      setErrorEliminar(err.response?.data?.mensaje || 'Error al eliminar el usuario');
    } finally {
      setLoadingEliminar(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-3)' }}>
      <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 10 }}></i> Cargando...
    </div>
  );

  return (
    <div>
      <div className="page-head">
        <div className="ph-left">
          <div className="crumb">
            <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Inicio</span>
            <span className="sep">›</span>
            <span>Usuarios</span>
          </div>
          <div className="page-title">Usuarios</div>
          <div className="page-subtitle">Administrá los usuarios del sistema y sus roles.</div>
        </div>
        <div className="ph-right">
          <button className="btn btn-primary btn-sm" onClick={() => setModalNuevo(true)}>
            <i className="fa-solid fa-user-plus"></i> Nuevo usuario
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className={`stat${!filtroRol && !filtroEstado ? ' active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => { setFiltroRol(''); setFiltroEstado(''); }}>
          <div className="stat-top"><div className="stat-label">Total</div><div className="stat-icon ic-primary"><i className="fa-solid fa-users"></i></div></div>
          <div className="stat-value">{usuarios.length}</div>
          <div className="stat-delta flat">usuarios registrados</div>
        </div>
        <div className={`stat${filtroRol === 'Administrador' ? ' active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFiltroRol(r => r === 'Administrador' ? '' : 'Administrador')}>
          <div className="stat-top"><div className="stat-label">Administradores</div><div className="stat-icon ic-info"><i className="fa-solid fa-shield-halved"></i></div></div>
          <div className="stat-value">{totalAdmins}</div>
          <div className="stat-delta flat">acceso total</div>
        </div>
        <div className={`stat${filtroRol === 'Trabajador' ? ' active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFiltroRol(r => r === 'Trabajador' ? '' : 'Trabajador')}>
          <div className="stat-top"><div className="stat-label">Trabajadores</div><div className="stat-icon ic-success"><i className="fa-solid fa-hard-hat"></i></div></div>
          <div className="stat-value">{totalTrabajadores}</div>
          <div className="stat-delta flat">acceso limitado</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <span className="toolbar-title">Usuarios · {filtrados.length}</span>
        <div className="search-inline">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input placeholder="Buscar por nombre o email..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <div className="desktop-filters" style={{ display: 'contents' }}>
          <select className="select" value={filtroRol} onChange={e => setFiltroRol(e.target.value)}>
            <option value="">Todos los roles</option>
            <option value="Administrador">Administrador</option>
            <option value="Trabajador">Trabajador</option>
          </select>
          <select className="select" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
        <button className="mobile-filter-btn" onClick={() => setSheetOpen(true)}>
          <i className="fa-solid fa-sliders"></i> Filtrar
          {totalMobileFilters > 0 && (
            <span style={{ background: '#185FA5', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 11, marginLeft: 4 }}>
              {totalMobileFilters}
            </span>
          )}
        </button>
      </div>

      {/* Tabla */}
      {filtrados.length === 0 ? (
        <div className="empty">
          <i className="fa-solid fa-users"></i>
          <h4>Sin usuarios</h4>
          <div>Ajustá los filtros o creá un nuevo usuario.</div>
        </div>
      ) : (
        <div className="tlist usr-list">
          <div className="usr-head">
            <div>Usuario</div>
            <div>Email</div>
            <div>Rol</div>
            <div>Cargo</div>
            <div>Modalidad</div>
            <div>Estado</div>
            <div></div>
          </div>
          {filtrados.map(u => {
            const esMiUsuario = u.id === user?.usuarioId;
            return (
              <div key={u.id} className="usr-row" onClick={() => setUsuarioEditar(u)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <Avatar nombre={u.nombre} rol={u.rol} activo={u.activo} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.nombre}
                      {esMiUsuario && (
                        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--primary)', background: 'rgba(59,110,245,0.08)', padding: '1px 7px', borderRadius: 99, flexShrink: 0 }}>
                          Yo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                <div><RolPill rol={u.rol} /></div>
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                  {u.perfilTrabajador?.cargo === 'Tecnico' ? 'Técnico' : u.perfilTrabajador?.cargo ?? '—'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                  {u.perfilTrabajador?.formaPagoNombre ?? '—'}
                </div>
                <div><EstadoPill activo={u.activo} /></div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="cc-menu cc-menu-danger"
                    title={esMiUsuario ? 'No podés eliminar tu propio usuario' : 'Eliminar'}
                    disabled={esMiUsuario}
                    style={{ opacity: esMiUsuario ? 0.3 : undefined, cursor: esMiUsuario ? 'not-allowed' : 'pointer' }}
                    onClick={e => { e.stopPropagation(); if (!esMiUsuario) { setErrorEliminar(''); setUsuarioEliminando(u); } }}
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalNuevo && (
        <NuevoUsuarioModal
          onClose={() => setModalNuevo(false)}
          onCreado={() => { setModalNuevo(false); cargar(); }}
        />
      )}

      {usuarioEditar && (
        <EditarUsuarioModal
          usuario={usuarioEditar}
          esUsuarioActual={usuarioEditar.id === user?.usuarioId}
          onClose={() => setUsuarioEditar(null)}
          onActualizado={() => { setUsuarioEditar(null); cargar(); }}
        />
      )}

      {usuarioEliminando && (
        <ConfirmDeleteModal
          titulo="Eliminar usuario"
          mensaje={<>¿Estás seguro que querés eliminar al usuario <strong>{usuarioEliminando.nombre}</strong>?</>}
          detalle="Esta acción no se puede deshacer."
          loading={loadingEliminar}
          error={errorEliminar}
          onConfirmar={confirmarEliminar}
          onCancelar={() => { setUsuarioEliminando(null); setErrorEliminar(''); }}
        />
      )}

      <UsuariosFilterSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onApply={f => { setMobileFilters(f); setSheetOpen(false); }}
        initialFilters={mobileFilters}
      />
    </div>
  );
}
