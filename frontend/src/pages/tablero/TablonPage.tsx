import { useState, useEffect } from 'react';
import { getTickets, cambiarEstadoTicket } from '../../api/tickets';
import { getProyectos } from '../../api/proyectos';
import { getUsuarios } from '../../api/usuarios';
import { getCatalogo } from '../../api/catalogos';
import { useAuth } from '../../context/AuthContext';
import type { TicketDto, ProyectoDto, UsuarioDto, CatalogoDto } from '../../types';

const ESTADO_COLORS: Record<string, string> = {
  por_hacer:    '#94A3B8',
  en_progreso:  '#3B6EF5',
  pendiente:    '#F59E0B',
  en_revision:  '#8B5CF6',
  completado:   '#10B981',
  cancelado:    '#EF4444',
};

const PRIORIDAD_COLORS: Record<string, string> = {
  critica: '#7C3AED',
  alta:    '#EF4444',
  media:   '#F59E0B',
  baja:    '#10B981',
};

const AVATAR_COLORS = [
  '#3B6EF5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#EC4899', '#F97316', '#6366F1', '#14B8A6',
];

function avatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }
function iniciales(nombre: string) {
  const p = nombre.trim().split(/\s+/);
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}
function estadoColor(codigo: string) { return ESTADO_COLORS[codigo] ?? '#64748B'; }
function prioridadColor(codigo: string) { return PRIORIDAD_COLORS[codigo] ?? '#94A3B8'; }
function formatFecha(fecha?: string | null) {
  if (!fecha) return null;
  return new Date(fecha).toLocaleDateString('es-CR', { day: '2-digit', month: 'short' });
}
function isOverdue(fecha?: string | null) {
  if (!fecha) return false;
  const d = new Date(fecha);
  const hoy = new Date();
  return d < hoy && d.toDateString() !== hoy.toDateString();
}

export default function TablonPage() {
  const { user } = useAuth();
  const [tickets, setTickets]   = useState<TicketDto[]>([]);
  const [estados, setEstados]   = useState<CatalogoDto[]>([]);
  const [proyectos, setProyectos] = useState<ProyectoDto[]>([]);
  const [usuarios, setUsuarios]   = useState<UsuarioDto[]>([]);
  const [loading, setLoading]   = useState(true);

  const [filtroProyecto, setFiltroProyecto] = useState<number | ''>('');
  const [filtroUsuario,  setFiltroUsuario]  = useState<number | ''>('');
  const [soloMios, setSoloMios]             = useState(false);

  const [draggingId,    setDraggingId]    = useState<number | null>(null);
  const [dragOverCod,   setDragOverCod]   = useState<string | null>(null);
  const [savingId,      setSavingId]      = useState<number | null>(null);

  const codToId = Object.fromEntries(estados.map(e => [e.codigo, e.id]));

  useEffect(() => {
    Promise.all([getTickets(), getCatalogo('estados-ticket'), getProyectos(), getUsuarios()])
      .then(([t, e, p, u]) => {
        setTickets(t);
        setEstados([...e].sort((a, b) => a.orden - b.orden));
        setProyectos(p);
        setUsuarios(u);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtrados = tickets.filter(t => {
    if (filtroProyecto && t.proyectoId !== filtroProyecto) return false;
    if (soloMios && t.usuarioId !== user?.usuarioId) return false;
    if (!soloMios && filtroUsuario) {
      const filt = Number(filtroUsuario);
      if (filt === -1 && t.usuarioId != null) return false;
      if (filt > 0 && t.usuarioId !== filt) return false;
    }
    return true;
  });

  async function handleDrop(estadoCodigo: string) {
    if (draggingId === null) { setDragOverCod(null); return; }
    const ticket = tickets.find(t => t.id === draggingId);
    if (!ticket || ticket.estadoCodigo === estadoCodigo) {
      setDraggingId(null); setDragOverCod(null); return;
    }
    const newEstadoId = codToId[estadoCodigo];
    if (!newEstadoId) return;

    const tid = draggingId;
    setSavingId(tid);
    setDraggingId(null);
    setDragOverCod(null);

    try {
      await cambiarEstadoTicket(tid, newEstadoId);
      setTickets(prev => prev.map(t =>
        t.id === tid
          ? { ...t, estadoCodigo, estadoNombre: estados.find(e => e.codigo === estadoCodigo)?.nombre ?? estadoCodigo }
          : t
      ));
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="page-head">
          <div className="ph-left">
            <div className="page-title">Tablero</div>
          </div>
        </div>
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24 }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div className="ph-left">
          <div className="page-title">Tablero</div>
          <div className="page-subtitle">Vista Kanban — arrastrá las tarjetas para cambiar el estado</div>
        </div>
      </div>

      <div className="toolbar" style={{ marginBottom: 20 }}>
        <select
          className="filter-select"
          value={filtroProyecto}
          onChange={e => setFiltroProyecto(e.target.value ? Number(e.target.value) : '')}
        >
          <option value="">Todos los proyectos</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>

        {!soloMios && (
          <select
            className="filter-select"
            value={filtroUsuario}
            onChange={e => setFiltroUsuario(e.target.value !== '' ? Number(e.target.value) : '')}
          >
            <option value="">Todos los asignados</option>
            <option value="-1">Sin asignar</option>
            {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </select>
        )}

        <button
          className={`btn${soloMios ? ' btn-primary' : ' btn-outline'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          onClick={() => { setSoloMios(v => !v); setFiltroUsuario(''); }}
        >
          <i className="fa-solid fa-user" style={{ fontSize: 11 }} />
          Mis tickets
        </button>
      </div>

      <div className="kanban">
        {estados.map(estado => {
          const colTickets = filtrados.filter(t => t.estadoCodigo === estado.codigo);
          const color = estadoColor(estado.codigo);
          const isDragOver = dragOverCod === estado.codigo;

          return (
            <div
              key={estado.id}
              className="kcol"
              onDragOver={e => { e.preventDefault(); setDragOverCod(estado.codigo); }}
              onDragLeave={e => {
                if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node))
                  setDragOverCod(null);
              }}
              onDrop={() => handleDrop(estado.codigo)}
            >
              <div className="kcol-head">
                <span className="kdot" style={{ background: color }} />
                <span className="kcol-title">{estado.nombre}</span>
                <span className="kcol-count">{colTickets.length}</span>
              </div>

              <div className={`kcol-body${isDragOver ? ' drag-over' : ''}`}>
                {colTickets.length === 0 && !isDragOver && (
                  <div className="kcol-empty">Sin tickets</div>
                )}
                {colTickets.map(ticket => (
                  <KCard
                    key={ticket.id}
                    ticket={ticket}
                    isDragging={draggingId === ticket.id}
                    isSaving={savingId === ticket.id}
                    onDragStart={() => setDraggingId(ticket.id)}
                    onDragEnd={() => { setDraggingId(null); setDragOverCod(null); }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface KCardProps {
  ticket: TicketDto;
  isDragging: boolean;
  isSaving: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}

function KCard({ ticket, isDragging, isSaving, onDragStart, onDragEnd }: KCardProps) {
  const pc = prioridadColor(ticket.prioridadCodigo);
  const fechaVence = formatFecha(ticket.fechaFin);
  const vencido = isOverdue(ticket.fechaFin);
  const asignado = ticket.usuarioId != null && ticket.usuarioNombre !== 'Sin asignar';

  return (
    <div
      className={`kcard${isDragging || isSaving ? ' dragging' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="kcard-top">
        <span className="kcard-code">{ticket.codigo}</span>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 7px',
          borderRadius: 999,
          background: pc + '22',
          color: pc,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
        }}>
          {ticket.prioridadNombre}
        </span>
      </div>

      <div className="kcard-title">{ticket.titulo}</div>

      <div className="kcard-project">
        <i className="fa-regular fa-folder" style={{ fontSize: 10 }} />
        {ticket.proyectoNombre}
      </div>

      <div className="kcard-foot">
        {fechaVence ? (
          <span className={`kcard-due${vencido ? ' overdue' : ''}`}>
            <i className={`fa-${vencido ? 'solid' : 'regular'} fa-calendar-days`} style={{ fontSize: 10 }} />
            {fechaVence}
          </span>
        ) : <span />}

        {asignado ? (
          <span
            className="kcard-av"
            style={{ background: avatarColor(ticket.usuarioId!) }}
            title={ticket.usuarioNombre}
          >
            {iniciales(ticket.usuarioNombre)}
          </span>
        ) : (
          <span
            className="kcard-av"
            style={{ background: 'var(--bg)', border: '1px dashed var(--border)' }}
            title="Sin asignar"
          >
            <i className="fa-solid fa-user-slash" style={{ fontSize: 7, color: 'var(--text-3)' }} />
          </span>
        )}
      </div>
    </div>
  );
}
