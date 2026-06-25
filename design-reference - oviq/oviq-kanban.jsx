/* OVIQ · Kanban board with drag & drop */
const { useState } = React;
const useApp = window.OVIQ_useApp;
const Avatar = window.OVIQ_Avatar;
const PriorityTag = window.OVIQ_PriorityTag;
const shortDate = window.OVIQ_shortDate;
const daysUntil = window.OVIQ_daysUntil;
const Empty = window.OVIQ_Empty;

const COLUMNS = [
  { s: 'Por hacer',  color: '#94A3B8' },
  { s: 'Pendiente',  color: '#3B6EF5' },
  { s: 'Completado', color: '#10B981' },
];

function KanbanView() {
  const { scopedTickets: tickets, projects, workers, setModal, setDetail, updateTicket, go } = useApp();
  const [proj, setProj] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  const filtered = tickets.filter(t => {
    if (proj && t.projectId !== proj) return false;
    if (assignee && t.assigneeId !== assignee) return false;
    return true;
  });

  const onDragStart = (e, id) => { setDragId(id); e.dataTransfer.effectAllowed = 'move'; };
  const onDragOver = (e, col) => { e.preventDefault(); setOverCol(col); };
  const onDrop = (e, col) => {
    e.preventDefault();
    if (dragId) { updateTicket(dragId, { status: col }); useApp().toast('Ticket movido a ' + col, 'success'); }
    setDragId(null); setOverCol(null);
  };

  return (
    <div className="content" data-screen-label="Tablero Kanban">
      <div className="page-head">
        <div className="ph-left">
          <div className="crumb"><a onClick={()=>go('dashboard')}>Inicio</a><span className="sep">›</span><span>Tablero Kanban</span></div>
          <div className="page-title">Tablero Kanban</div>
          <div className="page-subtitle">Arrastra tarjetas entre columnas para cambiar su estado.</div>
        </div>
        <div className="ph-right">
          <div className="segmented">
            <button onClick={()=>go('tickets')}><i className="fa-solid fa-list"></i> Lista</button>
            <button className="active"><i className="fa-solid fa-columns"></i> Tablero</button>
          </div>
          <button className="btn btn-primary btn-sm" onClick={()=>setModal({ kind:'ticket' })}><i className="fa-solid fa-plus"></i> Nuevo Ticket</button>
        </div>
      </div>

      <div className="toolbar">
        <span className="toolbar-title">Tablero · {filtered.length} tickets</span>
        <select className="select" value={proj} onChange={e=>setProj(e.target.value)}>
          <option value="">Todos los proyectos</option>
          {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="select" value={assignee} onChange={e=>setAssignee(e.target.value)}>
          <option value="">Todos los asignados</option>
          {workers.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      <div className="kanban">
        {COLUMNS.map(col => {
          const items = filtered.filter(t => t.status === col.s);
          return (
            <div key={col.s} className="kcol">
              <div className="kcol-head">
                <span className="kdot" style={{ background: col.color }}></span>
                <span className="kcol-title">{col.s}</span>
                <span className="kcol-count">{items.length}</span>
                <button className="kcol-add" onClick={()=>setModal({ kind:'ticket', data:{ status: col.s }})}><i className="fa-solid fa-plus"></i></button>
              </div>
              <div className={'kcol-body' + (overCol === col.s ? ' drag-over' : '')}
                onDragOver={(e)=>onDragOver(e, col.s)}
                onDragLeave={()=>setOverCol(null)}
                onDrop={(e)=>onDrop(e, col.s)}
              >
                {items.map(t => {
                  const w = workers.find(x=>x.id===t.assigneeId);
                  const p = projects.find(x=>x.id===t.projectId);
                  const du = daysUntil(t.due);
                  const overdue = du < 0 && t.status !== 'Completado';
                  return (
                    <div key={t.id} className={'kcard' + (dragId===t.id ? ' dragging' : '')}
                      draggable
                      onDragStart={(e)=>onDragStart(e, t.id)}
                      onDragEnd={()=>{ setDragId(null); setOverCol(null); }}
                      onClick={()=>setDetail({ kind:'ticket', id: t.id })}
                    >
                      <div className="kcard-top">
                        <span className="kcard-code">{t.code}</span>
                        <PriorityTag p={t.priority} />
                      </div>
                      <div className="kcard-title">{t.title}</div>
                      <div className="kcard-meta">
                        <span className="kcard-project"><span className="pd" style={{ background:p?.color }}></span>{p?.name || '—'}</span>
                      </div>
                      <div className="kcard-foot">
                        <span className={'kcard-due' + (overdue ? ' overdue':'')}><i className="fa-regular fa-calendar"></i>{shortDate(t.due)}</span>
                        {w && <div className="kcard-av" style={{ background: w.color }} title={w.name}>{w.initials}</div>}
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && <div style={{ padding:20, textAlign:'center', fontSize:11.5, color:'var(--text-3)', fontWeight:600 }}>Arrastra aquí</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.OVIQ_KanbanView = () => <KanbanView />;
