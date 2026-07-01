import { useState, useEffect, useRef } from 'react';
import { crearTicket, actualizarTicket } from '../../api/tickets';
import { getComentariosTicket, crearComentarioTicket } from '../../api/comentarios';
import { getUsuarios } from '../../api/usuarios';
import { useCatalogo } from '../../hooks/useCatalogo';
import type { TicketDto, UsuarioDto, ComentarioDto, ProyectoDto } from '../../types';

interface Props {
  proyectoId?: number;
  proyectos?: ProyectoDto[];
  ticket?: TicketDto;
  onClose: () => void;
  onCreado: () => void;
}

function fmtFecha(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: '2-digit' })} · ${d.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

export default function NuevoTicketModal({ proyectoId, proyectos, ticket, onClose, onCreado }: Props) {
  const { items: estados }     = useCatalogo('estados-ticket');
  const { items: prioridades } = useCatalogo('prioridades-ticket');
  const [usuarios, setUsuarios]       = useState<UsuarioDto[]>([]);
  const [comentarios, setComentarios] = useState<ComentarioDto[]>([]);

  const [titulo, setTitulo]             = useState(ticket?.titulo ?? '');
  const [descripcion, setDesc]          = useState(ticket?.descripcion ?? '');
  const [selectedProyectoId, setProy]   = useState('');
  const [usuarioId, setUsuarioId]       = useState(ticket?.usuarioId ? String(ticket.usuarioId) : '');
  const [prioridadId, setPrioridad]     = useState('');
  const [estadoId, setEstado]           = useState('');
  const [fechaInicio, setFI]            = useState(ticket?.fechaInicio?.slice(0, 10) ?? '');
  const [fechaFin, setFF]               = useState(ticket?.fechaFin?.slice(0, 10) ?? '');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);

  const [comentarioTexto, setComentarioTexto] = useState('');
  const [enviando, setEnviando]               = useState(false);

  useEffect(() => {
    if (error) bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [error]);

  useEffect(() => { getUsuarios().then(setUsuarios); }, []);

  useEffect(() => {
    if (ticket) {
      getComentariosTicket(ticket.id).then(setComentarios).catch(() => setComentarios([]));
    }
  }, [ticket?.id]);

  useEffect(() => {
    if (prioridades.length > 0 && !prioridadId && ticket) {
      const p = prioridades.find(p => p.codigo === ticket.prioridadCodigo);
      if (p) setPrioridad(String(p.id));
    }
  }, [prioridades]);

  useEffect(() => {
    if (estados.length > 0 && !estadoId && ticket) {
      const e = estados.find(e => e.codigo === ticket.estadoCodigo);
      if (e) setEstado(String(e.id));
    }
  }, [estados]);

  const handleGuardar = async () => {
    if (!titulo.trim()) { setError('El título es requerido'); return; }
    if (!ticket && !proyectoId && !selectedProyectoId) { setError('Seleccione un proyecto'); return; }
    if (!usuarioId)     { setError('Seleccione a quién asignar el ticket'); return; }
    if (!prioridadId)   { setError('Seleccione una prioridad'); return; }
    if (!estadoId)      { setError('Seleccione un estado'); return; }
    if (fechaInicio && fechaFin && fechaFin < fechaInicio) { setError('La fecha fin debe ser mayor o igual a la fecha de inicio'); return; }

    setError('');
    setLoading(true);
    try {
      if (ticket) {
        await actualizarTicket(ticket.id, {
          titulo: titulo.trim(),
          descripcion: descripcion || undefined,
          usuarioId: Number(usuarioId),
          prioridadId: Number(prioridadId),
          estadoId: Number(estadoId),
          fechaInicio: fechaInicio ? fechaInicio + 'T00:00:00.000Z' : undefined,
          fechaFin: fechaFin ? fechaFin + 'T00:00:00.000Z' : undefined,
        });
      } else {
        await crearTicket({
          titulo: titulo.trim(),
          descripcion: descripcion || undefined,
          proyectoId: proyectoId ?? Number(selectedProyectoId),
          usuarioId: Number(usuarioId),
          prioridadId: Number(prioridadId),
          estadoId: Number(estadoId),
          fechaInicio: fechaInicio ? fechaInicio + 'T00:00:00.000Z' : undefined,
          fechaFin: fechaFin ? fechaFin + 'T00:00:00.000Z' : undefined,
        });
      }
      onCreado();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al guardar el ticket');
    } finally {
      setLoading(false);
    }
  };

  const enviarComentario = async () => {
    const txt = comentarioTexto.trim();
    if (!txt || !ticket) return;
    setEnviando(true);
    try {
      const nuevo = await crearComentarioTicket(ticket.id, txt);
      setComentarios(prev => [...prev, nuevo]);
      setComentarioTexto('');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-bg" onMouseDown={e => { (e.currentTarget as HTMLElement).dataset.mdown = e.target === e.currentTarget ? '1' : '0'; }} onClick={e => { if (e.target === e.currentTarget && (e.currentTarget as HTMLElement).dataset.mdown === '1') onClose(); }}>
      <div className="modal">
        <div className="modal-head">
          <i className="fa-solid fa-ticket" style={{ color: 'var(--primary)' }}></i>
          <div className="modal-title">
            {ticket
              ? <><span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)', fontWeight: 400, marginRight: 8 }}>{ticket.codigo}</span>Editar ticket</>
              : 'Nuevo ticket'
            }
          </div>
          <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </div>

        <div className="modal-body" ref={bodyRef}>
          {error && (
            <div style={{ background: 'var(--danger-50)', color: 'var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14, border: '1px solid #FECACA' }}>
              {error}
            </div>
          )}

          {!ticket && !proyectoId && proyectos && (
            <div className="field">
              <label>Proyecto <span className="req">*</span></label>
              <select className="select" value={selectedProyectoId} onChange={e => setProy(e.target.value)}>
                <option value="">Seleccione un proyecto...</option>
                {proyectos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} — {p.clienteNombre}{p.subcuentaNombre ? ` · ${p.subcuentaNombre}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label>Título <span className="req">*</span></label>
            <input className="input" value={titulo} onChange={e => setTitulo(e.target.value)} autoFocus placeholder="" />
          </div>

          <div className="field">
            <label>Descripción</label>
            <textarea className="textarea" value={descripcion} onChange={e => setDesc(e.target.value)} />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Asignado a <span className="req">*</span></label>
              <select className="select" value={usuarioId} onChange={e => setUsuarioId(e.target.value)}>
                <option value="">Seleccione...</option>
                {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Prioridad <span className="req">*</span></label>
              <select className="select" value={prioridadId} onChange={e => setPrioridad(e.target.value)}>
                <option value="">Seleccione...</option>
                {prioridades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Estado <span className="req">*</span></label>
              <select className="select" value={estadoId} onChange={e => setEstado(e.target.value)}>
                <option value="">Seleccione...</option>
                {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Fecha inicio</label>
              <input className="input" type="date" value={fechaInicio} onChange={e => setFI(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>Fecha fin</label>
            <input className="input" type="date" value={fechaFin} min={fechaInicio || undefined} onChange={e => setFF(e.target.value)} />
          </div>

          {ticket && (
            <div style={{ marginTop: 20 }}>
              <div className="card-head" style={{ paddingLeft: 0, paddingRight: 0 }}>
                <div className="card-title">Comentarios</div>
              </div>
              <div className="comments" style={{ marginTop: 12 }}>
                {comentarios.length === 0 && (
                  <div style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
                    Sin comentarios aún.
                  </div>
                )}
                {comentarios.map(c => (
                  <div key={c.id} className="comment">
                    <div className="av av-sm" style={{ background: '#3B6EF5' }}>
                      {c.usuarioNombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="comment-bubble">
                      <div className="comment-meta">
                        <span className="comment-author">{c.usuarioNombre}</span>
                        <span className="comment-date">{fmtFecha(c.creadoEn)}</span>
                      </div>
                      <div className="comment-text">{c.texto}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'stretch' }}>
                <textarea
                  className="textarea"
                  rows={2}
                  placeholder="Escribí un comentario... (Ctrl+Enter para enviar)"
                  value={comentarioTexto}
                  onChange={e => setComentarioTexto(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) enviarComentario(); }}
                  style={{ flex: 1, minHeight: 60, resize: 'vertical' }}
                />
                <button
                  className="btn btn-primary"
                  style={{ alignSelf: 'stretch', minWidth: 48, padding: '0 16px' }}
                  onClick={enviarComentario}
                  disabled={enviando}
                >
                  {enviando
                    ? <i className="fa-solid fa-spinner fa-spin"></i>
                    : <i className="fa-solid fa-paper-plane"></i>
                  }
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleGuardar} disabled={loading}>
            {loading
              ? <><i className="fa-solid fa-spinner fa-spin"></i> Guardando...</>
              : <><i className="fa-solid fa-floppy-disk"></i> {ticket ? 'Guardar cambios' : 'Guardar'}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
