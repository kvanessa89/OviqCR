import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTickets } from '../../api/tickets';
import { getProyectos } from '../../api/proyectos';
import type { TicketDto, ProyectoDto } from '../../types';
import NuevoTicketModal from '../proyectos/NuevoTicketModal';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MAX_CARRILES = 3;

const PROYECTO_COLORS = [
  '#3B6EF5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#EC4899', '#F97316', '#6366F1', '#14B8A6',
];
function colorProyecto(id: number) { return PROYECTO_COLORS[id % PROYECTO_COLORS.length]; }

interface Celda {
  day: number;
  otro: boolean;
  fecha: Date;
}

function construirCeldas(cursor: Date): Celda[] {
  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const primero = new Date(y, m, 1);
  const inicioSemana = (primero.getDay() + 6) % 7; // lunes primero
  const diasEnMes = new Date(y, m + 1, 0).getDate();
  const diasMesAnterior = new Date(y, m, 0).getDate();

  const celdas: Celda[] = [];
  for (let i = 0; i < inicioSemana; i++) {
    const day = diasMesAnterior - inicioSemana + i + 1;
    celdas.push({ day, otro: true, fecha: new Date(y, m - 1, day) });
  }
  for (let i = 1; i <= diasEnMes; i++) {
    celdas.push({ day: i, otro: false, fecha: new Date(y, m, i) });
  }
  while (celdas.length % 7 !== 0) {
    const day = celdas.length - diasEnMes - inicioSemana + 1;
    celdas.push({ day, otro: true, fecha: new Date(y, m + 1, day) });
  }
  return celdas;
}

function fechaISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface Rango {
  ticket: TicketDto;
  inicio: string;
  fin: string;
}

// Rango de fechas a mostrar en el calendario:
// - ambas fechas → se extiende de inicio a fin
// - solo una de las dos → un solo día
function rangoTicket(t: TicketDto): { inicio: string; fin: string } | null {
  if (t.fechaInicio && t.fechaFin) return { inicio: t.fechaInicio.slice(0, 10), fin: t.fechaFin.slice(0, 10) };
  if (t.fechaInicio) return { inicio: t.fechaInicio.slice(0, 10), fin: t.fechaInicio.slice(0, 10) };
  if (t.fechaFin) return { inicio: t.fechaFin.slice(0, 10), fin: t.fechaFin.slice(0, 10) };
  return null;
}

interface Asignacion {
  rango: Rango;
  clipInicio: string;
  clipFin: string;
  carril: number;
}

// Asigna cada rango que toca esta semana a un "carril" (fila) fijo, para que un
// ticket mantenga siempre la misma fila mientras dura, sin importar qué otros
// tickets compartan un día puntual con él (evita el desfase visual).
function asignarCarriles(rangos: Rango[], weekStartISO: string, weekEndISO: string): Asignacion[] {
  const relevantes = rangos
    .filter(r => r.inicio <= weekEndISO && r.fin >= weekStartISO)
    .map(r => ({
      rango: r,
      clipInicio: r.inicio < weekStartISO ? weekStartISO : r.inicio,
      clipFin: r.fin > weekEndISO ? weekEndISO : r.fin,
    }))
    .sort((a, b) =>
      a.clipInicio.localeCompare(b.clipInicio) ||
      b.clipFin.localeCompare(a.clipFin) ||
      a.rango.ticket.id - b.rango.ticket.id
    );

  const finPorCarril: string[] = [];
  const asignaciones: Asignacion[] = [];

  relevantes.forEach(item => {
    let carril = finPorCarril.findIndex(fin => fin < item.clipInicio);
    if (carril === -1) { carril = finPorCarril.length; finPorCarril.push(''); }
    finPorCarril[carril] = item.clipFin;
    asignaciones.push({ ...item, carril });
  });

  return asignaciones;
}

export default function CalendarioPage() {
  const navigate = useNavigate();
  const [tickets, setTickets]     = useState<TicketDto[]>([]);
  const [proyectos, setProyectos] = useState<ProyectoDto[]>([]);
  const [loading, setLoading]     = useState(true);
  const [cursor, setCursor]       = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [ticketSeleccionado, setTicketSeleccionado] = useState<TicketDto | null>(null);

  const cargar = () =>
    Promise.all([getTickets(), getProyectos()])
      .then(([t, p]) => { setTickets(t); setProyectos(p); })
      .finally(() => setLoading(false));

  useEffect(() => { cargar(); }, []);

  const idsProyectosActivos = useMemo(
    () => new Set(proyectos.filter(p => p.estadoCodigo !== 'finalizado').map(p => p.id)),
    [proyectos]
  );

  const rangos = useMemo<Rango[]>(() => {
    return tickets
      .filter(t => idsProyectosActivos.has(t.proyectoId))
      .map(t => {
        const r = rangoTicket(t);
        return r ? { ticket: t, inicio: r.inicio, fin: r.fin } : null;
      })
      .filter((r): r is Rango => r !== null);
  }, [tickets, idsProyectosActivos]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-3)' }}>
      <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 10 }}></i> Cargando...
    </div>
  );

  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const celdas = construirCeldas(cursor);
  const semanas: Celda[][] = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const irMesAnterior = () => { const c = new Date(cursor); c.setMonth(c.getMonth() - 1); setCursor(c); };
  const irMesSiguiente = () => { const c = new Date(cursor); c.setMonth(c.getMonth() + 1); setCursor(c); };
  const irHoy = () => { const d = new Date(); d.setDate(1); setCursor(d); };

  return (
    <div>
      <div className="page-head">
        <div className="ph-left">
          <div className="crumb">
            <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Inicio</span>
            <span className="sep">›</span>
            <span>Calendario</span>
          </div>
          <div className="page-title">Calendario</div>
          <div className="page-subtitle">Tickets por día</div>
        </div>
        <div className="ph-right">
          <button className="btn btn-outline btn-sm" onClick={irMesAnterior}>
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-1)', minWidth: 160, textAlign: 'center', alignSelf: 'center' }}>
            {MESES[m]} {y}
          </div>
          <button className="btn btn-outline btn-sm" onClick={irMesSiguiente}>
            <i className="fa-solid fa-chevron-right"></i>
          </button>
          <button className="btn btn-primary btn-sm" onClick={irHoy}>Hoy</button>
        </div>
      </div>

      <div className="cal">
        <div className="cal-grid">
          {DIAS_SEMANA.map(d => <div key={d} className="cal-dow">{d}</div>)}
          {semanas.map((semana, si) => {
            const weekStartISO = fechaISO(semana[0].fecha);
            const weekEndISO = fechaISO(semana[6].fecha);
            const asignaciones = asignarCarriles(rangos, weekStartISO, weekEndISO);
            const maxCarril = asignaciones.reduce((max, a) => Math.max(max, a.carril), -1);
            const carrilesVisibles = Math.min(MAX_CARRILES, maxCarril + 1);

            const overflowPorDia: Record<string, number> = {};
            asignaciones.filter(a => a.carril >= MAX_CARRILES).forEach(a => {
              const cur = new Date(a.clipInicio + 'T00:00:00');
              const fin = new Date(a.clipFin + 'T00:00:00');
              while (cur.getTime() <= fin.getTime()) {
                const key = fechaISO(cur);
                overflowPorDia[key] = (overflowPorDia[key] || 0) + 1;
                cur.setDate(cur.getDate() + 1);
              }
            });

            return semana.map((c, col) => {
              const iso = fechaISO(c.fecha);
              const esHoy = c.fecha.getTime() === hoy.getTime();
              const restantes = overflowPorDia[iso] || 0;
              return (
                <div key={si * 7 + col} className={`cal-day${c.otro ? ' other' : ''}`}>
                  <div className={`cal-num${esHoy ? ' today' : ''}`}>{c.day}</div>
                  {Array.from({ length: carrilesVisibles }, (_, carril) => {
                    const asign = asignaciones.find(a => a.carril === carril && a.clipInicio <= iso && iso <= a.clipFin);
                    if (!asign) {
                      return <div key={carril} className="cal-evt" style={{ visibility: 'hidden' }}>&nbsp;</div>;
                    }
                    const color = colorProyecto(asign.rango.ticket.proyectoId);
                    // Si el ticket tiene fecha inicio y fin, la tarjeta se extiende
                    // como una barra continua a lo largo de esos días (recortada por semana).
                    const bordeIzq = iso === asign.rango.inicio || col === 0;
                    const bordeDer = iso === asign.rango.fin || col === 6;
                    return (
                      <div
                        key={carril}
                        className="cal-evt"
                        style={{
                          background: color + '20',
                          color,
                          borderRadius: `${bordeIzq ? 4 : 0}px ${bordeDer ? 4 : 0}px ${bordeDer ? 4 : 0}px ${bordeIzq ? 4 : 0}px`,
                          marginLeft: bordeIzq ? 0 : -6,
                          marginRight: bordeDer ? 0 : -6,
                        }}
                        title={`${asign.rango.ticket.titulo} — ${asign.rango.ticket.proyectoNombre}`}
                        onClick={() => setTicketSeleccionado(asign.rango.ticket)}
                      >
                        {bordeIzq ? asign.rango.ticket.titulo : ' '}
                      </div>
                    );
                  })}
                  {restantes > 0 && (
                    <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, marginTop: 2 }}>
                      +{restantes} más
                    </div>
                  )}
                </div>
              );
            });
          })}
        </div>
      </div>

      {ticketSeleccionado && (
        <NuevoTicketModal
          proyectoId={ticketSeleccionado.proyectoId}
          ticket={ticketSeleccionado}
          onClose={() => setTicketSeleccionado(null)}
          onCreado={() => { setTicketSeleccionado(null); cargar(); }}
        />
      )}
    </div>
  );
}
