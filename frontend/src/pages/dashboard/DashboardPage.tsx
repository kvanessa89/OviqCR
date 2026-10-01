import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProyectos, getResumenMensual } from '../../api/proyectos';
import type { ResumenMensualDto } from '../../api/proyectos';
import { getTickets } from '../../api/tickets';
import { getFacturas } from '../../api/facturas';
import { getNotas, crearNota, actualizarNota, cambiarEstadoNota, eliminarNota } from '../../api/notas';
import { useAuth } from '../../context/AuthContext';
import type { ProyectoDto, TicketDto, FacturaDto, NotaDto } from '../../types';
import NuevoTicketModal from '../proyectos/NuevoTicketModal';
import NuevaFacturaModal from '../facturacion/NuevaFacturaModal';
import ConfirmDeleteModal from '../../components/ui/ConfirmDeleteModal';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function shortDate(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getUTCDate()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function fmtCompact(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1e6) return '₡' + (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (abs >= 1e3) return '₡' + Math.round(n / 1e3) + 'K';
  return '₡' + Math.round(n);
}

function fmtFull(n: number, cur = 'CRC') {
  const sym = cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '₡';
  return sym + (n || 0).toLocaleString('es-CR', { maximumFractionDigits: cur === 'CRC' ? 0 : 2 });
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.rol === 'Administrador';

  const [proyectos, setProyectos] = useState<ProyectoDto[]>([]);
  const [tickets, setTickets]     = useState<TicketDto[]>([]);
  const [facturas, setFacturas]   = useState<FacturaDto[]>([]);
  const [notas, setNotas]         = useState<NotaDto[]>([]);
  const [loading, setLoading]     = useState(true);

  const [overdueTab, setOverdueTab]           = useState<'proyectos' | 'tickets'>('proyectos');
  const [modalTicket, setModalTicket]         = useState(false);
  const [ticketSeleccionado, setTicketSel]    = useState<TicketDto | null>(null);
  const [facturaSeleccionada, setFacturaSel]  = useState<FacturaDto | null>(null);

  const [modalNota, setModalNota]             = useState(false);
  const [notaEditando, setNotaEditando]       = useState<NotaDto | null>(null);
  const [notaTexto, setNotaTexto]             = useState('');
  const [guardandoNota, setGuardandoNota]     = useState(false);
  const [errNota, setErrNota]                 = useState('');
  const [notaEliminando, setNotaEliminando]         = useState<NotaDto | null>(null);
  const [loadingEliminarNota, setLoadingEliminarNota] = useState(false);
  const [errorEliminarNota, setErrorEliminarNota]     = useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [resumenMensual, setResumenMensual] = useState<ResumenMensualDto | null>(null);

  const cargarNotas = () => (isAdmin ? getNotas().then(setNotas) : Promise.resolve());

  const cargar = () =>
    Promise.all([getProyectos(), getTickets(), getFacturas(), cargarNotas()])
      .then(([p, t, f]) => { setProyectos(p); setTickets(t); setFacturas(f); })
      .finally(() => setLoading(false));

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    const [anio, mes] = monthKey.split('-').map(Number);
    getResumenMensual(anio, mes).then(setResumenMensual);
  }, [monthKey]);

  const handleToggleNota = (n: NotaDto) => {
    cambiarEstadoNota(n.id, !n.completada).then(cargarNotas);
  };

  const abrirNuevaNota = () => {
    setNotaEditando(null);
    setNotaTexto('');
    setErrNota('');
    setModalNota(true);
  };

  const abrirEditarNota = (n: NotaDto) => {
    setNotaEditando(n);
    setNotaTexto(n.descripcion);
    setErrNota('');
    setModalNota(true);
  };

  const handleGuardarNota = async () => {
    const texto = notaTexto.trim();
    if (!texto) { setErrNota('La descripción es requerida'); return; }
    setGuardandoNota(true);
    setErrNota('');
    try {
      if (notaEditando) await actualizarNota(notaEditando.id, texto);
      else await crearNota(texto);
      await cargarNotas();
      setModalNota(false);
      setNotaEditando(null);
      setNotaTexto('');
    } catch (err: any) {
      setErrNota(err.response?.data?.mensaje || 'Error al guardar la nota');
    } finally {
      setGuardandoNota(false);
    }
  };

  const confirmarEliminarNota = async () => {
    if (!notaEliminando) return;
    setLoadingEliminarNota(true);
    try {
      await eliminarNota(notaEliminando.id);
      setNotaEliminando(null);
      await cargarNotas();
    } catch (err: any) {
      setErrorEliminarNota(err.response?.data?.mensaje || 'Error al eliminar la nota');
    } finally {
      setLoadingEliminarNota(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-3)' }}>
      <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 10 }}></i> Cargando...
    </div>
  );

  const daysAgo = (iso?: string) => {
    if (!iso) return 0;
    return Math.floor((today.getTime() - new Date(iso).getTime()) / 86400000);
  };
  const venceLabel = (iso?: string) => {
    const n = daysAgo(iso);
    if (n === 0) return 'vence hoy';
    if (n === 1) return 'venció ayer';
    if (n > 0) return `venció hace ${n} días`;
    return `vence en ${-n} días`;
  };
  const completadoLabel = (iso?: string) => {
    const n = daysAgo(iso);
    if (n <= 0) return 'completado hoy';
    if (n === 1) return 'completado ayer';
    return `completado hace ${n} días`;
  };
  const atrasoLabel = (iso?: string) => {
    const n = daysAgo(iso);
    if (n <= 0) return 'al día';
    return `${n} ${n === 1 ? 'día' : 'días'} de atraso`;
  };

  const vencidas  = facturas.filter(f => f.estadoCodigo === 'vencida');
  const sumCRC = (list: FacturaDto[]) => list.filter(f => f.monedaCodigo === 'CRC').reduce((a, b) => a + b.monto, 0);
  const sumUSD = (list: FacturaDto[]) => list.filter(f => f.monedaCodigo === 'USD').reduce((a, b) => a + b.monto, 0);

  const notasAbiertas = notas.filter(n => !n.completada).length;

  const proyectosPendientesPago = proyectos.filter(p => p.estadoFinancieroCodigo === 'pendiente_de_pago');
  const idsPendientesPago = new Set(proyectosPendientesPago.map(p => p.id));
  const facturasPendientesPago = facturas.filter(f => idsPendientesPago.has(f.proyectoId) && f.estadoCodigo !== 'pagada');

  const pendientesFacturar   = proyectos.filter(p => p.estadoFinancieroCodigo === 'pendiente_de_facturar');
  const proyectosActivos     = proyectos.filter(p => p.estadoCodigo === 'en_progreso' || p.estadoCodigo === 'en_pausa');
  const proyectosActivosAtrasados = proyectosActivos.filter(p => p.fechaFin && p.fechaFin < today.toISOString().slice(0, 10));
  const ticketsActivos       = tickets.filter(t => t.estadoCodigo !== 'completado');

  const sortedVencidas    = [...vencidas].sort((a, b) => a.fechaEstimadaPago.localeCompare(b.fechaEstimadaPago)).slice(0, 5);
  const sortedPendientes  = [...pendientesFacturar].sort((a, b) => (b.fechaFin || '').localeCompare(a.fechaFin || '')).slice(0, 5);
  const sortedProyActivos = [...proyectosActivos].sort((a, b) => (a.fechaFin || '').localeCompare(b.fechaFin || '')).slice(0, 6);
  const sortedTicketsActivos = [...ticketsActivos].sort((a, b) => (a.fechaFin || '').localeCompare(b.fechaFin || '')).slice(0, 6);

  const [selYear, selMonth] = monthKey.split('-').map(Number);
  const monthLabel = `${MESES[selMonth - 1]} ${selYear}`;
  const fullDate = `${DIAS[today.getDay()]}, ${today.getDate()} de ${MESES[today.getMonth()].toLowerCase()} ${today.getFullYear()}`;
  const totalFacturacion = resumenMensual
    ? resumenMensual.proyectosFacturados + resumenMensual.proyectosSinFactura
    : 0;

  return (
    <div className="vg">
      <div className="page-head">
        <div className="ph-left">
          <div className="page-title">Vista rápida</div>
          <div className="page-subtitle">{fullDate}</div>
        </div>
        <div className="ph-right">
          <button
            className="btn btn-sm"
            style={{ background: '#fff', border: '1.5px solid var(--border-strong)', color: 'var(--text-2)' }}
            onClick={() => navigate('/calendario')}
          >
            <i className="fa-solid fa-calendar-days"></i> Calendario
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setModalTicket(true)}>
            <i className="fa-solid fa-plus"></i> Nuevo ticket
          </button>
          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={abrirNuevaNota}>
              <i className="fa-solid fa-note-sticky"></i> Nueva nota
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="stats-grid" style={{ marginBottom: 22 }}>
        <div className="stat" style={{ cursor: 'default' }}>
          <div className="stat-top">
            <div className="stat-label">Facturas vencidas</div>
            <div className="stat-icon ic-danger"><i className="fa-solid fa-triangle-exclamation"></i></div>
          </div>
          <div className="stat-value">{vencidas.length}</div>
          <div className="stat-delta flat">{vencidas.length > 0 ? 'Requieren atención' : 'Sin atrasos'}</div>
        </div>
        <div className="stat" style={{ cursor: 'default' }}>
          <div className="stat-top">
            <div className="stat-label">Proyectos pendientes de pago</div>
            <div className="stat-icon ic-warning"><i className="fa-solid fa-clock"></i></div>
          </div>
          <div className="stat-value">{proyectosPendientesPago.length}</div>
          <div className="stat-delta flat">
            {fmtCompact(sumCRC(facturasPendientesPago))} por cobrar{sumUSD(facturasPendientesPago) > 0 ? ` · ${fmtFull(sumUSD(facturasPendientesPago), 'USD')}` : ''}
          </div>
        </div>
        <div className="stat" style={{ cursor: 'default' }}>
          <div className="stat-top">
            <div className="stat-label">Proyectos pendientes de facturar</div>
            <div className="stat-icon ic-warning"><i className="fa-solid fa-file-invoice-dollar"></i></div>
          </div>
          <div className="stat-value">{pendientesFacturar.length}</div>
          <div className="stat-delta flat">Proyectos completados</div>
        </div>
        {isAdmin ? (
          <div className="stat" style={{ cursor: 'default' }}>
            <div className="stat-top">
              <div className="stat-label">Mis notas</div>
              <div className="stat-icon ic-primary"><i className="fa-solid fa-note-sticky"></i></div>
            </div>
            <div className="stat-value">{notasAbiertas}</div>
            <div className="stat-delta flat">Pendientes</div>
          </div>
        ) : (
          <div className="stat" style={{ cursor: 'default' }}>
            <div className="stat-top">
              <div className="stat-label">Proyectos activos</div>
              <div className="stat-icon ic-primary"><i className="fa-solid fa-diagram-project"></i></div>
            </div>
            <div className="stat-value">{proyectosActivos.length}</div>
            <div className="stat-delta flat">{proyectosActivosAtrasados.length} atrasados</div>
          </div>
        )}
      </div>

      {/* Notas — solo Administradores */}
      {isAdmin && notas.length > 0 && (
        <div className="vg-notes">
          <div className="vg-section-head">
            <span className="vg-section-title">
              Notas
              <span className="vg-notes-count">{notasAbiertas} pendiente{notasAbiertas === 1 ? '' : 's'}</span>
            </span>
          </div>
          <div className="vg-card">
            {notas.map(n => (
              <div key={n.id} className={`vg-note-row${n.completada ? ' done' : ''}`}>
                <button
                  type="button"
                  className="vg-note-check"
                  onClick={() => handleToggleNota(n)}
                  aria-label={n.completada ? 'Marcar como pendiente' : 'Marcar como hecha'}
                  title={n.completada ? 'Marcar como pendiente' : 'Marcar como hecha'}
                >
                  {n.completada && <i className="fa-solid fa-check"></i>}
                </button>
                <div className="vg-note-text" onClick={() => abrirEditarNota(n)}>{n.descripcion}</div>
                <div className="av av-xs" style={{ background: '#3B6EF5' }} title={`Creada por ${n.creadoPorNombre}`}>
                  {n.creadoPorNombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <button
                  type="button"
                  className="vg-note-del"
                  onClick={() => { setErrorEliminarNota(''); setNotaEliminando(n); }}
                  title="Eliminar nota"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Facturas vencidas · Proyectos pendientes de facturar */}
      <div className="vg-two-col">
        <div>
          <div className="vg-section-head">
            <span className="vg-section-title">Facturas vencidas</span>
            <span className="vg-link" onClick={() => navigate('/facturacion')}>Ver todas →</span>
          </div>
          <div className="vg-card">
            {sortedVencidas.length === 0
              ? <div className="vg-empty">No hay facturas vencidas. 🎉</div>
              : sortedVencidas.map(f => (
                <div key={f.id} className="vg-list-row" onClick={() => setFacturaSel(f)}>
                  <div className="vg-row-left">
                    <span className="vg-dot vg-dot-danger"></span>
                    <div className="vg-row-info">
                      <div className="vg-row-name">{f.proyectoNombre}{f.subcuentaNombre ? ` · ${f.subcuentaNombre}` : ''}</div>
                      <div className="vg-row-meta">{f.numero} · {venceLabel(f.fechaEstimadaPago)}</div>
                    </div>
                  </div>
                  <div className="vg-row-right">
                    <span className="vg-amt">{fmtFull(f.monto, f.monedaCodigo)}</span>
                    <i className="fa-solid fa-chevron-right vg-chev"></i>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div>
          <div className="vg-section-head">
            <span className="vg-section-title">Proyectos pendientes de facturar</span>
            <span className="vg-link" onClick={() => navigate('/proyectos')}>Ver todos →</span>
          </div>
          <div className="vg-card">
            {sortedPendientes.length === 0
              ? <div className="vg-empty">No hay proyectos pendientes de facturar.</div>
              : sortedPendientes.map(p => (
                <div key={p.id} className="vg-list-row" onClick={() => navigate(`/proyectos/${p.id}`)}>
                  <div className="vg-row-left">
                    <span className="vg-dot vg-dot-warn"></span>
                    <div className="vg-row-info">
                      <div className="vg-row-name">{p.nombre}</div>
                      <div className="vg-row-meta">{p.subcuentaNombre || p.clienteNombre} · {completadoLabel(p.fechaFin)}</div>
                    </div>
                  </div>
                  <div className="vg-row-right">
                    <i className="fa-solid fa-chevron-right vg-chev"></i>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Proyectos y tickets en progreso · Resumen del mes */}
      <div className="vg-two-col" style={{ marginTop: 18 }}>
        <div>
          <div className="vg-section-head">
            <span className="vg-section-title">Proyectos y tickets en progreso</span>
            <span className="vg-link" onClick={() => navigate(overdueTab === 'proyectos' ? '/proyectos' : '/tickets')}>Ver todos →</span>
          </div>
          <div className="vg-tab-bar">
            <button className={`vg-tab${overdueTab === 'proyectos' ? ' active' : ''}`} onClick={() => setOverdueTab('proyectos')}>
              Proyectos {proyectosActivos.length > 0 && <span className="vg-tab-count">{proyectosActivos.length}</span>}
            </button>
            <button className={`vg-tab${overdueTab === 'tickets' ? ' active' : ''}`} onClick={() => setOverdueTab('tickets')}>
              Tickets {ticketsActivos.length > 0 && <span className="vg-tab-count">{ticketsActivos.length}</span>}
            </button>
          </div>
          <div className="vg-card">
            {overdueTab === 'proyectos' ? (
              sortedProyActivos.length === 0
                ? <div className="vg-empty">No hay proyectos en progreso.</div>
                : sortedProyActivos.map(p => {
                  const atrasado = !!p.fechaFin && p.fechaFin < today.toISOString().slice(0, 10);
                  return (
                    <div key={p.id} className="vg-list-row" onClick={() => navigate(`/proyectos/${p.id}`)}>
                      <div className="vg-row-left">
                        <span className={`vg-dot ${atrasado ? 'vg-dot-danger' : 'vg-dot-primary'}`}></span>
                        <div className="vg-row-info">
                          <div className="vg-row-name">{p.nombre}</div>
                          <div className="vg-row-meta">
                            {p.subcuentaNombre || p.clienteNombre} · entrega {shortDate(p.fechaFin)}{atrasado ? ' · ' + atrasoLabel(p.fechaFin) : ''}
                          </div>
                        </div>
                      </div>
                      <div className="vg-row-right">
                        <span className={`vg-badge ${atrasado ? 'vg-badge-danger' : 'vg-badge-primary'}`}>{atrasado ? 'Atrasado' : p.estadoNombre}</span>
                        <i className="fa-solid fa-chevron-right vg-chev"></i>
                      </div>
                    </div>
                  );
                })
            ) : (
              sortedTicketsActivos.length === 0
                ? <div className="vg-empty">No hay tickets en progreso.</div>
                : sortedTicketsActivos.map(t => {
                  const atrasado = !!t.fechaFin && t.fechaFin < today.toISOString().slice(0, 10);
                  return (
                    <div key={t.id} className="vg-list-row" onClick={() => setTicketSel(t)}>
                      <div className="vg-row-left">
                        <span className={`vg-dot ${atrasado ? 'vg-dot-danger' : 'vg-dot-primary'}`}></span>
                        <div className="vg-row-info">
                          <div className="vg-row-name">{t.titulo}</div>
                          <div className="vg-row-meta">
                            {t.proyectoNombre} · entrega {shortDate(t.fechaFin)}{atrasado ? ' · ' + atrasoLabel(t.fechaFin) : ''}
                          </div>
                        </div>
                      </div>
                      <div className="vg-row-right">
                        <span className={`vg-badge ${atrasado ? 'vg-badge-danger' : 'vg-badge-primary'}`}>{atrasado ? 'Atrasado' : t.estadoNombre}</span>
                        <i className="fa-solid fa-chevron-right vg-chev"></i>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        <div>
          <div className="vg-section-head">
            <span className="vg-section-title">Resumen del mes</span>
            <input
              type="month"
              className="vg-month-picker"
              value={monthKey}
              max={currentMonthKey}
              onChange={e => setMonthKey(e.target.value || currentMonthKey)}
              aria-label="Seleccionar mes"
            />
          </div>
          <div className="vg-card">
            {!resumenMensual ? (
              <div className="vg-empty">Cargando resumen...</div>
            ) : (
              <div className="vg-mes">
                <div className="vg-mes-title">{monthLabel}</div>

                <div className="vg-mes-sep">
                  <span className="vg-mes-sep-label">Facturación</span>
                  <span className="vg-mes-sep-line"></span>
                </div>

                <div className="vg-mes-row">
                  <div className="vg-mes-row-left">
                    <span className="vg-mes-dot" style={{ background: 'var(--primary)' }}></span>
                    <div>
                      <div className="vg-mes-row-label">Proyectos facturados</div>
                      <div className="vg-mes-row-sub">
                        {resumenMensual.cantidadFacturasEmitidas} factura{resumenMensual.cantidadFacturasEmitidas === 1 ? '' : 's'} emitida{resumenMensual.cantidadFacturasEmitidas === 1 ? '' : 's'}
                      </div>
                    </div>
                  </div>
                  <div className="vg-mes-row-val" style={{ color: 'var(--primary)' }}>{fmtFull(resumenMensual.proyectosFacturados)}</div>
                </div>

                <div className="vg-mes-row">
                  <div className="vg-mes-row-left">
                    <span className="vg-mes-dot" style={{ background: '#8B5CF6' }}></span>
                    <div>
                      <div className="vg-mes-row-label">Proyectos sin factura</div>
                      <div className="vg-mes-row-sub">
                        {resumenMensual.cantidadProyectosSinFactura} proyecto{resumenMensual.cantidadProyectosSinFactura === 1 ? '' : 's'} finalizado{resumenMensual.cantidadProyectosSinFactura === 1 ? '' : 's'}
                      </div>
                    </div>
                  </div>
                  <div className="vg-mes-row-val" style={{ color: '#6d28d9' }}>{fmtFull(resumenMensual.proyectosSinFactura)}</div>
                </div>

                <div className="vg-mes-row vg-mes-row-muted">
                  <div className="vg-mes-row-left">
                    <div className="vg-mes-row-label">Total</div>
                  </div>
                  <div className="vg-mes-row-val">{fmtFull(totalFacturacion)}</div>
                </div>

                <div className="vg-mes-row">
                  <div className="vg-mes-row-left">
                    <span className="vg-mes-dot" style={{ background: 'var(--success)' }}></span>
                    <div className="vg-mes-row-label">Pagado</div>
                  </div>
                  <div className="vg-mes-row-val" style={{ color: 'var(--success)' }}>{fmtFull(resumenMensual.pagado)}</div>
                </div>

                <div className="vg-mes-row">
                  <div className="vg-mes-row-left">
                    <span className="vg-mes-dot" style={{ background: 'var(--warning)' }}></span>
                    <div className="vg-mes-row-label">Pendiente de pago</div>
                  </div>
                  <div className="vg-mes-row-val" style={{ color: 'var(--warning)' }}>{fmtFull(resumenMensual.pendienteDeCobro)}</div>
                </div>

                <div className="vg-mes-sep">
                  <span className="vg-mes-sep-label">Ganancias</span>
                  <span className="vg-mes-sep-line"></span>
                </div>

                <div className="vg-mes-row">
                  <div className="vg-mes-row-left">
                    <span className="vg-mes-dot" style={{ background: '#8B5CF6' }}></span>
                    <div className="vg-mes-row-label">Gastos de los proyectos</div>
                  </div>
                  <div className="vg-mes-row-val" style={{ color: '#6d28d9' }}>{fmtFull(resumenMensual.gastosProyectos)}</div>
                </div>

                <div className="vg-mes-row">
                  <div className="vg-mes-row-left">
                    <span className="vg-mes-dot" style={{ background: 'var(--text-1)' }}></span>
                    <div className="vg-mes-row-label">IVA (13%)</div>
                  </div>
                  <div className="vg-mes-row-val" style={{ color: 'var(--text-1)' }}>{fmtFull(resumenMensual.iva)}</div>
                </div>

                <div className={`vg-mes-ganancia-row${resumenMensual.ganancia < 0 ? ' neg' : ''}`}>
                  <div className="vg-mes-gan-label">
                    <i className="fa-solid fa-arrow-trend-up"></i> Ganancia
                  </div>
                  <div className="vg-mes-gan-val">{fmtFull(resumenMensual.ganancia)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalTicket && (
        <NuevoTicketModal
          proyectos={proyectos}
          onClose={() => setModalTicket(false)}
          onCreado={() => { setModalTicket(false); cargar(); }}
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

      {facturaSeleccionada && (
        <NuevaFacturaModal
          factura={facturaSeleccionada}
          onClose={() => setFacturaSel(null)}
          onGuardada={() => { setFacturaSel(null); cargar(); }}
        />
      )}

      {modalNota && (
        <div className="modal-bg" onMouseDown={e => { (e.currentTarget as HTMLElement).dataset.mdown = e.target === e.currentTarget ? '1' : '0'; }} onClick={e => { if (e.target === e.currentTarget && (e.currentTarget as HTMLElement).dataset.mdown === '1') setModalNota(false); }}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-head">
              <i className="fa-solid fa-note-sticky" style={{ color: 'var(--primary)' }}></i>
              <div className="modal-title">{notaEditando ? 'Editar nota' : 'Nueva nota'}</div>
              <button className="modal-close" onClick={() => setModalNota(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modal-body">
              {errNota && (
                <div style={{ background: 'var(--danger-50)', color: 'var(--danger)', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14, border: '1px solid #FECACA' }}>
                  {errNota}
                </div>
              )}
              <div className="field">
                <label>Descripción</label>
                <textarea
                  className="textarea"
                  rows={5}
                  autoFocus
                  placeholder="Describí la tarea o el recordatorio..."
                  value={notaTexto}
                  onChange={e => { setNotaTexto(e.target.value); setErrNota(''); }}
                  onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleGuardarNota(); }}
                />
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setModalNota(false)}>Cancelar</button>
              <button className="btn btn-primary" disabled={guardandoNota || !notaTexto.trim()} onClick={handleGuardarNota}>
                {guardandoNota
                  ? <><i className="fa-solid fa-spinner fa-spin"></i> Guardando...</>
                  : <><i className="fa-solid fa-check"></i> Guardar</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {notaEliminando && (
        <ConfirmDeleteModal
          titulo="Eliminar nota"
          mensaje={<>¿Estás seguro que quieres eliminar esta nota?</>}
          detalle="Esta acción no se puede deshacer."
          loading={loadingEliminarNota}
          error={errorEliminarNota}
          onConfirmar={confirmarEliminarNota}
          onCancelar={() => { setNotaEliminando(null); setErrorEliminarNota(''); }}
        />
      )}
    </div>
  );
}
