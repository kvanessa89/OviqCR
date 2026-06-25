/* Seed data for OVIQ — realistic Spanish-language project management */
window.OVIQ_SEED = (() => {
  const today = new Date();
  const d = (offset) => {
    const x = new Date(today); x.setDate(x.getDate() + offset);
    return x.toISOString().slice(0, 10);
  };

  const clients = [
    { id: 'c1', name: 'Pedregal CR', contact: 'María Fernández', email: 'mf@pedregal.cr', phone: '+506 2234-8810', status: 'Activo', industry: 'Energía', color: '#3B6EF5', initials: 'PC', description: 'Energía solar residencial y comercial en Costa Rica.' },
    { id: 'c2', name: 'Café Montaña Verde', contact: 'Roberto Vargas', email: 'rvargas@montanaverde.com', phone: '+506 2555-0912', status: 'Activo', industry: 'Agroindustria', color: '#10B981', initials: 'CM', description: 'Productores de café de especialidad, Zona de los Santos.' },
    { id: 'c3', name: 'Clínica Dental Sonrisa', contact: 'Dra. Lucía Mora', email: 'lucia@sonrisa.cr', phone: '+506 2290-4455', status: 'Activo', industry: 'Salud', color: '#06B6D4', initials: 'CS', description: 'Red de clínicas dentales en San José y Cartago.' },
    { id: 'c4', name: 'Inmobiliaria Atlántico', contact: 'Diego Zamora', email: 'diego@atlantico.cr', phone: '+506 2777-1203', status: 'Prospecto', industry: 'Inmobiliario', color: '#F59E0B', initials: 'IA', description: 'Desarrollos residenciales en Guanacaste.' },
    { id: 'c5', name: 'Textiles Pacífico', contact: 'Ana Castro', email: 'ana@textilespacifico.com', phone: '+506 2643-2211', status: 'Activo', industry: 'Manufactura', color: '#8B5CF6', initials: 'TP', description: 'Manufactura textil, exportación a Centroamérica.' },
    { id: 'c6', name: 'Ferretería El Roble', contact: 'Juan Solano', email: 'ventas@elroble.cr', phone: '+506 2440-7788', status: 'Inactivo', industry: 'Retail', color: '#EF4444', initials: 'FR', description: 'Cadena de ferreterías en el Valle Central.' },
    { id: 'c7', name: 'Escuela Río Claro', contact: 'Patricia Jiménez', email: 'patri@rioclaro.ed.cr', phone: '+506 2775-3366', status: 'Activo', industry: 'Educación', color: '#EC4899', initials: 'ER', description: 'Institución educativa privada bilingüe.' },
    { id: 'c8', name: 'Hotel Vista Azul', contact: 'Carlos Ugalde', email: 'cugalde@vistaazul.com', phone: '+506 2653-9900', status: 'Activo', industry: 'Turismo', color: '#0EA5E9', initials: 'HV', description: 'Hotel boutique en Manuel Antonio.' },
    { id: 'c9', name: 'Panadería La Espiga', contact: 'Marta Quirós', email: 'marta@laespiga.cr', phone: '+506 2221-4477', status: 'Prospecto', industry: 'Alimentos', color: '#F97316', initials: 'LE', description: 'Panadería artesanal, 4 sucursales.' },
  ];

  const workers = [
    { id: 'w1', name: 'Ana Carol Rodríguez', role: 'Gerente de Proyectos', email: 'ana.rodriguez@oviq.com', phone: '+506 8811-2233', status: 'Activo', workType: 'Por contrato', initials: 'AC', color: '#3B6EF5' },
    { id: 'w2', name: 'Luis Miguel Araya', role: 'Desarrollador Senior', email: 'luis.araya@oviq.com', phone: '+506 8822-4455', status: 'Activo', workType: 'Por contrato', initials: 'LA', color: '#10B981' },
    { id: 'w3', name: 'Sofía Campos', role: 'Diseñadora UX', email: 'sofia.campos@oviq.com', phone: '+506 8833-6677', status: 'Activo', workType: 'Por horas', initials: 'SC', color: '#EC4899' },
    { id: 'w4', name: 'Marco Villalobos', role: 'Técnico de Campo', email: 'marco.v@oviq.com', phone: '+506 8844-8899', status: 'Activo', workType: 'Por horas', initials: 'MV', color: '#F59E0B' },
    { id: 'w5', name: 'Paula Chaves', role: 'Analista QA', email: 'paula.ch@oviq.com', phone: '+506 8855-1122', status: 'Activo', workType: 'Por contrato', initials: 'PC', color: '#8B5CF6' },
    { id: 'w6', name: 'Ricardo Monge', role: 'Supervisor', email: 'r.monge@oviq.com', phone: '+506 8866-3344', status: 'Activo', workType: 'Por contrato', initials: 'RM', color: '#06B6D4' },
    { id: 'w7', name: 'Gabriela Soto', role: 'Contadora', email: 'g.soto@oviq.com', phone: '+506 8877-5566', status: 'Inactivo', workType: 'Por horas', initials: 'GS', color: '#EF4444' },
  ];

  const projects = [
    { id: 'p1', name: 'Instalación Eléctrica Pedregal', clientId: 'c1', status: 'En progreso', start: d(-45), end: d(30), description: 'Instalación eléctrica integral en sede Pedregal: tableros, canalización, iluminación y puesta a tierra.', icon: 'fa-solid fa-bolt', color: '#3B6EF5' },
    { id: 'p2', name: 'App Móvil de Fidelidad', clientId: 'c2', status: 'En progreso', start: d(-20), end: d(50), description: 'App iOS/Android para clientes del café: puntos, cupones, mapa de cafeterías.', icon: 'fa-solid fa-mobile-screen', color: '#10B981' },
    { id: 'p3', name: 'Rediseño Web Corporativo', clientId: 'c3', status: 'En progreso', start: d(-12), end: d(20), description: 'Rediseño completo del sitio web, enfocado en reservas online.', icon: 'fa-solid fa-palette', color: '#06B6D4' },
    { id: 'p4', name: 'Sistema POS Integrado', clientId: 'c5', status: 'Planificación', start: d(5), end: d(90), description: 'Sistema punto de venta con inventario y facturación electrónica.', icon: 'fa-solid fa-cash-register', color: '#8B5CF6' },
    { id: 'p5', name: 'Mantenimiento X', clientId: 'c1', status: 'Completado', start: d(-120), end: d(-15), description: 'Mantenimiento preventivo y correctivo programado X para sede Pedregal.', icon: 'fa-solid fa-screwdriver-wrench', color: '#3B6EF5' },
    { id: 'p6', name: 'Campaña Temporada Alta', clientId: 'c8', status: 'En progreso', start: d(-8), end: d(40), description: 'Campaña digital integrada para la temporada alta turística.', icon: 'fa-solid fa-bullhorn', color: '#0EA5E9' },
    { id: 'p7', name: 'Plataforma Educativa', clientId: 'c7', status: 'En pausa', start: d(-60), end: d(10), description: 'LMS personalizado para la institución, en pausa por revisión presupuestaria.', icon: 'fa-solid fa-graduation-cap', color: '#EC4899' },
  ];

  const priorities = ['Alta', 'Media', 'Baja'];
  const statuses = ['Por hacer', 'En progreso', 'En revisión', 'Completado'];

  const ticketTitles = [
    ['Diseñar mockups de dashboard', 'Revisar wireframes con cliente', 'Implementar autenticación SSO', 'Configurar pipeline CI/CD', 'Optimizar consultas a la base de datos'],
    ['Diseñar flujo de onboarding', 'Integración con pasarela de pago', 'Pruebas de carga del backend', 'Publicar app en TestFlight', 'Revisar accesibilidad WCAG'],
    ['Rediseño de homepage', 'Migración de contenido', 'SEO on-page', 'Pruebas cross-browser', 'Deploy a producción'],
    ['Análisis de requisitos', 'Levantamiento de inventario', 'Diseño de base de datos', 'Mockups interfaz cajero'],
    ['Migración de bases de datos', 'Pruebas de performance', 'Documentación técnica'],
    ['Brief creativo con cliente', 'Producción de assets', 'Setup Google Ads', 'Landing page temporada', 'Reporte de resultados semana 1'],
    ['Definición de módulos', 'Entrevistas con profesores', 'Wireframes portal padres'],
  ];

  let tid = 0;
  const tickets = [];
  projects.forEach((p, pi) => {
    ticketTitles[pi].forEach((title, i) => {
      tid++;
      const worker = workers[tid % workers.length];
      const status = p.status === 'Completado' ? 'Completado'
        : p.status === 'En pausa' ? (i % 2 ? 'Por hacer' : 'En revisión')
        : statuses[i % statuses.length];
      const priority = priorities[(tid + i) % 3];
      tickets.push({
        id: 'tkt-' + tid,
        code: 'OVQ-' + (100 + tid),
        title,
        projectId: p.id,
        assigneeId: worker.id,
        priority,
        status,
        due: d(-10 + (tid * 3) % 40),
        created: d(-30 + (tid * 2) % 20),
        description: 'Detalle del ticket ' + title.toLowerCase() + '. Incluye validación con stakeholders y documentación.',
        comments: [
          { id: 'cm' + tid + '1', author: worker.name, initials: worker.initials, text: 'Empezando a trabajar en esto hoy.', date: d(-2), kind: 'worker' },
        ],
      });
    });
  });

  return { clients, workers, projects, tickets, statuses, priorities };
})();
