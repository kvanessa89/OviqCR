/* ═══════════════════════════════════════════════════════════════════
   OVIQ · Main App
   Global store, routing, sidebar + topbar, toast/modal primitives.
   ═══════════════════════════════════════════════════════════════════ */

const { useState, useEffect, useMemo, useCallback, useRef, createContext, useContext } = React;

/* ───────── Storage helpers ───────── */
const STORAGE_KEY = 'oviq_app_state_v15';
// Wipe any older versions so data always reflects latest seed
try { Object.keys(localStorage).filter(k => k.startsWith('oviq_app_state_') && k !== STORAGE_KEY).forEach(k => localStorage.removeItem(k)); } catch(e){}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}
function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

/* ───────── App Store (Context) ───────── */
const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

/* ───────── Roles & permisos ─────────
   El administrador ve todo. El trabajador solo accede a la vista rápida
   (con métricas de sus tickets), sus tickets, el tablero y el calendario. */
const ROLE_VIEWS = {
  Administrador: null, // null = acceso a todas las vistas
  Trabajador: ['dashboard', 'tickets', 'kanban', 'calendario'],
};
function canAccess(view, role) {
  const allowed = ROLE_VIEWS[role];
  if (!allowed) return true;
  return allowed.includes(view);
}
const ADMIN_USER = { id: 'w1', name: 'David Víquez', initials: 'DV', color: '#3B6EF5', role: 'Administrador', workerId: 'w1' };

/* Construye la identidad de sesión a partir de un trabajador. */
function identityFor(w) {
  return { id: w.id, name: w.name, initials: w.initials, color: w.color, role: w.admin ? 'Administrador' : 'Trabajador', workerId: w.id };
}

/* Asegura que cada proyecto tenga un arreglo `comments`.
   Migra los comentarios heredados guardados en claves localStorage
   `oviq_proj_comments_<id>` y siembra comentarios demo si no hay ninguno. */
function withProjectComments(projects) {
  const now = Date.now();
  const demo = (pid) => [
    { id: pid+'-pc1', author:'David Víquez',   initials:'DV', color:'#3B6EF5', text:'Equipo, recuerden que la demo al cliente es la próxima semana. Necesitamos pulir los detalles pendientes.', date: new Date(now - 2*864e5).toISOString() },
    { id: pid+'-pc2', author:'Juancho Víquez', initials:'JV', color:'#10B981', text:'Revisado. Tengo listas las integraciones backend, solo falta el ajuste del endpoint de facturación.',     date: new Date(now - 864e5).toISOString() },
  ];
  return (projects || []).map(p => {
    if (Array.isArray(p.comments)) return p;
    let comments = null;
    try {
      const raw = localStorage.getItem('oviq_proj_comments_' + p.id);
      if (raw) {
        const list = JSON.parse(raw);
        comments = list.map((c, idx) => {
          const dd = new Date(c.date);
          return isNaN(dd) ? { ...c, date: new Date(now - (list.length - idx) * 36e5).toISOString() } : c;
        });
      }
    } catch (e) {}
    return { ...p, comments: comments || demo(p.id) };
  });
}

function AppProvider({ children }) {
  const persisted = loadState();
  const seed = window.OVIQ_SEED;

  const [clients, setClients] = useState(persisted?.clients || seed.clients);
  const [workers, setWorkers] = useState(persisted?.workers || seed.workers);
  const [projects, setProjects] = useState(() => withProjectComments(persisted?.projects || seed.projects));
  const [tickets, setTickets] = useState(persisted?.tickets || seed.tickets);
  const [invoices, setInvoices] = useState(persisted?.invoices || seed.invoices || []);
  const [notes, setNotes] = useState(persisted?.notes || []);
  const [notifications, setNotifications] = useState(persisted?.notifications || []);
  const [view, setView] = useState(persisted?.view || 'dashboard');
  const [viewCtx, setViewCtx] = useState(persisted?.viewCtx || {}); // e.g. { projectId }
  const [currentUser, setCurrentUser] = useState(persisted?.currentUser || ADMIN_USER);
  const [authed, setAuthed] = useState(persisted?.authed || false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(persisted?.sidebarCollapsed || false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null); // { kind, data }
  const [detail, setDetail] = useState(null); // { kind, id }

  // Referencia siempre actualizada al estado vivo, para que los callbacks
  // memoizados (addComment) lean el usuario, trabajadores y tickets actuales.
  const liveRef = useRef({});
  liveRef.current = { currentUser, workers, tickets };

  // persist on change
  useEffect(() => {
    saveState({ clients, workers, projects, tickets, invoices, notes, notifications, view, viewCtx, sidebarCollapsed, currentUser, authed });
  }, [clients, workers, projects, tickets, invoices, notes, notifications, view, viewCtx, sidebarCollapsed, currentUser, authed]);

  // Tickets visibles según el rol: el trabajador solo ve los suyos.
  const scopedTickets = useMemo(() => {
    if (currentUser.role === 'Trabajador' && currentUser.workerId)
      return tickets.filter(t => t.assigneeId === currentUser.workerId);
    return tickets;
  }, [tickets, currentUser]);

  const toast = useCallback((msg, kind='default') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2600);
  }, []);

  const go = useCallback((v, ctx={}) => {
    setView(v); setViewCtx(ctx); setDetail(null); setMobileOpen(false);
  }, []);

  const login = useCallback((email, password) => {
    const w = (liveRef.current.workers || []).find(x => (x.email||'').toLowerCase() === (email||'').trim().toLowerCase());
    if (!w) { toast('Correo no encontrado', 'error'); return false; }
    if (!String(password||'').trim()) { toast('Ingresa tu contraseña', 'error'); return false; }
    setCurrentUser(identityFor(w));
    setAuthed(true);
    setView('dashboard'); setViewCtx({}); setDetail(null); setModal(null); setMobileOpen(false);
    toast(`Bienvenido, ${(w.name||'').split(/\s+/)[0]}`, 'success');
    return true;
  }, [toast]);

  const logout = useCallback(() => {
    setAuthed(false); setDetail(null); setModal(null); setMobileOpen(false);
    toast('Sesión cerrada', 'success');
  }, [toast]);

  const switchUser = useCallback((u) => {
    setCurrentUser(u);
    setView('dashboard'); setViewCtx({}); setDetail(null); setMobileOpen(false);
    toast(u.role === 'Administrador' ? 'Sesión de administrador' : `Viendo como ${u.name}`, 'success');
  }, [toast]);

  /* ─── CRUD helpers ─── */
  const api = useMemo(() => ({
    createClient: (data) => {
      const id = 'c' + Date.now() + Math.random().toString(36).slice(2,6);
      const colors = ['#3B6EF5','#10B981','#06B6D4','#F59E0B','#8B5CF6','#EF4444','#EC4899','#0EA5E9','#F97316'];
      const initials = (data.name||'').split(/\s+/).map(s=>s[0]).slice(0,2).join('').toUpperCase();
      const c = { id, ...data, initials, color: colors[Math.floor(Math.random()*colors.length)] };
      setClients(cs => [c, ...cs]);
      toast('Cliente creado', 'success');
      return c;
    },
    updateClient: (id, patch) => {
      setClients(cs => cs.map(c => c.id === id ? { ...c, ...patch } : c));
      toast('Cliente actualizado', 'success');
    },
    deleteClient: (id) => {
      // Find sub-accounts and cascade delete their projects/tickets too
      let subIds = [];
      setClients(cs => {
        subIds = cs.filter(c => c.parentId === id).map(c => c.id);
        return cs.filter(c => c.id !== id && c.parentId !== id);
      });
      const toRemove = new Set([id, ...subIds]);
      let removedProjIds = [];
      setProjects(ps => {
        removedProjIds = ps.filter(p => toRemove.has(p.clientId) || toRemove.has(p.subClientId)).map(p => p.id);
        return ps.filter(p => !(toRemove.has(p.clientId) || toRemove.has(p.subClientId)));
      });
      const projSet = new Set(removedProjIds);
      setTickets(ts => ts.filter(t => !projSet.has(t.projectId)));
      setInvoices(is => is.filter(i => !(toRemove.has(i.clientId) || toRemove.has(i.subClientId) || projSet.has(i.projectId))));
      toast('Cliente eliminado');
    },
    createProject: (data) => {
      const id = 'p' + Date.now();
      const icons = ['fa-solid fa-diagram-project','fa-solid fa-rocket','fa-solid fa-star','fa-solid fa-bolt','fa-solid fa-cube'];
      const colors = ['#3B6EF5','#10B981','#06B6D4','#F59E0B','#8B5CF6','#EC4899'];
      const p = { id, comments: [], ...data, icon: icons[Math.floor(Math.random()*icons.length)], color: colors[Math.floor(Math.random()*colors.length)] };
      setProjects(ps => [p, ...ps]);
      toast('Proyecto creado', 'success');
      return p;
    },
    updateProject: (id, patch) => {
      setProjects(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p));
      toast('Proyecto actualizado', 'success');
    },
    addProjectComment: (projectId, text) => {
      const me = liveRef.current.currentUser;
      setProjects(ps => ps.map(p => p.id === projectId ? {
        ...p,
        comments: [...(p.comments||[]), {
          id: 'pc' + Date.now(),
          author: me.name, initials: me.initials, color: me.color,
          text, date: new Date().toISOString(),
        }],
      } : p));
      toast('Comentario enviado', 'success');
    },
    deleteProject: (id) => {
      setProjects(ps => ps.filter(p => p.id !== id));
      setTickets(ts => ts.filter(t => t.projectId !== id));
      setInvoices(is => is.filter(i => i.projectId !== id));
      toast('Proyecto eliminado');
    },
    createInvoice: (data) => {
      const id = 'inv-' + Date.now();
      const inv = { id, status: 'Emitida', currency: 'CRC', ...data };
      setInvoices(is => [inv, ...is]);
      // Al agregar una factura, el proyecto asociado queda marcado como facturado.
      if (inv.projectId) setProjects(ps => ps.map(p => p.id === inv.projectId ? { ...p, invoiced: true } : p));
      toast('Factura creada', 'success');
      return inv;
    },
    updateInvoice: (id, patch) => {
      setInvoices(is => is.map(i => i.id === id ? { ...i, ...patch } : i));
      toast('Factura actualizada', 'success');
    },
    deleteInvoice: (id) => {
      setInvoices(is => is.filter(i => i.id !== id));
      toast('Factura eliminada');
    },
    createTicket: (data) => {
      const num = 100 + (window.OVIQ_SEED?.tickets?.length || 0) + Math.floor(Math.random()*900);
      const id = 'tkt-' + Date.now();
      const t = { id, code: 'OVQ-' + num, created: new Date().toISOString().slice(0,10), comments: [], ...data };
      setTickets(ts => [t, ...ts]);
      toast('Ticket creado', 'success');
      return t;
    },
    updateTicket: (id, patch) => {
      setTickets(ts => ts.map(t => t.id === id ? { ...t, ...patch } : t));
    },
    deleteTicket: (id) => {
      setTickets(ts => ts.filter(t => t.id !== id));
      toast('Ticket eliminado');
    },
    addComment: (ticketId, text) => {
      const { currentUser: author, workers, tickets } = liveRef.current;
      const isAdminAuthor = author.role === 'Administrador';
      const ticket = tickets.find(t => t.id === ticketId);
      // 1) Agrega el comentario al ticket.
      setTickets(ts => ts.map(t => t.id === ticketId ? {
        ...t,
        comments: [...(t.comments||[]), {
          id: 'cm' + Date.now(),
          author: author.name, initials: author.initials,
          text, date: new Date().toISOString().slice(0,10),
          kind: isAdminAuthor ? 'admin' : 'worker',
        }]
      } : t));
      // 2) Notifica a los destinatarios según el rol del autor.
      //    Trabajador  → todos los administradores.
      //    Administrador → el resto de administradores + el trabajador del ticket.
      const adminIds = workers.filter(w => w.admin).map(w => w.id);
      const recipients = new Set(adminIds);
      if (isAdminAuthor && ticket?.assigneeId) recipients.add(ticket.assigneeId);
      recipients.delete(author.id);
      recipients.delete(author.workerId);
      const now = new Date().toISOString();
      const newNotifs = [...recipients].filter(Boolean).map((uid, i) => ({
        id: 'ntf' + Date.now() + '-' + i,
        userId: uid,
        type: 'ticket-comment',
        ticketId,
        ticketCode: ticket?.code || '',
        ticketTitle: ticket?.title || '',
        fromId: author.id, fromName: author.name, fromInitials: author.initials, fromColor: author.color,
        text,
        date: now,
        read: false,
      }));
      if (newNotifs.length) setNotifications(ns => [...newNotifs, ...ns]);
      toast('Comentario enviado', 'success');
    },
    markNotificationsRead: (userId) => setNotifications(ns => ns.map(n => n.userId === userId ? { ...n, read: true } : n)),
    clearNotifications: (userId) => setNotifications(ns => ns.filter(n => n.userId !== userId)),
    createWorker: (data) => {
      const id = 'w' + Date.now();
      const initials = (data.name||'').split(/\s+/).map(s=>s[0]).slice(0,2).join('').toUpperCase();
      const colors = ['#3B6EF5','#10B981','#06B6D4','#F59E0B','#8B5CF6','#EC4899'];
      const w = { id, ...data, initials, color: colors[Math.floor(Math.random()*colors.length)] };
      setWorkers(ws => [w, ...ws]);
      toast('Trabajador agregado', 'success');
      return w;
    },
    updateWorker: (id, patch) => setWorkers(ws => ws.map(w => w.id === id ? { ...w, ...patch } : w)),
    deleteWorker: (id) => { setWorkers(ws => ws.filter(w => w.id !== id)); toast('Trabajador eliminado'); },

    /* ── Notes (lista de tareas personal) ── */
    createNote: (data) => {
      const id = 'note-' + Date.now();
      const n = {
        id,
        owner: 'DV',
        description: (data?.description || '').trim(),
        done: false,
        createdAt: new Date().toISOString(),
        ...data,
      };
      setNotes(ns => [n, ...ns]);
      toast('Nota creada', 'success');
      return n;
    },
    updateNote: (id, patch) => setNotes(ns => ns.map(n => n.id === id ? { ...n, ...patch } : n)),
    deleteNote: (id) => { setNotes(ns => ns.filter(n => n.id !== id)); toast('Nota eliminada'); },
    toggleNote: (id) => setNotes(ns => ns.map(n => n.id === id ? { ...n, done: !n.done } : n)),

    resetDemo: () => {
      localStorage.removeItem(STORAGE_KEY);
      setClients(seed.clients); setWorkers(seed.workers);
      setProjects(withProjectComments(seed.projects)); setTickets(seed.tickets);
      setInvoices(seed.invoices || []);
      setNotes([]);
      setNotifications([]);
      toast('Datos reiniciados', 'success');
    },
  }), [toast]);

  const value = {
    clients, workers, projects, tickets, scopedTickets, invoices, notes, notifications,
    currentUser, switchUser, authed, login, logout,
    view, viewCtx, go,
    sidebarCollapsed, setSidebarCollapsed,
    mobileOpen, setMobileOpen,
    modal, setModal, detail, setDetail,
    toast, toasts,
    ...api,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

/* ───────── Utility functions ───────── */
const fmtDate = (iso) => {
  if (!iso) return '—';
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};
const shortDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return `${d.getDate()}/${(d.getMonth()+1).toString().padStart(2,'0')}`;
};
const daysUntil = (iso) => {
  if (!iso) return null;
  const a = new Date(iso), b = new Date();
  a.setHours(0,0,0,0); b.setHours(0,0,0,0);
  return Math.round((a - b) / 86400000);
};
const statusBadgeClass = (s) => {
  s = (s||'').toLowerCase();
  if (s === 'activo') return 'b-active';
  if (s === 'inactivo') return 'b-inactive';
  if (s === 'prospecto') return 'b-prospect';
  if (s === 'en progreso') return 'b-primary';
  if (s === 'pendiente') return 'b-primary';
  if (s === 'completado') return 'b-active';
  if (s === 'finalizado') return 'b-active';
  if (s === 'en pausa') return 'b-prospect';
  if (s === 'cancelado') return 'b-danger';
  if (s === 'planificación' || s === 'planificacion') return 'b-info';
  return 'b-neutral';
};

/* ───────── Sidebar ───────── */
function Sidebar() {
  const { view, go, sidebarCollapsed, scopedTickets, workers, currentUser, switchUser, logout } = useApp();
  const pendingCount = scopedTickets.filter(t => t.status !== 'Completado').length;
  const isWorker = currentUser.role === 'Trabajador';
  const [menuOpen, setMenuOpen] = useState(false);

  const allItems = [
    { section: 'Principal' },
    { key: 'dashboard', label: 'Vista rápida', icon: 'fa-gauge-high' },
    { section: 'Gestión' },
    { key: 'clientes', label: 'Clientes', icon: 'fa-user-group' },
    { key: 'proyectos', label: 'Proyectos', icon: 'fa-sitemap' },
    { key: 'tickets', label: isWorker ? 'Mis tickets' : 'Tickets', icon: 'fa-ticket', badge: pendingCount },
    { key: 'kanban', label: 'Tablero', icon: 'fa-columns' },
    { key: 'calendario', label: 'Calendario', icon: 'fa-calendar-days' },
    { key: 'trabajadores', label: 'Trabajadores', icon: 'fa-user-tie' },
    { key: 'facturacion', label: 'Facturación', icon: 'fa-file-invoice-dollar' },
    { section: 'Cuenta' },
    { key: 'configuracion', label: 'Configuración', icon: 'fa-gear' },
  ];
  // Filtra por permisos del rol y descarta encabezados de sección que quedan vacíos.
  const visible = allItems.filter(it => it.section || canAccess(it.key, currentUser.role));
  const items = visible.filter((it, i) => !it.section || (visible[i+1] && !visible[i+1].section));

  return (
    <aside className="sidebar">
      <div className="brand" onClick={() => go('dashboard')}>
        <div className="brand-logo">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3L3 8v8l9 5 9-5V8l-9-5z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M12 8v8" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="2" fill="#fff"/>
          </svg>
        </div>
        <div className="brand-name">OVIQ</div>
        <div className="brand-dot"></div>
      </div>
      <div className="nav">
        {items.map((it, i) => it.section
          ? <div key={'s'+i} className="nav-section">{it.section}</div>
          : <div key={it.key} className={'nav-item' + (view === it.key || (it.key === 'proyectos' && view === 'proyecto-detalle') ? ' active' : '')} onClick={() => go(it.key)}>
              <div className="nav-icon"><i className={'fa-solid ' + it.icon}></i></div>
              <div className="nav-label">{it.label}</div>
              {it.badge > 0 && <div className="nav-badge">{it.badge}</div>}
            </div>
        )}
      </div>
      <div className="sidebar-footer">
        {menuOpen && (
          <div className="role-menu">
            <button className="role-menu-item role-menu-logout" onClick={() => { setMenuOpen(false); logout(); }}>
              <span className="rm-ava" style={{ background:'#64748B' }}><i className="fa-solid fa-arrow-right-from-bracket"></i></span>
              <span className="rm-info"><span className="rm-name">Cerrar sesión</span><span className="rm-role">Salir de la cuenta</span></span>
            </button>
          </div>
        )}
        <div className="sf-avatar" style={{ background: currentUser.color }}>{currentUser.initials}</div>
        <div className="sf-info">
          <div className="sf-name">{currentUser.name}</div>
          <div className="sf-role">{currentUser.role}</div>
        </div>
        <button className="sf-btn" title="Cuenta" onClick={() => setMenuOpen(v => !v)}><i className={'fa-solid ' + (menuOpen ? 'fa-xmark' : 'fa-ellipsis-vertical')}></i></button>
      </div>
    </aside>
  );
}

/* ───────── Notificaciones (campana) ───────── */
const notifTimeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} d`;
  return fmtDate(iso);
};
function NotificationBell() {
  const { notifications, currentUser, markNotificationsRead, clearNotifications, tickets, go, setModal } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const mine = notifications.filter(n => n.userId === currentUser.id);
  const unread = mine.filter(n => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  // Al abrir el panel se marcan como leídas las notificaciones del usuario.
  useEffect(() => { if (open && unread > 0) markNotificationsRead(currentUser.id); }, [open]);

  // Al hacer clic en una notificación: ir a la página de tickets y abrir el
  // modal del ticket para ver/responder los comentarios.
  const openTicket = (n) => {
    const ticket = tickets.find(t => t.id === n.ticketId);
    setOpen(false);
    go('tickets');
    if (ticket) setModal({ kind: 'ticket', data: ticket });
  };

  return (
    <div className="notif" ref={ref}>
      <button className="tb-icon" onClick={() => setOpen(o => !o)} title="Notificaciones">
        <i className="fa-solid fa-bell"></i>
        {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-head">
            <span className="notif-title">Notificaciones</span>
            {mine.length > 0 && <button className="notif-clear" onClick={() => clearNotifications(currentUser.id)}>Limpiar</button>}
          </div>
          <div className="notif-list">
            {mine.length === 0 ? (
              <div className="notif-empty"><i className="fa-solid fa-bell-slash"></i><span>Sin notificaciones</span></div>
            ) : mine.slice(0, 30).map(n => (
              <button key={n.id} className={'notif-item' + (n.read ? '' : ' unread')} onClick={() => openTicket(n)}>
                <span className="notif-ava" style={{ background: n.fromColor || '#3B6EF5' }}>{n.fromInitials}</span>
                <span className="notif-body">
                  <span className="notif-line"><strong>{n.fromName}</strong> comentó en <strong>{n.ticketCode}</strong></span>
                  <span className="notif-ticket">{n.ticketTitle}</span>
                  <span className="notif-text">“{n.text}”</span>
                  <span className="notif-time">{notifTimeAgo(n.date)}</span>
                </span>
                {!n.read && <span className="notif-unread-dot"></span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── Topbar ───────── */
function Topbar() {
  const { setSidebarCollapsed, sidebarCollapsed, setMobileOpen, toast, resetDemo, currentUser } = useApp();
  const handleToggle = () => {
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 900px)').matches) {
      setMobileOpen(v => !v);
    } else {
      setSidebarCollapsed(v => !v);
    }
  };
  return (
    <div className="topbar">
      <button className="tb-toggle" onClick={handleToggle} title="Menú">
        <i className="fa-solid fa-bars"></i>
      </button>
      <div className="tb-search">
        <i className="fa-solid fa-magnifying-glass"></i>
        <input placeholder="Buscar tickets, proyectos, clientes..." />
        <span className="kbd">⌘K</span>
      </div>
      <div className="tb-right">
        <NotificationBell />
        <div className="tb-divider"></div>
        <div className="tb-user">
          <div className="ava" style={{ background: currentUser.color ? undefined : undefined }}>{currentUser.initials}</div>
          <div>
            <div className="tu-name">{currentUser.name}</div>
            <div className="tu-role">{currentUser.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── Toasts ───────── */
function ToastHost() {
  const { toasts } = useApp();
  return (
    <div className="toast-wrap">
      {toasts.map(t => (
        <div key={t.id} className={'toast ' + (t.kind || '')}>
          <i className={'fa-solid ' + (t.kind === 'success' ? 'fa-circle-check' : t.kind === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info')}></i>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

/* ───────── Modal host ───────── */
function ModalHost() {
  const { modal, setModal } = useApp();
  if (!modal) return null;
  const close = () => setModal(null);
  const M = window.OVIQ_MODALS?.[modal.kind];
  if (!M) return null;
  return (
    <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <M {...modal} close={close} />
    </div>
  );
}

/* ───────── Detail panel host ───────── */
function DetailHost() {
  const { detail, setDetail } = useApp();
  if (!detail) return null;
  const D = window.OVIQ_DETAILS?.[detail.kind];
  if (!D) return null;
  return (
    <React.Fragment>
      <div className={'backdrop show'} onClick={() => setDetail(null)}></div>
      <div className={'dpanel open'}>
        <D {...detail} close={() => setDetail(null)} />
      </div>
    </React.Fragment>
  );
}

/* ───────── Login ───────── */
function LoginScreen() {
  const { login, workers } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const submit = (e) => { e.preventDefault(); login(email, password); };
  const quick = (w) => { setEmail(w.email); setPassword('demo'); login(w.email, 'demo'); };
  return (
    <div className="login">
      <div className="login-hero">
        <img className="login-logo" src="logo-oviq.png" alt="OVIQ" />
        <div className="login-wordmark">OVIQ</div>
        <div className="login-tagline">Gestión de proyectos, tickets y facturación</div>
      </div>
      <div className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="login-card-brand"><img src="logo-oviq.png" alt="OVIQ" /></div>
          <h1 className="login-title">Iniciar sesión</h1>
          <p className="login-sub">Ingresa con tu cuenta para continuar</p>
          <label className="login-field">
            <span>Correo electrónico</span>
            <div className="login-input"><i className="fa-solid fa-envelope"></i><input type="email" autoFocus placeholder="tu@oviq.com" value={email} onChange={e=>setEmail(e.target.value)} /></div>
          </label>
          <label className="login-field">
            <span>Contraseña</span>
            <div className="login-input"><i className="fa-solid fa-lock"></i><input type={showPass?'text':'password'} placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} /><button type="button" className="login-eye" onClick={()=>setShowPass(v=>!v)} tabIndex={-1}><i className={'fa-solid ' + (showPass?'fa-eye-slash':'fa-eye')}></i></button></div>
          </label>
          <button type="submit" className="login-btn"><i className="fa-solid fa-arrow-right-to-bracket"></i> Entrar</button>
          <div className="login-divider"><span>Acceso rápido (demo)</span></div>
          <div className="login-quick">
            {(workers||[]).map(w => (
              <button type="button" key={w.id} className="login-quick-chip" onClick={()=>quick(w)}>
                <span className="rm-ava" style={{ background:w.color }}>{w.initials}</span>
                <span className="lq-info"><span className="lq-name">{w.name}</span><span className="lq-role">{w.admin ? 'Administrador' : 'Trabajador'} · {w.role}</span></span>
              </button>
            ))}
          </div>
          <p className="login-hint">Demo: cualquier contraseña es válida.</p>
        </form>
      </div>
    </div>
  );
}

/* ───────── Main app shell ───────── */
function App() {
  const { authed, view, sidebarCollapsed, mobileOpen, setMobileOpen, currentUser, go } = useApp();
  // Guard de routing: si el rol no puede acceder a la vista actual, regresa a la vista rápida.
  useEffect(() => {
    if (authed && !canAccess(view, currentUser.role)) go('dashboard');
  }, [view, currentUser.role, authed]);
  const views = window.OVIQ_VIEWS || {};
  const ViewComp = views[view] || views.dashboard || (() => <div className="content">Vista no encontrada: {view}</div>);
  const shellClasses = ['app-shell']
    .concat(sidebarCollapsed ? ['collapsed'] : [])
    .concat(mobileOpen ? ['mobile-open'] : [])
    .join(' ');
  if (!authed) return <LoginScreen />;
  return (
    <div className={shellClasses}>
      <Sidebar />
      <div className="mobile-backdrop" onClick={() => setMobileOpen(false)}></div>
      <div className="main-wrap">
        <Topbar />
        <ViewComp />
      </div>
      <ModalHost />
      <DetailHost />
      <ToastHost />
    </div>
  );
}

/* ───────── Export globals for other modules ───────── */
Object.assign(window, {
  OVIQ_App: App,
  OVIQ_AppProvider: AppProvider,
  OVIQ_useApp: useApp,
  OVIQ_fmtDate: fmtDate,
  OVIQ_shortDate: shortDate,
  OVIQ_daysUntil: daysUntil,
  OVIQ_statusBadgeClass: statusBadgeClass,
});
