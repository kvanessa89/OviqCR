/* OVIQ · Modals + Detail panels */
const { useState, useEffect } = React;
const useApp = window.OVIQ_useApp;
const Avatar = window.OVIQ_Avatar;
const StatusPill = window.OVIQ_StatusPill;
const PriorityTag = window.OVIQ_PriorityTag;
const fmtDate = window.OVIQ_fmtDate;

/* ─── Modal: Client ─── */
function ClientModal({ data, close }) {
  const { clients, createClient, updateClient } = useApp();
  const parents = clients.filter(c => !c.parentId && c.id !== data?.id);
  const [f, setF] = useState({ name:'', contact:'', email:'', phone:'', status:'Activo', parentId: null, description:'', ...(data||{}) });
  const save = () => {
    if (!f.name?.trim()) return;
    const payload = { ...f, parentId: f.parentId || null };
    if (data?.id) updateClient(data.id, payload); else createClient(payload);
    close();
  };
  return (
    <div className="modal">
      <div className="modal-head">
        <i className="fa-solid fa-user-plus" style={{ color:'var(--primary)' }}></i>
        <div className="modal-title">{data?.id ? 'Editar cuenta' : 'Nueva cuenta'}</div>
        <button className="modal-close" onClick={close}><i className="fa-solid fa-xmark"></i></button>
      </div>
      <div className="modal-body">
        <div className="field-row">
          <div className="field"><label>Nombre *</label><input className="input" value={f.name} onChange={e=>setF({...f, name:e.target.value})} autoFocus /></div>
          <div className="field"><label>Estado</label><select className="select" value={f.status} onChange={e=>setF({...f, status:e.target.value})}><option>Activo</option><option>Prospecto</option><option>Inactivo</option></select></div>
        </div>
        <div className="field"><label>Subcuenta de (opcional)</label><select className="select" value={f.parentId || ''} onChange={e=>setF({...f, parentId: e.target.value || null})}><option value="">— Es cuenta principal —</option>{parents.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div className="field-row">
          <div className="field"><label>Contacto</label><input className="input" value={f.contact} onChange={e=>setF({...f, contact:e.target.value})} /></div>
          <div className="field"><label>Email</label><input className="input" value={f.email} onChange={e=>setF({...f, email:e.target.value})} /></div>
        </div>
        <div className="field"><label>Teléfono</label><input className="input" value={f.phone} onChange={e=>setF({...f, phone:e.target.value})} /></div>
        <div className="field"><label>Descripción</label><textarea className="textarea" value={f.description} onChange={e=>setF({...f, description:e.target.value})} /></div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-outline" onClick={close}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}><i className="fa-solid fa-floppy-disk"></i> Guardar</button>
      </div>
    </div>
  );
}

/* ─── Modal: Project ─── */
function ProjectModal({ data, close }) {
  const { clients, createProject, updateProject } = useApp();
  const parents = clients.filter(c => !c.parentId);
  const [f, setF] = useState({ name:'', clientId: parents[0]?.id, subClientId: null, status:'Planificación', start:'', end:'', description:'', ...(data||{}) });
  const subs = clients.filter(c => c.parentId === f.clientId);
  const save = () => {
    if (!f.name?.trim()) return;
    const payload = { ...f, subClientId: f.subClientId || null };
    if (data?.id) updateProject(data.id, payload); else createProject(payload);
    close();
  };
  return (
    <div className="modal">
      <div className="modal-head">
        <i className="fa-solid fa-diagram-project" style={{ color:'var(--primary)' }}></i>
        <div className="modal-title">{data?.id ? 'Editar proyecto' : 'Nuevo proyecto'}</div>
        <button className="modal-close" onClick={close}><i className="fa-solid fa-xmark"></i></button>
      </div>
      <div className="modal-body">
        <div className="field"><label>Nombre del proyecto *</label><input className="input" autoFocus value={f.name} onChange={e=>setF({...f, name:e.target.value})} /></div>
        <div className="field-row">
          <div className="field"><label>Cuenta</label><select className="select" value={f.clientId} onChange={e=>setF({...f, clientId:e.target.value, subClientId: null})}>{parents.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="field"><label>Estado</label><select className="select" value={f.status} onChange={e=>setF({...f, status:e.target.value})}><option>Planificación</option><option>En progreso</option><option>En pausa</option><option>Completado</option></select></div>
        </div>
        {subs.length > 0 && (
          <div className="field"><label>Subcuenta (opcional)</label><select className="select" value={f.subClientId || ''} onChange={e=>setF({...f, subClientId: e.target.value || null})}><option value="">— Sin subcuenta —</option>{subs.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        )}
        <div className="field-row">
          <div className="field"><label>Fecha de inicio</label><input className="input" type="date" value={f.start} onChange={e=>setF({...f, start:e.target.value})} /></div>
          <div className="field"><label>Fecha de fin</label><input className="input" type="date" value={f.end} onChange={e=>setF({...f, end:e.target.value})} /></div>
        </div>
        <div className="field"><label>Descripción</label><textarea className="textarea" value={f.description} onChange={e=>setF({...f, description:e.target.value})} /></div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-outline" onClick={close}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}><i className="fa-solid fa-floppy-disk"></i> Guardar</button>
      </div>
    </div>
  );
}

/* ─── Modal: Ticket ─── */
function TicketModal({ data, close }) {
  const { projects, workers, createTicket, updateTicket } = useApp();
  const [f, setF] = useState({
    title:'', projectId: projects[0]?.id, assigneeId:'',
    priority:'Media', status:'Por hacer', due:'', description:'',
    ...(data||{})
  });
  const save = () => {
    if (!f.title?.trim()) return;
    if (data?.id) updateTicket(data.id, f); else createTicket(f);
    close();
  };
  return (
    <div className="modal wide">
      <div className="modal-head">
        <i className="fa-solid fa-ticket" style={{ color:'var(--primary)' }}></i>
        <div className="modal-title">{data?.id ? 'Editar ticket' : 'Nuevo ticket'}</div>
        <button className="modal-close" onClick={close}><i className="fa-solid fa-xmark"></i></button>
      </div>
      <div className="modal-body">
        <div className="field"><label>Título *</label><input className="input" autoFocus value={f.title} onChange={e=>setF({...f, title:e.target.value})} placeholder="Ej. Diseñar mockup home" /></div>
        <div className="field"><label>Descripción</label><textarea className="textarea" value={f.description} onChange={e=>setF({...f, description:e.target.value})} /></div>
        <div className="field-row">
          <div className="field"><label>Proyecto</label><select className="select" value={f.projectId} onChange={e=>setF({...f, projectId:e.target.value})}>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div className="field"><label>Asignado a</label><select className="select" value={f.assigneeId} onChange={e=>setF({...f, assigneeId:e.target.value})}><option value="">Sin asignar</option>{workers.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
        </div>
        <div className="field-row" style={{ gridTemplateColumns:'1fr 1fr 1fr' }}>
          <div className="field"><label>Prioridad</label><select className="select" value={f.priority} onChange={e=>setF({...f, priority:e.target.value})}><option>Alta</option><option>Media</option><option>Baja</option></select></div>
          <div className="field"><label>Estado</label><select className="select" value={f.status} onChange={e=>setF({...f, status:e.target.value})}><option>Por hacer</option><option>En progreso</option><option>En revisión</option><option>Completado</option></select></div>
          <div className="field"><label>Fecha límite</label><input className="input" type="date" value={f.due} onChange={e=>setF({...f, due:e.target.value})} /></div>
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-outline" onClick={close}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}><i className="fa-solid fa-floppy-disk"></i> Guardar</button>
      </div>
    </div>
  );
}

/* ─── Modal: Worker ─── */
function WorkerModal({ data, close }) {
  const { createWorker, updateWorker } = useApp();
  const [f, setF] = useState({ name:'', role:'Técnico', email:'', phone:'', status:'Activo', workType:'Por contrato', ...(data||{}) });
  const save = () => {
    if (!f.name?.trim()) return;
    if (data?.id) updateWorker(data.id, f); else createWorker(f);
    close();
  };
  return (
    <div className="modal">
      <div className="modal-head">
        <i className="fa-solid fa-user-tie" style={{ color:'var(--primary)' }}></i>
        <div className="modal-title">{data?.id ? 'Editar trabajador' : 'Nuevo trabajador'}</div>
        <button className="modal-close" onClick={close}><i className="fa-solid fa-xmark"></i></button>
      </div>
      <div className="modal-body">
        <div className="field-row">
          <div className="field"><label>Nombre *</label><input className="input" autoFocus value={f.name} onChange={e=>setF({...f, name:e.target.value})} /></div>
          <div className="field"><label>Cargo</label><input className="input" value={f.role} onChange={e=>setF({...f, role:e.target.value})} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Email</label><input className="input" value={f.email} onChange={e=>setF({...f, email:e.target.value})} /></div>
          <div className="field"><label>Teléfono</label><input className="input" value={f.phone} onChange={e=>setF({...f, phone:e.target.value})} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Estado</label><select className="select" value={f.status} onChange={e=>setF({...f, status:e.target.value})}><option>Activo</option><option>Inactivo</option></select></div>
          <div className="field"><label>Forma de trabajo</label><select className="select" value={f.workType} onChange={e=>setF({...f, workType:e.target.value})}><option>Por horas</option><option>Por contrato</option></select></div>
        </div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-outline" onClick={close}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}><i className="fa-solid fa-floppy-disk"></i> Guardar</button>
      </div>
    </div>
  );
}

/* ─── Detail panel: Ticket ─── */
function TicketDetail({ id, close }) {
  const { tickets, workers, projects, setModal, deleteTicket, updateTicket, addComment } = useApp();
  const t = tickets.find(x => x.id === id);
  const [cmt, setCmt] = useState('');
  if (!t) return null;
  const w = workers.find(x=>x.id===t.assigneeId);
  const p = projects.find(x=>x.id===t.projectId);
  return (
    <React.Fragment>
      <div className="dp-head">
        <div className="stat-icon ic-primary" style={{ width:40, height:40, borderRadius:10, fontSize:15 }}><i className="fa-solid fa-ticket"></i></div>
        <div style={{ flex:1 }}>
          <div className="dp-title">{t.title}</div>
          <div className="dp-sub">{t.code} · creado {fmtDate(t.created)}</div>
        </div>
        <button className="modal-close" onClick={close}><i className="fa-solid fa-xmark"></i></button>
      </div>
      <div className="dp-body">
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
          <StatusPill s={t.status} />
          <PriorityTag p={t.priority} />
        </div>

        <div className="dp-section">Detalles</div>
        <div className="dp-row"><span className="lbl">Proyecto</span><span className="val">{p?.name || '—'}</span></div>
        <div className="dp-row"><span className="lbl">Asignado</span><span className="val">{w ? <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><Avatar size="xs" color={w.color} initials={w.initials}/>{w.name}</span> : 'Sin asignar'}</span></div>
        <div className="dp-row"><span className="lbl">Fecha límite</span><span className="val">{fmtDate(t.due)}</span></div>
        <div className="dp-row"><span className="lbl">Creado</span><span className="val">{fmtDate(t.created)}</span></div>

        <div className="dp-section">Cambiar estado</div>
        <select className="select" style={{ width:'100%' }} value={t.status} onChange={e=>updateTicket(t.id, { status: e.target.value })}>
          <option>Por hacer</option><option>En progreso</option><option>En revisión</option><option>Completado</option>
        </select>

        {t.description && <React.Fragment>
          <div className="dp-section">Descripción</div>
          <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, padding:10, fontSize:12.5 }}>{t.description}</div>
        </React.Fragment>}

        <div className="dp-section">Comentarios ({(t.comments||[]).length})</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {(t.comments||[]).map(c => (
            <div key={c.id} className="comment">
              <Avatar size="sm" color={c.kind==='worker' ? '#10B981' : '#3B6EF5'} initials={c.initials}/>
              <div className="comment-bubble">
                <div className="comment-meta"><span className="comment-author">{c.author}</span><span className="comment-date">{fmtDate(c.date)}</span></div>
                <div className="comment-text">{c.text}</div>
              </div>
            </div>
          ))}
          <div style={{ display:'flex', gap:6 }}>
            <textarea className="textarea" rows="2" placeholder="Escribe un comentario..." value={cmt} onChange={e=>setCmt(e.target.value)} style={{ minHeight:44 }}/>
            <button className="btn btn-primary btn-sm" style={{ alignSelf:'flex-end' }} onClick={()=>{ if(cmt.trim()){ addComment(t.id, cmt.trim()); setCmt(''); }}}><i className="fa-solid fa-paper-plane"></i></button>
          </div>
        </div>

        <div style={{ display:'flex', gap:8, marginTop:18 }}>
          <button className="btn btn-danger-ghost btn-sm" style={{ flex:1 }} onClick={()=>{ if(confirm('¿Eliminar ticket?')) { deleteTicket(t.id); close(); }}}><i className="fa-solid fa-trash"></i> Eliminar</button>
        </div>
      </div>
    </React.Fragment>
  );
}

/* ─── Detail panel: Client ─── */
function ClientDetail({ id, close }) {
  const { clients, projects, tickets, setModal, deleteClient, go } = useApp();
  const c = clients.find(x=>x.id===id);
  if (!c) return null;
  const projs = projects.filter(p=>p.clientId===c.id);
  return (
    <React.Fragment>
      <div className="dp-head">
        <Avatar size="lg" color={c.color} initials={c.initials} />
        <div style={{ flex:1 }}>
          <div className="dp-title">{c.name}</div>
          <div className="dp-sub">{c.industry}</div>
        </div>
        <button className="modal-close" onClick={close}><i className="fa-solid fa-xmark"></i></button>
      </div>
      <div className="dp-body">
        <div style={{ marginBottom:14 }}><StatusPill s={c.status} /></div>
        <div className="dp-section">Contacto</div>
        <div className="dp-row"><span className="lbl">Persona</span><span className="val">{c.contact}</span></div>
        <div className="dp-row"><span className="lbl">Email</span><span className="val">{c.email}</span></div>
        <div className="dp-row"><span className="lbl">Teléfono</span><span className="val">{c.phone}</span></div>

        {c.description && <React.Fragment>
          <div className="dp-section">Descripción</div>
          <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, padding:10, fontSize:12.5 }}>{c.description}</div>
        </React.Fragment>}

        <div className="dp-section">Proyectos ({projs.length})</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {projs.map(p => {
            const tkts = tickets.filter(t=>t.projectId===p.id);
            const done = tkts.filter(t=>t.status==='Completado').length;
            const pct = tkts.length ? Math.round(done/tkts.length*100) : 0;
            return (
              <div key={p.id} style={{ padding:10, border:'1px solid var(--border)', borderRadius:8, cursor:'pointer' }} onClick={()=>{ close(); go('proyecto-detalle', { projectId: p.id }); }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <div style={{ width:26, height:26, background:p.color, borderRadius:6, display:'grid', placeItems:'center', color:'#fff' }}><i className={p.icon} style={{ fontSize:10 }}></i></div>
                  <div style={{ flex:1, fontSize:12.5, fontWeight:700, color:'var(--text-1)' }}>{p.name}</div>
                  <StatusPill s={p.status} />
                </div>
                <div className="progress"><div className="progress-fill" style={{ width: pct+'%', background:p.color }}></div></div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontSize:11, color:'var(--text-3)' }}><span>{done}/{tkts.length} tickets</span><span>{pct}%</span></div>
              </div>
            );
          })}
          {projs.length === 0 && <div style={{ fontSize:12, color:'var(--text-3)' }}>Sin proyectos aún</div>}
        </div>

        <div style={{ display:'flex', gap:8, marginTop:18 }}>
          <button className="btn btn-outline btn-sm" style={{ flex:1 }} onClick={()=>setModal({ kind:'client', data:c })}><i className="fa-solid fa-pen"></i> Editar</button>
          <button className="btn btn-danger-ghost btn-sm" onClick={()=>{ if(confirm('¿Eliminar cliente?')) { deleteClient(c.id); close(); }}}><i className="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </React.Fragment>
  );
}

Object.assign(window, {
  OVIQ_MODALS: {
    client: ClientModal,
    project: ProjectModal,
    ticket: TicketModal,
    worker: WorkerModal,
  },
  OVIQ_DETAILS: {
    ticket: TicketDetail,
    client: ClientDetail,
  },
});
