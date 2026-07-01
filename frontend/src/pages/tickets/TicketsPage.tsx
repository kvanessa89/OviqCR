import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTickets, eliminarTicket } from '../../api/tickets';
import { getProyectos } from '../../api/proyectos';
import { getUsuarios } from '../../api/usuarios';
import type { TicketDto, ProyectoDto, UsuarioDto } from '../../types';
import NuevoTicketModal from '../proyectos/NuevoTicketModal';
import FilterBottomSheet, { type FilterState } from '../../components/ui/FilterBottomSheet';
import ConfirmDeleteModal from '../../components/ui/ConfirmDeleteModal';

function StatusPill({ codigo, nombre }: { codigo: string; nombre: string }) {
  const cls =
    codigo === 'completado' ? 'b-active'  :
    codigo === 'pendiente'  ? 'b-purple'  :
    codigo === 'por_hacer'  ? 'b-info'    : 'b-neutral';
  return <span className={`badge ${cls}`}><span className="dot"></span>{nombre}</span>;
}

function PrioridadTag({ codigo }: { codigo: string }) {
  const cls =
    codigo === 'alta'  ? 'pri-alta'  :
    codigo === 'media' ? 'pri-media' : 'pri-baja';
  return (
    <span className={`priority-tag ${cls}`}>
      <span className="pp"></span>
      {codigo.charAt(0).toUpperCase() + codigo.slice(1)}
    </span>
  );
}

function fmtFecha(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function TicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets]     = useState<TicketDto[]>([]);
  const [proyectos, setProyectos] = useState<ProyectoDto[]>([]);
  const [usuarios, setUsuarios]   = useState<UsuarioDto[]>([]);
  const [loading, setLoading]     = useState(true);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFE]   = useState('');
  const [filtroProyecto, setFP] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mobileFilters, setMobileFilters] = useState<FilterState>({
    prioridades: [],
    estados: [],
    asignados: [],
  });

  const [modalAbierto, setModal]           = useState(false);
  const [ticketSeleccionado, setTicketSel] = useState<TicketDto | null>(null);
  const [ticketEliminando, setTicketEliminando] = useState<TicketDto | null>(null);
  const [loadingEliminar, setLoadingEliminar]   = useState(false);
  const [errorEliminar, setErrorEliminar]       = useState('');

  const hoy = new Date().toISOString().slice(0, 10);

  const cargar = () =>
    Promise.all([getTickets(), getProyectos(), getUsuarios()])
      .then(([t, p, u]) => { setTickets(t); setProyectos(p); setUsuarios(u); })
      .finally(() => setLoading(false));

  useEffect(() => { cargar(); }, []);

  const filtrados = tickets.filter(t => {
    if (busqueda && !(t.titulo + t.codigo).toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (filtroProyecto && String(t.proyectoId) !== filtroProyecto) return false;
    if (filtroEstado === '__atrasado') {
      if (!(t.estadoCodigo !== 'completado' && t.fechaFin && t.fechaFin < hoy)) return false;
    } else if (filtroEstado && t.estadoCodigo !== filtroEstado) return false;

    if (mobileFilters.prioridades.length > 0) {
      const priNombre = t.prioridadNombre || t.prioridadCodigo;
      if (!mobileFilters.prioridades.some(p => priNombre.toLowerCase().includes(p.toLowerCase()))) return false;
    }
    if (mobileFilters.estados.length > 0) {
      const estNombre = t.estadoNombre || t.estadoCodigo;
      if (!mobileFilters.estados.some(e => estNombre.toLowerCase().includes(e.toLowerCase()))) return false;
    }
    if (mobileFilters.asignados.length > 0) {
      if (!mobileFilters.asignados.includes(t.usuarioNombre)) return false;
    }

    return true;
  });

  const handleEliminarTicket = (t: TicketDto, e: React.MouseEvent) => {
    e.stopPropagation();
    setErrorEliminar('');
    setTicketEliminando(t);
  };

  const confirmarEliminarTicket = async () => {
    if (!ticketEliminando) return;
    setLoadingEliminar(true);
    try {
      await eliminarTicket(ticketEliminando.id);
      setTicketEliminando(null);
      cargar();
    } catch (err: any) {
      setErrorEliminar(err.response?.data?.mensaje || 'Error al eliminar el ticket');
    } finally {
      setLoadingEliminar(false);
    }
  };

  const totalMobileFilters = mobileFilters.prioridades.length + mobileFilters.estados.length + mobileFilters.asignados.length;
  const nombresAsignados = [...new Set(tickets.map(t => t.usuarioNombre).filter(n => n && n !== 'Sin asignar'))];

  const total      = tickets.length;
  const porHacer   = tickets.filter(t => t.estadoCodigo === 'por_hacer').length;
  const pendientes = tickets.filter(t => t.estadoCodigo === 'pendiente').length;
  const atrasados  = tickets.filter(t => t.estadoCodigo !== 'completado' && !!t.fechaFin && t.fechaFin < hoy).length;

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
            <span>Tickets</span>
          </div>
          <div className="page-title">Tickets</div>
          <div className="page-subtitle">{filtrados.length} de {total} tickets</div>
        </div>
        <div className="ph-right">
          <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>
            <i className="fa-solid fa-plus"></i> Nuevo Ticket
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className={`stat${filtroEstado === '' ? ' active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFE('')}>
          <div className="stat-top"><div className="stat-label">Total</div><div className="stat-icon ic-primary"><i className="fa-solid fa-ticket"></i></div></div>
          <div className="stat-value">{total}</div>
        </div>
        <div className={`stat${filtroEstado === 'por_hacer' ? ' active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFE(f => f === 'por_hacer' ? '' : 'por_hacer')}>
          <div className="stat-top"><div className="stat-label">Por hacer</div><div className="stat-icon ic-info"><i className="fa-solid fa-circle"></i></div></div>
          <div className="stat-value">{porHacer}</div>
        </div>
        <div className={`stat${filtroEstado === 'pendiente' ? ' active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFE(f => f === 'pendiente' ? '' : 'pendiente')}>
          <div className="stat-top"><div className="stat-label">Pendiente</div><div className="stat-icon ic-warning"><i className="fa-solid fa-spinner"></i></div></div>
          <div className="stat-value">{pendientes}</div>
        </div>
        <div className={`stat${filtroEstado === '__atrasado' ? ' active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFE(f => f === '__atrasado' ? '' : '__atrasado')}>
          <div className="stat-top"><div className="stat-label">Atrasados</div><div className="stat-icon ic-danger"><i className="fa-solid fa-triangle-exclamation"></i></div></div>
          <div className="stat-value">{atrasados}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <span className="toolbar-title">Todos los tickets · {filtrados.length}</span>
        <div className="search-inline">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input placeholder="Buscar ticket..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>

        {/* Filtros desktop */}
        <div className="desktop-filters" style={{ display: 'contents' }}>
          <select className="select" value={filtroProyecto} onChange={e => setFP(e.target.value)}>
            <option value="">Todos los proyectos</option>
            {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <select className="select" value={filtroEstado} onChange={e => setFE(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="por_hacer">Por hacer</option>
            <option value="pendiente">Pendiente</option>
            <option value="completado">Completado</option>
            <option value="__atrasado">Atrasados</option>
          </select>
        </div>

        {/* Botón filtros mobile */}
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
          <i className="fa-solid fa-ticket"></i>
          <h4>Sin tickets</h4>
          <div>Ajustá los filtros o creá un nuevo ticket.</div>
        </div>
      ) : (
        <div className="tlist">
          <div className="tlist-head">
            <div>Código</div>
            <div>Título</div>
            <div>Proyecto</div>
            <div>Asignado</div>
            <div>Prioridad</div>
            <div>Inicio – Fin</div>
            <div>Estado</div>
          </div>
          {filtrados.map(t => {
            const atrasado = t.estadoCodigo !== 'completado' && !!t.fechaFin && t.fechaFin < hoy;
            const iniciales = t.usuarioId
              ? t.usuarioNombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
              : '';
            return (
              <div key={t.id} className="tlist-row" style={{ cursor: 'pointer' }} onClick={() => setTicketSel(t)}>
                <div className="tlist-code">{t.codigo}</div>
                <div className="tlist-title">{t.titulo}</div>
                <div className="tlist-project">
                  <span className="pd" style={{ background: '#3B6EF5' }}></span>
                  {t.proyectoNombre}
                </div>
                <div className="tlist-assignee">
                  {t.usuarioId
                    ? <><div className="av av-xs" style={{ background: '#3B6EF5' }}>{iniciales}</div>{t.usuarioNombre.split(' ')[0]}</>
                    : <span style={{ color: 'var(--text-3)' }}>—</span>
                  }
                </div>
                <div><PrioridadTag codigo={t.prioridadCodigo} /></div>
                <div className="tlist-due" style={{ color: atrasado ? 'var(--danger)' : 'var(--text-2)', fontWeight: atrasado ? 700 : 500 }}>
                  <i className="fa-regular fa-calendar" style={{ marginRight: 4, fontSize: 11 }}></i>
                  {t.fechaInicio ? `${fmtFecha(t.fechaInicio)} – ` : ''}{fmtFecha(t.fechaFin)}
                  {atrasado && <i className="fa-solid fa-triangle-exclamation" style={{ marginLeft: 4, fontSize: 11 }}></i>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StatusPill codigo={t.estadoCodigo} nombre={t.estadoNombre} />
                  <button className="cc-menu cc-menu-danger" title="Eliminar" onClick={e => handleEliminarTicket(t, e)}>
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalAbierto && (
        <NuevoTicketModal
          proyectos={proyectos}
          onClose={() => setModal(false)}
          onCreado={() => { setModal(false); cargar(); }}
        />
      )}

      {ticketSeleccionado && (
        <NuevoTicketModal
          proyectoId={ticketSeleccionado.proyectoId}
          ticket={ticketSeleccionado}
          onClose={() => setTicketSel(null)}
          onCreado={() => { setTicketSel(null); cargar(); }}
        />
      )}

      <FilterBottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onApply={(f) => { setMobileFilters(f); setSheetOpen(false); }}
        initialFilters={mobileFilters}
        asignados={nombresAsignados}
      />

      {ticketEliminando && (
        <ConfirmDeleteModal
          titulo="Eliminar ticket"
          mensaje={<>¿Estás seguro que querés eliminar el ticket <strong>{ticketEliminando.codigo}</strong> — "{ticketEliminando.titulo}"?</>}
          detalle="Esta acción no se puede deshacer."
          loading={loadingEliminar}
          error={errorEliminar}
          onConfirmar={confirmarEliminarTicket}
          onCancelar={() => { setTicketEliminando(null); setErrorEliminar(''); }}
        />
      )}
    </div>
  );
}
