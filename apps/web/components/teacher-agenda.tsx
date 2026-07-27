"use client";

import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, MapPin, Plus, Video, X } from "lucide-react";
import { useMemo, useState } from "react";

type AgendaEvent = {
  id: string;
  day: number;
  start: string;
  end: string;
  title: string;
  group: string;
  mode: "Virtual" | "Presencial";
  location: string;
  status: "CONFIRMADA" | "PENDIENTE";
};

const baseEvents: AgendaEvent[] = [
  { id: "EV-01", day: 0, start: "09:00", end: "10:30", title: "Analítica de datos aplicada", group: "GRP-03", mode: "Virtual", location: "Sala virtual 03", status: "CONFIRMADA" },
  { id: "EV-02", day: 0, start: "18:00", end: "19:30", title: "Estrategias de marketing digital", group: "GRP-05", mode: "Virtual", location: "Sala virtual 05", status: "PENDIENTE" },
  { id: "EV-03", day: 1, start: "15:00", end: "16:30", title: "Gestión empresarial", group: "GRP-07", mode: "Presencial", location: "Aula 204", status: "CONFIRMADA" },
  { id: "EV-04", day: 2, start: "09:00", end: "10:30", title: "Analítica de datos aplicada", group: "GRP-03", mode: "Virtual", location: "Sala virtual 03", status: "CONFIRMADA" },
  { id: "EV-05", day: 3, start: "18:00", end: "19:30", title: "Estrategias de marketing digital", group: "GRP-05", mode: "Virtual", location: "Sala virtual 05", status: "CONFIRMADA" },
  { id: "EV-06", day: 4, start: "11:00", end: "12:30", title: "Taller de visualización", group: "GRP-03", mode: "Presencial", location: "Laboratorio 2", status: "CONFIRMADA" },
];

const monthName = new Intl.DateTimeFormat("es-PE", { month: "long" });
const dayName = new Intl.DateTimeFormat("es-PE", { weekday: "short" });

export function TeacherAgenda() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [view, setView] = useState<"SEMANA" | "DIA">("SEMANA");
  const [selectedDay, setSelectedDay] = useState(0);
  const [filter, setFilter] = useState<"TODAS" | AgendaEvent["status"]>("TODAS");
  const [events, setEvents] = useState(baseEvents);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [blockModal, setBlockModal] = useState(false);
  const [message, setMessage] = useState("");

  const weekStart = useMemo(() => {
    const date = new Date(2026, 6, 27);
    date.setDate(date.getDate() + weekOffset * 7);
    return date;
  }, [weekOffset]);
  const days = useMemo(() => Array.from({ length: 5 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  }), [weekStart]);
  const visibleDays = view === "DIA" ? [days[selectedDay]!] : days;
  const visibleEvents = events.filter((event) => filter === "TODAS" || event.status === filter);
  const weekEnd = days[4]!;

  function confirmEvent(id: string) {
    setEvents((current) => current.map((event) => event.id === id ? { ...event, status: "CONFIRMADA" } : event));
    setSelectedEvent((current) => current?.id === id ? { ...current, status: "CONFIRMADA" } : current);
    setMessage("Clase confirmada y agenda actualizada.");
  }

  function saveBlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBlockModal(false);
    setMessage(`Bloqueo personal registrado para ${String(form.get("fecha"))} a las ${String(form.get("hora"))}.`);
  }

  return <>
    <header className="page-header">
      <div><span className="page-kicker">Gestión operativa</span><h1>Mi agenda</h1><p>Organiza tus clases, confirma asignaciones y administra tu disponibilidad académica.</p></div>
      <button className="btn btn-primary" onClick={() => setBlockModal(true)}><Plus size={17}/>Bloquear horario</button>
    </header>
    {message && <div className="feedback feedback-success"><Check size={16}/>{message}</div>}
    <section className="metric-grid compact agenda-metrics">
      <article className="metric-card"><div className="metric-head"><span>Clases esta semana</span><CalendarDays size={16}/></div><strong>{events.length}</strong><small>{events.filter((event) => event.status === "CONFIRMADA").length} confirmadas</small></article>
      <article className="metric-card"><div className="metric-head"><span>Horas programadas</span><Clock3 size={16}/></div><strong>9 h</strong><small>Carga lectiva</small></article>
      <article className="metric-card"><div className="metric-head"><span>Por confirmar</span><span className="metric-signal attention"/></div><strong>{events.filter((event) => event.status === "PENDIENTE").length}</strong><small>Requiere acción</small></article>
      <article className="metric-card"><div className="metric-head"><span>Disponibilidad</span><span className="metric-signal positive"/></div><strong>76%</strong><small>En horario académico</small></article>
    </section>
    <section className="panel agenda-panel">
      <header className="agenda-toolbar">
        <div className="agenda-navigation">
          <button className="icon-button" onClick={() => setWeekOffset((current) => current - 1)} aria-label="Semana anterior"><ChevronLeft size={17}/></button>
          <button className="btn btn-secondary" onClick={() => setWeekOffset(0)}>Hoy</button>
          <button className="icon-button" onClick={() => setWeekOffset((current) => current + 1)} aria-label="Semana siguiente"><ChevronRight size={17}/></button>
          <div><strong>{weekStart.getDate()} – {weekEnd.getDate()} de {monthName.format(weekEnd)}</strong><small>Semana académica</small></div>
        </div>
        <div className="agenda-controls">
          <select aria-label="Filtrar agenda" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="TODAS">Todas las clases</option><option value="CONFIRMADA">Confirmadas</option><option value="PENDIENTE">Por confirmar</option></select>
          <div className="segmented-control"><button className={view === "SEMANA" ? "is-active" : ""} onClick={() => setView("SEMANA")}>Semana</button><button className={view === "DIA" ? "is-active" : ""} onClick={() => setView("DIA")}>Día</button></div>
        </div>
      </header>
      <div className={`agenda-calendar ${view === "DIA" ? "day-view" : ""}`}>
        <div className="agenda-time-head"/>
        {visibleDays.map((date) => <button className={`agenda-day-head ${view === "DIA" && days.indexOf(date) === selectedDay ? "is-active" : ""}`} onClick={() => { setSelectedDay(days.indexOf(date)); setView("DIA"); }} key={date.toISOString()}><span>{dayName.format(date)}</span><strong>{date.getDate()}</strong></button>)}
        {["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"].map((time, row) => <div className="agenda-row" key={time} style={{ gridColumn: `1 / ${visibleDays.length + 2}`, gridRow: row + 2 }}><span>{time}</span>{visibleDays.map((date) => <i key={date.toISOString()}/>)}</div>)}
        {visibleEvents.map((event) => {
          const dayIndex = view === "DIA" ? (event.day === selectedDay ? 0 : -1) : event.day;
          if (dayIndex < 0) return null;
          const startHour = Number(event.start.slice(0, 2));
          const row = Math.max(1, Math.floor((startHour - 8) / 2) + 1);
          return <button data-testid={`agenda-event-${event.id}`} className={`agenda-event ${event.status.toLowerCase()}`} style={{ gridColumn: dayIndex + 2, gridRow: row + 1 }} onClick={() => setSelectedEvent(event)} key={event.id}><span>{event.start} – {event.end}</span><strong>{event.title}</strong><small>{event.group} · {event.mode}</small></button>;
        })}
      </div>
      <footer className="agenda-legend"><span><i className="confirmed"/>Confirmada</span><span><i className="pending"/>Por confirmar</span><small>Selecciona una clase para consultar o gestionar sus detalles.</small></footer>
    </section>
    {selectedEvent && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="event-title"><header><div><span className="page-kicker">{selectedEvent.group}</span><h2 id="event-title">{selectedEvent.title}</h2><p>{selectedEvent.start} – {selectedEvent.end}</p></div><button className="icon-button" onClick={() => setSelectedEvent(null)} aria-label="Cerrar detalle de clase"><X size={18}/></button></header><div className="agenda-event-detail"><div><Clock3 size={17}/><span><small>Horario</small><strong>{selectedEvent.start} – {selectedEvent.end}</strong></span></div><div><MapPin size={17}/><span><small>Modalidad y ubicación</small><strong>{selectedEvent.mode} · {selectedEvent.location}</strong></span></div><div><Video size={17}/><span><small>Acceso</small><strong>{selectedEvent.mode === "Virtual" ? "Enlace de conexión habilitado" : "Asistencia presencial"}</strong></span></div></div><footer className="modal-actions"><button className="btn btn-secondary" onClick={() => setSelectedEvent(null)}>Cerrar</button>{selectedEvent.status === "PENDIENTE" && <button className="btn btn-primary" onClick={() => confirmEvent(selectedEvent.id)}><Check size={16}/>Confirmar clase</button>}{selectedEvent.mode === "Virtual" && <button className="btn btn-info" onClick={() => setMessage("Sala virtual abierta en modo demostración.")}><Video size={16}/>Abrir sala</button>}</footer></section></div>}
    {blockModal && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="block-title"><header><div><span className="page-kicker">Disponibilidad</span><h2 id="block-title">Bloquear horario</h2><p>Registra un espacio en el que no podrás recibir asignaciones.</p></div><button className="icon-button" onClick={() => setBlockModal(false)} aria-label="Cerrar bloqueo"><X size={18}/></button></header><form onSubmit={saveBlock}><div className="form-row"><label className="form-field"><span>Fecha</span><input name="fecha" type="date" required defaultValue="2026-07-30"/></label><label className="form-field"><span>Hora de inicio</span><input name="hora" type="time" required defaultValue="13:00"/></label></div><label className="form-field"><span>Motivo</span><input name="motivo" required placeholder="Ej. reunión institucional"/></label><footer><button type="button" className="btn btn-secondary" onClick={() => setBlockModal(false)}>Cancelar</button><button className="btn btn-primary" type="submit">Guardar bloqueo</button></footer></form></section></div>}
  </>;
}
