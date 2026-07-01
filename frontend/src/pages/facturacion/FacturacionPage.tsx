import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFacturas, eliminarFactura } from '../../api/facturas';
import { getClientes } from '../../api/clientes';
import type { FacturaDto, ClienteDto } from '../../types';
import NuevaFacturaModal from './NuevaFacturaModal';
import FilterBottomSheet, { type FilterState } from '../../components/ui/FilterBottomSheet';
import ConfirmDeleteModal from '../../components/ui/ConfirmDeleteModal';

const API_BASE = 'https://localhost:7299';

function fmtFecha(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtMoney(monto: number, codigo: string) {
  const sym = codigo === 'USD' ? '$' : codigo === 'EUR' ? '€' : '₡';
  const s = monto.toLocaleString('es-CR', {
    minimumFractionDigits: codigo === 'CRC' ? 0 : 2,
    maximumFractionDigits: codigo === 'CRC' ? 0 : 2,
  });
  return `${sym}${s}`;
}

function InvStatusPill({ codigo, nombre }: { codigo: string; nombre: string }) {
  const map: Record<string, { bg: string; color: string; icon: string }> = {
    emitida: { bg: 'rgba(245,158,11,0.14)', color: '#B45309', icon: 'fa-paper-plane' },
    pagada:  { bg: 'rgba(16,185,129,0.12)',  color: '#047857', icon: 'fa-circle-check' },
    vencida: { bg: 'rgba(239,68,68,0.12)',   color: '#B91C1C', icon: 'fa-triangle-exclamation' },
  };
  const c = map[codigo] ?? map['emitida'];
  return (
    <span style={{ background: c.bg, color: c.color, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
      <i className={`fa-solid ${c.icon}`} style={{ fontSize: 10 }}></i>{nombre}
    </span>
  );
}

export default function FacturacionPage() {
  const navigate = useNavigate();
  const [facturas, setFacturas] = useState<FacturaDto[]>([]);
  const [clientes, setClientes] = useState<ClienteDto[]>([]);
  const [loading, setLoading]   = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCliente, setFC]  = useState('');
  const [filtroEstado, setFE]   = useState('');
  const [modalNueva, setModalNueva]       = useState(false);
  const [facturaEditar, setFacturaEditar] = useState<FacturaDto | null>(null);
  const [facturaEliminando, setFacturaEliminando] = useState<FacturaDto | null>(null);
  const [loadingEliminar, setLoadingEliminar]     = useState(false);
  const [errorEliminar, setErrorEliminar]         = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mobileFilters, setMobileFilters] = useState<FilterState>({
    prioridades: [],
    estados: [],
    asignados: [],
  });

  const cargar = () =>
    Promise.all([getFacturas(), getClientes()])
      .then(([f, c]) => { setFacturas(f); setClientes(c); })
      .finally(() => setLoading(false));

  useEffect(() => { cargar(); }, []);

  const filtradas = facturas.filter(f => {
    if (busqueda && !(f.numero + f.clienteNombre + f.proyectoNombre).toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (filtroCliente && String(f.clienteId) !== filtroCliente) return false;
    if (filtroEstado && f.estadoCodigo !== filtroEstado) return false;
    if (mobileFilters.estados.length > 0) {
      if (!mobileFilters.estados.some(e => f.estadoNombre.toLowerCase().includes(e.toLowerCase()))) return false;
    }
    if (mobileFilters.asignados.length > 0) {
      if (!mobileFilters.asignados.includes(f.clienteNombre)) return false;
    }
    return true;
  }).sort((a, b) => b.fechaEmision.localeCompare(a.fechaEmision));

  const totalMobileFilters = mobileFilters.estados.length + mobileFilters.asignados.length;
  const nombresClientes = [...new Set(facturas.map(f => f.clienteNombre))];

  const totalEmitidas = facturas.filter(f => f.estadoCodigo === 'emitida').length;
  const totalPagadas  = facturas.filter(f => f.estadoCodigo === 'pagada').length;
  const totalVencidas = facturas.filter(f => f.estadoCodigo === 'vencida').length;

  const handleEliminar = (f: FacturaDto, e: React.MouseEvent) => {
    e.stopPropagation();
    setErrorEliminar('');
    setFacturaEliminando(f);
  };

  const confirmarEliminar = async () => {
    if (!facturaEliminando) return;
    setLoadingEliminar(true);
    try {
      await eliminarFactura(facturaEliminando.id);
      setFacturaEliminando(null);
      cargar();
    } catch (err: any) {
      setErrorEliminar(err.response?.data?.mensaje || 'Error al eliminar la factura');
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
            <span>Facturación</span>
          </div>
          <div className="page-title">Facturación</div>
          <div className="page-subtitle">{filtradas.length} de {facturas.length} facturas</div>
        </div>
        <div className="ph-right">
          <button className="btn btn-primary btn-sm" onClick={() => setModalNueva(true)}>
            <i className="fa-solid fa-plus"></i> Nueva Factura
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className={`stat${filtroEstado === '' ? ' active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFE('')}>
          <div className="stat-top">
            <div className="stat-label">Total</div>
            <div className="stat-icon ic-primary"><i className="fa-solid fa-file-invoice-dollar"></i></div>
          </div>
          <div className="stat-value">{facturas.length}</div>
        </div>
        <div className={`stat${filtroEstado === 'emitida' ? ' active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFE(v => v === 'emitida' ? '' : 'emitida')}>
          <div className="stat-top">
            <div className="stat-label">Emitidas</div>
            <div className="stat-icon ic-warning"><i className="fa-solid fa-paper-plane"></i></div>
          </div>
          <div className="stat-value">{totalEmitidas}</div>
        </div>
        <div className={`stat${filtroEstado === 'pagada' ? ' active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFE(v => v === 'pagada' ? '' : 'pagada')}>
          <div className="stat-top">
            <div className="stat-label">Pagadas</div>
            <div className="stat-icon ic-success"><i className="fa-solid fa-circle-check"></i></div>
          </div>
          <div className="stat-value">{totalPagadas}</div>
        </div>
        <div className={`stat${filtroEstado === 'vencida' ? ' active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setFE(v => v === 'vencida' ? '' : 'vencida')}>
          <div className="stat-top">
            <div className="stat-label">Vencidas</div>
            <div className="stat-icon ic-danger"><i className="fa-solid fa-triangle-exclamation"></i></div>
          </div>
          <div className="stat-value">{totalVencidas}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <span className="toolbar-title">Facturas · {filtradas.length}</span>
        <div className="search-inline">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input placeholder="Buscar por número, cliente o proyecto..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>

        {/* Filtros desktop */}
        <div className="desktop-filters" style={{ display: 'contents' }}>
          <select className="select" value={filtroCliente} onChange={e => setFC(e.target.value)}>
            <option value="">Todos los clientes</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select className="select" value={filtroEstado} onChange={e => setFE(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="emitida">Emitida</option>
            <option value="pagada">Pagada</option>
            <option value="vencida">Vencida</option>
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
      {filtradas.length === 0 ? (
        <div className="empty">
          <i className="fa-solid fa-file-invoice-dollar"></i>
          <h4>Sin facturas</h4>
          <div>Ajustá los filtros o creá una nueva factura.</div>
        </div>
      ) : (
        <div className="tlist inv-list">
          <div className="inv-head">
            <div>Número</div>
            <div>Cliente</div>
            <div>Proyecto</div>
            <div>Emisión</div>
            <div>Fecha est. pago</div>
            <div>Monto</div>
            <div>Estado</div>
            <div></div>
          </div>
          {filtradas.map(f => (
            <div key={f.id} className="inv-row" onClick={() => setFacturaEditar(f)}>
              <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12.5, fontWeight: 700, color: 'var(--text-1)' }}>{f.numero}</div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-1)' }}>{f.clienteNombre}</div>
                {f.subcuentaNombre && <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{f.subcuentaNombre}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="fa-solid fa-diagram-project" style={{ fontSize: 11, color: '#3B6EF5', flexShrink: 0 }}></i>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{f.proyectoNombre}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{fmtFecha(f.fechaEmision)}</div>
              <div style={{ fontSize: 13, color: f.estaVencida ? 'var(--danger)' : 'var(--text-2)', fontWeight: f.estaVencida ? 700 : 400 }}>
                {fmtFecha(f.fechaEstimadaPago)}{f.estaVencida && <> <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 10 }}></i></>}
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)' }}>
                {fmtMoney(f.monto, f.monedaCodigo)}
              </div>
              <div><InvStatusPill codigo={f.estadoCodigo} nombre={f.estadoNombre} /></div>
              <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                {f.archivoUrl && (
                  <a href={`${API_BASE}${f.archivoUrl}`} target="_blank" rel="noreferrer" className="row-edit-btn" title="Ver archivo" onClick={e => e.stopPropagation()}>
                    <i className="fa-solid fa-file-pdf"></i>
                  </a>
                )}
                <button className="cc-menu cc-menu-danger" title="Eliminar" onClick={e => handleEliminar(f, e)}>
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalNueva && (
        <NuevaFacturaModal
          onClose={() => setModalNueva(false)}
          onGuardada={() => { setModalNueva(false); cargar(); }}
        />
      )}

      {facturaEditar && (
        <NuevaFacturaModal
          factura={facturaEditar}
          onClose={() => setFacturaEditar(null)}
          onGuardada={() => { setFacturaEditar(null); cargar(); }}
        />
      )}

      <FilterBottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onApply={(f) => { setMobileFilters(f); setSheetOpen(false); }}
        initialFilters={mobileFilters}
        asignados={nombresClientes}
      />

      {facturaEliminando && (
        <ConfirmDeleteModal
          titulo="Eliminar factura"
          mensaje={<>¿Estás seguro que querés eliminar la factura <strong>{facturaEliminando.numero}</strong>?</>}
          detalle="Esta acción no se puede deshacer. Si la factura tiene un archivo adjunto, también se eliminará."
          loading={loadingEliminar}
          error={errorEliminar}
          onConfirmar={confirmarEliminar}
          onCancelar={() => { setFacturaEliminando(null); setErrorEliminar(''); }}
        />
      )}
    </div>
  );
}
