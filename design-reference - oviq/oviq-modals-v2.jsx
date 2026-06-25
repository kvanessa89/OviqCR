/* OVIQ · Modals + Detail panels */
const { useState, useEffect } = React;
const useApp = window.OVIQ_useApp;
const Avatar = window.OVIQ_Avatar;
const StatusPill = window.OVIQ_StatusPill;
const PriorityTag = window.OVIQ_PriorityTag;
const fmtDate = window.OVIQ_fmtDate;

/* ─── Modal: Client ─── */
function ClientModal({ data, parentId: presetParentId, close }) {
  const { clients, createClient, updateClient, deleteClient } = useApp();
  const getClasifs = (s) => Array.isArray(s?.classifications) ? s.classifications : (s?.classification ? [s.classification] : []);
  const [f, setF] = useState({ name:'', contact:'', email:'', phone:'', status:'Activo', parentId: presetParentId || null, description:'', ...(data||{}), classifications: getClasifs(data) });
  // Catálogo de clasificaciones existentes para la cuenta padre seleccionada
  const inheritedClasifs = Array.from(new Set(
    clients.filter(s => s.parentId === f.parentId).flatMap(getClasifs)
  )).sort();
  const isNewParent = !data?.id && !f.parentId;
  const editingParent = !!(data?.id && !data?.parentId);
  const liveSubs = editingParent ? clients.filter(c => c.parentId === data.id) : [];
  const parentClasifs = editingParent
    ? Array.from(new Set(liveSubs.flatMap(getClasifs))).sort()
    : inheritedClasifs;
  const [newSub, setNewSub] = useState({ name:'', clasif:'' });
  const addLiveSub = () => {
    const name = newSub.name.trim();
    if (!name) return;
    const c = newSub.clasif.trim();
    createClient({
      name, contact:'', email:'', phone:'', status:'Activo', description:'',
      parentId: data.id,
      classifications: c ? [c] : [],
    });
    setNewSub({ name:'', clasif:'' });
  };
  const updateSubClasifs = (subId, list) => {
    updateClient(subId, { classifications: list, classification: list[0] || '' });
  };
  // Estado para el builder de subcuentas
  const [classifList, setClassifList] = useState([]); // ['ATO …', 'SEDES']
  const [newClassifName, setNewClassifName] = useState('');
  const [addingClassif, setAddingClassif] = useState(false);
  const [subRows, setSubRows] = useState([]);         // [{name, classifications:[]}]
  const addClassif = () => {
    const n = newClassifName.trim();
    if (!n || classifList.includes(n)) return;
    setClassifList(l => [...l, n]);
    setNewClassifName('');
  };
  const removeClassif = (n) => {
    setClassifList(l => l.filter(x => x !== n));
    setSubRows(rs => rs.map(r => ({...r, classifications: r.classifications.filter(x => x !== n)})));
  };
  const addSubRow = () => setSubRows(rs => [...rs, { name:'', classification:'' }]);
  const updSubRow = (i, patch) => setSubRows(rs => rs.map((r,idx)=> idx===i ? {...r, ...patch} : r));
  const delSubRow = (i) => setSubRows(rs => rs.filter((_,idx)=>idx!==i));

  const save = () => {
    if (!f.name?.trim()) return;
    const payload = { ...f, parentId: f.parentId || null, classifications: f.parentId ? (f.classifications || []) : [] };
    if (data?.id) {
      updateClient(data.id, payload);
    } else {
      const created = createClient(payload);
      if (isNewParent && created?.id) {
        subRows.forEach(r => {
          if (r.name?.trim()) {
            const c = r.classification?.trim();
            createClient({ name: r.name.trim(), contact:'', email:'', phone:'', status:'Activo', parentId: created.id, classifications: c ? [c] : [], description:'' });
          }
        });
      }
    }
    close();
  };
  return (
    <div className="modal">
      <div className="modal-head">
        <i className="fa-solid fa-user-plus" style={{ color:'var(--primary)' }}></i>
        <div className="modal-title">{data?.id ? 'Editar cliente' : 'Nuevo cliente'}</div>
        <button className="modal-close" onClick={close}><i className="fa-solid fa-xmark"></i></button>
      </div>
      <div className="modal-body">
        <div className="field-row">
          <div className="field"><label>Nombre *</label><input className="input" value={f.name} onChange={e=>setF({...f, name:e.target.value})} autoFocus /></div>
          <div className="field"><label>Estado</label><select className="select" value={f.status} onChange={e=>setF({...f, status:e.target.value})}><option>Activo</option><option>Prospecto</option><option>Inactivo</option></select></div>
        </div>
        {f.parentId && (
          <div className="field">
            <label>Clasificaciones</label>
            <div className="chip-toggle-row">
              {inheritedClasifs.length === 0 && <span className="muted-sm">Sin clasificaciones definidas aún en este cliente.</span>}
              {inheritedClasifs.map(k => {
                const on = (f.classifications||[]).includes(k);
                return (
                  <button type="button" key={k} className={'chip-tog' + (on ? ' on' : '')}
                    onClick={()=> setF({...f, classifications: on
                      ? (f.classifications||[]).filter(x=>x!==k)
                      : [...(f.classifications||[]), k] })}
                  >{k}</button>
                );
              })}
            </div>
          </div>
        )}
        <div className="field-row">
          <div className="field"><label>Contacto</label><input className="input" value={f.contact} onChange={e=>setF({...f, contact:e.target.value})} /></div>
          <div className="field"><label>Email</label><input className="input" value={f.email} onChange={e=>setF({...f, email:e.target.value})} /></div>
        </div>
        <div className="field"><label>Teléfono</label><input className="input" value={f.phone} onChange={e=>setF({...f, phone:e.target.value})} /></div>
        <div className="field"><label>Descripción</label><textarea className="textarea" value={f.description} onChange={e=>setF({...f, description:e.target.value})} /></div>

        {isNewParent && (
          <>
            <div className="cm-panel">
              <div className="cm-panel-title">Clasificaciones</div>
              <div className="cm-panel-sub">Define las clasificaciones que tendrá este cliente. Luego podrás asignarlas a las subcuentas.</div>
              <div className="cm-clasif-row">
                {classifList.map(k => (
                  <span key={k} className="cm-clasif-chip">
                    {k}
                    <button type="button" onClick={()=>removeClassif(k)} title="Quitar"><i className="fa-solid fa-xmark"></i></button>
                  </span>
                ))}
                {addingClassif ? (
                  <input className="input cm-clasif-input" autoFocus value={newClassifName}
                    onChange={e=>setNewClassifName(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); addClassif(); } if(e.key==='Escape'){ setNewClassifName(''); setAddingClassif(false); } }}
                    onBlur={()=>{ addClassif(); setAddingClassif(false); }}
                    placeholder="Nombre de clasificación" />
                ) : (
                  <button type="button" className="cm-add-dashed cm-add-dashed-sm" onClick={()=>setAddingClassif(true)}>
                    <i className="fa-solid fa-plus"></i> Agregar clasificación
                  </button>
                )}
              </div>
            </div>

            <div className="cm-panel">
              <div className="cm-panel-title">Subcuentas</div>
              <div className="cm-panel-sub">Agrega las subcuentas del cliente y selecciona la clasificación correspondiente.</div>
              {subRows.length > 0 && (
                <div className="cm-sub-grid">
                  <div className="cm-sub-grid-head">
                    <span>Nombre subcuenta</span>
                    <span>Clasificación</span>
                    <span></span>
                  </div>
                  {subRows.map((r, i) => (
                    <div className="cm-sub-grid-row" key={i}>
                      <input className="input" placeholder={'Subcuenta ' + (i+1)} value={r.name} onChange={e=>updSubRow(i,{name:e.target.value})} />
                      <select className="select cm-sub-grid-select" value={r.classification} onChange={e=>updSubRow(i,{classification:e.target.value})}>
                        <option value="">Sin clasificación</option>
                        {classifList.map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                      <button className="cm-sub-grid-del" type="button" title="Quitar" onClick={()=>delSubRow(i)}><i className="fa-solid fa-xmark"></i></button>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" className="cm-add-dashed" onClick={addSubRow}>
                <i className="fa-solid fa-plus"></i> Agregar subcuenta
              </button>
            </div>
          </>
        )}

        {editingParent && (
          <div className="cm-subs">
            <div className="cm-subs-head">
              <i className="fa-solid fa-sitemap"></i>
              <span>Subcuentas</span>
              <span className="cm-subs-count">{liveSubs.length}</span>
            </div>

            {liveSubs.length === 0 && (
              <div className="cm-subs-empty">Este cliente aún no tiene subcuentas.</div>
            )}

            {liveSubs.map(s => {
              const sClasifs = getClasifs(s);
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
                      <SubClasifAdder existing={sClasifs} suggestions={parentClasifs} onAdd={(v)=>updateSubClasifs(s.id, [...sClasifs, v])} />
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
              <input className="input" placeholder="Nombre dla subcuenta" value={newSub.name} onChange={e=>setNewSub({...newSub, name:e.target.value})} />
              <input className="input" placeholder="Clasificación (opcional)" value={newSub.clasif} onChange={e=>setNewSub({...newSub, clasif:e.target.value})} list="cm-sub-clasif-sug" onKeyDown={e=>{ if (e.key==='Enter') { e.preventDefault(); addLiveSub(); } }} />
              <datalist id="cm-sub-clasif-sug">
                {parentClasifs.map(s => <option key={s} value={s} />)}
              </datalist>
              <button type="button" className="btn btn-primary btn-sm" onClick={addLiveSub} disabled={!newSub.name.trim()}>
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

/* ─── Helper: inline classification adder for an existing sub ─── */
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
      <input className="input input-sm" autoFocus value={val}
        onChange={e=>setVal(e.target.value)}
        onKeyDown={e=>{ if (e.key==='Enter') { e.preventDefault(); commit(); } if (e.key==='Escape') { setVal(''); setOpen(false); } }}
        onBlur={commit}
        list="clasif-sug-shared" placeholder="Clasificación" />
      <datalist id="clasif-sug-shared">
        {suggestions.map(s => <option key={s} value={s} />)}
      </datalist>
    </span>
  );
}

/* ─── Modal: Project ─── */
function ProjectModal({ data, close }) {
  const { clients, createProject, updateProject } = useApp();
  const parents = clients.filter(c => !c.parentId);
  const [f, setF] = useState({
    name:'', clientId: parents[0]?.id, subClientId: null,
    status:'En progreso', start:'', end:'', description:'',
    po: { poNumber:'', billToId:'', detail:'', amount:'', currency:'CRC' },
    ...(data||{}),
  });
  // Backfill po object if loading an older project without it
  const po = f.po || { poNumber:'', billToId:'', detail:'', amount:'', currency:'CRC' };
  const setPO = (patch) => setF({ ...f, po: { ...po, ...patch } });
  const subs = clients.filter(c => c.parentId === f.clientId);
  const billOptions = [
    ...(f.clientId ? [{ id: f.clientId, label: clients.find(c => c.id === f.clientId)?.name }] : []),
    ...subs.map(s => {
      const cls = Array.isArray(s.classifications) && s.classifications.length
        ? s.classifications.join(' / ')
        : (s.classification || '');
      return { id: s.id, label: cls ? `${cls} · ${s.name}` : s.name };
    }),
  ];
  const save = () => {
    if (!f.name?.trim()) return;
    const payload = {
      ...f,
      subClientId: f.subClientId || null,
      po: {
        poNumber: (po.poNumber || '').trim(),
        billToId: po.billToId || '',
        detail: (po.detail || '').trim(),
        amount: po.amount === '' ? null : Number(po.amount),
        currency: po.currency || 'CRC',
      },
    };
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
          <div className="field"><label>Cliente</label><select className="select" value={f.clientId} onChange={e=>setF({...f, clientId:e.target.value, subClientId: null})}>{parents.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="field"><label>Estado</label><select className="select" value={f.status} onChange={e=>setF({...f, status:e.target.value})}><option>En progreso</option><option>En pausa</option><option>Finalizado</option></select></div>
        </div>
        {subs.length > 0 && (
          <div className="field"><label>Subcuenta (opcional)</label><select className="select" value={f.subClientId || ''} onChange={e=>setF({...f, subClientId: e.target.value || null})}><option value="">— Sin subcuenta —</option>{subs.map(s => {
            const cls = Array.isArray(s.classifications) && s.classifications.length
              ? s.classifications.join(' / ')
              : (s.classification || '');
            const label = cls ? `${cls} · ${s.name}` : s.name;
            return <option key={s.id} value={s.id}>{label}</option>;
          })}</select></div>
        )}
        <div className="field-row">
          <div className="field"><label>Fecha de inicio</label><input className="input" type="date" value={f.start} onChange={e=>setF({...f, start:e.target.value})} /></div>
          <div className="field"><label>Fecha de fin</label><input className="input" type="date" value={f.end} onChange={e=>setF({...f, end:e.target.value})} /></div>
        </div>
        <div className="field"><label>Descripción</label><textarea className="textarea" value={f.description} onChange={e=>setF({...f, description:e.target.value})} /></div>

        <div className="modal-divider">
          <i className="fa-solid fa-file-invoice"></i>
          <span>Orden de compra</span>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Número de orden de compra</label>
            <input
              className="input"
              value={po.poNumber}
              onChange={e=>setPO({ poNumber: e.target.value })}
              placeholder="Ej. OC-2026-0145"
            />
          </div>
          <div className="field">
            <label>A quién facturar</label>
            <input
              className="input"
              value={po.billToId}
              onChange={e=>setPO({ billToId: e.target.value })}
              placeholder="Nombre de quién factura"
            />
          </div>
        </div>
        <div className="field">
          <label>Detalle de la orden</label>
          <textarea
            className="textarea"
            rows={3}
            value={po.detail}
            onChange={e=>setPO({ detail: e.target.value })}
            placeholder="Describe el alcance o servicios incluidos en la orden..."
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label>Monto total</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={po.amount}
              onChange={e=>setPO({ amount: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div className="field">
            <label>Moneda</label>
            <select
              className="select"
              value={po.currency}
              onChange={e=>setPO({ currency: e.target.value })}
            >
              <option value="CRC">CRC (₡)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
        </div>
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
  const { projects, workers, createTicket, updateTicket, tickets, addComment } = useApp();
  const [f, setF] = useState({
    title:'', projectId: projects[0]?.id, assigneeId:'',
    priority:'Media', status:'Por hacer', start:'', due:'', description:'',
    ...(data||{})
  });
  const [cmt, setCmt] = useState('');
  const liveTicket = data?.id ? tickets.find(t => t.id === data.id) : null;
  const comments = liveTicket?.comments || [];
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
          <div className="field"><label>Proyecto</label><select className="select" value={f.projectId} disabled={!!data?.lockProject} onChange={e=>setF({...f, projectId:e.target.value})}>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div className="field"><label>Asignado a</label><select className="select" value={f.assigneeId} onChange={e=>setF({...f, assigneeId:e.target.value})}><option value="">Sin asignar</option>{workers.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Prioridad</label><select className="select" value={f.priority} onChange={e=>setF({...f, priority:e.target.value})}><option>Alta</option><option>Media</option><option>Baja</option></select></div>
          <div className="field"><label>Estado</label><select className="select" value={f.status} onChange={e=>setF({...f, status:e.target.value})}><option>Por hacer</option><option>Pendiente</option><option>Completado</option></select></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Fecha inicio</label><input className="input" type="date" value={f.start || ''} onChange={e=>setF({...f, start:e.target.value})} /></div>
          <div className="field"><label>Fecha fin</label><input className="input" type="date" value={f.due || ''} onChange={e=>setF({...f, due:e.target.value})} /></div>
        </div>
        {data?.id && (
          <div className="field">
            <label>Comentarios ({comments.length})</label>
            <div className="comments" style={{ marginBottom:10 }}>
              {comments.length === 0
                ? <div style={{ fontSize:12.5, color:'var(--text-3)', padding:'4px 2px' }}>Aún no hay comentarios en este ticket.</div>
                : comments.map(c => (
                  <div key={c.id} className="comment">
                    <Avatar size="sm" color={c.kind==='worker' ? '#10B981' : '#3B6EF5'} initials={c.initials} />
                    <div className="comment-bubble">
                      <div className="comment-meta"><span className="comment-author">{c.author}</span><span className="comment-date">{fmtDate(c.date)}</span></div>
                      <div className="comment-text">{c.text}</div>
                    </div>
                  </div>
                ))}
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'stretch' }}>
              <textarea className="textarea" rows="2" placeholder="Escribe un comentario..." value={cmt} onChange={e=>setCmt(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter' && (e.metaKey||e.ctrlKey) && cmt.trim()){ addComment(data.id, cmt.trim()); setCmt(''); } }} style={{ flex:1, minHeight:50, resize:'vertical' }} />
              <button className="btn btn-primary" style={{ alignSelf:'stretch', minWidth:48, padding:'0 16px' }} onClick={()=>{ if(cmt.trim()){ addComment(data.id, cmt.trim()); setCmt(''); } }}><i className="fa-solid fa-paper-plane"></i></button>
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

/* ─── Modal: Invoice ─── */
function InvoiceModal({ data, close }) {
  const { clients, projects, createInvoice, updateInvoice } = useApp();
  const parents = clients.filter(c => !c.parentId);
  const today = new Date().toISOString().slice(0,10);
  const plus30 = (() => { const d = new Date(); d.setDate(d.getDate()+30); return d.toISOString().slice(0,10); })();
  const [f, setF] = useState({
    number:'', issueDate: today, dueDate: plus30,
    amount:'', currency:'CRC',
    projectId:'', clientId: parents[0]?.id || '', subClientId:'',
    status:'Emitida', notes:'', sinIva: false,
    ...(data||{})
  });
  const subs = clients.filter(c => c.parentId === f.clientId);
  // Lock client/sub/project when opening from a project context (preset projectId, no existing invoice id)
  // OR when explicitly locked via data.lockClient/lockProject (e.g. opened from Vista Rápida vencida row)
  const lockedFromProject = (!data?.id && !!data?.projectId) || !!data?.lockClient || !!data?.lockProject;
  // Vencida quick-edit (desde Vista Rápida): solo se pueden editar fecha de vencimiento y notas.
  const vencidaEdit = !!data?.vencidaEdit;
  const origDueDate = data?.dueDate;
  const projOptions = projects.filter(p => {
    if (!f.clientId) return true;
    if (p.clientId !== f.clientId) return false;
    if (f.subClientId) return p.subClientId === f.subClientId;
    return true;
  });
  const save = () => {
    if (!f.number?.trim()) return;
    const payload = {
      ...f,
      amount: parseFloat(f.amount) || 0,
      sinIva: !!f.sinIva,
      subClientId: f.subClientId || null,
      projectId: f.projectId || null,
    };
    // Al reprogramar la fecha de vencimiento de una factura vencida, vuelve a estado Emitida.
    if (vencidaEdit && f.dueDate !== origDueDate) payload.status = 'Emitida';
    if (data?.id) updateInvoice(data.id, payload); else createInvoice(payload);
    close();
  };
  return (
    <div className="modal">
      <div className="modal-head">
        <i className="fa-solid fa-file-invoice-dollar" style={{ color:'var(--primary)' }}></i>
        <div className="modal-title">{vencidaEdit ? 'Reprogramar factura vencida' : (data?.id ? 'Editar factura' : 'Nueva factura')}</div>
        <button className="modal-close" onClick={close}><i className="fa-solid fa-xmark"></i></button>
      </div>
      <div className="modal-body">
        <div className="field-row">
          <div className="field"><label>Número de factura *</label><input className="input" autoFocus={!vencidaEdit} disabled={vencidaEdit} value={f.number} onChange={e=>setF({...f, number:e.target.value})} placeholder="Ej. F-2026-0001" /></div>
          <div className="field"><label>Estado</label><select className="select" value={f.status} disabled={vencidaEdit} onChange={e=>setF({...f, status:e.target.value})}>
            <option>Emitida</option><option>Pagada</option><option>Vencida</option><option>Anulada</option>
          </select></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Fecha de emisión *</label><input className="input" type="date" disabled={vencidaEdit} value={f.issueDate} onChange={e=>setF({...f, issueDate:e.target.value})} /></div>
          <div className="field"><label>Fecha de vencimiento *</label><input className="input" type="date" autoFocus={vencidaEdit} value={f.dueDate} onChange={e=>setF({...f, dueDate:e.target.value})} /></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Monto total *</label><input className="input" type="number" min="0" step="0.01" disabled={vencidaEdit} value={f.amount} onChange={e=>setF({...f, amount:e.target.value})} placeholder="0.00" /></div>
          <div className="field"><label>Moneda</label><select className="select" value={f.currency} disabled={vencidaEdit} onChange={e=>setF({...f, currency:e.target.value})}>
            <option value="CRC">CRC (₡)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option>
          </select></div>
        </div>
        <div className="field">
          <label
            className={'iva-toggle' + (vencidaEdit ? ' is-disabled' : '')}
            onClick={()=>{ if(!vencidaEdit) setF({...f, sinIva: !f.sinIva}); }}
          >
            <span className={'iva-switch' + (f.sinIva ? ' on' : '')}><span className="iva-knob"></span></span>
            <span className="iva-toggle-text">
              <span className="iva-toggle-label">Sin IVA</span>
              <span className="iva-toggle-hint">No se aplica el 13% de IVA a esta factura.</span>
            </span>
          </label>
        </div>
        <div className="field"><label>Cliente *</label><select className="select" value={f.clientId} disabled={lockedFromProject || vencidaEdit} onChange={e=>setF({...f, clientId:e.target.value, subClientId:'', projectId:''})}>
          <option value="">— Selecciona un cliente —</option>
          {parents.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select></div>
        {subs.length > 0 && (
          <div className="field"><label>Subcuenta (opcional)</label><select className="select" value={f.subClientId} disabled={lockedFromProject || vencidaEdit} onChange={e=>setF({...f, subClientId:e.target.value, projectId:''})}>
            <option value="">— Sin subcuenta —</option>
            {subs.map(s => {
              const cls = Array.isArray(s.classifications) && s.classifications.length
                ? s.classifications.join(' / ')
                : (s.classification || '');
              const label = cls ? `${cls} · ${s.name}` : s.name;
              return <option key={s.id} value={s.id}>{label}</option>;
            })}
          </select></div>
        )}
        <div className="field"><label>Proyecto</label><select className="select" value={f.projectId} disabled={lockedFromProject || vencidaEdit} onChange={e=>setF({...f, projectId:e.target.value})}>
          <option value="">— Sin proyecto —</option>
          {projOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select></div>
        <div className="field"><label>Notas</label><textarea className="textarea" value={f.notes} onChange={e=>setF({...f, notes:e.target.value})} /></div>
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
  // Read role types from config (persisted by ViewConfig in localStorage)
  const roleTypes = (() => {
    try {
      const raw = localStorage.getItem('oviq_config_sections');
      if (raw) {
        const cfg = JSON.parse(raw);
        if (Array.isArray(cfg.roleTypes) && cfg.roleTypes.length) return cfg.roleTypes;
      }
    } catch (e) {}
    return ['Gerente','Desarrollador','Diseñador','Técnico','Supervisor'];
  })();
  const [f, setF] = useState({ name:'', role: roleTypes[0] || 'Técnico', email:'', phone:'', status:'Activo', workType:'Por contrato', ...(data||{}) });
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
          <div className="field"><label>Cargo</label><select className="select" value={f.role} onChange={e=>setF({...f, role:e.target.value})}>
            {roleTypes.map(r => <option key={r} value={r}>{r}</option>)}
            {f.role && !roleTypes.includes(f.role) && <option value={f.role}>{f.role}</option>}
          </select></div>
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
        <div className="dp-row"><span className="lbl">Fecha inicio</span><span className="val">{t.start ? fmtDate(t.start) : '—'}</span></div>
        <div className="dp-row"><span className="lbl">Fecha fin</span><span className="val">{t.due ? fmtDate(t.due) : '—'}</span></div>
        <div className="dp-row"><span className="lbl">Creado</span><span className="val">{fmtDate(t.created)}</span></div>

        <div className="dp-section">Cambiar estado</div>
        <select className="select" style={{ width:'100%' }} value={t.status} onChange={e=>updateTicket(t.id, { status: e.target.value })}>
          <option>Por hacer</option><option>Pendiente</option><option>Completado</option>
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

/* ─── Modal: Note (personal task) ─── */
function NoteModal({ data, close }) {
  const { createNote, updateNote, currentUser } = useApp();
  const isEdit = !!data?.id;
  const [description, setDescription] = useState(data?.description || '');
  const submit = (e) => {
    e?.preventDefault?.();
    const text = description.trim();
    if (!text) return;
    if (isEdit) updateNote(data.id, { description: text });
    else createNote({ description: text, owner: currentUser?.initials || 'DV' });
    close();
  };
  return (
    <div className="modal" onClick={e=>e.stopPropagation()}>
      <form onSubmit={submit}>
        <div className="modal-head">
          <i className="fa-solid fa-note-sticky" style={{ color:'var(--primary)' }}></i>
          <div className="modal-title">{isEdit ? 'Editar nota' : 'Nueva nota'}</div>
          <button type="button" className="modal-close" onClick={close}><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Descripción</label>
            <textarea
              className="textarea"
              autoFocus
              rows={5}
              placeholder="Describe la tarea o el recordatorio..."
              value={description}
              onChange={e=>setDescription(e.target.value)}
              onKeyDown={e=>{ if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit(e); }}
            />
            <span className="muted-sm" style={{ marginTop:6 }}>Solo visible para ti.</span>
          </div>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={close}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={!description.trim()}>
            <i className="fa-solid fa-check"></i> Guardar
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── Modal: Confirm (destructive action) ─── */
function ConfirmModal({ data, close }) {
  const {
    title = '¿Estás seguro?',
    message = 'Esta acción no se puede deshacer.',
    confirmLabel = 'Eliminar',
    cancelLabel = 'Cancelar',
    danger = true,
    onConfirm,
  } = data || {};
  const doConfirm = () => {
    try { onConfirm?.(); } finally { close(); }
  };
  return (
    <div className="modal confirm-modal" onClick={e=>e.stopPropagation()}>
      <div className="modal-head">
        <div className={'confirm-icon ' + (danger ? 'confirm-icon-danger' : 'confirm-icon-info')}>
          <i className={'fa-solid ' + (danger ? 'fa-triangle-exclamation' : 'fa-circle-question')}></i>
        </div>
        <div className="modal-title">{title}</div>
        <button className="modal-close" onClick={close}><i className="fa-solid fa-xmark"></i></button>
      </div>
      <div className="modal-body">
        <div className="confirm-message">{message}</div>
      </div>
      <div className="modal-foot">
        <button className="btn btn-outline" onClick={close}>{cancelLabel}</button>
        <button className={'btn ' + (danger ? 'btn-danger' : 'btn-primary')} onClick={doConfirm} autoFocus>
          {danger && <i className="fa-solid fa-trash"></i>} {confirmLabel}
        </button>
      </div>
    </div>
  );
}

Object.assign(window, {
  OVIQ_MODALS: {
    client: ClientModal,
    project: ProjectModal,
    ticket: TicketModal,
    worker: WorkerModal,
    invoice: InvoiceModal,
    note: NoteModal,
    confirm: ConfirmModal,
  },
  OVIQ_DETAILS: {
    ticket: TicketDetail,
    client: ClientDetail,
  },
});
