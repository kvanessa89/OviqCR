import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProyectos, eliminarProyecto } from '../../api/proyectos';
import type { ProyectoDto } from '../../types';
import NuevoProyectoModal from './NuevoProyectoModal';
import ConfirmDeleteModal from '../../components/ui/ConfirmDeleteModal';

function fmtFecha(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtFechaCorta(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit' });
}

const ESTADO_PROYECTO_COLORS: Record<string, { bg: string; color: string }> = {
  en_progreso: { bg: 'rgba(59,110,245,0.12)',  color: '#1D48B0' },
  en_pausa:    { bg: 'rgba(245,158,11,0.14)',  color: '#B45309' },
  finalizado:  { bg: 'rgba(16,185,129,0.12)',  color: '#047857' },
};

function StatusPill({ codigo, nombre }: { codigo: string; nombre: string }) {
  const c = ESTADO_PROYECTO_COLORS[codigo] ?? { bg: 'rgba(107,114,128,0.12)', color: '#4B5563' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block', flexShrink: 0 }}></span>
      {nombre}
    </span>
  );
}

function EFPill({ codigo, nombre }: { codigo?: string; nombre?: string }) {
  if (!codigo || !nombre) return <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>;
  const map: Record<string, { bg: string; color: string }> = {
    pendiente_de_facturar: { bg: 'rgba(245,158,11,0.14)',  color: '#B45309' },
    pendiente_de_pago:     { bg: 'rgba(236,72,153,0.12)',  color: '#9D174D' },
    pagado_parcialmente:   { bg: 'rgba(245,158,11,0.14)',  color: '#B45309' },
    pagado:                { bg: 'rgba(16,185,129,0.12)',  color: '#047857' },
  };
  const c = map[codigo] ?? { bg: 'rgba(107,114,128,0.12)', color: '#4B5563' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block', flexShrink: 0 }}></span>
      {nombre}
    </span>
  );
}

function RequiereFacturaPill({ requiere }: { requiere: boolean }) {
  const c = requiere
    ? { bg: 'rgba(59,130,246,0.12)', color: '#1D4ED8' }
    : { bg: 'rgba(107,114,128,0.12)', color: '#4B5563' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      {requiere ? 'Sí' : 'No'}
    </span>
  );
}

export default function ProyectosPage() {
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState<ProyectoDto[]>([]);
  const [loading, setLoading]     = useState(true);
  const [busqueda, setBusqueda]   = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proyectoEliminando, setProyectoEliminando] = useState<ProyectoDto | null>(null);
  const [loadingEliminar, setLoadingEliminar]       = useState(false);
  const [errorEliminar, setErrorEliminar]           = useState('');

  const cargar = () =>
    getProyectos()
      .then(setProyectos)
      .finally(() => setLoading(false));

  useEffect(() => { cargar(); }, []);

  const filtrados = proyectos.filter(p => {
    if (busqueda && !(p.nombre + p.clienteNombre).toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (filtroEstado.startsWith('ef_')) return p.estadoFinancieroCodigo === filtroEstado.slice(3);
    if (filtroEstado && p.estadoCodigo !== filtroEstado) return false;
    return true;
  });

  const enProgreso        = proyectos.filter(p => p.estadoCodigo === 'en_progreso').length;
  const finalizados       = proyectos.filter(p => p.estadoCodigo === 'finalizado').length;
  const efPendFacturar    = proyectos.filter(p => p.estadoFinancieroCodigo === 'pendiente_de_facturar').length;
  const efPendPago        = proyectos.filter(p => p.estadoFinancieroCodigo === 'pendiente_de_pago').length;
  const efPagadoParcial   = proyectos.filter(p => p.estadoFinancieroCodigo === 'pagado_parcialmente').length;

  const confirmarEliminar = async () => {
    if (!proyectoEliminando) return;
    setLoadingEliminar(true);
    try {
      await eliminarProyecto(proyectoEliminando.id);
      setProyectoEliminando(null);
      cargar();
    } catch (err: any) {
      setErrorEliminar(err.response?.data?.mensaje || 'Error al eliminar el proyecto');
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
            <span>Proyectos</span>
          </div>
          <div className="page-title">Proyectos</div>
          <div className="page-subtitle">{proyectos.length} proyectos en total · {enProgreso} en progreso</div>
        </div>
        <div className="ph-right">
          <button className="btn btn-primary btn-sm" onClick={() => setModalAbierto(true)}>
            <i className="fa-solid fa-plus"></i> Nuevo proyecto
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 20 }}>
        <div className={`stat${filtroEstado === 'en_progreso' ? ' active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFiltroEstado(f => f === 'en_progreso' ? '' : 'en_progreso')}>
          <div className="stat-top"><div className="stat-label">En progreso</div><div className="stat-icon ic-primary"><i className="fa-solid fa-bolt"></i></div></div>
          <div className="stat-value">{enProgreso}</div>
        </div>
        <div className={`stat${filtroEstado === 'finalizado' ? ' active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFiltroEstado(f => f === 'finalizado' ? '' : 'finalizado')}>
          <div className="stat-top"><div className="stat-label">Finalizados</div><div className="stat-icon ic-success"><i className="fa-solid fa-circle-check"></i></div></div>
          <div className="stat-value">{finalizados}</div>
        </div>
        <div className={`stat${filtroEstado === 'ef_pendiente_de_facturar' ? ' active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFiltroEstado(f => f === 'ef_pendiente_de_facturar' ? '' : 'ef_pendiente_de_facturar')}>
          <div className="stat-top"><div className="stat-label">Pend. facturar</div><div className="stat-icon ic-warning"><i className="fa-solid fa-file-circle-exclamation"></i></div></div>
          <div className="stat-value">{efPendFacturar}</div>
        </div>
        <div className={`stat${filtroEstado === 'ef_pendiente_de_pago' ? ' active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFiltroEstado(f => f === 'ef_pendiente_de_pago' ? '' : 'ef_pendiente_de_pago')}>
          <div className="stat-top"><div className="stat-label">Pend. de pago</div><div className="stat-icon ic-success"><i className="fa-solid fa-file-invoice-dollar"></i></div></div>
          <div className="stat-value">{efPendPago}</div>
        </div>
        <div className={`stat${filtroEstado === 'ef_pagado_parcialmente' ? ' active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFiltroEstado(f => f === 'ef_pagado_parcialmente' ? '' : 'ef_pagado_parcialmente')}>
          <div className="stat-top"><div className="stat-label">Pagado Parcialmente</div><div className="stat-icon ic-warning"><i className="fa-solid fa-circle-half-stroke"></i></div></div>
          <div className="stat-value">{efPagadoParcial}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <span className="toolbar-title">Proyectos · {filtrados.length}</span>
        <div className="search-inline">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input placeholder="Buscar proyecto o cliente..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>
        <div className="desktop-filters" style={{ display: 'contents' }}>
          <select className="select" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="">Todos</option>
            <optgroup label="Estado del proyecto">
              <option value="en_progreso">En progreso</option>
              <option value="en_pausa">En pausa</option>
              <option value="finalizado">Finalizado</option>
            </optgroup>
            <optgroup label="Estado financiero">
              <option value="ef_pendiente_de_facturar">Pend. de facturar</option>
              <option value="ef_pendiente_de_pago">Pend. de pago</option>
              <option value="ef_pagado_parcialmente">Pagado Parcialmente</option>
            </optgroup>
          </select>
        </div>
      </div>

      {/* Tabla */}
      {filtrados.length === 0 ? (
        <div className="empty">
          <i className="fa-solid fa-diagram-project"></i>
          <h4>Sin proyectos</h4>
          <div>Ajustá los filtros o creá un nuevo proyecto.</div>
        </div>
      ) : (
        <>
          <div className="tlist proj-list proj-list-desktop">
            <div className="proj-head">
              <div>#</div>
              <div>Proyecto</div>
              <div>Cliente</div>
              <div>Inicio</div>
              <div>Fin</div>
              <div>Estado</div>
              <div>Req. factura</div>
              <div>Est. financiero</div>
              <div></div>
            </div>
            {filtrados.map(p => (
              <div key={p.id} className="proj-row" onClick={() => navigate(`/proyectos/${p.id}`)}>
                <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>
                  #{p.id}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)', overflowWrap: 'break-word' }}>{p.nombre}</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.clienteNombre}</div>
                  {p.subcuentaNombre && <div style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.subcuentaNombre}</div>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>{fmtFecha(p.fechaInicio)}</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>{fmtFecha(p.fechaFin)}</div>
                <div><StatusPill codigo={p.estadoCodigo} nombre={p.estadoNombre} /></div>
                <div style={{ textAlign: 'center' }}><RequiereFacturaPill requiere={p.requiereFactura} /></div>
                <div><EFPill codigo={p.estadoFinancieroCodigo} nombre={p.estadoFinancieroNombre} /></div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="cc-menu cc-menu-danger"
                    title="Eliminar"
                    onClick={e => { e.stopPropagation(); setErrorEliminar(''); setProyectoEliminando(p); }}
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="proj-cards-mobile">
            {filtrados.map(p => {
              const estadoColor = ESTADO_PROYECTO_COLORS[p.estadoCodigo] ?? { bg: 'rgba(107,114,128,0.12)', color: '#4B5563' };
              const fechasTexto = (p.fechaInicio || p.fechaFin)
                ? `${fmtFechaCorta(p.fechaInicio)} – ${fmtFechaCorta(p.fechaFin)}`
                : 'Sin fechas';
              return (
                <div key={p.id} className="pcm-card" onClick={() => navigate(`/proyectos/${p.id}`)}>
                  <div className="pcm-top">
                    <div className="pcm-header">
                      <div>
                        <div className="pcm-id">#{p.id}</div>
                        <div className="pcm-title">{p.nombre}</div>
                      </div>
                      <button
                        className="pcm-trash"
                        title="Eliminar"
                        onClick={e => { e.stopPropagation(); setErrorEliminar(''); setProyectoEliminando(p); }}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                    <div className="pcm-client">
                      <span className="pcm-dot" style={{ background: '#3B6EF5' }}></span>
                      {p.clienteNombre}{p.subcuentaNombre ? ` · ${p.subcuentaNombre}` : ''}
                    </div>
                  </div>
                  <div className="pcm-bottom">
                    <div className="pcm-dates">
                      <i className="fa-regular fa-calendar"></i>
                      {fechasTexto}
                    </div>
                    <div className="pcm-actions">
                      <span className="pcm-status-dot" style={{ background: estadoColor.color }}></span>
                      <span className="pcm-status-label" style={{ color: estadoColor.color }}>{p.estadoNombre}</span>
                      <span className="pcm-divider"></span>
                      <span className={`pcm-req-pill ${p.requiereFactura ? 'amber' : 'gray'}`}>
                        {p.requiereFactura ? 'Req. factura' : 'Sin factura'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {modalAbierto && (
        <NuevoProyectoModal
          onClose={() => setModalAbierto(false)}
          onCreado={() => { setModalAbierto(false); cargar(); }}
        />
      )}

      {proyectoEliminando && (
        <ConfirmDeleteModal
          titulo="Eliminar proyecto"
          mensaje={<>¿Estás seguro que querés eliminar el proyecto <strong>{proyectoEliminando.nombre}</strong>?</>}
          detalle="Esta acción no se puede deshacer."
          loading={loadingEliminar}
          error={errorEliminar}
          onConfirmar={confirmarEliminar}
          onCancelar={() => { setProyectoEliminando(null); setErrorEliminar(''); }}
        />
      )}
    </div>
  );
}
