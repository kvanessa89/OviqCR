import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClientes, eliminarCliente } from '../../api/clientes';
import { getProyectos } from '../../api/proyectos';
import { getFacturas } from '../../api/facturas';
import NuevoClienteModal from './NuevoClienteModal';
import EditarClienteModal from './EditarClienteModal';
import NuevoProyectoModal from '../proyectos/NuevoProyectoModal';
import ConfirmDeleteModal from '../../components/ui/ConfirmDeleteModal';
import type { ClienteDto, SubcuentaDto, ClasificacionDto, ProyectoDto } from '../../types';



// ── Helpers ──────────────────────────────────────────────────────────

function FacturaEmitidaTag() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: 'rgba(245,158,11,0.14)', color: '#B45309', whiteSpace: 'nowrap' }}>
      <i className="fa-solid fa-file-invoice" style={{ fontSize: 10 }} />
      Factura emitida
    </span>
  );
}

function StatusPill({ codigo, nombre }: { codigo: string; nombre: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    en_progreso: { bg: 'rgba(59,110,245,0.12)',  color: '#1D48B0' },
    en_pausa:    { bg: 'rgba(245,158,11,0.14)',  color: '#B45309' },
    finalizado:  { bg: 'rgba(16,185,129,0.12)',  color: '#047857' },
  };
  const c = map[codigo] ?? { bg: 'rgba(107,114,128,0.12)', color: '#4B5563' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block', flexShrink: 0 }}></span>
      {nombre}
    </span>
  );
}

// ── Subcomponentes ────────────────────────────────────────────────────

function SubcuentaRow({ sub, proyectos, facturasEmitidas, onVerProyecto }: {
  sub: SubcuentaDto;
  proyectos: ProyectoDto[];
  facturasEmitidas: Set<number>;
  onVerProyecto: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const subProyectos = proyectos.filter(p => p.subcuentaId === sub.id);

  return (
    <>
      <div className="sub-row" onClick={() => setOpen(o => !o)}>
        <div className="sub-left">
          <div className="sub-dot" style={{ background: '#7F77DD' }}></div>
          <div>
            <div className="sub-name">{sub.nombre}</div>
            <div className="sub-count">{subProyectos.length} {subProyectos.length === 1 ? 'proyecto' : 'proyectos'}</div>
          </div>
        </div>
        <div className="sub-right">
          <i className={`fa-solid fa-chevron-right sub-chev${open ? ' open' : ''}`}></i>
        </div>
      </div>

      {open && subProyectos.map(pr => (
        <div
          key={pr.id}
          className="sub-project-row"
          onClick={(e) => { e.stopPropagation(); onVerProyecto(pr.id); }}
        >
          <div className="sub-left">
            <i className="fa-solid fa-diagram-project sub-proj-icon" style={{ color: '#3B6EF5' }}></i>
            <div>
              <div className="sub-proj-name">{pr.nombre}</div>
              <div className="sub-count">{pr.estadoNombre}</div>
            </div>
          </div>
          <div className="sub-right">
            {facturasEmitidas.has(pr.id) && <FacturaEmitidaTag />}
            <StatusPill codigo={pr.estadoCodigo} nombre={pr.estadoNombre} />
            <i className="fa-solid fa-chevron-right sub-chev"></i>
          </div>
        </div>
      ))}

      {open && subProyectos.length === 0 && (
        <div className="acct-empty-row">Esta subcuenta aún no tiene proyectos.</div>
      )}
    </>
  );
}


function ClienteCard({ cliente, proyectos, facturasEmitidas, onVerProyecto, onEditar, onEliminar, onAgregarProyecto }: {
  cliente: ClienteDto;
  proyectos: ProyectoDto[];
  facturasEmitidas: Set<number>;
  onVerProyecto: (id: number) => void;
  onEditar: (cliente: ClienteDto) => void;
  onEliminar: (cliente: ClienteDto) => void;
  onAgregarProyecto: (clienteId: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [openClasif, setOpenClasif] = useState(true);
  const [openSinClasif, setOpenSinClasif] = useState(true);
  const [openDirectos, setOpenDirectos] = useState(true);

  const proyectosDirectos = proyectos.filter(
    p => p.clienteId === cliente.id && !p.subcuentaId
  );

  const subs = cliente.subcuentas;
  const clasifs = cliente.clasificaciones;
  const hasSubs = subs.length > 0;
  const hasClasif = clasifs.length > 0;

  const subsConClasif = subs.filter(s => s.clasificacionId);
  const subsSinClasif = subs.filter(s => !s.clasificacionId);

  return (
    <div className="acct-card">
      <div className="acct-header" onClick={() => setOpen(o => !o)}>
        <div className="acct-left">
          <div className="acct-icon" style={{ background: '#3B6EF522', color: '#3B6EF5' }}>
            <i className="fa-solid fa-briefcase"></i>
          </div>
          <div className="acct-info">
            <div className="acct-name">{cliente.nombre}</div>
            <div className="acct-meta">
              {hasSubs
                ? `${subs.length} ${subs.length === 1 ? 'subcuenta' : 'subcuentas'}${hasClasif ? ` · ${clasifs.length} ${clasifs.length === 1 ? 'clasificación' : 'clasificaciones'}` : ' · sin clasificaciones'}`
                : `Sin subcuentas · ${proyectosDirectos.length} ${proyectosDirectos.length === 1 ? 'proyecto directo' : 'proyectos directos'}`
              }
            </div>
          </div>
        </div>
        <div className="acct-right">
          <button className="cc-menu" title="Editar" onClick={e => { e.stopPropagation(); onEditar(cliente); }}>
            <i className="fa-solid fa-pen"></i>
          </button>
          <button className="cc-menu cc-menu-danger" title="Eliminar" onClick={e => { e.stopPropagation(); onEliminar(cliente); }}>
            <i className="fa-solid fa-trash"></i>
          </button>
          <i className={`fa-solid fa-chevron-right acct-chev${open ? ' open' : ''}`}></i>
        </div>
      </div>

      {open && (
        <div className="acct-body">
          {hasSubs ? (
            <>
              {/* Subcuentas por clasificación */}
              {subsConClasif.length > 0 && (
                <>
                  <div className="acct-section-label acct-section-toggle" onClick={() => setOpenClasif(o => !o)}>
                    <i className={`fa-solid fa-chevron-right sec-chev${openClasif ? ' open' : ''}`}></i>
                    <span>Subcuentas por clasificación</span>
                    <span className="sec-count">{subsConClasif.length}</span>
                  </div>
                  {openClasif && (
                    <div className="acct-clasif-section">
                      {clasifs.map(c => {
                        const grupo = subsConClasif.filter(s => s.clasificacionId === c.id);
                        if (grupo.length === 0) return null;
                        return (
                          <Fragment key={c.id}>
                            <div className="clasif-header" style={{ cursor: 'default' }}>
                              <span className="clasif-tag"><i className="fa-solid fa-tag"></i>{c.nombre}</span>
                              <span className="clasif-meta">{grupo.length} {grupo.length === 1 ? 'subcuenta' : 'subcuentas'}</span>
                            </div>
                            {grupo.map(sub => (
                              <SubcuentaRow key={sub.id} sub={sub} proyectos={proyectos} facturasEmitidas={facturasEmitidas} onVerProyecto={onVerProyecto} />
                            ))}
                          </Fragment>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Subcuentas sin clasificación */}
              {subsSinClasif.length > 0 && (
                <>
                  <div className="acct-section-label acct-section-toggle" onClick={() => setOpenSinClasif(o => !o)}>
                    <i className={`fa-solid fa-chevron-right sec-chev${openSinClasif ? ' open' : ''}`}></i>
                    <span>Subcuentas</span>
                    <span className="sec-count">{subsSinClasif.length}</span>
                  </div>
                  {openSinClasif && (
                    <div className="acct-sinclas-section">
                      {subsSinClasif.map(sub => (
                        <SubcuentaRow key={sub.id} sub={sub} proyectos={proyectos} facturasEmitidas={facturasEmitidas} onVerProyecto={onVerProyecto} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Proyectos directos al cliente (aunque tenga subcuentas) */}
              {proyectosDirectos.length > 0 && (
                <>
                  <div className="acct-section-label acct-section-toggle" onClick={() => setOpenDirectos(o => !o)}>
                    <i className={`fa-solid fa-chevron-right sec-chev${openDirectos ? ' open' : ''}`}></i>
                    <span>Proyectos directos</span>
                    <span className="sec-count">{proyectosDirectos.length}</span>
                  </div>
                  {openDirectos && (
                    <div className="acct-directos-section">
                      {proyectosDirectos.map(pr => (
                        <div key={pr.id} className="sub-row" onClick={() => onVerProyecto(pr.id)}>
                          <div className="sub-left">
                            <i className="fa-solid fa-diagram-project sub-proj-icon" style={{ color: '#3B6EF5' }}></i>
                            <div>
                              <div className="sub-name">{pr.nombre}</div>
                              <div className="sub-count">Factura directo al cliente</div>
                            </div>
                          </div>
                          <div className="sub-right">
                            {facturasEmitidas.has(pr.id) && <FacturaEmitidaTag />}
                            <StatusPill codigo={pr.estadoCodigo} nombre={pr.estadoNombre} />
                            <i className="fa-solid fa-chevron-right sub-chev"></i>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              {/* Cliente sin subcuentas — proyectos directos */}
              <div className="acct-section-label acct-section-toggle" onClick={() => setOpenDirectos(o => !o)}>
                <i className={`fa-solid fa-chevron-right sec-chev${openDirectos ? ' open' : ''}`}></i>
                <span>Proyectos directos</span>
                <span className="sec-count">{proyectosDirectos.length}</span>
              </div>
              {openDirectos && (
                <div className="acct-directos-section">
                  {proyectosDirectos.length === 0 ? (
                    <div className="acct-empty-row">Este cliente aún no tiene proyectos.</div>
                  ) : proyectosDirectos.map(pr => (
                    <div key={pr.id} className="sub-row" onClick={() => onVerProyecto(pr.id)}>
                      <div className="sub-left">
                        <div className="sub-dot" style={{ background: '#10B981' }}></div>
                        <div>
                          <div className="sub-name">{pr.nombre}</div>
                          <div className="sub-count">Factura directo al cliente</div>
                        </div>
                      </div>
                      <div className="sub-right">
                        {facturasEmitidas.has(pr.id) && <FacturaEmitidaTag />}
                        <StatusPill codigo={pr.estadoCodigo} nombre={pr.estadoNombre} />
                        <i className="fa-solid fa-chevron-right sub-chev"></i>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div
            className="acct-add-row"
            onClick={() => onAgregarProyecto(cliente.id)}
          >
            <i className="fa-solid fa-plus"></i> Agregar proyecto a {cliente.nombre}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pantalla principal ───────────────────────────────────────────────

export default function ClientesPage() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<ClienteDto[]>([]);
  const [proyectos, setProyectos] = useState<ProyectoDto[]>([]);
  const [facturasEmitidas, setFacturasEmitidas] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('activo');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<ClienteDto | null>(null);
  const [nuevoProyectoClienteId, setNuevoProyectoClienteId] = useState<number | null>(null);
  const [clienteEliminando, setClienteEliminando] = useState<ClienteDto | null>(null);
  const [errorEliminar, setErrorEliminar] = useState('');
  const [loadingEliminar, setLoadingEliminar] = useState(false);

  useEffect(() => {
    Promise.all([getClientes(), getProyectos(), getFacturas()])
      .then(([c, p, f]) => {
        setClientes(c);
        setProyectos(p);
        setFacturasEmitidas(new Set(f.filter(x => x.estadoCodigo === 'emitida').map(x => x.proyectoId)));
      })
      .finally(() => setLoading(false));
  }, []);

  const recargar = () =>
    Promise.all([getClientes(), getProyectos(), getFacturas()])
      .then(([c, p, f]) => {
        setClientes(c);
        setProyectos(p);
        setFacturasEmitidas(new Set(f.filter(x => x.estadoCodigo === 'emitida').map(x => x.proyectoId)));
      });

  const handleEliminar = (cliente: ClienteDto) => {
    setErrorEliminar('');
    setClienteEliminando(cliente);
  };

  const confirmarEliminar = async () => {
    if (!clienteEliminando) return;
    setLoadingEliminar(true);
    try {
      await eliminarCliente(clienteEliminando.id);
      setClienteEliminando(null);
      recargar();
    } catch (err: any) {
      setErrorEliminar(err.response?.data?.mensaje || 'Error al eliminar el cliente');
    } finally {
      setLoadingEliminar(false);
    }
  };

  const clientesFiltrados = clientes.filter(c => {
    const matchBusqueda = !busqueda ||
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.contacto || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      c.subcuentas.some(s => s.nombre.toLowerCase().includes(busqueda.toLowerCase()));
    const matchEstado = !filtroEstado || c.estadoCodigo === filtroEstado;
    return matchBusqueda && matchEstado;
  });

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
            <span>Clientes</span>
          </div>
          <div className="page-title">Clientes</div>
          <div className="page-subtitle">Administre tus clientes, subcuentas y sus proyectos.</div>
        </div>
        <div className="ph-right">
          <button className="btn btn-primary btn-sm" onClick={() => setModalAbierto(true)}>
            <i className="fa-solid fa-plus"></i> Nuevo cliente
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <span className="toolbar-title">Listado de clientes · {clientesFiltrados.length}</span>
        <div className="search-inline">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            placeholder="Buscar cliente o subcuenta..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <select
          className="select"
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>

      {/* Lista de clientes */}
      {clientesFiltrados.length === 0 ? (
        <div className="empty">
          <i className="fa-solid fa-user-group"></i>
          <h4>Sin resultados</h4>
          <div>Ajustá los filtros o creá un nuevo cliente.</div>
        </div>
      ) : (
        <div className="acct-list">
          {clientesFiltrados.map(cliente => (
            <ClienteCard
              key={cliente.id}
              cliente={cliente}
              proyectos={proyectos}
              facturasEmitidas={facturasEmitidas}
              onVerProyecto={(id) => navigate(`/proyectos/${id}`)}
              onEditar={setClienteEditando}
              onEliminar={handleEliminar}
              onAgregarProyecto={setNuevoProyectoClienteId}
            />
          ))}
        </div>
      )}
      {modalAbierto && (
        <NuevoClienteModal
          onClose={() => setModalAbierto(false)}
          onCreado={() => { setModalAbierto(false); recargar(); }}
        />
      )}
      {nuevoProyectoClienteId !== null && (
        <NuevoProyectoModal
          clienteIdInicial={nuevoProyectoClienteId}
          onClose={() => { setNuevoProyectoClienteId(null); recargar(); }}
          onCreado={() => setNuevoProyectoClienteId(null)}
        />
      )}
      {clienteEditando && (
        <EditarClienteModal
          cliente={clienteEditando}
          onClose={() => { setClienteEditando(null); recargar(); }}
          onGuardado={() => setClienteEditando(null)}
        />
      )}
      {clienteEliminando && (
        <ConfirmDeleteModal
          titulo="Eliminar cliente"
          mensaje={<>¿Estás seguro que querés eliminar el cliente <strong>{clienteEliminando.nombre}</strong>?</>}
          detalle="Esta acción no se puede deshacer. Si el cliente tiene proyectos asociados, no puede eliminarse."
          loading={loadingEliminar}
          error={errorEliminar}
          onConfirmar={confirmarEliminar}
          onCancelar={() => { setClienteEliminando(null); setErrorEliminar(''); }}
        />
      )}
    </div>
  );
}
