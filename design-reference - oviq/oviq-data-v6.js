/* Seed data for OVIQ — real client data */
window.OVIQ_SEED = (() => {
  const today = new Date();
  const d = (offset) => {
    const x = new Date(today); x.setDate(x.getDate() + offset);
    return x.toISOString().slice(0, 10);
  };

  const clients = [
    // Cuentas principales
    { id: 'c1', parentId: null,  name: 'Pedregal CR',   contact: 'María Fernández', email: 'mf@pedregal.cr',       phone: '+506 2234-8810', status: 'Activo',   color: '#3B6EF5', initials: 'PC', description: 'Proyectos de infraestructura y desarrollos en Costa Rica.' },
    { id: 'c2', parentId: null,  name: 'Café Britt',    contact: 'Roberto Vargas',  email: 'rvargas@cafebritt.com', phone: '+506 2277-1600', status: 'Activo',   color: '#10B981', initials: 'CB', description: 'Productor y exportador de café costarricense.' },
    { id: 'c3', parentId: null,  name: 'Carranza',      contact: 'Luis Carranza',   email: 'lcarranza@carranza.cr', phone: '+506 2290-4455', status: 'Inactivo', color: '#F59E0B', initials: 'CA', description: 'Sistemas de seguridad y monitoreo.' },
    { id: 'c4', parentId: null,  name: 'Marco Ureña',   contact: 'Marco Ureña',     email: 'marco.urena@gmail.com', phone: '+506 8833-7722', status: 'Inactivo', color: '#8B5CF6', initials: 'MU', description: 'Cuenta residencial privada.' },
    // Subcuentas — Pedregal CR (sin clasificaciones)
    { id: 'c1a', parentId: 'c1', name: 'Bloques',                 contact: 'Andrea Mora',      email: 'amora@pedregal.cr',     phone: '+506 2234-8820', status: 'Activo',   color: '#1E40AF', initials: 'BL', description: 'División de bloques y prefabricados de Pedregal CR.', classifications: [] },
    { id: 'c1b', parentId: 'c1', name: 'Quebradores',             contact: 'Pablo Solano',     email: 'psolano@pedregal.cr',   phone: '+506 2234-8830', status: 'Activo',   color: '#2563EB', initials: 'QU', description: 'División de quebradores y materiales pétreos.', classifications: [] },
    { id: 'c1c', parentId: 'c1', name: 'IZF',                     contact: 'Verónica Quirós',  email: 'vquiros@pedregal.cr',   phone: '+506 2234-8840', status: 'Activo',   color: '#3B6EF5', initials: 'IZ', description: 'Zona Franca Industrial de Pedregal CR.', classifications: [] },
    // Subcuentas — Café Britt
    { id: 'c2a', parentId: 'c2', name: 'Food Court #1',           contact: 'Patricia Salas',   email: 'psalas@cafebritt.com',  phone: '+506 2277-1610', status: 'Activo',   color: '#047857', initials: 'F1', description: 'Tienda Food Court #1 en el Aeropuerto Juan Santamaría.', classifications: ['ATO Juan Santamaría'] },
    { id: 'c2b', parentId: 'c2', name: 'Food Court #2',           contact: 'José Méndez',      email: 'jmendez@cafebritt.com', phone: '+506 2277-1620', status: 'Activo',   color: '#059669', initials: 'F2', description: 'Tienda Food Court #2 en el Aeropuerto Juan Santamaría.', classifications: ['ATO Juan Santamaría'] },
    { id: 'c2c', parentId: 'c2', name: 'Mercadito Gourmet',       contact: 'Laura Brenes',     email: 'lbrenes@cafebritt.com', phone: '+506 2277-1630', status: 'Activo',   color: '#0F766E', initials: 'MG', description: 'Mercadito Gourmet en el Aeropuerto Juan Santamaría.', classifications: ['ATO Juan Santamaría'] },
    { id: 'c2d', parentId: 'c2', name: 'BALI',                    contact: 'Carolina Soto',    email: 'csoto@cafebritt.com',   phone: '+506 2277-1640', status: 'Activo',   color: '#10B981', initials: 'BA', description: 'Sede BALI de Café Britt.', classifications: ['SEDES'] },
    { id: 'c2e', parentId: 'c2', name: 'SWT SJ',                  contact: 'Andrés Rojas',     email: 'arojas@cafebritt.com',  phone: '+506 2277-1650', status: 'Activo',   color: '#34D399', initials: 'SJ', description: 'Sede SWT San José de Café Britt.', classifications: ['SEDES'] },
    { id: 'c2f', parentId: 'c2', name: 'SWT LIB',                 contact: 'Mariana Vega',     email: 'mvega@cafebritt.com',   phone: '+506 2277-1660', status: 'Activo',   color: '#6EE7B7', initials: 'LB', description: 'Sede SWT Liberia de Café Britt.', classifications: ['SEDES'] },
  ];

  const workers = [
    { id: 'w1', name: 'David Víquez',    role: 'Gerente',    email: 'david.viquez@oviq.com',    phone: '+506 8822-4455', status: 'Activo', workType: 'Por contrato', initials: 'DV', color: '#3B6EF5', admin: true },
    { id: 'w2', name: 'Juancho Víquez',  role: 'Técnico',    email: 'juancho.viquez@oviq.com',  phone: '+506 8811-2233', status: 'Activo', workType: 'Por contrato', initials: 'JV', color: '#10B981' },
    { id: 'w3', name: 'Ricardo Víquez',  role: 'Supervisor', email: 'ricardo.viquez@oviq.com',  phone: '+506 8833-6677', status: 'Activo', workType: 'Por horas',    initials: 'RV', color: '#EC4899', admin: true },
    { id: 'w4', name: 'Raquel Hernández',role: 'Asistente',  email: 'raquel.hernandez@oviq.com',phone: '+506 8855-1122', status: 'Activo', workType: 'Por contrato', initials: 'RH', color: '#8B5CF6' },
  ];

  const projects = [
    { id: 'p1', name: 'Pedregal San José',       clientId: 'c1', subClientId: 'c1a', status: 'En progreso', start: d(-45), end: d(30),  description: 'Obras y adecuaciones para el proyecto Pedregal en San José.',       icon: 'fa-solid fa-building',  color: '#3B6EF5' },
    { id: 'p2', name: 'Pedregal Guanacaste',     clientId: 'c1', subClientId: 'c1a', status: 'En progreso', start: d(-30), end: d(60),  description: 'Desarrollo del proyecto Pedregal en Guanacaste.',                    icon: 'fa-solid fa-tree',      color: '#0EA5E9' },
    { id: 'p3', name: 'Café Britt Instalación',  clientId: 'c2', subClientId: 'c2a', status: 'En progreso', start: d(-20), end: d(25),  description: 'Instalación de sistemas en las oficinas de Café Britt.',             icon: 'fa-solid fa-mug-hot',   color: '#10B981' },
    { id: 'p4', name: 'Tárcoles',                clientId: 'c2', subClientId: 'c2a', status: 'En progreso', start: d(-10), end: d(40),  description: 'Proyecto en planta de Tárcoles para Café Britt.',                    icon: 'fa-solid fa-industry',  color: '#059669' },
    { id: 'p5', name: 'Cámaras',                 clientId: 'c3', subClientId: null,  status: 'En pausa',    start: d(-90), end: d(-10), description: 'Instalación de cámaras de seguridad en sedes de Carranza.',          icon: 'fa-solid fa-video',     color: '#F59E0B' },
    { id: 'p6', name: 'Instalación',             clientId: 'c4', subClientId: null,  status: 'En pausa',    start: d(-80), end: d(-20), description: 'Instalación residencial para Marco Ureña.',                          icon: 'fa-solid fa-house',     color: '#8B5CF6' },
  ];

  /* Ticket titles per project — 1 complete + rest En progreso for active ones.
     Inactive projects: tickets paused / por hacer. */
  const ticketPlan = [
    // p1 · Pedregal San José
    { projectId: 'p1', items: [
      { title: 'Levantamiento topográfico',       status: 'Completado' },
      { title: 'Permisos municipales',            status: 'Pendiente' },
      { title: 'Coordinación con contratistas',   status: 'Pendiente' },
      { title: 'Entrega de planos constructivos', status: 'Pendiente' },
    ]},
    // p2 · Pedregal Guanacaste
    { projectId: 'p2', items: [
      { title: 'Estudio de suelos',               status: 'Completado' },
      { title: 'Movimiento de tierras',           status: 'Pendiente' },
      { title: 'Instalación eléctrica provisional', status: 'Pendiente' },
      { title: 'Acondicionamiento de accesos',    status: 'Pendiente' },
    ]},
    // p3 · Café Britt Instalación
    { projectId: 'p3', items: [
      { title: 'Inspección de sitio',             status: 'Completado' },
      { title: 'Cableado estructurado',           status: 'Pendiente' },
      { title: 'Instalación de equipos',          status: 'Pendiente' },
      { title: 'Pruebas de funcionamiento',       status: 'Pendiente' },
    ]},
    // p4 · Tárcoles
    { projectId: 'p4', items: [
      { title: 'Visita técnica inicial',          status: 'Completado' },
      { title: 'Montaje de racks',                status: 'Pendiente' },
      { title: 'Conexión a red industrial',       status: 'Pendiente' },
      { title: 'Capacitación al personal',        status: 'Pendiente' },
    ]},
    // p5 · Cámaras (Carranza, inactivo)
    { projectId: 'p5', items: [
      { title: 'Relevamiento de puntos de cámara', status: 'Completado' },
      { title: 'Instalación de cámaras exteriores', status: 'Pendiente' },
      { title: 'Configuración del DVR',            status: 'Por hacer' },
    ]},
    // p6 · Instalación (Marco Ureña, inactivo)
    { projectId: 'p6', items: [
      { title: 'Visita de diagnóstico',            status: 'Completado' },
      { title: 'Cotización de materiales',         status: 'Pendiente' },
      { title: 'Instalación final',                status: 'Por hacer' },
    ]},
  ];

  const priorities = ['Alta', 'Media', 'Baja'];
  const statuses   = ['Por hacer', 'Pendiente', 'Completado'];

  let tid = 0;
  const tickets = [];
  ticketPlan.forEach(plan => {
    plan.items.forEach((it, i) => {
      tid++;
      // Random assignment among David (w1), Juancho (w2), Ricardo (w3)
      const assignees = ['w1', 'w2', 'w3'];
      const assigneeId = assignees[(tid * 7 + i * 3) % assignees.length];
      tickets.push({
        id: 'tkt-' + tid,
        code: 'OVQ-' + (100 + tid),
        title: it.title,
        projectId: plan.projectId,
        assigneeId,
        priority: priorities[(tid + i) % priorities.length],
        status: it.status,
        start: d(-20 + (tid * 3) % 16),
        due: d(-10 + (tid * 4) % 50),
        created: d(-25 + (tid * 2) % 15),
        description: 'Detalle: ' + it.title.toLowerCase() + '. Incluye validación con el cliente y documentación correspondiente.',
        comments: [],
      });
    });
  });

  const invoices = [
    { id: 'inv-001', number: 'F-2026-0118', issueDate: d(-42), dueDate: d(-12), amount: 4850000, currency: 'CRC', clientId: 'c1', subClientId: 'c1a', projectId: 'p1', status: 'Pagada',  notes: 'Avance #1 - Levantamiento y permisos.' },
    { id: 'inv-002', number: 'F-2026-0124', issueDate: d(-28), dueDate: d(2),   amount: 3120000, currency: 'CRC', clientId: 'c1', subClientId: 'c1a', projectId: 'p2', status: 'Emitida', notes: 'Estudio de suelos y movimiento de tierras inicial.' },
    { id: 'inv-003', number: 'F-2026-0131', issueDate: d(-18), dueDate: d(12),  amount: 1875000, currency: 'CRC', clientId: 'c2', subClientId: 'c2a', projectId: 'p3', status: 'Emitida', notes: 'Cableado estructurado food court #1.' },
    { id: 'inv-004', number: 'F-2026-0136', issueDate: d(-9),  dueDate: d(21),  amount: 4200,    currency: 'USD', clientId: 'c2', subClientId: 'c2c', projectId: 'p4', status: 'Emitida', notes: 'Adecuación Mercadito Gourmet — fase 1.' },
    { id: 'inv-005', number: 'F-2026-0098', issueDate: d(-75), dueDate: d(-45), amount: 980000,  currency: 'CRC', clientId: 'c3', subClientId: null,  projectId: 'p5', status: 'Vencida', notes: 'Cámaras IP — pendiente de pago.' },
    { id: 'inv-006', number: 'F-2026-0105', issueDate: d(-60), dueDate: d(-30), amount: 1450000, currency: 'CRC', clientId: 'c4', subClientId: null,  projectId: 'p6', status: 'Vencida', notes: 'Instalación residencial Ureña.' },
    { id: 'inv-007', number: 'F-2026-0140', issueDate: d(-4),  dueDate: d(26),  amount: 2680000, currency: 'CRC', clientId: 'c1', subClientId: 'c1b', projectId: null, status: 'Emitida', notes: 'Asesoría técnica Quebradores Q1.' },
    { id: 'inv-008', number: 'F-2025-0312', issueDate: d(-110),dueDate: d(-80), amount: 5200000, currency: 'CRC', clientId: 'c2', subClientId: 'c2a', projectId: 'p3', status: 'Pagada',  notes: 'Anticipo Café Britt - fase preliminar.' },
  ];

  return { clients, workers, projects, tickets, invoices, statuses, priorities };
})();
