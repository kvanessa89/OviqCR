import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProyecto, marcarFinalizado, getResumenFinanciero, guardarResumenFinanciero, registrarPagoCliente } from '../../api/proyectos';
import type { ResumenFinancieroDto } from '../../api/proyectos';
import { getTicketsPorProyecto } from '../../api/tickets';
import { getComentariosProyecto, crearComentarioProyecto } from '../../api/comentarios';
import { getFacturasPorProyecto } from '../../api/facturas';
import { getGastosPorProyecto } from '../../api/gastos';
import type { ProyectoDto, TicketDto, ComentarioDto, FacturaDto, GastoDto } from '../../types';
import NuevoTicketModal from './NuevoTicketModal';
import EditarProyectoModal from './EditarProyectoModal';

function StatusPill({ codigo, nombre }: { codigo: string; nombre: string }) {
  const cls =
    codigo === 'en_progreso' ? 'b-primary'  :
    codigo === 'en_pausa'    ? 'b-prospect' :
    codigo === 'finalizado'  ? 'b-active'   :
    codigo === 'por_hacer'   ? 'b-info'     :
    codigo === 'pendiente'   ? 'b-purple'   : 'b-neutral';
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

function FacturaEstadoPill({ codigo, nombre, vencida }: { codigo: string; nombre: string; vencida: boolean }) {
  const map: Record<string, { bg: string; color: string }> = {
    borrador:  { bg: 'rgba(107,114,128,0.12)', color: '#4B5563' },
    emitida:   { bg: 'rgba(59,130,246,0.12)',  color: '#1D4ED8' },
    pagada:    { bg: 'rgba(16,185,129,0.12)',  color: '#047857' },
    vencida:   { bg: 'rgba(239,68,68,0.12)',   color: '#B91C1C' },
    cancelada: { bg: 'rgba(107,114,128,0.12)', color: '#4B5563' },
  };
  const key = vencida ? 'vencida' : codigo;
  const c = map[key] ?? map.borrador;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, padding: '2px 9px', borderRadius: 99, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block', flexShrink: 0 }}></span>
      {vencida ? 'Vencida' : nombre}
    </span>
  );
}

function fmtComentarioFecha(iso: string) {
  const d = new Date(iso);
  const fecha = d.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const hora  = d.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${fecha} · ${hora}`;
}

export default function ProyectoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [proyecto, setProyecto]       = useState<ProyectoDto | null>(null);
  const [tickets, setTickets]         = useState<TicketDto[]>([]);
  const [comentarios, setComentarios] = useState<ComentarioDto[]>([]);
  const [facturas, setFacturas]       = useState<FacturaDto[]>([]);
  const [gastos, setGastos]           = useState<GastoDto[]>([]);
  const [tabActiva, setTabActiva]     = useState<'comentarios' | 'facturas' | 'gastos'>('comentarios');
  const [loading, setLoading]         = useState(true);
  const [comentarioTexto, setComentarioTexto]     = useState('');
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [modalTicket, setModalTicket]               = useState(false);
  const [modalEditar, setModalEditar]               = useState(false);
  const [ticketSeleccionado, setTicketSeleccionado] = useState<TicketDto | null>(null);
  const [confirmFinalizar, setConfirmFinalizar]     = useState(false);
  const [filtroTicket, setFiltroTicket]             = useState('');
  const [marcandoFinalizado, setMarcandoFinalizado] = useState(false);
  const [modalCobrar, setModalCobrar]               = useState(false);
  const [montoCobrado, setMontoCobrado]             = useState('');
  const [guardandoCobro, setGuardandoCobro]         = useState(false);
  const [errCobro, setErrCobro]                     = useState('');
  const [modalPago, setModalPago]                   = useState(false);
  const [montoPago, setMontoPago]                   = useState('');
  const [guardandoPago, setGuardandoPago]           = useState(false);
  const [errPago, setErrPago]                       = useState('');

  const cargar = async () => {
    if (!id) return;
    try {
      const [p, t, c, f, g] = await Promise.all([
        getProyecto(Number(id)),
        getTicketsPorProyecto(Number(id)),
        getComentariosProyecto(Number(id)),
        getFacturasPorProyecto(Number(id)),
        getGastosPorProyecto(Number(id)),
      ]);
      setProyecto(p);
      setTickets(t);
      setComentarios(c);
      setFacturas(f);
      setGastos(g);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [id]);

  const enviarComentario = async () => {
    const txt = comentarioTexto.trim();
    if (!txt || !id) return;
    setEnviandoComentario(true);
    try {
      const nuevo = await crearComentarioProyecto(Number(id), txt);
      setComentarios(prev => [...prev, nuevo]);
      setComentarioTexto('');
    } finally {
      setEnviandoComentario(false);
    }
  };

  const handleMarcarFinalizado = async () => {
    if (!proyecto || !id) return;
    setMarcandoFinalizado(true);
    try {
      await marcarFinalizado(Number(id));
      await cargar();
    } finally {
      setMarcandoFinalizado(false);
    }
  };

  const handleCobrar = async () => {
    if (!proyecto || !id) return;
    const monto = parseFloat(montoCobrado);
    if (!montoCobrado || isNaN(monto) || monto <= 0) {
      setErrCobro('Ingresá un monto válido mayor a 0.');
      return;
    }
    setGuardandoCobro(true);
    setErrCobro('');
    try {
      const existente = await getResumenFinanciero(Number(id)).catch(() => null);
      const totalCostos = existente?.totalCostos ?? 0;
      await guardarResumenFinanciero(Number(id), {
        totalFacturado: monto,
        totalCostos,
        utilidadNeta: monto - totalCostos,
      });
      setModalCobrar(false);
      setMontoCobrado('');
      await cargar();
    } finally {
      setGuardandoCobro(false);
    }
  };

  const handleRegistrarPago = async () => {
    if (!proyecto || !id) return;
    const monto = parseFloat(montoPago);
    if (!montoPago || isNaN(monto) || monto <= 0) {
      setErrPago('Ingresá un monto válido mayor a 0.');
      return;
    }
    setGuardandoPago(true);
    setErrPago('');
    try {
      await registrarPagoCliente(Number(id), monto);
      setModalPago(false);
      setMontoPago('');
      await cargar();
    } finally {
      setGuardandoPago(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-3)' }}>
      <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 10 }}></i> Cargando...
    </div>
  );

  if (!proyecto) return (
    <div className="empty"><i className="fa-solid fa-folder-open"></i><h4>Proyecto no encontrado</h4></div>
  );

  const ticketsFiltrados = tickets.filter(t => !filtroTicket || t.estadoCodigo === filtroTicket);
  const completados = tickets.filter(t => t.estadoCodigo === 'completado').length;
  const porHacer    = tickets.filter(t => t.estadoCodigo === 'por_hacer').length;
  const pendientes  = tickets.filter(t => t.estadoCodigo === 'pendiente').length;
  const pct = tickets.length ? Math.round(completados / tickets.length * 100) : 0;
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <div>
      {/* Header */}
      <div className="page-head">
        <div className="ph-left">
          <div className="crumb">
            <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Inicio</span>
            <span className="sep">›</span>
            <span onClick={() => navigate('/proyectos')} style={{ cursor: 'pointer' }}>Proyectos</span>
            <span className="sep">›</span>
            <span>{proyecto.nombre}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <div style={{ background: '#3B6EF5', width: 44, height: 44, borderRadius: 11, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
              <i className="fa-solid fa-diagram-project"></i>
            </div>
            <div>
              <div className="page-title">{proyecto.nombre}</div>
              <div className="page-subtitle">
                {proyecto.clienteNombre}
                {proyecto.subcuentaNombre ? ` · ${proyecto.subcuentaNombre}` : ''}
                {proyecto.fechaInicio && proyecto.fechaFin
                  ? ` · ${fmtFecha(proyecto.fechaInicio)} → ${fmtFecha(proyecto.fechaFin)}`
                  : ''}
                {proyecto.ordenCompra?.numeroOc
                  ? <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-2)' }}> · {proyecto.ordenCompra.numeroOc}</span>
                  : ''}
              </div>
            </div>
          </div>
        </div>
        <div className="ph-right">
          <StatusPill codigo={proyecto.estadoCodigo} nombre={proyecto.estadoNombre} />
          {(proyecto.estadoCodigo === 'en_progreso' || proyecto.estadoCodigo === 'en_pausa') && (
            <button
              className="btn btn-sm"
              style={{ background: '#fff', border: '1.5px solid var(--border-strong)', color: 'var(--text-2)' }}
              onClick={() => setConfirmFinalizar(true)}
              disabled={marcandoFinalizado}
            >
              {marcandoFinalizado
                ? <><i className="fa-solid fa-spinner fa-spin"></i> Procesando...</>
                : <><i className="fa-solid fa-circle-check"></i> Marcar finalizado</>
              }
            </button>
          )}
          {proyecto.estadoFinancieroCodigo === 'pendiente_de_cobro' && (
            <button
              className="btn btn-sm"
              style={{ background: '#fff', border: '1.5px solid var(--border-strong)', color: 'var(--text-2)' }}
              onClick={() => { setMontoCobrado(''); setErrCobro(''); setModalCobrar(true); }}
            >
              <i className="fa-solid fa-circle-dollar-to-slot"></i> Cobrar proyecto
            </button>
          )}
          {(proyecto.estadoFinancieroCodigo === 'pendiente_de_pago' || proyecto.estadoFinancieroCodigo === 'pagado_parcialmente') && (
            <button
              className="btn btn-sm"
              style={{ background: '#fff', border: '1.5px solid var(--border-strong)', color: 'var(--text-2)' }}
              onClick={() => { setMontoPago(''); setErrPago(''); setModalPago(true); }}
            >
              <i className="fa-solid fa-hand-holding-dollar"></i> Registrar pago
            </button>
          )}
          <button
            className="btn btn-sm"
            style={{ background: '#fff', border: '1.5px solid var(--border-strong)', color: 'var(--text-2)' }}
            onClick={() => setModalEditar(true)}
          >
            <i className="fa-solid fa-pen-to-square"></i> Editar
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setModalTicket(true)}>
            <i className="fa-solid fa-plus"></i> Nuevo Ticket
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className={`stat${filtroTicket === '' ? ' active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFiltroTicket('')}>
          <div className="stat-top">
            <div className="stat-label">Total tickets</div>
            <div className="stat-icon ic-primary"><i className="fa-solid fa-list-check"></i></div>
          </div>
          <div className="stat-value">{tickets.length}</div>
        </div>
        <div className={`stat${filtroTicket === 'por_hacer' ? ' active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFiltroTicket(f => f === 'por_hacer' ? '' : 'por_hacer')}>
          <div className="stat-top">
            <div className="stat-label">Por hacer</div>
            <div className="stat-icon ic-info"><i className="fa-solid fa-circle"></i></div>
          </div>
          <div className="stat-value">{porHacer}</div>
        </div>
        <div className={`stat${filtroTicket === 'pendiente' ? ' active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFiltroTicket(f => f === 'pendiente' ? '' : 'pendiente')}>
          <div className="stat-top">
            <div className="stat-label">Pendiente</div>
            <div className="stat-icon ic-warning"><i className="fa-solid fa-spinner"></i></div>
          </div>
          <div className="stat-value">{pendientes}</div>
        </div>
        <div className={`stat${filtroTicket === 'completado' ? ' active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFiltroTicket(f => f === 'completado' ? '' : 'completado')}>
          <div className="stat-top">
            <div className="stat-label">Completados</div>
            <div className="stat-icon ic-success"><i className="fa-solid fa-circle-check"></i></div>
          </div>
          <div className="stat-value">{completados}</div>
        </div>
      </div>

      {/* Grid principal */}
      <div className="pd-main-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Tabla de tickets */}
          <div className="card">
            <div className="card-head">
              <div className="card-title">Tickets del proyecto</div>
              {filtroTicket && (
                <span className="badge badge-info" style={{ marginLeft: 8 }}>
                  <i className="fa-solid fa-filter" style={{ marginRight: 4 }}></i>
                  {filtroTicket}
                  <i className="fa-solid fa-xmark" style={{ marginLeft: 6, cursor: 'pointer' }} onClick={() => setFiltroTicket('')}></i>
                </span>
              )}
              <div className="card-sub" style={{ marginLeft: 'auto' }}>{ticketsFiltrados.length} de {tickets.length} tickets</div>
            </div>

            {ticketsFiltrados.length === 0 ? (
              <div className="acct-empty-row">
                {tickets.length === 0 ? 'Este proyecto aún no tiene tickets.' : 'Sin tickets con el filtro seleccionado.'}
              </div>
            ) : (
              <div className="pv2-tickets">
                <div className="pv2-tk-head">
                  <div>Código</div>
                  <div>Título</div>
                  <div>Asignado</div>
                  <div>Inicio – Fin</div>
                  <div>Prioridad</div>
                  <div>Estado</div>
                </div>
                {ticketsFiltrados.map(t => {
                  const atrasado = t.estadoCodigo !== 'completado' && !!t.fechaFin && t.fechaFin < hoy;
                  return (
                    <div key={t.id} className="pv2-tk-row" style={{ cursor: 'pointer' }} onClick={() => setTicketSeleccionado(t)}>
                      <div className="pv2-tk-code">{t.codigo}</div>
                      <div className="pv2-tk-title">{t.titulo}</div>
                      <div className="pv2-tk-assignee">
                        {t.usuarioId
                          ? <><div className="av av-xs" style={{ background: '#3B6EF5' }}>{t.usuarioNombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}</div><span>{t.usuarioNombre.split(' ')[0]}</span></>
                          : <span style={{ color: 'var(--text-3)' }}>Sin asignar</span>
                        }
                      </div>
                      <div className="pv2-tk-due" style={{ color: atrasado ? 'var(--danger)' : 'var(--text-2)', fontWeight: atrasado ? 700 : 500 }}>
                        <i className="fa-regular fa-calendar"></i>{' '}
                        {t.fechaInicio ? `${fmtFecha(t.fechaInicio)} – ` : ''}{fmtFecha(t.fechaFin)}
                        {atrasado && ' ⚠'}
                      </div>
                      <div><PrioridadTag codigo={t.prioridadCodigo} /></div>
                      <div><StatusPill codigo={t.estadoCodigo} nombre={t.estadoNombre} /></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tabs: Comentarios / Facturas / Gastos */}
          <div className="card">
            <div className="card-head" style={{ paddingBottom: 0, borderBottom: 'none' }}>
              <div className="vg-tab-bar" style={{ marginBottom: 0 }}>
                <button className={`vg-tab${tabActiva === 'comentarios' ? ' active' : ''}`} onClick={() => setTabActiva('comentarios')}>
                  <i className="fa-solid fa-comments"></i> Comentarios
                  {comentarios.length > 0 && <span className="vg-tab-count">{comentarios.length}</span>}
                </button>
                <button className={`vg-tab${tabActiva === 'facturas' ? ' active' : ''}`} onClick={() => setTabActiva('facturas')}>
                  <i className="fa-solid fa-file-invoice-dollar"></i> Facturas
                  {facturas.length > 0 && <span className="vg-tab-count">{facturas.length}</span>}
                </button>
                <button className={`vg-tab${tabActiva === 'gastos' ? ' active' : ''}`} onClick={() => setTabActiva('gastos')}>
                  <i className="fa-solid fa-receipt"></i> Gastos
                  {gastos.length > 0 && <span className="vg-tab-count">{gastos.length}</span>}
                </button>
              </div>
            </div>

            {tabActiva === 'comentarios' && (
              <div style={{ padding: 16 }}>
                <div className="comments">
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
                          <span className="comment-date">{fmtComentarioFecha(c.creadoEn)}</span>
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
                    disabled={enviandoComentario}
                  >
                    {enviandoComentario
                      ? <i className="fa-solid fa-spinner fa-spin"></i>
                      : <i className="fa-solid fa-paper-plane"></i>
                    }
                  </button>
                </div>
              </div>
            )}

            {tabActiva === 'facturas' && (
              <div style={{ padding: '12px 16px' }}>
                {facturas.length === 0 ? (
                  <div style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
                    Sin facturas registradas.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600, fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>N°</th>
                        <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600, fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Monto</th>
                        <th style={{ textAlign: 'center', padding: '6px 8px', fontWeight: 600, fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facturas.map(f => (
                        <tr key={f.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '7px 8px', color: 'var(--text-2)', fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}>{f.numero}</td>
                          <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                            {f.monedaCodigo === 'CRC' ? '₡' : f.monedaCodigo === 'USD' ? '$' : f.monedaCodigo + ' '}
                            {f.monto.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                            <FacturaEstadoPill codigo={f.estadoCodigo} nombre={f.estadoNombre} vencida={f.estaVencida} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {tabActiva === 'gastos' && (
              <div style={{ padding: '12px 16px' }}>
                {gastos.length === 0 ? (
                  <div style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>
                    Sin gastos registrados.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600, fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Rubro</th>
                        <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 600, fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gastos.map(g => (
                        <tr key={g.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '7px 8px', color: 'var(--text-1)' }}>{g.rubro}</td>
                          <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                            {g.monto.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td style={{ padding: '7px 8px', fontWeight: 700, fontSize: 12, color: 'var(--text-3)', textTransform: 'uppercase' }}>Total</td>
                        <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {gastos.reduce((s, g) => s + g.monto, 0).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Panel lateral derecho */}
        <div className="card">
          <div className="card-head"><div className="card-title">Presupuesto del proyecto</div></div>
          <div style={{ padding: 16 }}>
            {proyecto.ordenCompra ? (
              <>
                <div className="dp-row">
                  <span className="lbl">Monto OC</span>
                  <span className="val">{proyecto.ordenCompra.monedaSimbolo ?? proyecto.ordenCompra.monedaCodigo} {proyecto.ordenCompra.montoTotal.toLocaleString('es-CR')}</span>
                </div>
                {proyecto.ordenCompra.numeroOc && (
                  <div className="dp-row">
                    <span className="lbl">Número OC</span>
                    <span className="val" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{proyecto.ordenCompra.numeroOc}</span>
                  </div>
                )}
                {proyecto.ordenCompra.aQuienFacturar && (
                  <div className="dp-row">
                    <span className="lbl">A quién facturar</span>
                    <span className="val">{proyecto.ordenCompra.aQuienFacturar}</span>
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Sin orden de compra registrada.</div>
            )}

            <div className="dp-section" style={{ marginTop: 14 }}>Descripción</div>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 10, fontSize: 12.5, color: 'var(--text-1)' }}>
              {proyecto.descripcion || 'Sin descripción.'}
            </div>

            <div className="dp-section" style={{ marginTop: 14 }}>Fechas</div>
            <div className="dp-row"><span className="lbl">Inicio</span><span className="val">{fmtFecha(proyecto.fechaInicio)}</span></div>
            <div className="dp-row"><span className="lbl">Fin estimado</span><span className="val">{fmtFecha(proyecto.fechaFin)}</span></div>

            <div className="dp-section" style={{ marginTop: 14 }}>Avance</div>
            <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', margin: '8px 0' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: '#3B6EF5', borderRadius: 99 }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)' }}>
              <span>{completados}/{tickets.length} tickets</span>
              <span>{pct}%</span>
            </div>
          </div>
        </div>
      </div>

      {modalTicket && (
        <NuevoTicketModal
          proyectoId={Number(id)}
          onClose={() => setModalTicket(false)}
          onCreado={() => { setModalTicket(false); cargar(); }}
        />
      )}

      {ticketSeleccionado && (
        <NuevoTicketModal
          proyectoId={Number(id)}
          ticket={ticketSeleccionado}
          onClose={() => setTicketSeleccionado(null)}
          onCreado={() => { setTicketSeleccionado(null); cargar(); }}
        />
      )}

      {modalEditar && proyecto && (
        <EditarProyectoModal
          proyecto={proyecto}
          onClose={() => setModalEditar(false)}
          onGuardado={() => { setModalEditar(false); cargar(); }}
        />
      )}

      {modalCobrar && proyecto && (
        <div className="modal-bg" onMouseDown={e => { (e.currentTarget as HTMLElement).dataset.mdown = e.target === e.currentTarget ? '1' : '0'; }} onClick={e => { if (e.target === e.currentTarget && (e.currentTarget as HTMLElement).dataset.mdown === '1') setModalCobrar(false); }}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-head">
              <i className="fa-solid fa-circle-dollar-to-slot" style={{ color: 'var(--success)' }}></i>
              <div className="modal-title">Cobro del proyecto</div>
              <button className="modal-close" onClick={() => setModalCobrar(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--text-1)', marginBottom: 16 }}>
                ¿Se ha cobrado el proyecto <strong>{proyecto.nombre}</strong>? Indicá el monto cobrado.
              </p>
              <div className="field">
                <label>Monto cobrado</label>
                <input
                  className={`input${errCobro ? ' input-error' : ''}`}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={montoCobrado}
                  onChange={e => { setMontoCobrado(e.target.value); setErrCobro(''); }}
                  autoFocus
                />
                {errCobro && <div className="field-error">{errCobro}</div>}
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setModalCobrar(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                style={{ background: 'var(--success)' }}
                disabled={guardandoCobro}
                onClick={handleCobrar}
              >
                {guardandoCobro
                  ? <><i className="fa-solid fa-spinner fa-spin"></i> Guardando...</>
                  : <><i className="fa-solid fa-floppy-disk"></i> Guardar</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {modalPago && proyecto && (
        <div className="modal-bg" onMouseDown={e => { (e.currentTarget as HTMLElement).dataset.mdown = e.target === e.currentTarget ? '1' : '0'; }} onClick={e => { if (e.target === e.currentTarget && (e.currentTarget as HTMLElement).dataset.mdown === '1') setModalPago(false); }}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-head">
              <i className="fa-solid fa-hand-holding-dollar" style={{ color: 'var(--success)' }}></i>
              <div className="modal-title">Registrar pago del cliente</div>
              <button className="modal-close" onClick={() => setModalPago(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--text-1)', marginBottom: 16 }}>
                ¿El cliente ha pagado el proyecto <strong>{proyecto.nombre}</strong>? Indicá el monto recibido.
              </p>
              <div className="field">
                <label>Monto recibido <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  className={`input${errPago ? ' input-error' : ''}`}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={montoPago}
                  onChange={e => { setMontoPago(e.target.value); setErrPago(''); }}
                  autoFocus
                />
                {errPago && <div className="field-error">{errPago}</div>}
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setModalPago(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                style={{ background: 'var(--success)' }}
                disabled={guardandoPago}
                onClick={handleRegistrarPago}
              >
                {guardandoPago
                  ? <><i className="fa-solid fa-spinner fa-spin"></i> Guardando...</>
                  : <><i className="fa-solid fa-floppy-disk"></i> Guardar</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmFinalizar && proyecto && (
        <div className="modal-bg" onMouseDown={e => { (e.currentTarget as HTMLElement).dataset.mdown = e.target === e.currentTarget ? '1' : '0'; }} onClick={e => { if (e.target === e.currentTarget && (e.currentTarget as HTMLElement).dataset.mdown === '1') setConfirmFinalizar(false); }}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-head">
              <i className="fa-solid fa-circle-check" style={{ color: 'var(--success)' }}></i>
              <div className="modal-title">Marcar como finalizado</div>
              <button className="modal-close" onClick={() => setConfirmFinalizar(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--text-1)' }}>
                ¿Estás seguro que quieres marcar <strong>{proyecto.nombre}</strong> como finalizado?
              </p>
              <p style={{ marginTop: 8, fontSize: 13, color: 'var(--text-3)' }}>
                Esta acción cambiará el estado del proyecto a "Finalizado".
              </p>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setConfirmFinalizar(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                style={{ background: 'var(--success)' }}
                disabled={marcandoFinalizado}
                onClick={() => { setConfirmFinalizar(false); handleMarcarFinalizado(); }}
              >
                {marcandoFinalizado
                  ? <><i className="fa-solid fa-spinner fa-spin"></i> Procesando...</>
                  : <><i className="fa-solid fa-circle-check"></i> Sí, marcar como finalizado</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
