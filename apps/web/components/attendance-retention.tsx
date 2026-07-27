"use client";

import { CalendarDays, CheckCircle2, ClipboardCheck, Eye, Filter, RotateCcw, Search, TrendingUp, UserCheck, X } from "lucide-react";
import { useMemo, useState } from "react";

type AttendanceStatus = "CERRADA" | "PENDIENTE";
type AttendanceSession = {
  id: string; date: string; course: string; group: string; teacher: string;
  scheduled: number; present: number; late: number; absent: number; status: AttendanceStatus;
};

const attendanceSessions: AttendanceSession[] = [
  { id: "SES-0726-01", date: "2026-07-26", course: "Analítica de datos aplicada", group: "GRP-03", teacher: "Oscar Vildoso García", scheduled: 24, present: 20, late: 1, absent: 3, status: "CERRADA" },
  { id: "SES-0725-02", date: "2026-07-25", course: "Estrategias de marketing digital", group: "GRP-05", teacher: "Elena Campos", scheduled: 28, present: 23, late: 2, absent: 3, status: "CERRADA" },
  { id: "SES-0725-01", date: "2026-07-25", course: "Fundamentos de gestión empresarial", group: "GRP-02", teacher: "María Costa", scheduled: 30, present: 25, late: 1, absent: 4, status: "CERRADA" },
  { id: "SES-0724-01", date: "2026-07-24", course: "Analítica de datos aplicada", group: "GRP-03", teacher: "Oscar Vildoso García", scheduled: 24, present: 19, late: 2, absent: 3, status: "CERRADA" },
  { id: "SES-0723-01", date: "2026-07-23", course: "Liderazgo para equipos de alto rendimiento", group: "GRP-07", teacher: "Víctor Lara", scheduled: 20, present: 18, late: 0, absent: 2, status: "CERRADA" },
  { id: "SES-0722-01", date: "2026-07-22", course: "Fundamentos de gestión empresarial", group: "GRP-02", teacher: "María Costa", scheduled: 30, present: 24, late: 2, absent: 4, status: "CERRADA" },
  { id: "SES-0728-01", date: "2026-07-28", course: "Estrategias de marketing digital", group: "GRP-05", teacher: "Elena Campos", scheduled: 28, present: 0, late: 0, absent: 0, status: "PENDIENTE" },
];

function displayDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

export function AttendanceControl() {
  const [month, setMonth] = useState("2026-07");
  const [date, setDate] = useState("");
  const [group, setGroup] = useState("TODOS");
  const [course, setCourse] = useState("TODOS");
  const [status, setStatus] = useState<"TODOS" | AttendanceStatus>("TODOS");
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => attendanceSessions.filter((item) =>
    item.date.startsWith(month) && (!date || item.date === date) &&
    (group === "TODOS" || item.group === group) && (course === "TODOS" || item.course === course) &&
    (status === "TODOS" || item.status === status) &&
    `${item.course} ${item.group} ${item.teacher}`.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => b.date.localeCompare(a.date)), [course, date, group, month, search, status]);
  const closed = filtered.filter((item) => item.status === "CERRADA");
  const scheduled = closed.reduce((sum, item) => sum + item.scheduled, 0);
  const present = closed.reduce((sum, item) => sum + item.present + item.late, 0);
  const absent = closed.reduce((sum, item) => sum + item.absent, 0);
  const average = scheduled ? Math.round((present / scheduled) * 1000) / 10 : 0;
  const resetFilters = () => { setMonth("2026-07"); setDate(""); setGroup("TODOS"); setCourse("TODOS"); setStatus("TODOS"); setSearch(""); };

  return <>
    <header className="page-header"><div><span className="page-kicker">Control académico</span><h1>Control de asistencia</h1><p>Consulta todas las sesiones registradas por fecha, mes, grupo, curso y estado de cierre.</p></div></header>
    <section className="metric-grid compact attendance-metrics">
      <article className="metric-card"><div className="metric-head"><span>Asistencia promedio</span><TrendingUp size={18}/></div><strong>{average}%</strong><small>Según los filtros aplicados</small></article>
      <article className="metric-card"><div className="metric-head"><span>Sesiones</span><CalendarDays size={18}/></div><strong>{filtered.length}</strong><small>{closed.length} cerradas</small></article>
      <article className="metric-card"><div className="metric-head"><span>Asistencias</span><UserCheck size={18}/></div><strong>{present}</strong><small>Incluye tardanzas</small></article>
      <article className="metric-card"><div className="metric-head"><span>Faltas registradas</span><ClipboardCheck size={18}/></div><strong>{absent}</strong><small>En el periodo visible</small></article>
    </section>
    <section className="panel attendance-history">
      <header className="panel-header"><div><h2>Historial de sesiones</h2><p>Los indicadores se recalculan con cada filtro.</p></div><span className="status-badge info">{filtered.length} resultados</span></header>
      <div className="attendance-filter-grid">
        <label className="form-field"><span>Mes</span><input type="month" value={month} onChange={(event) => setMonth(event.target.value)}/></label>
        <label className="form-field"><span>Fecha exacta</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)}/></label>
        <label className="form-field"><span>Grupo</span><select value={group} onChange={(event) => setGroup(event.target.value)}><option value="TODOS">Todos los grupos</option>{Array.from(new Set(attendanceSessions.map((item) => item.group))).map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="form-field"><span>Curso</span><select value={course} onChange={(event) => setCourse(event.target.value)}><option value="TODOS">Todos los cursos</option>{Array.from(new Set(attendanceSessions.map((item) => item.course))).map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="form-field"><span>Estado</span><select value={status} onChange={(event) => setStatus(event.target.value as "TODOS" | AttendanceStatus)}><option value="TODOS">Todos los estados</option><option value="CERRADA">Cerrada</option><option value="PENDIENTE">Pendiente</option></select></label>
        <label className="search-control attendance-search"><Search size={17}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar docente o curso"/></label>
        <button className="btn btn-secondary attendance-reset" onClick={resetFilters}><RotateCcw size={16}/>Limpiar filtros</button>
      </div>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>Fecha y sesión</th><th>Curso</th><th>Grupo</th><th>Docente</th><th>Programados</th><th>Asistió</th><th>Tardanza</th><th>Faltó</th><th>% asistencia</th><th>Estado</th></tr></thead><tbody>{filtered.map((item) => {
        const percentage = item.status === "CERRADA" ? Math.round(((item.present + item.late) / item.scheduled) * 100) : null;
        return <tr key={item.id}><td><strong>{displayDate(item.date)}</strong><small className="table-subtitle">{item.id}</small></td><td><strong>{item.course}</strong></td><td>{item.group}</td><td>{item.teacher}</td><td>{item.scheduled}</td><td className="attendance-present">{item.present}</td><td className="attendance-late">{item.late}</td><td className="attendance-absent">{item.absent}</td><td><strong>{percentage === null ? "—" : `${percentage}%`}</strong></td><td><span className={`status-badge ${item.status === "CERRADA" ? "success" : "warning"}`}>{item.status === "CERRADA" ? "Cerrada" : "Pendiente"}</span></td></tr>;
      })}</tbody></table></div>
      {!filtered.length && <div className="empty-state"><Filter size={26}/><strong>No hay sesiones con estos filtros</strong><p>Prueba otro mes, grupo, curso o estado.</p></div>}
    </section>
  </>;
}

type RecoveryRecord = {
  id: string; student: string; document: string; course: string; group: string; risk: string;
  intervention: string; responsible: string; returnDate: string; returnSession: string;
  attendanceAfter: number; sessionsAfter: number; outcome: "REINSERTADO" | "RETENIDO"; evidence: string;
};

const recoveryRecords: RecoveryRecord[] = [
  { id: "RET-026", student: "Valeria Campos León", document: "EST-00230", course: "Liderazgo para equipos de alto rendimiento", group: "GRP-07", risk: "2 faltas consecutivas", intervention: "Llamada y ajuste de horario", responsible: "Víctor Lara", returnDate: "2026-07-20", returnSession: "Sesión 5", attendanceAfter: 100, sessionsAfter: 3, outcome: "REINSERTADO", evidence: "Compromiso de continuidad registrado" },
  { id: "RET-025", student: "Rosa Medina Castro", document: "EST-00201", course: "Fundamentos de gestión empresarial", group: "GRP-02", risk: "4 faltas acumuladas", intervention: "Acuerdo de recuperación académica", responsible: "María Costa", returnDate: "2026-07-22", returnSession: "Sesión 6", attendanceAfter: 100, sessionsAfter: 2, outcome: "REINSERTADO", evidence: "compromiso-retorno.pdf" },
  { id: "RET-021", student: "Ricardo León Prado", document: "EST-00142", course: "Analítica de datos aplicada", group: "GRP-03", risk: "3 faltas acumuladas", intervention: "Tutoría y reprogramación", responsible: "Elena Campos", returnDate: "2026-07-15", returnSession: "Sesión 4", attendanceAfter: 80, sessionsAfter: 5, outcome: "RETENIDO", evidence: "Acta de tutoría" },
  { id: "RET-018", student: "Paola Rivas Soto", document: "EST-00117", course: "Estrategias de marketing digital", group: "GRP-05", risk: "Intención de abandono", intervention: "Orientación y plan de continuidad", responsible: "Javier Ponce", returnDate: "2026-06-28", returnSession: "Sesión 3", attendanceAfter: 92, sessionsAfter: 7, outcome: "RETENIDO", evidence: "Plan de continuidad firmado" },
];

export function RetentionResults() {
  const [course, setCourse] = useState("TODOS");
  const [month, setMonth] = useState("TODOS");
  const [outcome, setOutcome] = useState<"TODOS" | RecoveryRecord["outcome"]>("TODOS");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<RecoveryRecord | null>(null);
  const filtered = useMemo(() => recoveryRecords.filter((item) =>
    (course === "TODOS" || item.course === course) && (month === "TODOS" || item.returnDate.startsWith(month)) &&
    (outcome === "TODOS" || item.outcome === outcome) &&
    `${item.student} ${item.document} ${item.group}`.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => b.returnDate.localeCompare(a.returnDate)), [course, month, outcome, search]);
  const averageAttendance = filtered.length ? Math.round(filtered.reduce((sum, item) => sum + item.attendanceAfter, 0) / filtered.length) : 0;
  const reinserted = filtered.filter((item) => item.outcome === "REINSERTADO").length;
  const retained = filtered.filter((item) => item.outcome === "RETENIDO").length;

  return <>
    <header className="page-header"><div><span className="page-kicker">Resultados de permanencia</span><h1>Retención y reinserción</h1><p>Consulta a los estudiantes que lograron retornar al curso o sostener su continuidad después de una intervención.</p></div></header>
    <div className="feedback feedback-success retention-definition"><CheckCircle2 size={17}/><span>Esta sección muestra únicamente resultados confirmados. Los casos pendientes continúan gestionándose en <strong>Seguimiento de faltas</strong>.</span></div>
    <section className="metric-grid compact">
      <article className="metric-card"><div className="metric-head"><span>Resultados confirmados</span><UserCheck size={18}/></div><strong>{filtered.length}</strong><small>Según los filtros aplicados</small></article>
      <article className="metric-card"><div className="metric-head"><span>Reinsertados</span><RotateCcw size={18}/></div><strong>{reinserted}</strong><small>Retornaron después de faltar</small></article>
      <article className="metric-card"><div className="metric-head"><span>Retenidos</span><CheckCircle2 size={18}/></div><strong>{retained}</strong><small>Continuidad sostenida</small></article>
      <article className="metric-card"><div className="metric-head"><span>Asistencia posterior</span><TrendingUp size={18}/></div><strong>{averageAttendance}%</strong><small>Promedio tras la intervención</small></article>
    </section>
    <section className="panel retention-results">
      <header className="panel-header"><div><h2>Estudiantes recuperados</h2><p>Evidencia del retorno, la intervención aplicada y su asistencia posterior.</p></div></header>
      <div className="retention-toolbar">
        <label className="search-control"><Search size={17}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar estudiante o grupo"/></label>
        <select aria-label="Filtrar por curso" value={course} onChange={(event) => setCourse(event.target.value)}><option value="TODOS">Todos los cursos</option>{Array.from(new Set(recoveryRecords.map((item) => item.course))).map((item) => <option key={item}>{item}</option>)}</select>
        <select aria-label="Filtrar por mes de retorno" value={month} onChange={(event) => setMonth(event.target.value)}><option value="TODOS">Todos los meses</option><option value="2026-07">Julio 2026</option><option value="2026-06">Junio 2026</option></select>
        <select aria-label="Filtrar por resultado" value={outcome} onChange={(event) => setOutcome(event.target.value as "TODOS" | RecoveryRecord["outcome"])}><option value="TODOS">Todos los resultados</option><option value="REINSERTADO">Reinsertado</option><option value="RETENIDO">Retenido</option></select>
      </div>
      <div className="retention-card-grid">{filtered.map((item) => <article className="retention-card" key={item.id}>
        <div className="retention-card-top"><span className={`status-badge ${item.outcome === "REINSERTADO" ? "info" : "success"}`}>{item.outcome === "REINSERTADO" ? "Reinsertado" : "Retenido"}</span><small>{item.id}</small></div>
        <h3>{item.student}</h3><p>{item.course} · {item.group}</p>
        <dl><div><dt>Retorno confirmado</dt><dd>{displayDate(item.returnDate)} · {item.returnSession}</dd></div><div><dt>Intervención</dt><dd>{item.intervention}</dd></div><div><dt>Asistencia posterior</dt><dd><strong>{item.attendanceAfter}%</strong> en {item.sessionsAfter} sesiones</dd></div></dl>
        <div className="retention-progress"><span style={{ width: `${item.attendanceAfter}%` }}/></div>
        <button className="row-action" onClick={() => setSelected(item)}><Eye size={15}/>Ver recuperación</button>
      </article>)}</div>
      {!filtered.length && <div className="empty-state"><Filter size={26}/><strong>No hay resultados confirmados</strong><p>Modifica los filtros para consultar otro periodo o curso.</p></div>}
    </section>
    {selected && <div className="modal-backdrop"><section className="modal retention-modal" role="dialog" aria-modal="true" aria-labelledby="retention-title"><header><div><span className="page-kicker">{selected.id} · {selected.outcome === "REINSERTADO" ? "Reinserción confirmada" : "Retención confirmada"}</span><h2 id="retention-title">{selected.student}</h2><p>{selected.document} · {selected.course}</p></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Cerrar detalle"><X size={18}/></button></header>
      <div className="retention-detail-grid"><div><span>Riesgo detectado</span><strong>{selected.risk}</strong></div><div><span>Responsable</span><strong>{selected.responsible}</strong></div><div><span>Intervención realizada</span><strong>{selected.intervention}</strong></div><div><span>Retorno al curso</span><strong>{displayDate(selected.returnDate)} · {selected.returnSession}</strong></div><div><span>Seguimiento posterior</span><strong>{selected.sessionsAfter} sesiones · {selected.attendanceAfter}% de asistencia</strong></div><div><span>Evidencia</span><strong>{selected.evidence}</strong></div></div>
      <footer><button className="btn btn-primary" onClick={() => setSelected(null)}>Cerrar detalle</button></footer>
    </section></div>}
  </>;
}
