/* ═══════════════════════════════════════════════════════════════════
   OVIQ · Views — Dashboard, Clientes, Proyectos, Proyecto Detalle,
   Tickets list, Kanban, Calendario, Trabajadores, Configuración.
   ═══════════════════════════════════════════════════════════════════ */
const { useState, useEffect, useMemo, useRef } = React;

const useApp     = window.OVIQ_useApp;
const fmtDate    = window.OVIQ_fmtDate;
const shortDate  = window.OVIQ_shortDate;
const daysUntil  = window.OVIQ_daysUntil;
const statusBadge = window.OVIQ_statusBadgeClass;

/* ─── Small shared pieces ─── */
const Avatar = ({ name='', color='#3B6EF5', initials, size='md', style }) => {
  const i = initials || (name.split(/\s+/).map(s=>s[0]).slice(0,2).join('') || '?').toUpperCase();
  return <div className={'av av-' + size} style={{ background: color, ...style }}>{i}</div>;
};
const PriorityTag = ({ p }) => <span className={'priority-tag pri-' + (p||'media').toLowerCase()}><span className="pp"></span>{p}</span>;
const StatusPill = ({ s }) => <span className={'badge ' + statusBadge(s)}><span className="dot"></span>{s}</span>;
const AvatarStack = ({ workers }) => (
  <div className="avatar-stack">
    {workers.slice(0,4).map(w => <div key={w.id} className="av" style={{ background: w.color, width:24, height:24, fontSize:10, borderRadius:'50%' }}>{w.initials}</div>)}
    {workers.length > 4 && <div className="av" style={{ background:'#CBD5E1', color:'#334155', width:24, height:24, fontSize:10, borderRadius:'50%' }}>+{workers.length-4}</div>}
  </div>
);
const Empty = ({ icon='fa-inbox', title='Nada por aquí', sub }) => (
  <div className="empty">
    <i className={'fa-solid ' + icon}></i>
    <h4>{title}</h4>
    {sub && <div>{sub}</div>}
  </div>
);

/* ─────────────────────── DASHBOARD · TRABAJADOR ───────────────────────
   Vista rápida con métricas de los tickets propios del trabajador. */
function ViewDashboardWorker() {
  const { scopedTickets, projects, currentUser, go, setDetail, setModal } = useApp();
  const today = new Date(); today.setHours(0,0,0,0);

  // Mapeo de estados (columnas del tablero): Por hacer → Pendiente (en progreso) → Completado
  const open       = scopedTickets.filter(t => t.status !== 'Completado');
  const porHacer   = scopedTickets.filter(t => t.status === 'Por hacer');
  const enProgreso = scopedTickets.filter(t => t.status === 'Pendiente');
  const atrasados  = open.filter(t => t.due && daysUntil(t.due) < 0);
  const completados= scopedTickets.filter(t => t.status === 'Completado');
  const hoy        = open.filter(t => t.due && daysUntil(t.due) === 0);

  const monthsEs = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const days = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  const fullDate = `${days[today.getDay()]}, ${today.getDate()} de ${monthsEs[today.getMonth()]} ${today.getFullYear()}`;
  const firstName = (currentUser.name || '').split(/\s+/)[0];

  // Lista de pendientes: atrasados primero, luego por fecha de vencimiento ascendente.
  const myOpen = [...open].sort((a, b) => {
    const da = a.due ? daysUntil(a.due) : 9999;
    const db = b.due ? daysUntil(b.due) : 9999;
    return da - db;
  });
  const findProject = id => projects.find(p => p.id === id);
  const dueLabel = (iso) => {
    if (!iso) return 'Sin fecha';
    const n = daysUntil(iso);
    if (n < 0) return `Atrasado ${-n} ${-n === 1 ? 'día' : 'días'}`;
    if (n === 0) return 'Vence hoy';
    if (n === 1) return 'Vence mañana';
    return `Vence en ${n} días`;
  };

  return (
    <div className="content vg" data-screen-label="Vista rápida">
      <div className="page-head">
        <div className="ph-left">
          <div className="page-title" style={{ textTransform:'none' }}>Hola, {firstName}</div>
          <div className="page-subtitle">{fullDate}</div>
        </div>
        <div className="ph-right">
          <button className="btn btn-outline btn-sm" onClick={() => go('kanban')}><i className="fa-solid fa-columns"></i> Tablero</button>
          <button className="btn btn-outline btn-sm" onClick={() => go('calendario')}><i className="fa-solid fa-calendar-days"></i> Calendario</button>
        </div>
      </div>

      {/* KPIs de mis tickets */}
      <div className="stats-grid" style={{ marginBottom: 22 }}>
        <StatCard
          label="Pendientes"
          value={open.length}
          icon="fa-list-check"
          tone="primary"
          delta={porHacer.length > 0 ? `${porHacer.length} por iniciar` : 'Todo iniciado'}
          onClick={() => go('tickets')}
        />
        <StatCard
          label="En progreso"
          value={enProgreso.length}
          icon="fa-spinner"
          tone="warning"
          delta={hoy.length > 0 ? `${hoy.length} vence${hoy.length === 1 ? '' : 'n'} hoy` : 'En curso'}
          onClick={() => go('kanban')}
        />
        <StatCard
          label="Atrasados"
          value={atrasados.length}
          icon="fa-triangle-exclamation"
          tone="danger"
          delta={atrasados.length > 0 ? 'Requieren atención' : 'Sin atrasos'}
          onClick={() => go('tickets')}
        />
        <StatCard
          label="Completados"
          value={completados.length}
          icon="fa-circle-check"
          tone="success"
          delta="Cerrados"
          onClick={() => go('kanban')}
        />
      </div>

      {/* Mis pendientes */}
      <div className="vg-section-head">
        <span className="vg-section-title">Mis pendientes</span>
        <a className="vg-link" onClick={() => go('tickets')}>Ver todos</a>
      </div>
      <div className="vg-card">
        {myOpen.length === 0 ? (
          <Empty icon="fa-mug-hot" title="Sin pendientes" sub="No tienes tickets abiertos asignados." />
        ) : myOpen.slice(0, 8).map(t => {
          const p = findProject(t.projectId);
          const overdue = t.due && daysUntil(t.due) < 0;
          const dueHoy = t.due && daysUntil(t.due) === 0;
          return (
            <div key={t.id} className="vg-ticket-row" onClick={() => setDetail({ kind:'ticket', id:t.id })}>
              <span className="vg-ticket-dot" style={{ background: p?.color || '#3B6EF5' }}></span>
              <div className="vg-ticket-main">
                <div className="vg-ticket-title">{t.title}</div>
                <div className="vg-ticket-meta">{t.code} · {p?.name || 'Sin proyecto'}</div>
              </div>
              <PriorityTag p={t.priority} />
              <span className={'vg-ticket-due' + (overdue ? ' overdue' : dueHoy ? ' today' : '')}>{dueLabel(t.due)}</span>
              <StatusPill s={t.status} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────── DASHBOARD ─────────────────────── */
function ViewDashboard() {
  const _app = useApp();
  if (_app.currentUser?.role === 'Trabajador') return <ViewDashboardWorker />;
  const { clients, projects, tickets, invoices, notes, go, setModal, currentUser, toggleNote, deleteNote } = useApp();
  const today = new Date(); today.setHours(0,0,0,0);

  const invStatus = (i) => {
    if (i.status === 'Emitida' && new Date(i.dueDate) < today) return 'Vencida';
    return i.status;
  };
  const enrichedInv = invoices.map(i => ({ ...i, _statusEff: invStatus(i) }));
  const vencidas = enrichedInv.filter(i => i._statusEff === 'Vencida');
  const porCobrar = enrichedInv.filter(i => i._statusEff === 'Emitida' || i._statusEff === 'Vencida');
  // Sum in CRC (USD/EUR collapsed back via rough rate). For dashboard precision: keep currencies separate but show CRC total. We display dominant currency CRC.
  const sumCRC = (list) => list.filter(i => (i.currency||'CRC') === 'CRC').reduce((a,b)=>a+(b.amount||0), 0);
  const sumUSD = (list) => list.filter(i => i.currency === 'USD').reduce((a,b)=>a+(b.amount||0), 0);

  const fmtCompact = (n, cur='CRC') => {
    const sym = cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '₡';
    const abs = Math.abs(n);
    if (abs >= 1e6) return sym + (n/1e6).toFixed(1).replace(/\.0$/,'') + 'M';
    if (abs >= 1e3) return sym + Math.round(n/1e3) + 'K';
    return sym + Math.round(n);
  };
  const fmtFull = (n, cur='CRC') => {
    const sym = cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '₡';
    return sym + (n||0).toLocaleString('es-CR', { maximumFractionDigits: cur==='CRC'?0:2 });
  };

  const completedNotInvoiced = projects.filter(p => p.completed && !p.invoiced);
  const activeProjects = projects.filter(p => p.status === 'En progreso');
  const projectsOverdue = projects.filter(p => p.status !== 'Finalizado' && p.end && new Date(p.end) < today);
  const ticketsOverdue = tickets.filter(t => t.status !== 'Completado' && t.due && daysUntil(t.due) < 0);

  const daysAgo = (iso) => {
    if (!iso) return 0;
    const d = Math.floor((today - new Date(iso)) / 86400000);
    return d;
  };
  const venceLabel = (iso) => {
    const n = daysAgo(iso);
    if (n === 0) return 'venció hoy';
    if (n === 1) return 'venció ayer';
    if (n > 0) return `venció hace ${n} días`;
    return `vence en ${-n} días`;
  };
  const completadoLabel = (iso) => {
    const n = daysAgo(iso);
    if (n <= 0) return 'completado hoy';
    if (n === 1) return 'completado ayer';
    return `completado hace ${n} días`;
  };
  const atrasoLabel = (iso) => {
    const n = daysAgo(iso);
    if (n <= 0) return 'al día';
    return `${n} ${n === 1 ? 'día' : 'días'} de atraso`;
  };

  // Resumen del mes — issueDate within current month (configurable)
  const ym = (iso) => iso ? iso.slice(0,7) : '';
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const monthInv = enrichedInv.filter(i => ym(i.issueDate) === monthKey && (i.currency||'CRC') === 'CRC');
  const facturadoMes = monthInv.reduce((a,b)=>a+(b.amount||0), 0);
  const ivaMes = monthInv.reduce((a,b)=> a + (b.sinIva ? 0 : (b.amount||0) * 0.13), 0);
  const cobradoMes = monthInv.filter(i => i._statusEff === 'Pagada').reduce((a,b)=>a+(b.amount||0), 0);
  const porCobrarMes = facturadoMes - cobradoMes;
  const monthsEs = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const [selYear, selMonth] = monthKey.split('-').map(Number);
  const monthLabel = `${monthsEs[selMonth-1]} ${selYear}`;
  const fullDate = (() => {
    const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    return `${days[today.getDay()]}, ${today.getDate()} de ${monthsEs[today.getMonth()].toLowerCase()} ${today.getFullYear()}`;
  })();

  const [overdueTab, setOverdueTab] = useState('proyectos');

  const findClient = id => clients.find(c => c.id === id);
  const findProject = id => projects.find(p => p.id === id);

  const sortedVencidas = [...vencidas].sort((a,b) => (a.dueDate||'').localeCompare(b.dueDate||'')).slice(0, 5);
  const sortedPendingInv = [...completedNotInvoiced].sort((a,b) => (b.end||'').localeCompare(a.end||'')).slice(0, 5);
  const sortedProjOverdue = [...projectsOverdue].sort((a,b) => (a.end||'').localeCompare(b.end||'')).slice(0, 6);
  const sortedTicketOverdue = [...ticketsOverdue].sort((a,b) => (a.due||'').localeCompare(b.due||'')).slice(0, 6);

  // En progreso
  const ticketsActive = tickets.filter(t => t.status !== 'Completado');
  const sortedProjActive = [...activeProjects].sort((a,b) => (a.end||'').localeCompare(b.end||'')).slice(0, 6);
  const sortedTicketActive = [...ticketsActive].sort((a,b) => (a.due||'').localeCompare(b.due||'')).slice(0, 6);

  // Compose subtitle line for invoice rows: "#NUM · venció hace X días"
  return (
    <div className="content vg" data-screen-label="Vista rápida">
      <div className="page-head">
        <div className="ph-left">
          <div className="page-title" style={{ textTransform:'none' }}>Vista rápida</div>
          <div className="page-subtitle">{fullDate}</div>
        </div>
        <div className="ph-right">
          <button className="btn btn-outline btn-sm" onClick={() => go('calendario')}><i className="fa-solid fa-calendar-days"></i> Calendario</button>
          <button className="btn btn-primary btn-sm" onClick={() => setModal({ kind: 'ticket' })}><i className="fa-solid fa-plus"></i> Nuevo ticket</button>
          <button className="btn btn-primary btn-sm" onClick={() => setModal({ kind: 'note' })}><i className="fa-solid fa-note-sticky"></i> Nueva nota</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="stats-grid" style={{ marginBottom: 22 }}>
        <StatCard
          label="Facturas vencidas"
          value={vencidas.length}
          icon="fa-triangle-exclamation"
          tone="danger"
          delta={vencidas.length > 0 ? 'Requieren atención' : 'Sin atrasos'}
          onClick={()=>go('facturacion')}
        />
        <StatCard
          label="Pendientes de pago"
          value={porCobrar.length}
          icon="fa-clock"
          tone="warning"
          delta={`${fmtCompact(sumCRC(porCobrar))} por cobrar${sumUSD(porCobrar) > 0 ? ` · ${fmtCompact(sumUSD(porCobrar),'USD')}` : ''}`}
          onClick={()=>go('facturacion')}
        />
        <StatCard
          label="Pendientes de facturar"
          value={completedNotInvoiced.length}
          icon="fa-file-invoice-dollar"
          tone="warning"
          delta="Proyectos completados"
          onClick={()=>{ go('proyectos', { flagFilter: 'pending-invoice' }); }}
        />
        <StatCard
          label="Mis notas"
          value={(notes || []).filter(n => n.owner === (currentUser?.initials || 'DV') && !n.done).length}
          icon="fa-note-sticky"
          tone="primary"
          delta="Pendientes"
          onClick={()=>{
            const el = document.querySelector('.vg-notes');
            if (el) {
              const top = el.getBoundingClientRect().top + window.scrollY - 80;
              window.scrollTo({ top, behavior: 'smooth' });
            } else {
              setModal({ kind:'note' });
            }
          }}
        />
      </div>

      {/* Notas de los administradores — visibles para todos; solo se muestra si hay notas */}
      {(() => {
        const allNotes = (notes || []);
        if (allNotes.length === 0) return null;
        const openCount = allNotes.filter(n => !n.done).length;
        return (
          <div className="vg-notes">
            <div className="vg-section-head">
              <span className="vg-section-title">
                Notas
                <span className="vg-notes-count">{openCount} pendiente{openCount === 1 ? '' : 's'}</span>
              </span>
            </div>
            <div className="vg-card">
              {allNotes.map(n => (
                <div key={n.id} className={'vg-note-row' + (n.done ? ' done' : '')}>
                  <button
                    type="button"
                    className="vg-note-check"
                    onClick={()=>toggleNote(n.id)}
                    aria-label={n.done ? 'Marcar como pendiente' : 'Marcar como hecha'}
                    title={n.done ? 'Marcar como pendiente' : 'Marcar como hecha'}
                  >
                    {n.done && <i className="fa-solid fa-check"></i>}
                  </button>
                  <div className="vg-note-text" onClick={()=>setModal({ kind:'note', data: n })}>
                    {n.description}
                  </div>
                  <Avatar initials={n.owner} style={{ width:24, height:24, fontSize:10, borderRadius:'50%', flexShrink:0 }} title={'Creada por ' + n.owner} />
                  <button
                    type="button"
                    className="vg-note-del"
                    onClick={()=>deleteNote(n.id)}
                    title="Eliminar nota"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Two-col content */}
      <div className="vg-two-col">
        {/* Left: Facturas vencidas */}
        <div>
          <div className="vg-section-head">
            <span className="vg-section-title">Facturas vencidas</span>
            <span className="vg-link" onClick={()=>go('facturacion')}>Ver todas →</span>
          </div>
          <div className="vg-card">
            {sortedVencidas.length === 0
              ? <div className="vg-empty">No hay facturas vencidas. 🎉</div>
              : sortedVencidas.map(inv => {
                const sub = inv.subClientId ? findClient(inv.subClientId) : null;
                const cli = findClient(inv.clientId);
                const proj = inv.projectId ? findProject(inv.projectId) : null;
                const second = sub?.name || cli?.name;
                const subParts = [];
                if (proj?.name) subParts.push(proj.name);
                if (second) subParts.push(second);
                const subtitle = subParts.join(' · ');
                return (
                  <div key={inv.id} className="vg-list-row" onClick={()=>setModal({ kind:'invoice', data: { ...inv, lockClient: true, lockProject: true, vencidaEdit: true } })}>
                    <div className="vg-row-left">
                      <span className="vg-dot vg-dot-danger"></span>
                      <div className="vg-row-info">
                        <div className="vg-row-name">{subtitle || cli?.name || '—'}</div>
                        <div className="vg-row-meta">{inv.number} · {venceLabel(inv.dueDate)}</div>
                      </div>
                    </div>
                    <div className="vg-row-right">
                      <span className="vg-amt">{fmtFull(inv.amount, inv.currency)}</span>
                      <i className="fa-solid fa-chevron-right vg-chev"></i>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right: Proyectos pendientes de facturar */}
        <div>
          <div className="vg-section-head">
            <span className="vg-section-title">Proyectos pendientes de facturar</span>
            <span className="vg-link" onClick={()=>go('proyectos', { flagFilter: 'pending-invoice' })}>Ver todos →</span>
          </div>
          <div className="vg-card">
            {sortedPendingInv.length === 0
              ? <div className="vg-empty">No hay proyectos pendientes de facturar.</div>
              : sortedPendingInv.map(p => {
                const cli = findClient(p.subClientId) || findClient(p.clientId);
                return (
                  <div key={p.id} className="vg-list-row" onClick={()=>go('proyecto-detalle', { projectId: p.id })}>
                    <div className="vg-row-left">
                      <span className="vg-dot vg-dot-warn"></span>
                      <div className="vg-row-info">
                        <div className="vg-row-name">{p.name}{p.po?.poNumber ? <span style={{ fontFamily:'var(--font-mono)', color:'var(--text-3)', fontWeight:600, marginLeft:6 }}>· {p.po.poNumber}</span> : ''}</div>
                        <div className="vg-row-meta">{cli?.name || '—'} · {completadoLabel(p.end)}</div>
                      </div>
                    </div>
                    <div className="vg-row-right">
                      <i className="fa-solid fa-chevron-right vg-chev"></i>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Bottom row: Proyectos y tickets en progreso · Resumen del mes */}
      <div className="vg-two-col" style={{ marginTop:18 }}>
        <div>
          <div className="vg-section-head">
            <span className="vg-section-title">Proyectos y tickets en progreso</span>
            <span className="vg-link" onClick={()=>go(overdueTab === 'proyectos' ? 'proyectos' : 'tickets')}>Ver todos →</span>
          </div>
          <div className="vg-tab-bar">
            <button className={'vg-tab' + (overdueTab === 'proyectos' ? ' active' : '')} onClick={()=>setOverdueTab('proyectos')}>
              Proyectos {sortedProjActive.length > 0 && <span className="vg-tab-count">{activeProjects.length}</span>}
            </button>
            <button className={'vg-tab' + (overdueTab === 'tickets' ? ' active' : '')} onClick={()=>setOverdueTab('tickets')}>
              Tickets {ticketsActive.length > 0 && <span className="vg-tab-count">{ticketsActive.length}</span>}
            </button>
          </div>
          <div className="vg-card">
            {overdueTab === 'proyectos' ? (
              sortedProjActive.length === 0
                ? <div className="vg-empty">No hay proyectos en progreso.</div>
                : sortedProjActive.map(p => {
                  const cli = findClient(p.subClientId) || findClient(p.clientId);
                  const isOverdue = p.end && new Date(p.end) < today;
                  return (
                    <div key={p.id} className="vg-list-row" onClick={()=>go('proyecto-detalle', { projectId: p.id })}>
                      <div className="vg-row-left">
                        <span className={'vg-dot ' + (isOverdue ? 'vg-dot-danger' : 'vg-dot-primary')}></span>
                        <div className="vg-row-info">
                          <div className="vg-row-name">{p.name}</div>
                          <div className="vg-row-meta">{cli?.name || '—'} · entrega {shortDate(p.end)}{isOverdue ? ' · ' + atrasoLabel(p.end) : ''}</div>
                        </div>
                      </div>
                      <div className="vg-row-right">
                        <span className={'vg-badge ' + (isOverdue ? 'vg-badge-danger' : 'vg-badge-primary')}>{isOverdue ? 'Atrasado' : 'En progreso'}</span>
                        <i className="fa-solid fa-chevron-right vg-chev"></i>
                      </div>
                    </div>
                  );
                })
            ) : (
              sortedTicketActive.length === 0
                ? <div className="vg-empty">No hay tickets en progreso.</div>
                : sortedTicketActive.map(t => {
                  const proj = findProject(t.projectId);
                  const isOverdue = t.due && daysUntil(t.due) < 0;
                  return (
                    <div key={t.id} className="vg-list-row" onClick={()=>setModal({ kind:'ticket', data: t })}>
                      <div className="vg-row-left">
                        <span className={'vg-dot ' + (isOverdue ? 'vg-dot-danger' : 'vg-dot-primary')}></span>
                        <div className="vg-row-info">
                          <div className="vg-row-name">{t.title}</div>
                          <div className="vg-row-meta">{proj?.name || '—'} · entrega {shortDate(t.due)}{isOverdue ? ' · ' + atrasoLabel(t.due) : ''}</div>
                        </div>
                      </div>
                      <div className="vg-row-right">
                        <span className={'vg-badge ' + (isOverdue ? 'vg-badge-danger' : 'vg-badge-primary')}>{isOverdue ? 'Atrasado' : t.status}</span>
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
              onChange={(e)=>setMonthKey(e.target.value || currentMonthKey)}
              aria-label="Seleccionar mes"
            />
          </div>
          <div className="vg-card">
            <div className="vg-mes">
              <div className="vg-mes-title">{monthLabel}</div>
              <div className="vg-mes-nums">
                <div className="vg-mes-item">
                  <div className="vg-mes-val">{fmtFull(facturadoMes)}</div>
                  <div className="vg-mes-label">Facturado</div>
                </div>
                <div className="vg-mes-item">
                  <div className="vg-mes-val">{fmtFull(ivaMes)}</div>
                  <div className="vg-mes-label">IVA (13%)</div>
                </div>
                <div className="vg-mes-item">
                  <div className="vg-mes-val">{fmtFull(cobradoMes)}</div>
                  <div className="vg-mes-label">Pagado</div>
                </div>
                <div className="vg-mes-item">
                  <div className="vg-mes-val vg-val-warn">{fmtFull(porCobrarMes)}</div>
                  <div className="vg-mes-label">Pendiente de pago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function StatCard({ label, value, icon, tone, delta, onClick, active }) {
  return (
    <div className={'stat' + (onClick ? ' clickable' : '') + (active ? ' active' : '')} onClick={onClick}>
      <div className="stat-top">
        <div className="stat-label">{label}</div>
        <div className={'stat-icon ic-' + tone}><i className={'fa-solid ' + icon}></i></div>
      </div>
      <div className="stat-value">{value}</div>
      <div className={'stat-delta flat'}>{delta}</div>
    </div>
  );
}
function StatusBar({ data }) {
  const total = data.reduce((s,x)=>s+x.n,0) || 1;
  const colors = { 'Por hacer':'#94A3B8', 'Pendiente':'#3B6EF5', 'Completado':'#10B981' };
  return (
    <div>
      <div style={{ display:'flex', height:12, borderRadius:999, overflow:'hidden', background:'var(--bg-subtle)' }}>
        {data.map(d => <div key={d.s} style={{ width: (d.n/total*100)+'%', background:colors[d.s], transition:'width .4s ease' }} title={d.s + ': ' + d.n}></div>)}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:14, gap:10, flexWrap:'wrap' }}>
        {data.map(d => (
          <div key={d.s} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:10, height:10, borderRadius:3, background:colors[d.s] }}></div>
            <div>
              <div style={{ fontSize:13, fontWeight:800, color:'var(--text-1)' }}>{d.n}</div>
              <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600 }}>{d.s}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function MiniProject({ project }) {
  const { tickets, clients, workers, go } = useApp();
  const tkts = tickets.filter(t => t.projectId === project.id);
  const done = tkts.filter(t => t.status === 'Completado').length;
  const pct = tkts.length ? Math.round(done/tkts.length*100) : 0;
  const client = clients.find(c => c.id === project.clientId);
  const teamIds = [...new Set(tkts.map(t=>t.assigneeId))];
  const team = workers.filter(w => teamIds.includes(w.id));
  return (
    <div className="proj-card" onClick={() => go('proyecto-detalle', { projectId: project.id })}>
      <div className="proj-head">
        <div className="proj-icon" style={{ background: project.color }}><i className={project.icon}></i></div>
        <div style={{ flex:1, minWidth:0 }}>
          <div className="proj-name">{project.name}</div>
          <div className="proj-client">{client?.name || '—'}</div>
        </div>
      </div>
      <div>
        <div className="progress"><div className="progress-fill" style={{ width: pct+'%', background: project.color }}></div></div>
        <div className="progress-meta"><span>{done}/{tkts.length} tickets</span><span>{pct}%</span></div>
      </div>
      <div className="proj-footer">
        <AvatarStack workers={team} />
        <span className="kcard-due"><i className="fa-regular fa-calendar"></i>{shortDate(project.end)}</span>
      </div>
    </div>
  );
}

/* ─────────────────────── CLIENTES ─────────────────────── */
function ViewClientes() {
  const { clients, projects, tickets, invoices, setModal, setDetail, go, deleteClient } = useApp();
  const today = new Date(); today.setHours(0,0,0,0);
  // Status effective considering due date
  const invStatus = (i) => {
    if (i.status === 'Emitida' && new Date(i.dueDate) < today) return 'Vencida';
    return i.status;
  };
  // Invoices for a parent account: all (including its subs)
  const invForParent = (cid) => invoices.filter(i => i.clientId === cid);
  // Invoices for a sub account
  const invForSub = (sid) => invoices.filter(i => i.subClientId === sid);
  const countByStatus = (list, status) => list.filter(i => invStatus(i) === status).length;
  const invForProject = (pid) => invoices.filter(i => i.projectId === pid);
  const projInvTags = (pid) => {
    const invs = invForProject(pid);
    const em = countByStatus(invs, 'Emitida');
    const ve = countByStatus(invs, 'Vencida');
    return (<>
      {em > 0 && <span className="inv-tag inv-tag-pending"><i className="fa-solid fa-paper-plane"></i>{em} {em===1?'factura emitida':'facturas emitidas'}</span>}
      {ve > 0 && <span className="inv-tag inv-tag-overdue"><i className="fa-solid fa-triangle-exclamation"></i>{ve} {ve===1?'factura vencida':'facturas vencidas'}</span>}
    </>);
  };
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('Activo');
  const [open, setOpen] = useState({}); // todas las cuentas inicialmente colapsadas

  const parents = clients.filter(c => !c.parentId);
  const subsOf = (pid) => clients.filter(c => c.parentId === pid);

  const matches = (c) => {
    if (q && !(c.name + ' ' + (c.contact||'') + ' ' + (c.industry||'')).toLowerCase().includes(q.toLowerCase())) return false;
    if (status && c.status !== status) return false;
    return true;
  };

  // Una cuenta principal aparece si ella matchea, o alguna subcuenta matchea
  const visibleParents = parents.filter(p => {
    if (matches(p)) return true;
    return subsOf(p.id).some(matches);
  });

  const subCount = clients.filter(c => c.parentId).length;
  const activeProjCount = projects.filter(p => p.status === 'En progreso').length;
  const getClasifs = (s) => Array.isArray(s.classifications) ? s.classifications : (s.classification ? [s.classification] : []);
  const clasifPairs = new Set();
  clients.filter(c => c.parentId).forEach(s => getClasifs(s).forEach(k => clasifPairs.add(s.parentId + '::' + k)));
  const clasifCount = clasifPairs.size;

  const toggle = (id) => setOpen(o => ({ ...o, [id]: !o[id] }));
  const [clasifOpen, setClasifOpen] = useState({});
  const toggleClasif = (key) => setClasifOpen(o => ({ ...o, [key]: !o[key] }));
  const isClasifOpen = (key) => clasifOpen[key] !== false; // default open
  const [subOpen, setSubOpen] = useState({});
  const toggleSub = (id) => setSubOpen(o => ({ ...o, [id]: !o[id] }));
  const [sectionOpen, setSectionOpen] = useState({}); // key: `${cId}::subs` / `::direct`
  const toggleSection = (key) => setSectionOpen(o => ({ ...o, [key]: !(o[key] !== false) }));
  const isSectionOpen = (key) => sectionOpen[key] !== false; // default open

  return (
    <div className="content" data-screen-label="Clientes">
      <div className="page-head">
        <div className="ph-left">
          <div className="crumb"><a onClick={()=>go('clientes')}>Inicio</a><span className="sep">›</span><span>Clientes</span></div>
          <div className="page-title">Clientes</div>
          <div className="page-subtitle">Administra tus clientes, subcuentas y sus proyectos.</div>
        </div>
        <div className="ph-right">
          <button className="btn btn-primary btn-sm" onClick={() => setModal({ kind:'client' })}><i className="fa-solid fa-plus"></i> Nuevo Cliente</button>
        </div>
      </div>

      <div className="toolbar">
        <span className="toolbar-title">Listado de Clientes · {visibleParents.length}</span>
        <div className="search-inline"><i className="fa-solid fa-magnifying-glass"></i><input placeholder="Buscar cliente o subcuenta..." value={q} onChange={e=>setQ(e.target.value)} /></div>
        <select className="select" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          <option>Activo</option><option>Prospecto</option><option>Inactivo</option>
        </select>
      </div>

      {visibleParents.length === 0 ? <Empty icon="fa-user-group" title="Sin resultados" sub="Ajusta los filtros o crea un nuevo cliente." /> : (
        <div className="acct-list">
          {visibleParents.map(c => {
            const subs = subsOf(c.id);
            const directProjs = projects.filter(p => p.clientId === c.id && !p.subClientId);
            const allProjs = projects.filter(p => p.clientId === c.id);
            const activeP = allProjs.filter(p => p.status === 'En progreso').length;
            const isOpen = !!open[c.id];
            const hasSubs = subs.length > 0;
            // Group subs by classifications (a sub may appear in many groups)
            const clasifMap = {};
            subs.forEach(s => {
              const ks = getClasifs(s);
              if (ks.length === 0) { (clasifMap['__none__'] = clasifMap['__none__'] || []).push(s); }
              else ks.forEach(k => (clasifMap[k] = clasifMap[k] || []).push(s));
            });
            const clasifKeys = Object.keys(clasifMap);
            const hasClasif = clasifKeys.some(k => k !== '__none__');
            const clasifCountForAcct = clasifKeys.filter(k => k !== '__none__').length;

            return (
              <div key={c.id} className="acct-card">
                <div className="acct-header" onClick={() => toggle(c.id)}>
                  <div className="acct-left">
                    <div className="acct-icon" style={{ background: (c.color || '#3B6EF5') + '22', color: c.color || '#3B6EF5' }}>
                      <i className="fa-solid fa-briefcase"></i>
                    </div>
                    <div className="acct-info">
                      <div className="acct-name">{c.name}</div>
                      <div className="acct-meta">
                        {hasSubs
                          ? `${subs.length} ${subs.length === 1 ? 'subcuenta' : 'subcuentas'} · ${hasClasif ? `${clasifCountForAcct} ${clasifCountForAcct === 1 ? 'clasificación' : 'clasificaciones'}` : 'sin clasificaciones'} · ${allProjs.length} ${allProjs.length === 1 ? 'proyecto' : 'proyectos'}`
                          : `Sin subcuentas · ${directProjs.length} ${directProjs.length === 1 ? 'proyecto directo' : 'proyectos directos'}`}
                      </div>
                    </div>
                  </div>
                  <div className="acct-right">
                    {(() => {
                      const invs = invForParent(c.id);
                      const em = countByStatus(invs, 'Emitida');
                      const ve = countByStatus(invs, 'Vencida');
                      return (
                        <>
                          {em > 0 && <span className="inv-tag inv-tag-pending"><i className="fa-solid fa-paper-plane"></i>{em} {em===1?'factura emitida':'facturas emitidas'}</span>}
                          {ve > 0 && <span className="inv-tag inv-tag-overdue"><i className="fa-solid fa-triangle-exclamation"></i>{ve} {ve===1?'factura vencida':'facturas vencidas'}</span>}
                        </>
                      );
                    })()}
                    <button className="cc-menu" onClick={(e)=>{ e.stopPropagation(); setModal({ kind:'client', data: c }); }} title="Editar cliente"><i className="fa-solid fa-pen"></i></button>
                    <button className="cc-menu cc-menu-danger" onClick={(e)=>{
                      e.stopPropagation();
                      const subCount = subs.length;
                      const projCount = allProjs.length;
                      const msg = `¿Eliminar el cliente "${c.name}"?` +
                        (subCount > 0 ? `\nSe eliminarán también ${subCount} ${subCount === 1 ? 'subcuenta' : 'subcuentas'}.` : '') +
                        (projCount > 0 ? `\nSe eliminarán ${projCount} ${projCount === 1 ? 'proyecto' : 'proyectos'} y sus tickets.` : '') +
                        `\n\nEsta acción no se puede deshacer.`;
                      if (window.confirm(msg)) deleteClient(c.id);
                    }} title="Eliminar cliente"><i className="fa-solid fa-trash"></i></button>
                    <i className={'fa-solid fa-chevron-right acct-chev' + (isOpen ? ' open' : '')}></i>
                  </div>
                </div>

                {isOpen && (
                  <div className="acct-body">
                    {hasSubs ? (
                      <>
                        {(() => {
                          const subsKey = c.id + '::subs';
                          const subsSecOpen = isSectionOpen(subsKey);
                          return (
                        <div className="acct-section-label acct-section-toggle" onClick={()=>toggleSection(subsKey)}>
                          <i className={'fa-solid fa-chevron-right sec-chev' + (subsSecOpen ? ' open' : '')}></i>
                          <span>Subcuentas{hasClasif ? ' por clasificación' : ''}</span>
                          <span className="sec-count">{subs.length}</span>
                        </div>
                          );
                        })()}
                        {isSectionOpen(c.id + '::subs') && (() => {
                          const renderSub = (s) => {
                            const sp = projects.filter(p => p.subClientId === s.id);
                            const sActive = sp.filter(p => p.status === 'En progreso').length;
                            const sOpen = !!subOpen[s.id];
                            return (
                              <React.Fragment key={s.id}>
                                <div className="sub-row" onClick={() => toggleSub(s.id)}>
                                  <div className="sub-left">
                                    <div className="sub-dot" style={{ background: s.color || '#7F77DD' }}></div>
                                    <div>
                                      <div className="sub-name">{s.name}</div>
                                      <div className="sub-count">{s.contact} · {sp.length} {sp.length === 1 ? 'proyecto' : 'proyectos'}</div>
                                    </div>
                                  </div>
                                  <div className="sub-right">
                                    {(() => {
                                      const invs = invForSub(s.id);
                                      const em = countByStatus(invs, 'Emitida');
                                      const ve = countByStatus(invs, 'Vencida');
                                      return (
                                        <>
                                          {em > 0 && <span className="inv-tag inv-tag-pending"><i className="fa-solid fa-paper-plane"></i>{em} {em===1?'factura emitida':'facturas emitidas'}</span>}
                                          {ve > 0 && <span className="inv-tag inv-tag-overdue"><i className="fa-solid fa-triangle-exclamation"></i>{ve} {ve===1?'factura vencida':'facturas vencidas'}</span>}
                                        </>
                                      );
                                    })()}
                                    <button className="cc-menu" onClick={(e)=>{ e.stopPropagation(); setModal({ kind:'client', data: s }); }} title="Editar subcuenta"><i className="fa-solid fa-pen"></i></button>
                                    <button className="cc-menu cc-menu-danger" onClick={(e)=>{
                                      e.stopPropagation();
                                      const projCount = sp.length;
                                      const msg = `¿Eliminar la subcuenta "${s.name}"?` +
                                        (projCount > 0 ? `\nSe eliminarán ${projCount} ${projCount === 1 ? 'proyecto' : 'proyectos'} y sus tickets.` : '') +
                                        `\n\nEsta acción no se puede deshacer.`;
                                      if (window.confirm(msg)) deleteClient(s.id);
                                    }} title="Eliminar subcuenta"><i className="fa-solid fa-trash"></i></button>
                                    <i className={'fa-solid fa-chevron-right sub-chev' + (sOpen ? ' open' : '')}></i>
                                  </div>
                                </div>
                                {sOpen && (sp.length === 0 ? (
                                  <div className="sub-project-empty">Esta subcuenta aún no tiene proyectos.</div>
                                ) : sp.map(pr => {
                                  const tks = tickets.filter(t => t.projectId === pr.id);
                                  return (
                                    <div key={pr.id} className="sub-project-row" onClick={(e)=>{ e.stopPropagation(); go('proyecto-detalle', { projectId: pr.id }); }}>
                                      <div className="sub-left">
                                        <i className="fa-solid fa-diagram-project sub-proj-icon" style={{ color: pr.color || '#7F77DD' }}></i>
                                        <div>
                                          <div className="sub-proj-name">{pr.name}</div>
                                          <div className="sub-count">{tks.length} {tks.length === 1 ? 'ticket' : 'tickets'}</div>
                                        </div>
                                      </div>
                                      <div className="sub-right">
                                        {projInvTags(pr.id)}
                                        <StatusPill s={pr.status} />
                                        <i className="fa-solid fa-chevron-right sub-chev"></i>
                                      </div>
                                    </div>
                                  );
                                }))}
                              </React.Fragment>
                            );
                          };
                          if (!hasClasif) {
                            return subs.map(renderSub);
                          }
                          // Ordered: classifications first (alpha), then "sin clasificar" last
                          const orderedKeys = clasifKeys
                            .filter(k => k !== '__none__').sort()
                            .concat(clasifMap['__none__'] ? ['__none__'] : []);
                          return orderedKeys.map(key => {
                            const items = clasifMap[key];
                            const groupKey = c.id + '::' + key;
                            const gOpen = isClasifOpen(groupKey);
                            const label = key === '__none__' ? 'Sin clasificar' : key;
                            return (
                              <div key={groupKey} className="clasif-group">
                                <div className="clasif-header" onClick={() => toggleClasif(groupKey)}>
                                  <span className="clasif-tag">
                                    <i className="fa-solid fa-tag"></i>{label}
                                  </span>
                                  <span className="clasif-meta">{items.length} {items.length === 1 ? 'subcuenta' : 'subcuentas'}</span>
                                  <i className={'fa-solid fa-chevron-right clasif-chev' + (gOpen ? ' open' : '')}></i>
                                </div>
                                {gOpen && items.map(renderSub)}
                              </div>
                            );
                          });
                        })()}
                        {directProjs.length > 0 && (() => {
                          const dirKey = c.id + '::direct';
                          const dirOpen = isSectionOpen(dirKey);
                          return (
                          <>
                            <div className="acct-section-label acct-section-toggle" onClick={()=>toggleSection(dirKey)}>
                              <i className={'fa-solid fa-chevron-right sec-chev' + (dirOpen ? ' open' : '')}></i>
                              <span>Proyectos directos</span>
                              <span className="sec-count">{directProjs.length}</span>
                            </div>
                            {dirOpen && directProjs.map(pr => {
                              const tks = tickets.filter(t => t.projectId === pr.id);
                              return (
                                <div key={pr.id} className="sub-row" onClick={() => go('proyecto-detalle', { projectId: pr.id })}>
                                  <div className="sub-left">
                                    <div className="sub-dot" style={{ background: pr.color || '#10B981' }}></div>
                                    <div>
                                      <div className="sub-name">{pr.name}</div>
                                      <div className="sub-count">{tks.length} tickets · factura directo al cliente</div>
                                    </div>
                                  </div>
                                  <div className="sub-right">
                                    {projInvTags(pr.id)}
                                    <StatusPill s={pr.status} />
                                    <i className="fa-solid fa-chevron-right sub-chev"></i>
                                  </div>
                                </div>
                              );
                            })}
                          </>
                          );
                        })()}
                        <div className="acct-add-row" onClick={() => setModal({ kind:'project', data: { clientId: c.id } })}>
                          <i className="fa-solid fa-plus"></i> Agregar proyecto a {c.name}
                        </div>
                      </>
                    ) : (
                      <>
                        {(() => {
                          const dirKey = c.id + '::direct';
                          const dirOpen = isSectionOpen(dirKey);
                          return (
                          <>
                            <div className="acct-section-label acct-section-toggle" onClick={()=>toggleSection(dirKey)}>
                              <i className={'fa-solid fa-chevron-right sec-chev' + (dirOpen ? ' open' : '')}></i>
                              <span>Proyectos directos</span>
                              <span className="sec-count">{directProjs.length}</span>
                            </div>
                            {dirOpen && (directProjs.length === 0 ? (
                              <div className="acct-empty-row">Este cliente aún no tiene proyectos.</div>
                            ) : directProjs.map(pr => {
                              const tks = tickets.filter(t => t.projectId === pr.id);
                              return (
                                <div key={pr.id} className="sub-row" onClick={() => go('proyecto-detalle', { projectId: pr.id })}>
                                  <div className="sub-left">
                                    <div className="sub-dot" style={{ background: pr.color || '#10B981' }}></div>
                                    <div>
                                      <div className="sub-name">{pr.name}</div>
                                      <div className="sub-count">{tks.length} tickets · factura directo al cliente</div>
                                    </div>
                                  </div>
                                  <div className="sub-right">
                                    {projInvTags(pr.id)}
                                    <StatusPill s={pr.status} />
                                    <i className="fa-solid fa-chevron-right sub-chev"></i>
                                  </div>
                                </div>
                              );
                            }))}
                          </>
                          );
                        })()}
                        <div className="acct-add-row" onClick={() => setModal({ kind:'project', data: { clientId: c.id } })}>
                          <i className="fa-solid fa-plus"></i> Agregar proyecto a {c.name}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── PROYECTOS ─────────────────────── */
function ViewProyectos() {
  const { projects, clients, tickets, workers, invoices, setModal, go, updateProject } = useApp();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [flagFilter, setFlagFilter] = useState(''); // '', 'pending-invoice', 'invoiced', 'open'

  const hasUnpaidInvoice = (p) => invoices.some(i =>
    i.projectId === p.id && i.status !== 'Pagada' && i.status !== 'Anulada'
  );
  const isRelevant = (p) =>
    p.status === 'En progreso' ||
    (p.completed && !p.invoiced) ||
    hasUnpaidInvoice(p);

  const filtered = projects.filter(p => {
    if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (status && p.status !== status) return false;
    if (flagFilter === 'pending-invoice' && !(p.completed && !p.invoiced)) return false;
    if (flagFilter === 'invoiced' && !p.invoiced) return false;
    if (flagFilter === 'open' && p.completed) return false;
    // Default view: solo relevantes (en progreso o pendientes de facturar/cobrar)
    if (!status && !flagFilter && !q && !isRelevant(p)) return false;
    return true;
  });

  const pendingInvoiceCount = projects.filter(p => p.completed && !p.invoiced).length;

  return (
    <div className="content" data-screen-label="Proyectos">
      <div className="page-head">
        <div className="ph-left">
          <div className="crumb"><a onClick={()=>go('proyectos')}>Inicio</a><span className="sep">›</span><span>Proyectos</span></div>
          <div className="page-title">Proyectos</div>
          <div className="page-subtitle">{projects.length} proyectos en total · {projects.filter(p=>p.status==='En progreso').length} activos</div>
        </div>
        <div className="ph-right">
          <button className="btn btn-primary btn-sm" onClick={() => setModal({ kind:'project' })}><i className="fa-solid fa-plus"></i> Nuevo Proyecto</button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(5, 1fr)' }}>
        <StatCard label="En progreso" value={projects.filter(p=>p.status==='En progreso').length} icon="fa-bolt" tone="primary" delta={status==='En progreso' ? 'filtrando ahora' : 'activos ahora'} onClick={()=>setStatus(status==='En progreso' ? '' : 'En progreso')} active={status==='En progreso'} />
        <StatCard label="Finalizados" value={projects.filter(p=>p.status==='Finalizado').length} icon="fa-circle-check" tone="success" delta={status==='Finalizado' ? 'filtrando ahora' : 'este año'} onClick={()=>setStatus(status==='Finalizado' ? '' : 'Finalizado')} active={status==='Finalizado'} />
        <StatCard label="Pendientes de facturar" value={pendingInvoiceCount} icon="fa-circle-exclamation" tone="warning" delta={flagFilter==='pending-invoice' ? 'filtrando ahora' : 'completados sin facturar'} onClick={()=>setFlagFilter(flagFilter==='pending-invoice' ? '' : 'pending-invoice')} active={flagFilter==='pending-invoice'} />
        <StatCard label="En pausa" value={projects.filter(p=>p.status==='En pausa').length} icon="fa-pause" tone="warning" delta={status==='En pausa' ? 'filtrando ahora' : 'en espera'} onClick={()=>setStatus(status==='En pausa' ? '' : 'En pausa')} active={status==='En pausa'} />
        <StatCard label="Facturados" value={projects.filter(p=>p.invoiced).length} icon="fa-file-invoice-dollar" tone="success" delta={flagFilter==='invoiced' ? 'filtrando ahora' : 'cobrados'} onClick={()=>setFlagFilter(flagFilter==='invoiced' ? '' : 'invoiced')} active={flagFilter==='invoiced'} />
      </div>

      <div className="toolbar">
        <span className="toolbar-title">Todos los proyectos · {filtered.length}</span>
        <div className="search-inline"><i className="fa-solid fa-magnifying-glass"></i><input placeholder="Buscar proyecto..." value={q} onChange={e=>setQ(e.target.value)} /></div>
        <div className="toolbar-chips">
          <button className={'tb-chip' + (flagFilter==='' ? ' is-on' : '')} onClick={()=>setFlagFilter('')}>Todos</button>
          <button className={'tb-chip' + (flagFilter==='open' ? ' is-on' : '')} onClick={()=>setFlagFilter(flagFilter==='open'?'':'open')}>Abiertos</button>
          <button className={'tb-chip tb-chip-warn' + (flagFilter==='pending-invoice' ? ' is-on' : '')} onClick={()=>setFlagFilter(flagFilter==='pending-invoice'?'':'pending-invoice')}>
            <i className="fa-solid fa-circle-exclamation"></i> Pendientes de facturar {pendingInvoiceCount > 0 && <span className="tb-chip-count">{pendingInvoiceCount}</span>}
          </button>
          <button className={'tb-chip tb-chip-ok' + (flagFilter==='invoiced' ? ' is-on' : '')} onClick={()=>setFlagFilter(flagFilter==='invoiced'?'':'invoiced')}>
            <i className="fa-solid fa-file-invoice-dollar"></i> Facturados
          </button>
        </div>
        <select className="select" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          <option>En progreso</option><option>En pausa</option><option>Finalizado</option>
        </select>
      </div>

      <div className="cards-grid" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {filtered.map(p => {
          const tkts = tickets.filter(t => t.projectId === p.id);
          const done = tkts.filter(t => t.status === 'Completado').length;
          const pct = tkts.length ? Math.round(done/tkts.length*100) : 0;
          const client = clients.find(c=>c.id===p.clientId);
          const team = workers.filter(w => [...new Set(tkts.map(t=>t.assigneeId))].includes(w.id));
          const toggleCompleted = (e) => {
            e.stopPropagation();
            const next = !p.completed;
            updateProject(p.id, { completed: next, status: next ? 'Finalizado' : (p.status === 'Finalizado' ? 'En progreso' : p.status), invoiced: next ? p.invoiced : false });
          };
          const toggleInvoiced = (e) => {
            e.stopPropagation();
            updateProject(p.id, { invoiced: !p.invoiced, completed: !p.invoiced ? true : p.completed, status: !p.invoiced ? 'Finalizado' : p.status });
          };
          return (
            <div key={p.id} className={'proj-card' + (p.completed ? ' is-completed' : '') + (p.invoiced ? ' is-invoiced' : '')} onClick={()=>go('proyecto-detalle', { projectId: p.id })}>
              {p.invoiced && <div className="proj-ribbon"><i className="fa-solid fa-circle-check"></i> Facturado</div>}
              <div className="proj-head">
                <div className="proj-icon" style={{ background: p.color }}><i className={p.icon}></i></div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="proj-name">{p.name}</div>
                  <div className="proj-client">{client?.name || '—'}</div>
                </div>
                <StatusPill s={p.status} />
              </div>
              <div>
                <div className="progress"><div className="progress-fill" style={{ width: pct+'%', background: p.color }}></div></div>
                <div className="progress-meta"><span>{done}/{tkts.length} tickets</span><span>{pct}%</span></div>
              </div>
              <div className="proj-flags">
                <button className={'flag-chip flag-completed' + (p.completed ? ' is-on' : '')} onClick={toggleCompleted} title={p.completed ? 'Marcar como no completado' : 'Marcar como completado'}>
                  <i className={p.completed ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'}></i>
                  <span>Completado</span>
                </button>
                <button className={'flag-chip flag-invoiced' + (p.invoiced ? ' is-on' : '')} onClick={toggleInvoiced} title={p.invoiced ? 'Marcar como no facturado' : 'Marcar como facturado'}>
                  <i className={p.invoiced ? 'fa-solid fa-file-invoice-dollar' : 'fa-regular fa-file-lines'}></i>
                  <span>Facturado</span>
                </button>
              </div>
              <div className="proj-footer">
                <AvatarStack workers={team} />
                <span className="kcard-due"><i className="fa-regular fa-calendar"></i>{shortDate(p.start)} → {shortDate(p.end)}</span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ gridColumn:'1/-1' }}><Empty icon="fa-sitemap" title="Sin proyectos" sub="Crea tu primer proyecto para empezar." /></div>}
      </div>
    </div>
  );
}

/* ─────────────────────── PROYECTOS · V2 (Lista acordeón) ─────────────────────── */
function ViewProyectosV2() {
  const { viewCtx, projects, clients, tickets, workers, invoices, setModal, setDetail, go, deleteProject, addComment, toast, currentUser, updateProject } = useApp();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [flagFilter, setFlagFilter] = useState(viewCtx?.flagFilter || '');

  const filtered = projects.filter(p => {
    if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (status && p.status !== status) return false;
    if (flagFilter === 'pending-invoice' && !(p.completed && !p.invoiced)) return false;
    if (flagFilter === 'invoiced' && !p.invoiced) return false;
    if (flagFilter === 'open' && p.completed) return false;
    // Default view: únicamente en progreso o completados pendientes de facturar
    if (!status && !flagFilter && !q) {
      const relevant = p.status === 'En progreso' || (p.status === 'Finalizado' && !p.invoiced);
      if (!relevant) return false;
    }
    return true;
  });

  const pendingInvoiceCount = projects.filter(p => p.completed && !p.invoiced).length;

  return (
    <div className="content" data-screen-label="Proyectos">
      <div className="page-head">
        <div className="ph-left">
          <div className="crumb"><a onClick={()=>go('proyectos')}>Inicio</a><span className="sep">›</span><span>Proyectos</span></div>
          <div className="page-title">Proyectos</div>
          <div className="page-subtitle">{projects.length} proyectos en total · vista lista</div>
        </div>
        <div className="ph-right">
          <button className="btn btn-primary btn-sm" onClick={() => setModal({ kind:'project' })}><i className="fa-solid fa-plus"></i> Nuevo Proyecto</button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(5, 1fr)' }}>
        <StatCard label="En progreso"            value={projects.filter(p=>p.status==='En progreso').length} icon="fa-bolt"                tone="primary" delta={status==='En progreso' ? 'filtrando ahora' : 'activos ahora'}              onClick={()=>setStatus(status==='En progreso' ? '' : 'En progreso')}             active={status==='En progreso'} />
        <StatCard label="Finalizados"            value={projects.filter(p=>p.status==='Finalizado').length}  icon="fa-circle-check"        tone="success" delta={status==='Finalizado' ? 'filtrando ahora' : 'este año'}                  onClick={()=>setStatus(status==='Finalizado' ? '' : 'Finalizado')}               active={status==='Finalizado'} />
        <StatCard label="En pausa"               value={projects.filter(p=>p.status==='En pausa').length}    icon="fa-pause"               tone="warning" delta={status==='En pausa' ? 'filtrando ahora' : 'en espera'}                  onClick={()=>setStatus(status==='En pausa' ? '' : 'En pausa')}                   active={status==='En pausa'} />
        <StatCard label="Pendientes de facturar" value={pendingInvoiceCount}                                  icon="fa-circle-exclamation"  tone="warning" delta={flagFilter==='pending-invoice' ? 'filtrando ahora' : 'completados sin facturar'} onClick={()=>setFlagFilter(flagFilter==='pending-invoice' ? '' : 'pending-invoice')} active={flagFilter==='pending-invoice'} />
        <StatCard label="Facturados"             value={projects.filter(p=>p.invoiced).length}                icon="fa-file-invoice-dollar" tone="success" delta={flagFilter==='invoiced' ? 'filtrando ahora' : 'por pagar'}                  onClick={()=>setFlagFilter(flagFilter==='invoiced' ? '' : 'invoiced')}             active={flagFilter==='invoiced'} />
      </div>

      <div className="toolbar">
        <span className="toolbar-title">Listado de Proyectos · {filtered.length}</span>
        <div className="search-inline"><i className="fa-solid fa-magnifying-glass"></i><input placeholder="Buscar proyecto..." value={q} onChange={e=>setQ(e.target.value)} /></div>
        <select className="select" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          <option>En progreso</option><option>En pausa</option><option>Finalizado</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Empty icon="fa-sitemap" title="Sin proyectos" sub="Ajusta los filtros o crea un nuevo proyecto." />
      ) : (
        <div className="acct-list">
          {filtered.map(p => {
            const client = clients.find(c => c.id === p.clientId);
            const sub = p.subClientId ? clients.find(c => c.id === p.subClientId) : null;
            const tkts = tickets.filter(t => t.projectId === p.id);
            const overdueCount = tkts.filter(t => daysUntil(t.due) < 0 && t.status !== 'Completado').length;
            const issuedInv = invoices.filter(i => i.projectId === p.id && i.status === 'Emitida' && !(i.dueDate && new Date(i.dueDate) < new Date(new Date().setHours(0,0,0,0)))).length;
            const overdueInv = invoices.filter(i => i.projectId === p.id && i.status === 'Emitida' && i.dueDate && new Date(i.dueDate) < new Date(new Date().setHours(0,0,0,0))).length;
            return (
              <div key={p.id} className="acct-card">
                <div className="acct-header" onClick={() => go('proyecto-detalle', { projectId: p.id })}>
                  <div className="acct-left">
                    <div className="acct-icon" style={{ background: (p.color || '#3B6EF5') + '22', color: p.color || '#3B6EF5' }}>
                      <i className={'fa-solid ' + ((p.icon || '').replace(/^fa[a-z\-]*\s+/, '') || 'fa-diagram-project')}></i>
                    </div>
                    <div className="acct-info">
                      <div className="acct-name">{p.name}</div>
                      <div className="acct-meta">
                        {client?.name || '—'}{sub ? ` · ${sub.name}` : ''} · {fmtDate(p.start)} → {fmtDate(p.end)}
                      </div>
                    </div>
                  </div>
                  <div className="acct-right">
                    <StatusPill s={p.status} />
                    <span className="acct-active-pill">{tkts.length} {tkts.length === 1 ? 'ticket' : 'tickets'}</span>
                    {issuedInv > 0 && (
                      <span className="acct-active-pill" style={{ background:'var(--warning-50, #FEF3C7)', color:'#B45309', display:'inline-flex', alignItems:'center', gap:5 }}>
                        <i className="fa-solid fa-paper-plane" style={{ fontSize:10 }}></i>
                        {issuedInv} {issuedInv === 1 ? 'factura emitida' : 'facturas emitidas'}
                      </span>
                    )}
                    {overdueInv > 0 && (
                      <span className="acct-active-pill" style={{ background:'rgba(239, 68, 68, .12)', color:'#B91C1C', display:'inline-flex', alignItems:'center', gap:5 }}>
                        <i className="fa-solid fa-triangle-exclamation" style={{ fontSize:10 }}></i>
                        {overdueInv} {overdueInv === 1 ? 'factura vencida' : 'facturas vencidas'}
                      </span>
                    )}
                    {overdueCount > 0 && (
                      <span className="acct-active-pill" style={{ background:'var(--danger-50)', color:'#B91C1C' }}>
                        {overdueCount} atrasado{overdueCount === 1 ? '' : 's'}
                      </span>
                    )}
                    <button className="cc-menu" onClick={(e)=>{ e.stopPropagation(); setModal({ kind:'project', data: p }); }} title="Editar proyecto">
                      <i className="fa-solid fa-pen"></i>
                    </button>
                    <button className="cc-menu" onClick={(e)=>{ e.stopPropagation(); setModal({ kind:'ticket', data:{ projectId: p.id } }); }} title="Nuevo ticket">
                      <i className="fa-solid fa-plus"></i>
                    </button>
                    <button className="cc-menu cc-menu-danger" onClick={(e)=>{
                      e.stopPropagation();
                      const msg = `¿Eliminar el proyecto "${p.name}"?` +
                        (tkts.length > 0 ? `\nSe eliminarán también ${tkts.length} ${tkts.length === 1 ? 'ticket' : 'tickets'}.` : '') +
                        `\n\nEsta acción no se puede deshacer.`;
                      if (window.confirm(msg)) deleteProject(p.id);
                    }} title="Eliminar proyecto"><i className="fa-solid fa-trash"></i></button>
                    <i className="fa-solid fa-chevron-right acct-chev"></i>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProyectoV2Body({ project }) {
  const p = project;
  const { tickets, workers, clients, invoices, setModal, setDetail, toast, addProjectComment } = useApp();
  const [sec, setSec] = useState({ tickets: true, invoices: false, comments: false });
  const toggle = (k) => setSec(s => ({ ...s, [k]: !s[k] }));

  const tkts = tickets.filter(t => t.projectId === p.id);

  // Pending invoices: not Pagada and not Anulada
  const projInv = invoices.filter(i => i.projectId === p.id);
  const today = new Date(); today.setHours(0,0,0,0);
  const pendingInv = projInv.filter(i => i.status !== 'Pagada' && i.status !== 'Anulada');
  const fmtMoney = (n, cur='CRC') => {
    const sym = cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '₡';
    return sym + (n||0).toLocaleString('es-CR', { maximumFractionDigits: cur==='CRC'?0:2 });
  };

  // Comentarios — desde el store global (igual que los tickets)
  const projComments = p.comments || [];
  const fmtCommentDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const date = d.toLocaleDateString('es-CR', { day:'2-digit', month:'2-digit', year:'2-digit' });
    const time = d.toLocaleTimeString('es-CR', { hour:'2-digit', minute:'2-digit', hour12:false });
    return `${date} · ${time}`;
  };
  const [commentText, setCommentText] = useState('');
  const sendComment = () => {
    const txt = commentText.trim();
    if (!txt) return;
    addProjectComment(p.id, txt);
    setCommentText('');
  };

  return (
    <div className="acct-body">
      {/* Sección: Tickets */}
      <div className="pv2-section">
        <div className="acct-section-label acct-section-toggle pv2-section-head" onClick={() => toggle('tickets')}>
          <i className={'fa-solid fa-chevron-right sec-chev' + (sec.tickets ? ' open' : '')}></i>
          <span>Tickets</span>
          <span className="sec-count">{tkts.length}</span>
          <button
            className="btn btn-outline btn-xs pv2-section-action"
            onClick={(e)=>{ e.stopPropagation(); setModal({ kind:'ticket', data:{ projectId: p.id } }); }}
          >
            <i className="fa-solid fa-plus"></i> Nuevo ticket
          </button>
        </div>
        {sec.tickets && (
          tkts.length === 0
            ? <div className="acct-empty-row">Este proyecto aún no tiene tickets.</div>
            : (
              <div className="pv2-tickets">
                <div className="pv2-tk-head">
                  <div>Código</div>
                  <div>Título</div>
                  <div>Asignado</div>
                  <div>Inicio – Fin</div>
                  <div>Prioridad</div>
                  <div>Estado</div>
                  <div></div>
                </div>
                {tkts.map(t => {
                  const w = workers.find(x => x.id === t.assigneeId);
                  const du = daysUntil(t.due);
                  const overdue = du < 0 && t.status !== 'Completado';
                  return (
                    <div key={t.id} className="pv2-tk-row" onClick={() => setDetail({ kind:'ticket', id: t.id })}>
                      <div className="pv2-tk-code">{t.code}</div>
                      <div className="pv2-tk-title">{t.title}</div>
                      <div className="pv2-tk-assignee">
                        {w
                          ? <React.Fragment>
                              <div className="av av-xs" style={{ background: w.color }}>{w.initials}</div>
                              <span>{w.name.split(' ')[0]}</span>
                            </React.Fragment>
                          : <span style={{ color:'var(--text-3)' }}>Sin asignar</span>}
                      </div>
                      <div className="pv2-tk-due" style={{ color: overdue ? 'var(--danger)' : 'var(--text-2)', fontWeight: overdue ? 700 : 500 }}>
                        <i className="fa-regular fa-calendar"></i> {t.start ? shortDate(t.start) + ' – ' : ''}{shortDate(t.due)}{overdue && ' ⚠'}
                      </div>
                      <div><PriorityTag p={t.priority} /></div>
                      <div><StatusPill s={t.status} /></div>
                      <button
                        className="cc-menu"
                        onClick={(e)=>{ e.stopPropagation(); setModal({ kind:'ticket', data: t }); }}
                        title="Editar ticket"
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                    </div>
                  );
                })}
              </div>
            )
        )}
      </div>

      {/* Sección: Facturas pendientes */}
      <div className="pv2-section">
        <div className="acct-section-label acct-section-toggle pv2-section-head" onClick={() => toggle('invoices')}>
          <i className={'fa-solid fa-chevron-right sec-chev' + (sec.invoices ? ' open' : '')}></i>
          <span>Facturas pendientes</span>
          <span className="sec-count">{pendingInv.length}</span>
          <button
            className="btn btn-outline btn-xs pv2-section-action"
            onClick={(e)=>{ e.stopPropagation(); setModal({ kind:'invoice', data: { projectId: p.id, clientId: p.clientId, subClientId: p.subClientId } }); }}
          >
            <i className="fa-solid fa-plus"></i> Nueva factura
          </button>
        </div>
        {sec.invoices && (
          pendingInv.length === 0
            ? <div className="acct-empty-row">No hay facturas pendientes para este proyecto.</div>
            : (
              <div className="pv2-inv-list">
                {pendingInv.map(inv => {
                  const overdue = inv.status === 'Emitida' && new Date(inv.dueDate) < today;
                  const sEff = overdue ? 'Vencida' : inv.status;
                  return (
                    <div key={inv.id} className="pv2-inv-row" onClick={() => setModal({ kind:'invoice', data: inv })}>
                      <div className="pv2-inv-num">{inv.number}</div>
                      <div className="pv2-inv-dates">
                        <i className="fa-regular fa-calendar"></i> Emitida {shortDate(inv.issueDate)} · vence {shortDate(inv.dueDate)}
                      </div>
                      <div className="pv2-inv-amt">{fmtMoney(inv.amount, inv.currency)}</div>
                      <div className="pv2-inv-status">
                        <span className={'badge ' + (sEff === 'Vencida' ? 'badge-danger' : 'badge-warning')}>
                          <span className="dot"></span>{sEff}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
        )}
      </div>

      {/* Sección: Comentarios */}
      <div className="pv2-section">
        <div className="acct-section-label acct-section-toggle pv2-section-head" onClick={() => toggle('comments')}>
          <i className={'fa-solid fa-chevron-right sec-chev' + (sec.comments ? ' open' : '')}></i>
          <span>Comentarios</span>
          <span className="sec-count">{projComments.length}</span>
        </div>
        {sec.comments && (
          <div className="pv2-comments">
            {projComments.length === 0
              ? <div className="acct-empty-row">Aún no hay comentarios en este proyecto.</div>
              : (
                <div className="comments" style={{ padding:'4px 18px 12px' }}>
                  {projComments.map(c => (
                    <div key={c.id} className="comment">
                      <Avatar size="sm" color={c.color} initials={c.initials} />
                      <div className="comment-bubble">
                        <div className="comment-meta"><span className="comment-author">{c.author}</span><span className="comment-date">{fmtCommentDate(c.date)}</span></div>
                        <div className="comment-text">{c.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            <div className="pv2-comment-compose">
              <textarea
                className="textarea"
                rows="2"
                placeholder="Escribe un comentario..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendComment(); }}
              />
              <button className="btn btn-primary" onClick={sendComment}>
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Router: pick V1 (cuadrícula) o V2 (lista) según la tweak `proyectosVersion` */
function ProyectosRouter() {
  const [v, setV] = useState(() => (typeof document !== 'undefined' && document.documentElement.dataset.proyectos) || 'v1');
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setV(root.dataset.proyectos || 'v1');
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ['data-proyectos'] });
    return () => obs.disconnect();
  }, []);
  return v === 'v2' ? <ViewProyectosV2 /> : <ViewProyectos />;
}

/* ─────────────────────── PROYECTO DETALLE ─────────────────────── */
function ViewProyectoDetalle() {
  const { viewCtx, projects, clients, tickets, workers, invoices, go, setModal, deleteProject, updateProject, addProjectComment, toast } = useApp();
  const p = projects.find(x => x.id === viewCtx.projectId);
  const [commentText, setCommentText] = useState('');
  const [ticketFilter, setTicketFilter] = useState('');
  const fmtCommentDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const date = d.toLocaleDateString('es-CR', { day:'2-digit', month:'2-digit', year:'2-digit' });
    const time = d.toLocaleTimeString('es-CR', { hour:'2-digit', minute:'2-digit', hour12:false });
    return `${date} · ${time}`;
  };
  const projComments = p?.comments || [];
  const sendComment = () => {
    const txt = commentText.trim();
    if (!txt) return;
    addProjectComment(p.id, txt);
    setCommentText('');
  };
  if (!p) {
    return <div className="content"><Empty icon="fa-folder-open" title="Proyecto no encontrado" /></div>;
  }
  const client = clients.find(c => c.id === p.clientId);
  const tkts = tickets.filter(t => t.projectId === p.id);
  const done = tkts.filter(t => t.status === 'Completado').length;
  const pct = tkts.length ? Math.round(done/tkts.length*100) : 0;
  const byStatus = ['Por hacer','Pendiente','Completado'].map(s => ({ s, n: tkts.filter(t=>t.status===s).length }));

  return (
    <div className="content" data-screen-label="Proyecto Detalle">
      <div className="page-head">
        <div className="ph-left">
          <div className="crumb"><a onClick={()=>go('proyectos')}>Inicio</a><span className="sep">›</span><a onClick={()=>go('proyectos')}>Proyectos</a><span className="sep">›</span><span>{p.name}</span></div>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:4 }}>
            <div className="proj-icon" style={{ background: p.color, width:44, height:44, borderRadius:11, fontSize:17 }}><i className={p.icon}></i></div>
            <div>
              <div className="page-title">{p.name}</div>
              <div className="page-subtitle">{client?.name} · {fmtDate(p.start)} → {fmtDate(p.end)}{p.po?.poNumber ? <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:'var(--text-2)' }}> · OC {p.po.poNumber}</span> : ''}</div>
            </div>
          </div>
        </div>
        <div className="ph-right">
          <StatusPill s={p.status} />
          <button className="btn btn-outline btn-sm" onClick={()=>setModal({ kind:'project', data:p })}><i className="fa-solid fa-pen"></i> Editar</button>
          {p.status !== 'Finalizado' && (
            <button className="btn btn-outline btn-sm" onClick={()=>setModal({ kind:'confirm', data:{
              title: '¿Marcar proyecto como finalizado?',
              message: `El proyecto "${p.name}" cambiará su estado a Finalizado.`,
              confirmLabel: 'Marcar como finalizado',
              danger: false,
              onConfirm: () => { updateProject(p.id, { status: 'Finalizado', completed: true }); toast('Proyecto finalizado', 'success'); },
            }})}><i className="fa-solid fa-circle-check"></i> Marcar finalizado</button>
          )}
          <button className="btn btn-primary btn-sm" onClick={()=>setModal({ kind:'ticket', data:{ projectId: p.id, lockProject: true }})}><i className="fa-solid fa-plus"></i> Nuevo Ticket</button>
        </div>
      </div>

      <div className="stats-grid pd-stats-grid">
        <StatCard label="Total tickets" value={tkts.length} icon="fa-list-check" tone="primary" delta={ticketFilter === '' ? pct + '% completado' : 'ver todos'} onClick={()=>setTicketFilter('')} active={ticketFilter === ''} />
        <StatCard label="Por hacer" value={byStatus[0].n} icon="fa-circle" tone="info" delta={ticketFilter === 'Por hacer' ? 'filtrando ahora' : 'en backlog'} onClick={()=>setTicketFilter(ticketFilter === 'Por hacer' ? '' : 'Por hacer')} active={ticketFilter === 'Por hacer'} />
        <StatCard label="Pendiente" value={byStatus[1].n} icon="fa-spinner" tone="warning" delta={ticketFilter === 'Pendiente' ? 'filtrando ahora' : 'pendientes'} onClick={()=>setTicketFilter(ticketFilter === 'Pendiente' ? '' : 'Pendiente')} active={ticketFilter === 'Pendiente'} />
        <StatCard label="Completados" value={byStatus[2].n} icon="fa-circle-check" tone="success" delta={ticketFilter === 'Completado' ? 'filtrando ahora' : 'este mes'} onClick={()=>setTicketFilter(ticketFilter === 'Completado' ? '' : 'Completado')} active={ticketFilter === 'Completado'} />
      </div>

      <div className="pd-main-grid">
        <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <div className="card">
            <div className="card-head">
              <div className="card-title">Tickets del proyecto</div>
              {ticketFilter && <span className="badge badge-info" style={{ marginLeft:8 }}><i className="fa-solid fa-filter" style={{ marginRight:4 }}></i>{ticketFilter}<i className="fa-solid fa-xmark" style={{ marginLeft:6, cursor:'pointer' }} onClick={()=>setTicketFilter('')}></i></span>}
              <div className="card-sub" style={{ marginLeft:'auto' }}>{tkts.filter(t=>!ticketFilter || t.status===ticketFilter).length} de {tkts.length} tickets</div>
            </div>
            <TicketList tickets={tkts.filter(t=>!ticketFilter || t.status===ticketFilter)} hideProject lockProject />
          </div>

          <div className="pd-bottom-grid">
            <div className="card">
              <div className="card-head">
                <div className="card-title">Comentarios del proyecto</div>
              </div>
              <div style={{ padding:16 }}>
                <div className="comments">
                  {projComments.map(c => (
                    <div key={c.id} className="comment">
                      <Avatar size="sm" color={c.color} initials={c.initials} />
                      <div className="comment-bubble">
                        <div className="comment-meta"><span className="comment-author">{c.author}</span><span className="comment-date">{fmtCommentDate(c.date)}</span></div>
                        <div className="comment-text">{c.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:8, marginTop:12, alignItems:'stretch' }}>
                  <textarea className="textarea" rows="2" placeholder="Escribe un comentario..." value={commentText} onChange={e=>setCommentText(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter' && (e.metaKey||e.ctrlKey)) sendComment(); }} style={{ flex:1, minHeight:60, resize:'vertical' }}/>
                  <button className="btn btn-primary" style={{ alignSelf:'stretch', minWidth:48, padding:'0 16px' }} onClick={sendComment}><i className="fa-solid fa-paper-plane"></i></button>
                </div>
              </div>
            </div>
            <ProjectInvoices project={p} />
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div className="card-title">Presupuesto del proyecto</div></div>
          <div style={{ padding:16 }}>
            {(() => {
              const projInv = invoices.filter(i => i.projectId === p.id && i.status !== 'Anulada');
              const cur = p.po?.currency || projInv[0]?.currency || 'CRC';
              const facturado = projInv.filter(i => (i.currency||'CRC') === cur).reduce((a,b)=>a+(b.amount||0),0);
              const gastos = 0;
              const total = facturado - gastos;
              return (
                <>
                  <div className="dp-row"><span className="lbl">Monto facturado</span><span className="val">{fmtMoney(facturado, cur)}</span></div>
                  <div className="dp-row"><span className="lbl">Gastos</span><span className="val">{fmtMoney(gastos, cur)}</span></div>
                  <div className="dp-row" style={{ marginTop:8, paddingTop:10, borderTop:'1px solid var(--border)' }}><span className="lbl" style={{ fontWeight:800, color:'var(--text-1)' }}>Total</span><span className="val" style={{ fontWeight:800, fontSize:15 }}>{fmtMoney(total, cur)}</span></div>
                </>
              );
            })()}
            <div className="dp-section" style={{ marginTop:14 }}>Descripción</div>
            <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, padding:10, fontSize:12.5, color:'var(--text-1)' }}>{p.description}</div>
            <div style={{ marginTop:16, display:'flex', gap:8 }}>
              <button className="btn btn-danger-ghost btn-sm" style={{ flex:1 }} onClick={()=>setModal({ kind:'confirm', data:{
                title: '¿Eliminar proyecto?',
                message: `Se eliminará "${p.name}"${tkts.length ? ` y sus ${tkts.length} ${tkts.length === 1 ? 'ticket' : 'tickets'} asociados` : ''}. Esta acción no se puede deshacer.`,
                confirmLabel: 'Eliminar proyecto',
                onConfirm: () => { deleteProject(p.id); go('proyectos'); },
              }})}><i className="fa-solid fa-trash"></i> Eliminar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── TICKET LIST (shared) ─────────────────────── */
function ProjectInvoices({ project }) {
  const { invoices, setModal, updateProject, toast } = useApp();
  const today2 = new Date(); today2.setHours(0,0,0,0);
  const projInvoices = invoices.filter(i => i.projectId === project.id);
  const fmt = (n, cur='CRC') => {
    const sym = cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '₡';
    return sym + (n||0).toLocaleString('es-CR', { maximumFractionDigits: cur==='CRC'?0:2 });
  };
  const effStatus = (i) => (i.status === 'Emitida' && new Date(i.dueDate) < today2) ? 'Vencida' : i.status;
  const pillStyle = (s) => {
    if (s === 'Pagada')  return { bg:'rgba(16,185,129,.12)', color:'#047857', icon:'fa-circle-check' };
    if (s === 'Vencida') return { bg:'rgba(239,68,68,.12)',  color:'#B91C1C', icon:'fa-triangle-exclamation' };
    if (s === 'Anulada') return { bg:'rgba(100,116,139,.14)',color:'#475569', icon:'fa-ban' };
    return                       { bg:'rgba(245,158,11,.14)', color:'#B45309', icon:'fa-paper-plane' };
  };
  const totalByCur = projInvoices.reduce((acc, i) => { acc[i.currency||'CRC'] = (acc[i.currency||'CRC']||0) + (i.amount||0); return acc; }, {});
  const totalLine = Object.keys(totalByCur).length === 0 ? '—' : Object.entries(totalByCur).map(([c,n]) => fmt(n,c)).join(' · ');
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">Facturas</div>
        <span className="card-sub">{projInvoices.length} · {totalLine}</span>
        {(project.invoiced || projInvoices.length > 0) ? (
          <span className="badge" style={{ marginLeft:'auto', background:'var(--warning-50)', color:'#B45309' }}><span className="dot" style={{ background:'#F59E0B' }}></span>Facturado</span>
        ) : (
          <button className="btn btn-outline btn-xs" style={{ marginLeft:'auto' }} onClick={()=>setModal({ kind:'confirm', data:{
            title: '¿Marcar proyecto como facturado?',
            message: `El proyecto "${project.name}" se marcará como facturado aunque no tenga facturas registradas.`,
            confirmLabel: 'Marcar como facturado',
            danger: false,
            onConfirm: () => { updateProject(project.id, { invoiced: true }); toast('Proyecto marcado como facturado', 'success'); },
          }})}><i className="fa-solid fa-file-invoice-dollar"></i> Marcar facturado</button>
        )}
      </div>
      <div>
        {projInvoices.length === 0 ? (
          <div style={{ padding:'18px 16px', textAlign:'center', fontSize:12.5, color:'var(--text-3)' }}>Aún no hay facturas para este proyecto.</div>
        ) : projInvoices.map(inv => {
          const sEff = effStatus(inv);
          const ps = pillStyle(sEff);
          return (
            <div key={inv.id} className="vg-list-row" style={{ padding:'10px 16px' }} onClick={()=>setModal({ kind:'invoice', data: inv })}>
              <div className="vg-row-left">
                <span className="inv-pill" style={{ background:ps.bg, color:ps.color, padding:'3px 7px', fontSize:10.5 }}><i className={'fa-solid ' + ps.icon}></i></span>
                <div className="vg-row-info">
                  <div className="vg-row-name" style={{ fontFamily:'var(--font-mono)', fontSize:12 }}>{inv.number}</div>
                  <div className="vg-row-meta">{shortDate(inv.issueDate)} → {shortDate(inv.dueDate)}</div>
                </div>
              </div>
              <div className="vg-row-right">
                <span className="vg-amt" style={{ fontSize:12.5 }}>{fmt(inv.amount, inv.currency)}</span>
              </div>
            </div>
          );
        })}
        <div className="acct-add-row" style={{ padding:'10px 16px', borderTop:'1px dashed var(--border)' }} onClick={()=>setModal({ kind:'invoice', data: { projectId: project.id, clientId: project.clientId, subClientId: project.subClientId } })}>
          <i className="fa-solid fa-plus"></i> Agregar factura a este proyecto
        </div>
      </div>
    </div>
  );
}

function TicketList({ tickets: list, hideProject, lockProject }) {
  const { workers, projects, setModal, currentUser } = useApp();
  const isAdmin = currentUser?.role === 'Administrador';
  if (!list.length) return <Empty icon="fa-ticket" title="Sin tickets" sub="Agrega uno para empezar a trabajar." />;
  return (
    <div className={hideProject ? 'tlist-no-project' : ''}>
      <div className="tlist-head">
        <div>Código</div><div>Título</div>{!hideProject && <div>Proyecto</div>}<div>Asignado</div><div>Prioridad</div><div>Inicio – Fin</div><div>Estado</div><div></div>
      </div>
      {list.map(t => {
        const w = workers.find(x=>x.id===t.assigneeId);
        const p = projects.find(x=>x.id===t.projectId);
        const du = daysUntil(t.due);
        const overdue = du < 0 && t.status !== 'Completado';
        return (
          <div key={t.id} className="tlist-row" onClick={()=>setModal({ kind:'ticket', data: { ...t, lockProject: !!lockProject } })}>
            <div className="tlist-code">{t.code}</div>
            <div className="tlist-title">{t.title}</div>
            {!hideProject && <div className="tlist-project"><span className="pd" style={{ background:p?.color }}></span>{p?.name || '—'}</div>}
            <div className="tlist-assignee">{w ? <React.Fragment><div className="av" style={{ background:w.color, width:22, height:22, borderRadius:'50%', fontSize:9.5 }}>{w.initials}</div>{w.name.split(' ')[0]}</React.Fragment> : <span style={{ color:'var(--text-3)' }}>Sin asignar</span>}</div>
            <div><PriorityTag p={t.priority} /></div>
            <div className="tlist-due" style={{ color: overdue ? 'var(--danger)' : 'var(--text-2)', fontWeight: overdue ? 700 : 500 }}>{t.start ? shortDate(t.start) + ' – ' : ''}{shortDate(t.due)}{overdue && ' ⚠'}</div>
            <div><StatusPill s={t.status} /></div>
            <div></div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────── TICKETS (lista principal) ─────────────────────── */
function ViewTickets() {
  const { scopedTickets: tickets, projects, workers, setModal, setDetail, go, currentUser } = useApp();
  const isWorker = currentUser.role === 'Trabajador';
  const [q, setQ] = useState('');
  const [proj, setProj] = useState('');
  const [pri, setPri] = useState('');
  const [st, setSt] = useState('');
  const [asg, setAsg] = useState('');

  const filtered = tickets.filter(t => {
    if (q && !(t.title + t.code).toLowerCase().includes(q.toLowerCase())) return false;
    if (proj && t.projectId !== proj) return false;
    if (pri && t.priority !== pri) return false;
    if (asg === '__none') { if (t.assigneeId) return false; }
    else if (asg && t.assigneeId !== asg) return false;
    if (st === '__overdue') { if (!(t.status !== 'Completado' && daysUntil(t.due) < 0)) return false; }
    else if (st && t.status !== st) return false;
    return true;
  });

  return (
    <div className="content" data-screen-label="Tickets">
      <div className="page-head">
        <div className="ph-left">
          <div className="crumb"><a onClick={()=>go('tickets')}>Inicio</a><span className="sep">›</span><span>{isWorker ? 'Mis tickets' : 'Tickets'}</span></div>
          <div className="page-title">{isWorker ? 'Mis tickets' : 'Tickets'}</div>
          <div className="page-subtitle">{filtered.length} de {tickets.length} tickets</div>
        </div>
        <div className="ph-right">
          <div className="segmented">
            <button className="active" onClick={()=>go('tickets')}><i className="fa-solid fa-list"></i> Lista</button>
            <button onClick={()=>go('kanban')}><i className="fa-solid fa-columns"></i> Tablero</button>
          </div>
          <button className="btn btn-primary btn-sm" onClick={()=>setModal({ kind:'ticket' })}><i className="fa-solid fa-plus"></i> Nuevo Ticket</button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total" value={tickets.length} icon="fa-ticket" tone="primary" delta={st==='' ? 'sin filtro' : 'mostrar todos'} onClick={()=>setSt('')} active={st===''} />
        <StatCard label="Por hacer" value={tickets.filter(t=>t.status==='Por hacer').length} icon="fa-circle" tone="info" delta={st==='Por hacer' ? 'filtrando ahora' : 'backlog'} onClick={()=>setSt(st==='Por hacer' ? '' : 'Por hacer')} active={st==='Por hacer'} />
        <StatCard label="Pendiente" value={tickets.filter(t=>t.status==='Pendiente').length} icon="fa-spinner" tone="warning" delta={st==='Pendiente' ? 'filtrando ahora' : 'pendientes'} onClick={()=>setSt(st==='Pendiente' ? '' : 'Pendiente')} active={st==='Pendiente'} />
        <StatCard label="Atrasados" value={tickets.filter(t=>t.status !== 'Completado' && daysUntil(t.due)<0).length} icon="fa-triangle-exclamation" tone="danger" delta={st==='__overdue' ? 'filtrando ahora' : 'requieren atención'} onClick={()=>setSt(st==='__overdue' ? '' : '__overdue')} active={st==='__overdue'} />
      </div>

      <div className="toolbar">
        <span className="toolbar-title">Todos los tickets · {filtered.length}</span>
        <div className="search-inline"><i className="fa-solid fa-magnifying-glass"></i><input placeholder="Buscar..." value={q} onChange={e=>setQ(e.target.value)} /></div>
        <select className="select" value={proj} onChange={e=>setProj(e.target.value)}><option value="">Todos los proyectos</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select className="select" value={pri} onChange={e=>setPri(e.target.value)}><option value="">Todas las prioridades</option><option>Alta</option><option>Media</option><option>Baja</option></select>
        <select className="select" value={st} onChange={e=>setSt(e.target.value)}><option value="">Todos los estados</option><option>Por hacer</option><option>Pendiente</option><option>Completado</option></select>
        {!isWorker && <select className="select" value={asg} onChange={e=>setAsg(e.target.value)}><option value="">Todos los trabajadores</option><option value="__none">Sin asignar</option>{workers.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select>}
      </div>

      <div className="tlist">
        <TicketList tickets={filtered} />
      </div>
    </div>
  );
}

/* ─────────────────────── CALENDARIO ─────────────────────── */
function ViewCalendario() {
  const { scopedTickets: tickets, projects, setDetail, go } = useApp();
  const [cursor, setCursor] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const y = cursor.getFullYear(), m = cursor.getMonth();
  const first = new Date(y, m, 1);
  const startDay = (first.getDay() + 6) % 7; // Monday first
  const daysInMonth = new Date(y, m+1, 0).getDate();
  const prevMonthDays = new Date(y, m, 0).getDate();

  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push({ day: prevMonthDays - startDay + i + 1, other: true, date: new Date(y, m-1, prevMonthDays - startDay + i + 1) });
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, other: false, date: new Date(y, m, i) });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - startDay + 1, other: true, date: new Date(y, m+1, cells.length - daysInMonth - startDay + 1) });

  const today = new Date(); today.setHours(0,0,0,0);
  const ticketsByDate = useMemo(() => {
    const map = {};
    tickets.forEach(t => {
      if (!t.due) return;
      (map[t.due] = map[t.due] || []).push(t);
    });
    return map;
  }, [tickets]);

  return (
    <div className="content" data-screen-label="Calendario">
      <div className="page-head">
        <div className="ph-left">
          <div className="crumb"><a onClick={()=>go('calendario')}>Inicio</a><span className="sep">›</span><span>Calendario</span></div>
          <div className="page-title">Calendario</div>
          <div className="page-subtitle">Vencimientos de tickets por día</div>
        </div>
        <div className="ph-right">
          <button className="btn btn-outline btn-sm" onClick={()=>{ const c = new Date(cursor); c.setMonth(c.getMonth()-1); setCursor(c); }}><i className="fa-solid fa-chevron-left"></i></button>
          <div style={{ fontWeight:800, fontSize:14, color:'var(--text-1)', minWidth:160, textAlign:'center', alignSelf:'center' }}>{monthNames[m]} {y}</div>
          <button className="btn btn-outline btn-sm" onClick={()=>{ const c = new Date(cursor); c.setMonth(c.getMonth()+1); setCursor(c); }}><i className="fa-solid fa-chevron-right"></i></button>
          <button className="btn btn-primary btn-sm" onClick={()=>{ const d = new Date(); d.setDate(1); setCursor(d); }}>Hoy</button>
        </div>
      </div>
      <div className="cal">
        <div className="cal-grid">
          {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => <div key={d} className="cal-dow">{d}</div>)}
          {cells.map((c, i) => {
            const iso = c.date.toISOString().slice(0,10);
            const evts = ticketsByDate[iso] || [];
            const isToday = +c.date === +today;
            return (
              <div key={i} className={'cal-day' + (c.other ? ' other' : '')}>
                <div className={'cal-num' + (isToday ? ' today' : '')}>{c.day}</div>
                {evts.slice(0,3).map(t => {
                  const p = projects.find(x=>x.id===t.projectId);
                  return <div key={t.id} className="cal-evt" style={{ background: (p?.color || '#3B6EF5')+'20', color: p?.color || '#3B6EF5' }} onClick={()=>setDetail({ kind:'ticket', id:t.id })}>{t.title}</div>;
                })}
                {evts.length > 3 && <div style={{ fontSize:10, color:'var(--text-3)', fontWeight:700, marginTop:2 }}>+{evts.length-3} más</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── TRABAJADORES ─────────────────────── */
function ViewTrabajadores() {
  const { workers, tickets, setModal, go, deleteWorker } = useApp();
  const [q, setQ] = useState('');
  const filtered = workers.filter(w => !q || (w.name + w.role).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="content" data-screen-label="Trabajadores">
      <div className="page-head">
        <div className="ph-left">
          <div className="crumb"><a onClick={()=>go('trabajadores')}>Inicio</a><span className="sep">›</span><span>Trabajadores</span></div>
          <div className="page-title">Trabajadores</div>
          <div className="page-subtitle">Equipo · {workers.filter(w=>w.status==='Activo').length} activos</div>
        </div>
        <div className="ph-right">
          <button className="btn btn-primary btn-sm" onClick={()=>setModal({ kind:'worker' })}><i className="fa-solid fa-plus"></i> Nuevo Trabajador</button>
        </div>
      </div>

      <div className="toolbar">
        <span className="toolbar-title">Equipo · {filtered.length}</span>
        <div className="search-inline"><i className="fa-solid fa-magnifying-glass"></i><input placeholder="Buscar..." value={q} onChange={e=>setQ(e.target.value)} /></div>
      </div>

      {filtered.length === 0 ? (
        <Empty icon="fa-user-tie" title="Sin trabajadores" sub="Agrega un trabajador para empezar." />
      ) : (
        <div className="acct-list">
          {filtered.map(w => {
            const assigned = tickets.filter(t => t.assigneeId === w.id);
            const openT = assigned.filter(t => t.status !== 'Completado').length;
            const closedT = assigned.length - openT;
            return (
              <div key={w.id} className="acct-card">
                <div className="acct-header" onClick={() => setModal({ kind:'worker', data: w })}>
                  <div className="acct-left">
                    <div className="acct-icon" style={{ background: w.color, color:'#fff' }}>
                      {w.initials}
                    </div>
                    <div className="acct-info">
                      <div className="acct-name">{w.name}</div>
                      <div className="acct-meta">
                        {w.role} · {w.email}{w.phone ? ` · ${w.phone}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="acct-right">
                    <StatusPill s={w.status} />
                    <span className={'badge ' + (w.workType==='Por horas' ? 'b-info' : 'b-purple')}>
                      <span className="dot"></span>{w.workType}
                    </span>
                    <span className="acct-active-pill">
                      {assigned.length} {assigned.length === 1 ? 'ticket' : 'tickets'}
                    </span>
                    {openT > 0 && (
                      <span className="acct-active-pill" style={{ background:'var(--warning-50, #FEF3C7)', color:'#B45309', display:'inline-flex', alignItems:'center', gap:5 }}>
                        <i className="fa-solid fa-spinner" style={{ fontSize:10 }}></i>
                        {openT} {openT === 1 ? 'abierto' : 'abiertos'}
                      </span>
                    )}
                    {closedT > 0 && (
                      <span className="acct-active-pill" style={{ background:'rgba(16,185,129,.12)', color:'#047857', display:'inline-flex', alignItems:'center', gap:5 }}>
                        <i className="fa-solid fa-circle-check" style={{ fontSize:10 }}></i>
                        {closedT} {closedT === 1 ? 'completado' : 'completados'}
                      </span>
                    )}
                    <button className="cc-menu" onClick={(e)=>{ e.stopPropagation(); setModal({ kind:'worker', data: w }); }} title="Editar trabajador">
                      <i className="fa-solid fa-pen"></i>
                    </button>
                    <button className="cc-menu cc-menu-danger" onClick={(e)=>{
                      e.stopPropagation();
                      setModal({ kind:'confirm', data:{
                        title: '¿Eliminar trabajador?',
                        message: `Se eliminará a "${w.name}".` + (assigned.length > 0 ? ` Sus ${assigned.length} ${assigned.length === 1 ? 'ticket asignado quedará' : 'tickets asignados quedarán'} sin asignar.` : '') + ' Esta acción no se puede deshacer.',
                        confirmLabel: 'Eliminar trabajador',
                        onConfirm: () => deleteWorker(w.id),
                      }});
                    }} title="Eliminar trabajador">
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── FACTURACIÓN ─────────────────────── */
function fmtMoney(n, cur) {
  const sym = cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '₡';
  const s = (Math.round((n||0) * 100) / 100).toLocaleString('es-CR', { minimumFractionDigits: cur === 'CRC' ? 0 : 2, maximumFractionDigits: cur === 'CRC' ? 0 : 2 });
  return sym + s;
}
function ViewFacturacion() {
  const { invoices, clients, projects, setModal, deleteInvoice, go, toast } = useApp();
  const [q, setQ] = useState('');
  const [st, setSt] = useState('');
  const [client, setClient] = useState('');
  const today = new Date(); today.setHours(0,0,0,0);

  // auto-mark vencidas
  const enriched = invoices.map(i => {
    const dueD = new Date(i.dueDate);
    const isOverdue = i.status === 'Emitida' && dueD < today;
    return { ...i, _overdue: isOverdue, _statusEffective: isOverdue ? 'Vencida' : i.status };
  });

  const filtered = enriched.filter(i => {
    if (q && !((i.number || '') + ' ' + (i.notes || '')).toLowerCase().includes(q.toLowerCase())) return false;
    if (client && i.clientId !== client) return false;
    if (st && i._statusEffective !== st) return false;
    return true;
  }).sort((a,b) => (b.issueDate||'').localeCompare(a.issueDate||''));

  const sumBy = (status) => enriched
    .filter(i => i._statusEffective === status)
    .reduce((acc, i) => {
      acc[i.currency] = (acc[i.currency] || 0) + (i.amount || 0);
      return acc;
    }, {});
  const fmtAggregate = (agg) => {
    const entries = Object.entries(agg);
    if (!entries.length) return fmtMoney(0, 'CRC');
    return entries.map(([cur, n]) => fmtMoney(n, cur)).join(' · ');
  };

  const totEmitida = sumBy('Emitida');
  const totPagada = sumBy('Pagada');
  const totVencida = sumBy('Vencida');
  const totAll = enriched.reduce((acc, i) => { acc[i.currency] = (acc[i.currency]||0) + (i.amount||0); return acc; }, {});

  const parents = clients.filter(c => !c.parentId);
  const findClient = id => clients.find(c => c.id === id);
  const findProject = id => projects.find(p => p.id === id);

  const onDelete = (e, inv) => {
    e.stopPropagation();
    if (!confirm(`¿Eliminar la factura ${inv.number}?\n\nEsta acción no se puede deshacer.`)) return;
    deleteInvoice(inv.id);
  };

  return (
    <div className="content" data-screen-label="Facturación">
      <div className="page-head">
        <div className="ph-left">
          <div className="crumb"><a onClick={()=>go('facturacion')}>Inicio</a><span className="sep">›</span><span>Facturación</span></div>
          <div className="page-title">Facturación</div>
          <div className="page-subtitle">{filtered.length} de {invoices.length} facturas · {fmtAggregate(totAll)} total</div>
        </div>
        <div className="ph-right">
          <button className="btn btn-primary btn-sm" onClick={()=>setModal({ kind:'invoice' })}><i className="fa-solid fa-plus"></i> Nueva Factura</button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total" value={invoices.length} icon="fa-file-invoice-dollar" tone="primary" delta={fmtAggregate(totAll)} onClick={()=>setSt('')} active={st===''} />
        <StatCard label="Emitidas" value={enriched.filter(i=>i._statusEffective==='Emitida').length} icon="fa-paper-plane" tone="info" delta={fmtAggregate(totEmitida)} onClick={()=>setSt(st==='Emitida'?'':'Emitida')} active={st==='Emitida'} />
        <StatCard label="Pagadas" value={enriched.filter(i=>i._statusEffective==='Pagada').length} icon="fa-circle-check" tone="success" delta={fmtAggregate(totPagada)} onClick={()=>setSt(st==='Pagada'?'':'Pagada')} active={st==='Pagada'} />
        <StatCard label="Vencidas" value={enriched.filter(i=>i._statusEffective==='Vencida').length} icon="fa-triangle-exclamation" tone="danger" delta={fmtAggregate(totVencida)} onClick={()=>setSt(st==='Vencida'?'':'Vencida')} active={st==='Vencida'} />
      </div>

      <div className="toolbar">
        <span className="toolbar-title">Facturas · {filtered.length}</span>
        <div className="search-inline"><i className="fa-solid fa-magnifying-glass"></i><input placeholder="Buscar por número o notas..." value={q} onChange={e=>setQ(e.target.value)} /></div>
        <select className="select" value={client} onChange={e=>setClient(e.target.value)}>
          <option value="">Todos los clientes</option>
          {parents.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="select" value={st} onChange={e=>setSt(e.target.value)}>
          <option value="">Todos los estados</option>
          <option>Emitida</option><option>Pagada</option><option>Vencida</option><option>Anulada</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Empty icon="fa-file-invoice-dollar" title="Sin facturas" message="Crea una nueva factura para comenzar." />
      ) : (
        <div className="tlist inv-list">
          <div className="inv-head">
            <div>Número</div>
            <div>Cliente</div>
            <div>Proyecto</div>
            <div>Emisión</div>
            <div>Vence</div>
            <div style={{ textAlign:'right' }}>Monto</div>
            <div>Estado</div>
            <div></div>
          </div>
          {filtered.map(inv => {
            const cli = findClient(inv.clientId);
            const sub = inv.subClientId ? findClient(inv.subClientId) : null;
            const proj = inv.projectId ? findProject(inv.projectId) : null;
            return (
              <div key={inv.id} className="inv-row" onClick={()=>setModal({ kind:'invoice', data: inv })}>
                <div className="inv-num">{inv.number}</div>
                <div className="inv-client">
                  <div className="inv-client-name">{cli?.name || '—'}</div>
                  {sub && (() => {
                    const cls = Array.isArray(sub.classifications) && sub.classifications.length
                      ? sub.classifications.join(' / ')
                      : (sub.classification || '');
                    return <div className="inv-client-sub">{cls ? `${cls} · ${sub.name}` : sub.name}</div>;
                  })()}
                </div>
                <div className="inv-project">
                  {proj ? (<><span className="pd" style={{ background: proj.color }}></span>{proj.name}</>) : <span style={{ color:'var(--text-3)' }}>—</span>}
                </div>
                <div className="inv-date">{shortDate(inv.issueDate)}</div>
                <div className="inv-date" style={{ color: inv._overdue ? 'var(--danger)' : undefined, fontWeight: inv._overdue ? 700 : undefined }}>
                  {shortDate(inv.dueDate)}{inv._overdue && ' ⚠'}
                </div>
                <div className="inv-amount">{fmtMoney(inv.amount, inv.currency)}</div>
                <div><InvStatusPill s={inv._statusEffective} /></div>
                <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                  <button className="row-edit-btn" title="Editar" onClick={(e)=>{ e.stopPropagation(); setModal({ kind:'invoice', data: inv }); }}><i className="fa-solid fa-pen"></i></button>
                  <button className="row-edit-btn row-del-btn" title="Eliminar" onClick={(e)=>onDelete(e, inv)}><i className="fa-solid fa-trash"></i></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InvStatusPill({ s }) {
  const map = {
    'Emitida':  { bg:'rgba(245,158,11,0.14)', color:'#B45309', icon:'fa-paper-plane' },
    'Pagada':   { bg:'rgba(16,185,129,0.12)', color:'#047857', icon:'fa-circle-check' },
    'Vencida':  { bg:'rgba(239,68,68,0.12)',  color:'#B91C1C', icon:'fa-triangle-exclamation' },
    'Anulada':  { bg:'rgba(100,116,139,0.14)',color:'#475569', icon:'fa-ban' },
  };
  const c = map[s] || map['Emitida'];
  return (
    <span className="inv-pill" style={{ background: c.bg, color: c.color }}>
      <i className={'fa-solid ' + c.icon}></i>{s}
    </span>
  );
}

/* ─────────────────────── CONFIGURACIÓN ─────────────────────── */
function ViewConfig() {
  const { go, toast } = useApp();
  const DEFAULT_SECTIONS = {
    clientStatuses: ['Activo','Inactivo','Prospecto'],
    projectStatuses: ['En progreso','En pausa','Finalizado'],
    ticketStatuses: ['Por hacer','Pendiente','Completado'],
    priorities: ['Alta','Media','Baja'],
    workTypes: ['Por horas','Por contrato'],
    roleTypes: ['Gerente','Desarrollador','Diseñador','Técnico','Supervisor'],
  };
  const [sections, setSections] = useState(() => {
    try {
      const raw = localStorage.getItem('oviq_config_sections');
      if (raw) return { ...DEFAULT_SECTIONS, ...JSON.parse(raw) };
    } catch (e) {}
    return DEFAULT_SECTIONS;
  });
  useEffect(() => {
    try { localStorage.setItem('oviq_config_sections', JSON.stringify(sections)); } catch (e) {}
  }, [sections]);
  const groups = [
    { key:'clientStatuses', title:'Estados de cliente', icon:'fa-user-group', tone:'primary' },
    { key:'projectStatuses', title:'Estados de proyecto', icon:'fa-diagram-project', tone:'success' },
    { key:'ticketStatuses', title:'Estados de ticket', icon:'fa-ticket', tone:'info' },
    { key:'priorities', title:'Prioridades', icon:'fa-flag', tone:'danger' },
    { key:'workTypes', title:'Formas de trabajo', icon:'fa-briefcase', tone:'warning' },
    { key:'roleTypes', title:'Tipos de cargo', icon:'fa-user-tie', tone:'purple' },
  ];
  const supersections = [
    { title: 'Cliente',       icon: 'fa-user-group',       desc: 'Taxonomías que aplican a los clientes.',      items: ['clientStatuses'] },
    { title: 'Proyecto',      icon: 'fa-diagram-project',  desc: 'Categorías usadas en los proyectos.',         items: ['projectStatuses'] },
    { title: 'Ticket',        icon: 'fa-ticket',           desc: 'Estados y prioridades de los tickets.',       items: ['ticketStatuses', 'priorities'] },
    { title: 'Trabajadores',  icon: 'fa-user-tie',         desc: 'Opciones del módulo de trabajadores.',        items: ['workTypes', 'roleTypes'] },
  ];
  const groupByKey = Object.fromEntries(groups.map(g => [g.key, g]));
  return (
    <div className="content" data-screen-label="Configuración">
      <div className="page-head">
        <div className="ph-left">
          <div className="crumb"><a onClick={()=>go('configuracion')}>Inicio</a><span className="sep">›</span><span>Configuración</span></div>
          <div className="page-title">Configuración</div>
          <div className="page-subtitle">Personaliza las taxonomías del sistema.</div>
        </div>
      </div>
      {supersections.map(sec => (
        <div key={sec.title} className="cfg-section">
          <div className="cfg-section-head">
            <div className="cfg-section-icon"><i className={'fa-solid ' + sec.icon}></i></div>
            <div className="cfg-section-title">{sec.title}</div>
          </div>
          <div className="cfg-section-body" style={{ display:'grid', gridTemplateColumns: sec.items.length > 1 ? 'repeat(auto-fill, minmax(320px, 1fr))' : 'minmax(320px, 520px)', gap:16 }}>
            {sec.items.map(key => {
              const g = groupByKey[key];
              return (
                <div key={key} className="card">
                  <div className="card-head">
                    <div className={'stat-icon ic-' + g.tone} style={{ width:30, height:30, borderRadius:7 }}><i className={'fa-solid ' + g.icon}></i></div>
                    <div className="card-title">{g.title}</div>
                  </div>
                  <ConfigEditor items={sections[g.key]} onAdd={(v)=>{ setSections(s=>({ ...s, [g.key]: [...s[g.key], v] })); toast('Agregado', 'success'); }} onDelete={(i)=>{ setSections(s=>({ ...s, [g.key]: s[g.key].filter((_,x)=>x!==i) })); }} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
function ConfigEditor({ items, onAdd, onDelete }) {
  const [val, setVal] = useState('');
  return (
    <React.Fragment>
      <div style={{ padding:12, borderBottom:'1px solid var(--border)', display:'flex', gap:8 }}>
        <input className="input" placeholder="Agregar nuevo..." value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter' && val.trim()){ onAdd(val.trim()); setVal(''); }}} />
        <button className="btn btn-primary btn-sm" onClick={()=>{ if(val.trim()){ onAdd(val.trim()); setVal(''); }}}><i className="fa-solid fa-plus"></i></button>
      </div>
      <div className="tag-list">
        {items.map((it, i) => (
          <div key={i} className="tag-item">
            <i className="fa-solid fa-circle-dot" style={{ color:'var(--text-3)', fontSize:10 }}></i>
            <span>{it}</span>
            <button className="tg-delete" onClick={()=>onDelete(i)}><i className="fa-solid fa-trash"></i></button>
          </div>
        ))}
      </div>
    </React.Fragment>
  );
}

/* ─── Register all views ─── */
Object.assign(window, {
  OVIQ_VIEWS: {
    dashboard: ViewDashboard,
    clientes: ViewClientes,
    proyectos: ViewProyectosV2,
    'proyecto-detalle': ViewProyectoDetalle,
    tickets: ViewTickets,
    kanban: () => window.OVIQ_KanbanView(),
    calendario: ViewCalendario,
    trabajadores: ViewTrabajadores,
    facturacion: ViewFacturacion,
    configuracion: ViewConfig,
  },
  OVIQ_TicketList: TicketList,
  OVIQ_Avatar: Avatar,
  OVIQ_StatusPill: StatusPill,
  OVIQ_PriorityTag: PriorityTag,
  OVIQ_Empty: Empty,
});
