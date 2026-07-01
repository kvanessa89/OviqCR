import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProyectos } from '../../api/proyectos';
import { getTickets } from '../../api/tickets';
import { getClientes } from '../../api/clientes';
import type { ProyectoDto, TicketDto, ClienteDto } from '../../types';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState<ProyectoDto[]>([]);
  const [tickets, setTickets]     = useState<TicketDto[]>([]);
  const [clientes, setClientes]   = useState<ClienteDto[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([getProyectos(), getTickets(), getClientes()])
      .then(([p, t, c]) => { setProyectos(p); setTickets(t); setClientes(c); })
      .finally(() => setLoading(false));
  }, []);

  const hoy = new Date().toISOString().slice(0, 10);

  const proyectosActivos   = proyectos.filter(p => p.estadoCodigo === 'en_progreso' || p.estadoCodigo === 'en_pausa');
  const proyectosAtrasados = proyectos.filter(p =>
    (p.estadoCodigo === 'en_progreso' || p.estadoCodigo === 'en_pausa') && p.fechaFin && p.fechaFin < hoy
  );
  const ticketsAtrasados  = tickets.filter(t =>
    t.estadoCodigo !== 'completado' && t.fechaFin && t.fechaFin < hoy
  );
  const pendientesFacturar = proyectos.filter(p => p.estadoCodigo === 'finalizado' && p.cantidadFacturasEmitidas === 0);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-3)' }}>
      <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 10 }}></i> Cargando...
    </div>
  );

  return (
    <div>
      <div className="page-head">
        <div className="ph-left">
          <div className="page-title">Vista general</div>
          <div className="page-subtitle">
            {new Date().toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="vg-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <div className="vg-kpi" style={{ borderLeftColor: 'var(--danger)' }}>
          <div className="vg-kpi-label">Tickets atrasados</div>
          <div className="vg-kpi-val" style={{ color: 'var(--danger)' }}>{ticketsAtrasados.length}</div>
          <div className="vg-kpi-sub">Requieren atención</div>
        </div>
        <div className="vg-kpi" style={{ borderLeftColor: 'var(--warning)' }}>
          <div className="vg-kpi-label">Pendientes de facturar</div>
          <div className="vg-kpi-val" style={{ color: 'var(--warning)' }}>{pendientesFacturar.length}</div>
          <div className="vg-kpi-sub">Proyectos finalizados sin factura</div>
        </div>
        <div className="vg-kpi" style={{ borderLeftColor: 'var(--primary)' }}>
          <div className="vg-kpi-label">Proyectos activos</div>
          <div className="vg-kpi-val">{proyectosActivos.length}</div>
          <div className="vg-kpi-sub">{proyectosAtrasados.length} atrasados</div>
        </div>
        <div className="vg-kpi" style={{ borderLeftColor: 'var(--success)' }}>
          <div className="vg-kpi-label">Clientes</div>
          <div className="vg-kpi-val">{clientes.length}</div>
          <div className="vg-kpi-sub">Total registrados</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Proyectos atrasados */}
        <div>
          <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>Proyectos atrasados</span>
            <span style={{ fontSize: 12, color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/proyectos')}>Ver todos →</span>
          </div>
          <div className="card">
            {proyectosAtrasados.length === 0
              ? <div style={{ padding: '20px 16px', fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>Sin proyectos atrasados ✓</div>
              : proyectosAtrasados.map(p => (
                <div key={p.id} className="list-row" onClick={() => navigate(`/proyectos/${p.id}`)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0, display: 'inline-block' }}></span>
                    <div>
                      <div style={{ fontSize: 13.5, color: 'var(--text-1)', fontWeight: 500 }}>{p.nombre}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.clienteNombre}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, background: 'var(--danger-50)', color: 'var(--danger)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>Atrasado</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Tickets atrasados */}
        <div>
          <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>Tickets atrasados</span>
            <span style={{ fontSize: 12, color: 'var(--primary)', cursor: 'pointer' }} onClick={() => navigate('/tickets')}>Ver todos →</span>
          </div>
          <div className="card">
            {ticketsAtrasados.length === 0
              ? <div style={{ padding: '20px 16px', fontSize: 13, color: 'var(--text-3)', textAlign: 'center' }}>Sin tickets atrasados ✓</div>
              : ticketsAtrasados.slice(0, 5).map(t => (
                <div key={t.id} className="list-row"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0, display: 'inline-block' }}></span>
                    <div>
                      <div style={{ fontSize: 13.5, color: 'var(--text-1)', fontWeight: 500 }}>{t.titulo}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{t.proyectoNombre} · {t.usuarioNombre}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>{t.codigo}</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Proyectos pendientes de facturar */}
        {pendientesFacturar.length > 0 && (
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-1)' }}>Pendientes de facturar</span>
            </div>
            <div className="card">
              {pendientesFacturar.map(p => (
                <div key={p.id} className="list-row" onClick={() => navigate(`/proyectos/${p.id}`)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--warning)', flexShrink: 0, display: 'inline-block' }}></span>
                    <div>
                      <div style={{ fontSize: 13.5, color: 'var(--text-1)', fontWeight: 500 }}>{p.nombre}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.clienteNombre}{p.subcuentaNombre ? ` · ${p.subcuentaNombre}` : ''}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, background: 'var(--warning-50)', color: 'var(--warning)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>Pendiente de facturar</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
