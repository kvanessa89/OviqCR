/* OVIQ · Modals + Detail panels */
const { useState, useEffect } = React;
const useApp = window.OVIQ_useApp;
const Avatar = window.OVIQ_Avatar;
const StatusPill = window.OVIQ_StatusPill;
const PriorityTag = window.OVIQ_PriorityTag;
const fmtDate = window.OVIQ_fmtDate;

/* ─── Modal: Client ─── */
function ClientModal({ data, parentId, close }) {
  const { clients, createClient, updateClient, deleteClient } = useApp();
  const isSub = !!(data?.parentId || parentId);
  const editingParent = !!(data?.id && !data?.parentId);
  const parent = isSub ? clients.find(c => c.id === (data?.parentId || parentId)) : null;
  const initialClasifs = Array.isArray(data?.classifications)
    ? data.classifications
    : (data?.classification ? [data.classification] : []);
  const [f, setF] = useState({
    name:'', contact:'', email:'', phone:'', status:'Activo', industry:'', description:'',
    ...(data||{}),
    classifications: initialClasifs,
    parentId: data?.parentId || parentId || null,
  });
  const [clasifInput, setClasifInput] = useState('');

  // Subaccounts state (only when editing a parent)
  const liveSubs = editingParent ? clients.filter(c => c.parentId === data.id) : [];
  const [newSub, setNewSub] = useState({ name:'', clasif:'' });

  // Classification suggestions: all existing classifications in this client's network
  const suggestPool = editingParent
    ? liveSubs
    : (parent ? clients.filter(c => c.parentId === parent.id) : []);
  const suggestions = Array.from(new Set(
    suggestPool.flatMap(s => Array.isArray(s.classifications) ? s.classifications : (s.classification ? [s.classification] : []))
  )).filter(Boolean).sort();

  const addClasif = (val) => {
    const v = (val ?? clasifInput).trim();
    if (!v) return;
    if (f.classifications.includes(v)) { setClasifInput(''); return; }
    setF({ ...f, classifications: [...f.classifications, v] });
    setClasifInput('');
  };
  const removeClasif = (v) => setF({ ...f, classifications: f.classifications.filter(x => x !== v) });

  const save = () => {
    if (!f.name?.trim()) return;
    const payload = { ...f };
    // legacy single-classification mirror
    payload.classification = payload.classifications[0] || '';
    if (data?.id) updateClient(data.id, payload); else createClient(payload);
    close();
  };

  const addSub = () => {
    const name = newSub.name.trim();
    if (!name) return;
    const clasif = newSub.clasif.trim();
    createClient({
      name,
      contact:'', email:'', phone:'', status:'Activo', description:'',
      parentId: data.id,
      classifications: clasif ? [clasif] : [],
      classification: clasif || '',
    });
    setNewSub({ name:'', clasif:'' });
  };

  const updateSubClasifs = (subId, newList) => {
    updateClient(subId, { classifications: newList, classification: newList[0] || '' });
  };

  const titleText = editingParent ? 'Editar cuenta'
    : (data?.id ? 'Editar subcuenta'
    : (isSub ? `Nueva subcuenta${parent ? ' de ' + parent.name : ''}` : 'Nueva cuenta'));

  return (
    <div className="modal" style={{ maxWidth: editingParent ? 720 : 560 }}>
      <div className="modal-head">
        <i className={'fa-solid ' + (isSub ? 'fa-sitemap' : 'fa-briefcase')} style={{ color:'var(--primary)' }}></i>
        <div className="modal-title">{titleText}</div>
        <button className="modal-close" onClick={close}><i className="fa-solid fa-xmark"></i></button>
      </div>
      <div className="modal-body">
        {parent && (
          <div className="cm-parent-badge">
            <i className="fa-solid fa-briefcase"></i>
            <span>Cuenta padre: <strong>{parent.name}</strong></span>
          </div>
        )}
        <div className="field-row">
          <div className="field"><label>Nombre *</label><input className="input" value={f.name} onChange={e=>setF({...f, name:e.target.value})} autoFocus /></div>
          <div className="field"><label>Estado</label><select className="select" value={f.status} onChange={e=>setF({...f, status:e.target.value})}><option>Activo</option><option>Prospecto</option><option>Inactivo</option></select></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Contacto</label><input className="input" value={f.contact || ''} onChange={e=>setF({...f, contact:e.target.value})} /></div>
          <div className="field"><label>Email</label><input className="input" value={f.email || ''} onChange={e=>setF({...f, email:e.target.value})} /></div>
        </div>
        <div className="field"><label>Teléfono</label><input className="input" value={f.phone || ''} onChange={e=>setF({...f, phone:e.target.value})} /></div>

        {isSub && (
          <div className="field">
            <label>Clasificaciones</label>
            <div className="clasif-edit">
              <div className="clasif-chips">
                {f.classifications.length === 0 && <span className="clasif-empty">Sin clasificación</span>}
                {f.classifications.map(v => (
                  <span key={v} className="clasif-chip">
                    <i className="fa-solid fa-tag"></i>{v}
                    <button type="button" onClick={()=>removeClasif(v)} title="Quitar"><i className="fa-solid fa-xmark"></i></button>
                  </span>
                ))}
              </div>
              <div className="clasif-add">
                <input
                  className="input"
                  placeholder="Agregar clasificación y presionar Enter"
                  value={clasifInput}
                  onChange={e=>setClasifInput(e.target.value)}
                  onKeyDown={e=>{ if (e.key === 'Enter') { e.preventDefault(); addClasif(); } }}
                  list={'clasif-sug-' + (data?.id || 'new')}
                />
                <datalist id={'clasif-sug-' + (data?.id || 'new')}>
                  {suggestions.map(s => <option key={s} value={s} />)}
                </datalist>
                <button type="button" className="btn btn-outline btn-sm" onClick={()=>addClasif()}><i className="fa-solid fa-plus"></i></button>
              </div>
            </div>
          </div>
        )}

        <div className="field"><label>Descripción</label><textarea className="textarea" value={f.description || ''} onChange={e=>setF({...f, description:e.target.value})} /></div>

        {editingParent && (
          <div className="cm-subs">
            <div className="cm-subs-head">
              <i className="fa-solid fa-sitemap"></i>
              <span>Subcuentas</span>
              <span className="cm-subs-count">{liveSubs.length}</span>
            </div>

            {liveSubs.length === 0 && (
              <div className="cm-subs-empty">Esta cuenta aún no tiene subcuentas.</div>
            )}

            {liveSubs.map(s => {
              const sClasifs = Array.isArray(s.classifications) ? s.classifications : (s.classification ? [s.classification] : []);
              return (
                <div key={s.id} className="cm-sub-row">
                  <div className="cm-sub-main">
                    <div className="cm-sub-name">
                      <span className="sub-dot" style={{ background: s.color || '#7F77DD' }}></span>
                      {s.name}
                    </div>
                    <div className="cm-sub-clasifs">
                      {sClasifs.length === 0 && <span className="clasif-empty">Sin clasificación</span>}
                      {sClasifs.map(v => (
                        <span key={v} className="clasif-chip sm">
                          <i className="fa-solid fa-tag"></i>{v}
                          <button type="button" onClick={()=>updateSubClasifs(s.id, sClasifs.filter(x=>x!==v))} title="Quitar"><i className="fa-solid fa-xmark"></i></button>
                        </span>
                      ))}
                      <SubClasifAdder existing={sClasifs} suggestions={suggestions} onAdd={(v)=>updateSubClasifs(s.id, [...sClasifs, v])} />
                    </div>
                  </div>
                  <div className="cm-sub-actions">
                    <button type="button" className="cc-menu cc-menu-danger" title="Eliminar subcuenta" onClick={()=>{
                      if (window.confirm(`¿Eliminar la subcuenta "${s.name}"?\nSe eliminarán sus proyectos y tickets.\n\nEsta acción no se puede deshacer.`)) {
                        deleteClient(s.id);
                      }
                    }}><i className="fa-solid fa-trash"></i></button>
                  </div>
                </div>
              );
            })}

            <div className="cm-sub-new">
              <input
                className="input"
                placeholder="Nombre de la subcuenta"
                value={newSub.name}
                onChange={e=>setNewSub({...newSub, name:e.target.value})}
              />
              <input
                className="input"
                placeholder="Clasificación (opcional)"
                value={newSub.clasif}
                onChange={e=>setNewSub({...newSub, clasif:e.target.value})}
                list="cm-sub-clasif-sug"
                onKeyDown={e=>{ if (e.key === 'Enter') { e.preventDefault(); addSub(); } }}
              />
              <datalist id="cm-sub-clasif-sug">
                {suggestions.map(s => <option key={s} value={s} />)}
              </datalist>
              <button type="button" className="btn btn-primary btn-sm" onClick={addSub} disabled={!newSub.name.trim()}>
                <i className="fa-solid fa-plus"></i> Agregar
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="modal-foot">
        <button className="btn btn-outline" onClick={close}>Cancelar</button>
        <button className="btn btn-primary" onClick={save}><i className="fa-solid fa-floppy-disk"></i> Guardar</button>
      </div>
    </div>
  );
}

function SubClasifAdder({ existing, suggestions, onAdd }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState('');
  const commit = () => {
    const v = val.trim();
    if (!v) { setOpen(false); return; }
    if (!existing.includes(v)) onAdd(v);
    setVal(''); setOpen(false);
  };
  if (!open) {
    return (
      <button type="button" className="clasif-chip-add" onClick={()=>setOpen(true)}>
        <i className="fa-solid fa-plus"></i> clasificación
      </button>
    );
  }
  return (
    <span className="clasif-add-inline">
      <input
        className="input input-sm"
        autoFocus
        value={val}
        onChange={e=>setVal(e.target.value)}
        onKeyDown={e=>{ if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') { setVal(''); setOpen(false); } }}
        onBlur={commit}
        list="clasif-sug-shared"
        placeholder="Clasificación"
      />
      <datalist id="clasif-sug-shared">
        {suggestions.map(s => <option key={s} value={s} />)}
      </datalist>
    </span>
  );
}

/* ─── Modal: Project ─── */
function ProjectModal({ data, close }) {
  const { clients, createProject, updateProject } = useApp();
  const [f, setF] = useState({ name:'', clientId: clients[0]?.id, status:'Planificación', start:'', end:'', description:'', ...(data||{}) });
  const save = () => {
    if (!f.name?.trim()) return;
    if (data?.id) updateProject(data.id, f); else createProject(f);
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
          <div className="field"><label>Cliente</label><select className="select" value={f.clientId} onChange={e=>setF({...f, clientId:e.target.value})}>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="field"><label>Estado</label><select className="select" value={f.status} onChange={e=>setF({...f, status:e.target.value})}><option>Planificación</option><option>En progreso</option><option>En pausa</option><option>Completado</option></select></div>
        </div>
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
  // Lock project selector when opening from project detail (preset projectId, no existing ticket id)
  const projectLocked = !data?.id && !!data?.projectId;
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
          <div className="field"><label>Proyecto {projectLocked && <span style={{ color:'var(--text-3)', fontWeight:500, fontSize:11 }}>· fijado desde detalle</span>}</label><select className="select" value={f.projectId} onChange={e=>setF({...f, projectId:e.target.value})} disabled={projectLocked} style={projectLocked ? { background:'var(--bg)', cursor:'not-allowed', color:'var(--text-1)', fontWeight:600 } : undefined}>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
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

/* ─── Detail panel: Ticket (inline editable) ─── */
function TicketDetail({ id, close }) {
  const { tickets, workers, projects, deleteTicket, updateTicket, addComment, currentUser } = useApp();
  const t = tickets.find(x => x.id === id);
  const [cmt, setCmt] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  if (!t) return null;
  const w = workers.find(x=>x.id===t.assigneeId);
  const p = projects.find(x=>x.id===t.projectId);
  const canEdit = currentUser?.role === 'Administrador';

  const saveTitle = () => { if (titleDraft.trim() && titleDraft !== t.title) updateTicket(t.id, { title: titleDraft.trim() }); setEditingTitle(false); };
  const saveDesc = () => { if (descDraft !== (t.description||'')) updateTicket(t.id, { description: descDraft }); setEditingDesc(false); };

  return (
    <React.Fragment>
      <div className="dp-head">
        <div className="stat-icon ic-primary" style={{ width:40, height:40, borderRadius:10, fontSize:15, flexShrink:0 }}><i className="fa-solid fa-ticket"></i></div>
        <div style={{ flex:1, minWidth:0 }}>
          {editingTitle
            ? <input className="input" autoFocus value={titleDraft} onChange={e=>setTitleDraft(e.target.value)} onBlur={saveTitle} onKeyDown={e=>{ if(e.key==='Enter') saveTitle(); if(e.key==='Escape'){ setEditingTitle(false); }}} style={{ fontSize:14, fontWeight:700, padding:'4px 8px' }}/>
            : <div className={'dp-title' + (canEdit ? ' dp-editable' : '')} onClick={()=>{ if(canEdit){ setTitleDraft(t.title); setEditingTitle(true); }}} title={canEdit ? 'Click para editar' : ''}>{t.title}{canEdit && <i className="fa-solid fa-pen dp-edit-icon"></i>}</div>
          }
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
        <div className="dp-row"><span className="lbl">Asignado</span>
          {canEdit
            ? <select className="dp-inline-select" value={t.assigneeId || ''} onChange={e=>updateTicket(t.id, { assigneeId: e.target.value })}>
                <option value="">Sin asignar</option>
                {workers.map(wk=><option key={wk.id} value={wk.id}>{wk.name}</option>)}
              </select>
            : <span className="val">{w ? w.name : 'Sin asignar'}</span>
          }
        </div>
        <div className="dp-row"><span className="lbl">Prioridad</span>
          {canEdit
            ? <select className="dp-inline-select" value={t.priority} onChange={e=>updateTicket(t.id, { priority: e.target.value })}>
                <option>Alta</option><option>Media</option><option>Baja</option>
              </select>
            : <span className="val">{t.priority}</span>
          }
        </div>
        <div className="dp-row"><span className="lbl">Estado</span>
          {canEdit
            ? <select className="dp-inline-select" value={t.status} onChange={e=>updateTicket(t.id, { status: e.target.value })}>
                <option>Por hacer</option><option>En progreso</option><option>En revisión</option><option>Completado</option>
              </select>
            : <span className="val">{t.status}</span>
          }
        </div>
        <div className="dp-row"><span className="lbl">Fecha límite</span>
          {canEdit
            ? <input type="date" className="dp-inline-select" value={t.due || ''} onChange={e=>updateTicket(t.id, { due: e.target.value })} />
            : <span className="val">{fmtDate(t.due)}</span>
          }
        </div>
        <div className="dp-row"><span className="lbl">Creado</span><span className="val">{fmtDate(t.created)}</span></div>

        <div className="dp-section">Descripción</div>
        {editingDesc
          ? <div>
              <textarea className="textarea" autoFocus value={descDraft} onChange={e=>setDescDraft(e.target.value)} rows={4} style={{ width:'100%' }}/>
              <div style={{ display:'flex', gap:6, marginTop:6 }}>
                <button className="btn btn-primary btn-sm" onClick={saveDesc}><i className="fa-solid fa-check"></i> Guardar</button>
                <button className="btn btn-outline btn-sm" onClick={()=>setEditingDesc(false)}>Cancelar</button>
              </div>
            </div>
          : <div className={'dp-desc' + (canEdit ? ' dp-editable' : '')} onClick={()=>{ if(canEdit){ setDescDraft(t.description||''); setEditingDesc(true); }}} title={canEdit ? 'Click para editar' : ''}>
              {t.description || <span style={{ color:'var(--text-3)', fontStyle:'italic' }}>Sin descripción{canEdit ? ' · click para agregar' : ''}</span>}
              {canEdit && t.description && <i className="fa-solid fa-pen dp-edit-icon"></i>}
            </div>
        }

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

        {canEdit && <div style={{ display:'flex', gap:8, marginTop:18, justifyContent:'flex-end' }}>
          <button className="btn btn-danger-ghost btn-sm" onClick={()=>{ if(confirm('¿Eliminar ticket?')) { deleteTicket(t.id); close(); }}}><i className="fa-solid fa-trash"></i> Eliminar ticket</button>
        </div>}
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
