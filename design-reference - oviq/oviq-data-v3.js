/* Seed data for OVIQ — real client data */
window.OVIQ_SEED = (() => {
  const today = new Date();
  const d = (offset) => {
    const x = new Date(today); x.setDate(x.getDate() + offset);
    return x.toISOString().slice(0, 10);
  };

  const clients = [
    { id: 'c1', name: 'Pedregal CR',   contact: 'María Fernández', email: 'mf@pedregal.cr',       phone: '+506 2234-8810', status: 'Activo',   industry: 'Construcción',   color: '#3B6EF5', initials: 'PC', description: 'Proyectos de infraestructura y desarrollos en Costa Rica.' },
    { id: 'c2', name: 'Café Britt',    contact: 'Roberto Vargas',  email: 'rvargas@cafebritt.com', phone: '+506 2277-1600', status: 'Activo',   industry: 'Agroindustria',  color: '#10B981', initials: 'CB', description: 'Productor y exportador de café costarricense.' },
    { id: 'c3', name: 'Carranza',      contact: 'Luis Carranza',   email: 'lcarranza@carranza.cr', phone: '+506 2290-4455', status: 'Inactivo', industry: 'Seguridad',      color: '#F59E0B', initials: 'CA', description: 'Sistemas de seguridad y monitoreo.' },
    { id: 'c4', name: 'Marco Ureña',   contact: 'Marco Ureña',     email: 'marco.urena@gmail.com', phone: '+506 8833-7722', status: 'Inactivo', industry: 'Residencial',    color: '#8B5CF6', initials: 'MU', description: 'Cliente residencial privado.' },
  ];

  const workers = [
    { id: 'w1', name: 'Juancho Víquez',  role: 'Gerente',    email: 'juancho.viquez@oviq.com',  phone: '+506 8811-2233', status: 'Activo', workType: 'Por contrato', initials: 'JV', color: '#3B6EF5' },
    { id: 'w2', name: 'David Víquez',    role: 'Técnico',    email: 'david.viquez@oviq.com',    phone: '+506 8822-4455', status: 'Activo', workType: 'Por contrato', initials: 'DV', color: '#10B981' },
    { id: 'w3', name: 'Ricardo Víquez',  role: 'Supervisor', email: 'ricardo.viquez@oviq.com',  phone: '+506 8833-6677', status: 'Activo', workType: 'Por horas',    initials: 'RV', color: '#EC4899' },
    { id: 'w4', name: 'Raquel Hernández',role: 'Asistente',  email: 'raquel.hernandez@oviq.com',phone: '+506 8855-1122', status: 'Activo', workType: 'Por contrato', initials: 'RH', color: '#8B5CF6' },
  ];

  const projects = [
    { id: 'p1', name: 'Pedregal San José',       clientId: 'c1', status: 'En progreso', start: d(-45), end: d(30),  description: 'Obras y adecuaciones para el proyecto Pedregal en San José.',       icon: 'fa-solid fa-building',  color: '#3B6EF5' },
    { id: 'p2', name: 'Pedregal Guanacaste',     clientId: 'c1', status: 'En progreso', start: d(-30), end: d(60),  description: 'Desarrollo del proyecto Pedregal en Guanacaste.',                    icon: 'fa-solid fa-tree',      color: '#0EA5E9' },
    { id: 'p3', name: 'Café Britt Instalación',  clientId: 'c2', status: 'En progreso', start: d(-20), end: d(25),  description: 'Instalación de sistemas en las oficinas de Café Britt.',             icon: 'fa-solid fa-mug-hot',   color: '#10B981' },
    { id: 'p4', name: 'Tárcoles',                clientId: 'c2', status: 'En progreso', start: d(-10), end: d(40),  description: 'Proyecto en planta de Tárcoles para Café Britt.',                    icon: 'fa-solid fa-industry',  color: '#059669' },
    { id: 'p5', name: 'Cámaras',                 clientId: 'c3', status: 'En pausa',    start: d(-90), end: d(-10), description: 'Instalación de cámaras de seguridad en sedes de Carranza.',          icon: 'fa-solid fa-video',     color: '#F59E0B' },
    { id: 'p6', name: 'Instalación',             clientId: 'c4', status: 'En pausa',    start: d(-80), end: d(-20), description: 'Instalación residencial para Marco Ureña.',                          icon: 'fa-solid fa-house',     color: '#8B5CF6' },
  ];

  /* Ticket titles per project — 1 complete + rest En progreso for active ones.
     Inactive projects: tickets paused / por hacer. */
  const ticketPlan = [
    // p1 · Pedregal San José
    { projectId: 'p1', items: [
      { title: 'Levantamiento topográfico',       status: 'Completado' },
      { title: 'Permisos municipales',            status: 'En progreso' },
      { title: 'Coordinación con contratistas',   status: 'En progreso' },
      { title: 'Entrega de planos constructivos', status: 'En progreso' },
    ]},
    // p2 · Pedregal Guanacaste
    { projectId: 'p2', items: [
      { title: 'Estudio de suelos',               status: 'Completado' },
      { title: 'Movimiento de tierras',           status: 'En progreso' },
      { title: 'Instalación eléctrica provisional', status: 'En progreso' },
      { title: 'Acondicionamiento de accesos',    status: 'En progreso' },
    ]},
    // p3 · Café Britt Instalación
    { projectId: 'p3', items: [
      { title: 'Inspección de sitio',             status: 'Completado' },
      { title: 'Cableado estructurado',           status: 'En progreso' },
      { title: 'Instalación de equipos',          status: 'En progreso' },
      { title: 'Pruebas de funcionamiento',       status: 'En progreso' },
    ]},
    // p4 · Tárcoles
    { projectId: 'p4', items: [
      { title: 'Visita técnica inicial',          status: 'Completado' },
      { title: 'Montaje de racks',                status: 'En progreso' },
      { title: 'Conexión a red industrial',       status: 'En progreso' },
      { title: 'Capacitación al personal',        status: 'En progreso' },
    ]},
    // p5 · Cámaras (Carranza, inactivo)
    { projectId: 'p5', items: [
      { title: 'Relevamiento de puntos de cámara', status: 'Completado' },
      { title: 'Instalación de cámaras exteriores', status: 'En pausa' },
      { title: 'Configuración del DVR',            status: 'Por hacer' },
    ]},
    // p6 · Instalación (Marco Ureña, inactivo)
    { projectId: 'p6', items: [
      { title: 'Visita de diagnóstico',            status: 'Completado' },
      { title: 'Cotización de materiales',         status: 'En pausa' },
      { title: 'Instalación final',                status: 'Por hacer' },
    ]},
  ];

  const priorities = ['Alta', 'Media', 'Baja'];
  const statuses   = ['Por hacer', 'En progreso', 'En revisión', 'Completado'];

  let tid = 0;
  const tickets = [];
  ticketPlan.forEach(plan => {
    plan.items.forEach((it, i) => {
      tid++;
      tickets.push({
        id: 'tkt-' + tid,
        code: 'OVQ-' + (100 + tid),
        title: it.title,
        projectId: plan.projectId,
        assigneeId: null,
        priority: priorities[(tid + i) % priorities.length],
        status: it.status,
        due: d(-10 + (tid * 4) % 50),
        created: d(-25 + (tid * 2) % 15),
        description: 'Detalle: ' + it.title.toLowerCase() + '. Incluye validación con el cliente y documentación correspondiente.',
        comments: [],
      });
    });
  });

  return { clients, workers, projects, tickets, statuses, priorities };
})();
