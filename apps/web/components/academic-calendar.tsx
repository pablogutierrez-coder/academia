"use client";

import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, MapPin, Plus, RefreshCw, Search, UsersRound, X } from "lucide-react";
import { useMemo, useState } from "react";

type EventType = "REGULAR" | "REFUERZO" | "REPROGRAMADA";
type AcademicEvent = {
  id: string;
  date: string;
  start: string;
  end: string;
  course: string;
  group: string;
  teacher: string;
  mode: "Virtual" | "Presencial" | "Híbrida";
  location: string;
  type: EventType;
  note?: string;
  originalDate?: string;
};

const initialEvents: AcademicEvent[] = [
  { id: "CL-201", date: "2026-07-06", start: "18:00", end: "19:30", course: "Analítica de datos aplicada", group: "GRP-03", teacher: "Oscar Vildoso García", mode: "Virtual", location: "Sala virtual 03", type: "REGULAR" },
  { id: "CL-202", date: "2026-07-08", start: "18:00", end: "19:30", course: "Analítica de datos aplicada", group: "GRP-03", teacher: "Oscar Vildoso García", mode: "Virtual", location: "Sala virtual 03", type: "REGULAR" },
  { id: "CL-203", date: "2026-07-13", start: "19:00", end: "20:30", course: "Estrategias de marketing digital", group: "GRP-05", teacher: "Claudia Rivas Soto", mode: "Virtual", location: "Sala virtual 05", type: "REGULAR" },
  { id: "CL-204", date: "2026-07-15", start: "18:00", end: "19:30", course: "Analítica de datos aplicada", group: "GRP-03", teacher: "Oscar Vildoso García", mode: "Virtual", location: "Sala virtual 03", type: "REGULAR" },
  { id: "CL-205", date: "2026-07-18", start: "09:00", end: "11:00", course: "Fundamentos de gestión empresarial", group: "GRP-07", teacher: "Víctor Lara Reynoso", mode: "Híbrida", location: "Aula 204", type: "REGULAR" },
  { id: "CL-206", date: "2026-07-20", start: "18:00", end: "19:30", course: "Analítica de datos aplicada", group: "GRP-03", teacher: "Oscar Vildoso García", mode: "Virtual", location: "Sala virtual 03", type: "REGULAR" },
  { id: "CL-207", date: "2026-07-22", start: "19:00", end: "20:30", course: "Estrategias de marketing digital", group: "GRP-05", teacher: "Claudia Rivas Soto", mode: "Virtual", location: "Sala virtual 05", type: "REGULAR" },
  { id: "CL-208", date: "2026-07-24", start: "17:00", end: "18:30", course: "Liderazgo para equipos de alto rendimiento", group: "GRP-01", teacher: "Mariana Costa Ruiz", mode: "Presencial", location: "Aula 102", type: "REGULAR" },
  { id: "CL-209", date: "2026-07-27", start: "18:00", end: "19:30", course: "Analítica de datos aplicada", group: "GRP-03", teacher: "Oscar Vildoso García", mode: "Virtual", location: "Sala virtual 03", type: "REGULAR" },
  { id: "CL-210", date: "2026-07-30", start: "19:00", end: "20:30", course: "Estrategias de marketing digital", group: "GRP-05", teacher: "Claudia Rivas Soto", mode: "Virtual", location: "Sala virtual 05", type: "REPROGRAMADA", originalDate: "2026-07-28", note: "Reprogramada por feriado nacional" },
  { id: "CL-211", date: "2026-08-01", start: "10:00", end: "12:00", course: "Fundamentos de gestión empresarial", group: "GRP-07", teacher: "Víctor Lara Reynoso", mode: "Virtual", location: "Sala de refuerzo", type: "REFUERZO", note: "Repaso previo a evaluación" },
];

const courseColors: Record<string, string> = {
  "Analítica de datos aplicada": "blue",
  "Estrategias de marketing digital": "purple",
  "Fundamentos de gestión empresarial": "green",
  "Liderazgo para equipos de alto rendimiento": "orange",
};
const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const monthFormat = new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric" });
const fullDate = new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

function localDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

export function AcademicCalendar() {
  const [cursor, setCursor] = useState(new Date(2026, 6, 1));
  const [events, setEvents] = useState(initialEvents);
  const [course, setCourse] = useState("TODOS");
  const [group, setGroup] = useState("TODOS");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AcademicEvent | null>(null);
  const [editor, setEditor] = useState<"REFUERZO" | "REPROGRAMAR" | null>(null);
  const [message, setMessage] = useState("");

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(year, month, index - startOffset + 1);
    return date;
  });
  const visibleEvents = useMemo(() => events.filter((item) =>
    (course === "TODOS" || item.course === course) &&
    (group === "TODOS" || item.group === group) &&
    `${item.course} ${item.group} ${item.teacher}`.toLowerCase().includes(search.toLowerCase())
  ), [course, events, group, search]);
  const monthEvents = visibleEvents.filter((item) => {
    const date = localDate(item.date);
    return date.getFullYear() === year && date.getMonth() === month;
  });
  const conflicts = monthEvents.filter((item, index) => monthEvents.some((other, otherIndex) =>
    index !== otherIndex && item.date === other.date && item.start === other.start && (item.teacher === other.teacher || item.group === other.group)
  )).length;

  function saveReinforcement(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newEvent: AcademicEvent = {
      id: `REF-${Date.now()}`,
      date: String(form.get("date")),
      start: String(form.get("start")),
      end: String(form.get("end")),
      course: String(form.get("course")),
      group: String(form.get("group")),
      teacher: String(form.get("teacher")),
      mode: String(form.get("mode")) as AcademicEvent["mode"],
      location: String(form.get("location")),
      type: "REFUERZO",
      note: String(form.get("note")),
    };
    setEvents((current) => [...current, newEvent]);
    setEditor(null);
    setMessage(`Clase de refuerzo añadida para ${newEvent.group} el ${newEvent.date} a las ${newEvent.start}.`);
  }

  function saveReschedule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const previousDate = selected.date;
    const updated: AcademicEvent = {
      ...selected,
      date: String(form.get("date")),
      start: String(form.get("start")),
      end: String(form.get("end")),
      type: "REPROGRAMADA",
      originalDate: selected.originalDate ?? previousDate,
      note: `${String(form.get("reason"))}: ${String(form.get("note"))}`.replace(/:\s*$/, ""),
    };
    setEvents((current) => current.map((item) => item.id === updated.id ? updated : item));
    setSelected(updated);
    setEditor(null);
    setMessage(`Clase ${updated.id} reprogramada del ${previousDate} al ${updated.date}.`);
  }

  return <>
    <header className="page-header"><div><span className="page-kicker">Programación general</span><h1>Calendario académico</h1><p>Administra las sesiones de todos los cursos, refuerzos y cambios de programación.</p></div><button className="btn btn-primary" onClick={() => { setSelected(null); setEditor("REFUERZO"); }}><Plus size={17}/>Añadir clase de refuerzo</button></header>
    {message && <div className="feedback feedback-success" role="status"><CheckCircle2 size={16}/>{message}</div>}
    <section className="metric-grid compact academic-calendar-metrics">
      <article className="metric-card"><div className="metric-head"><span>Sesiones del mes</span><CalendarDays size={17}/></div><strong>{monthEvents.length}</strong><small>Programación visible</small></article>
      <article className="metric-card"><div className="metric-head"><span>Clases regulares</span><Clock3 size={17}/></div><strong>{monthEvents.filter((item) => item.type === "REGULAR").length}</strong><small>Según filtros</small></article>
      <article className="metric-card"><div className="metric-head"><span>Refuerzos</span><UsersRound size={17}/></div><strong>{monthEvents.filter((item) => item.type === "REFUERZO").length}</strong><small>Sesiones adicionales</small></article>
      <article className="metric-card"><div className="metric-head"><span>Reprogramadas</span><RefreshCw size={17}/></div><strong>{monthEvents.filter((item) => item.type === "REPROGRAMADA").length}</strong><small>{conflicts} conflictos detectados</small></article>
    </section>
    <section className="panel academic-calendar-panel">
      <header className="academic-calendar-toolbar">
        <div className="calendar-month-navigation"><button className="icon-button" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Mes anterior"><ChevronLeft size={18}/></button><button className="btn btn-secondary" onClick={() => setCursor(new Date(2026, 6, 1))}>Hoy</button><button className="icon-button" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Mes siguiente"><ChevronRight size={18}/></button><h2>{monthFormat.format(cursor)}</h2></div>
        <div className="calendar-filters"><label className="search-control"><Search size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar curso o docente"/></label><select aria-label="Filtrar por curso" value={course} onChange={(event) => setCourse(event.target.value)}><option value="TODOS">Todos los cursos</option>{Array.from(new Set(events.map((item) => item.course))).map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Filtrar por grupo" value={group} onChange={(event) => setGroup(event.target.value)}><option value="TODOS">Todos los grupos</option>{Array.from(new Set(events.map((item) => item.group))).map((item) => <option key={item}>{item}</option>)}</select></div>
      </header>
      <div className="academic-month-calendar">
        {weekdays.map((day) => <div className="academic-weekday" key={day}>{day}</div>)}
        {calendarDays.map((date) => {
          const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
          const dayEvents = visibleEvents.filter((item) => item.date === iso).sort((a, b) => a.start.localeCompare(b.start));
          const outside = date.getMonth() !== month;
          const today = iso === "2026-07-26";
          return <div className={`academic-day ${outside ? "outside" : ""} ${today ? "today" : ""}`} key={iso}><div className="academic-day-number"><span>{date.getDate()}</span>{today && <small>Hoy</small>}</div><div className="academic-day-events">{dayEvents.slice(0, 3).map((item) => <button className={`academic-calendar-event ${courseColors[item.course] ?? "blue"} ${item.type.toLowerCase()}`} onClick={() => setSelected(item)} key={item.id}><span>{item.start}</span><strong>{item.course}</strong><small>{item.group}{item.type === "REFUERZO" ? " · Refuerzo" : item.type === "REPROGRAMADA" ? " · Reprogramada" : ""}</small></button>)}{dayEvents.length > 3 && <span className="more-events">+{dayEvents.length - 3} sesiones</span>}</div></div>;
        })}
      </div>
      <footer className="academic-calendar-legend"><span><i className="legend-regular"/>Clase regular</span><span><i className="legend-reinforcement"/>Refuerzo</span><span><i className="legend-rescheduled"/>Reprogramada</span><small>Selecciona una sesión para consultar o cambiar su programación.</small></footer>
    </section>
    {selected && editor !== "REPROGRAMAR" && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="academic-event-title"><header><div><span className="page-kicker">{selected.type === "REGULAR" ? "Clase programada" : selected.type === "REFUERZO" ? "Clase de refuerzo" : "Clase reprogramada"}</span><h2 id="academic-event-title">{selected.course}</h2><p>{selected.group} · {fullDate.format(localDate(selected.date))}</p></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Cerrar sesión"><X size={18}/></button></header><div className="academic-event-detail"><div><Clock3 size={18}/><span><small>Horario</small><strong>{selected.start} – {selected.end}</strong></span></div><div><UsersRound size={18}/><span><small>Docente y grupo</small><strong>{selected.teacher} · {selected.group}</strong></span></div><div><MapPin size={18}/><span><small>Modalidad y ubicación</small><strong>{selected.mode} · {selected.location}</strong></span></div>{selected.originalDate && <div><RefreshCw size={18}/><span><small>Fecha original</small><strong>{fullDate.format(localDate(selected.originalDate))}</strong></span></div>}{selected.note && <p>{selected.note}</p>}</div><footer className="modal-actions"><button className="btn btn-secondary" onClick={() => setSelected(null)}>Cerrar</button><button className="btn btn-primary" onClick={() => setEditor("REPROGRAMAR")}><RefreshCw size={16}/>Reprogramar clase</button></footer></section></div>}
    {editor === "REFUERZO" && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="reinforcement-title"><header><div><span className="page-kicker">Programación adicional</span><h2 id="reinforcement-title">Añadir clase de refuerzo</h2><p>Crea una sesión extraordinaria asociada a un curso y grupo.</p></div><button className="icon-button" onClick={() => setEditor(null)} aria-label="Cerrar formulario"><X size={18}/></button></header><form onSubmit={saveReinforcement}><label className="form-field"><span>Curso</span><select name="course" required><option>Analítica de datos aplicada</option><option>Estrategias de marketing digital</option><option>Fundamentos de gestión empresarial</option><option>Liderazgo para equipos de alto rendimiento</option></select></label><div className="form-row"><label className="form-field"><span>Grupo</span><select name="group"><option>GRP-03</option><option>GRP-05</option><option>GRP-07</option><option>GRP-01</option></select></label><label className="form-field"><span>Docente</span><select name="teacher"><option>Oscar Vildoso García</option><option>Claudia Rivas Soto</option><option>Víctor Lara Reynoso</option><option>Mariana Costa Ruiz</option></select></label></div><div className="form-row"><label className="form-field"><span>Fecha</span><input name="date" type="date" required defaultValue="2026-08-01"/></label><label className="form-field"><span>Hora de inicio</span><input name="start" type="time" required defaultValue="10:00"/></label></div><div className="form-row"><label className="form-field"><span>Hora de término</span><input name="end" type="time" required defaultValue="12:00"/></label><label className="form-field"><span>Modalidad</span><select name="mode"><option>Virtual</option><option>Presencial</option><option>Híbrida</option></select></label></div><label className="form-field"><span>Ubicación o sala</span><input name="location" required placeholder="Sala virtual o aula"/></label><label className="form-field"><span>Objetivo del refuerzo</span><textarea name="note" rows={3} required placeholder="Describe el tema o necesidad académica"/></label><footer><button type="button" className="btn btn-secondary" onClick={() => setEditor(null)}>Cancelar</button><button className="btn btn-primary" type="submit">Añadir al calendario</button></footer></form></section></div>}
    {editor === "REPROGRAMAR" && selected && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="reschedule-title"><header><div><span className="page-kicker">Cambio de programación</span><h2 id="reschedule-title">Reprogramar clase</h2><p>{selected.course} · fecha actual {selected.date}</p></div><button className="icon-button" onClick={() => setEditor(null)} aria-label="Cerrar reprogramación"><X size={18}/></button></header><form onSubmit={saveReschedule}><label className="form-field"><span>Motivo del cambio</span><select name="reason" required><option>Feriado nacional</option><option>Disponibilidad del docente</option><option>Solicitud del grupo</option><option>Incidencia operativa</option><option>Otro motivo</option></select></label><div className="form-row"><label className="form-field"><span>Nueva fecha</span><input name="date" type="date" required defaultValue={selected.date}/></label><label className="form-field"><span>Hora de inicio</span><input name="start" type="time" required defaultValue={selected.start}/></label></div><label className="form-field"><span>Hora de término</span><input name="end" type="time" required defaultValue={selected.end}/></label><label className="form-field"><span>Observación</span><textarea name="note" rows={3} placeholder="Información que verán docentes y estudiantes"/></label><footer><button type="button" className="btn btn-secondary" onClick={() => setEditor(null)}>Cancelar</button><button className="btn btn-primary" type="submit">Confirmar reprogramación</button></footer></form></section></div>}
  </>;
}
