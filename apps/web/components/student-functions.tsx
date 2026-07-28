"use client";

import {
  Award,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  MapPin,
  Plus,
  Send,
  Video,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ForumExperience } from "./module-functions";
import { api } from "../lib/api";

const courses = ["Analítica de datos aplicada", "Estrategias de marketing digital"] as const;
type Course = typeof courses[number];

const learningCourses = [
  { id: "CUR-AD-2026-03", title: courses[0], description: "Transforma información en decisiones mediante una experiencia práctica y progresiva.", progress: 72, next: "Hoy · 18:00" },
  { id: "CUR-MK-2026-02", title: courses[1], description: "Diseña campañas integradas a partir de audiencias, canales y métricas.", progress: 61, next: "Martes · 19:00" },
] as const;
const learningItems = [
  { module: "Módulo 1 · Fundamentos", title: "1.1 Bienvenida y objetivos", type: "Video", time: 8, description: "Presentación del curso y resultados esperados.", content: "Recurso audiovisual introductorio con la guía de trabajo del curso." },
  { module: "Módulo 1 · Fundamentos", title: "1.2 Lectura: conceptos base", type: "Lectura", time: 15, description: "Conceptos esenciales para avanzar en la ruta.", content: "Lectura interactiva con ejemplos, conceptos clave y una actividad de comprobación." },
  { module: "Módulo 1 · Fundamentos", title: "Foro de presentación", type: "Foro", time: 10, description: "Comparte tu experiencia y expectativas.", content: "Responde la consigna y comenta el aporte de un compañero." },
  { module: "Módulo 1 · Fundamentos", title: "Evaluación diagnóstica", type: "Evaluación", time: 20, description: "Comprueba tus conocimientos iniciales.", content: "Cuestionario de 10 preguntas con un intento disponible." },
  { module: "Módulo 2 · Aplicación", title: "2.1 Caso aplicado", type: "Lectura", time: 25, description: "Aplica los conceptos en un escenario real.", content: "Caso guiado con datos, criterios y entregable final." },
];

export function StudentLearningPath() {
  const [selectedCourse, setSelectedCourse] = useState<typeof learningCourses[number] | null>(null);
  const [active, setActive] = useState(0);
  const [message, setMessage] = useState("");
  const item = learningItems[active]!;
  return <>
    <header className="page-header"><div><span className="page-kicker">Mi aprendizaje</span><h1>Ruta de aprendizaje</h1><p>Selecciona uno de tus cursos asignados para acceder a sus módulos, actividades y evaluaciones.</p></div></header>
    {message && <div className="feedback feedback-success"><CheckCircle2 size={16}/>{message}</div>}
    {!selectedCourse ? <section className="course-picker-grid" aria-label="Cursos asignados">
      {learningCourses.map((course) => <article className="panel course-picker-card" key={course.id}><div className="course-picker-top"><span className="record-code">{course.id}</span><span className="status-badge success">Activo</span></div><div className="course-picker-icon"><BookOpen size={24}/></div><h2>{course.title}</h2><p>{course.description}</p><div className="course-picker-meta"><span><b>Próxima sesión</b>{course.next}</span><span><b>Contenidos</b>{learningItems.length} publicados</span></div><div className="course-picker-progress"><span><b>Progreso de ruta</b><strong>{course.progress}%</strong></span><div><i style={{ width: `${course.progress}%` }}/></div></div><button data-testid={`open-course-${course.id}`} className="btn btn-primary" onClick={() => { setSelectedCourse(course); setActive(0); }}>Continuar ruta <ChevronRight size={17}/></button></article>)}
    </section> : <>
      <section className="panel learning-course-toolbar"><div><span>Curso seleccionado</span><strong>{selectedCourse.title}</strong></div><button className="btn btn-secondary" onClick={() => { setSelectedCourse(null); setMessage(""); }}>Cambiar curso</button></section>
      <section className="student-learning-page panel">
        <div className="learning-hero"><div><span>CURSO ACTIVO · {selectedCourse.id}</span><h2>{selectedCourse.title}</h2><p>{selectedCourse.description}</p></div><div className="learning-progress-ring"><strong>{active + 1}/{learningItems.length}</strong><span>contenidos</span></div></div>
        <div className="learning-experience"><aside><h3>Contenido del curso</h3>{["Módulo 1 · Fundamentos", "Módulo 2 · Aplicación"].map((module) => <div className="learning-module-list" key={module}><strong>{module}</strong>{learningItems.map((entry, index) => entry.module === module && <button className={index === active ? "is-active" : ""} onClick={() => setActive(index)} key={entry.title}><span>{index + 1}</span><div><b>{entry.title}</b><small>{entry.type} · {entry.time} min</small></div></button>)}</div>)}</aside>
          <div className="learning-main"><span className="learning-current-module">{item.module}</span><h2>{item.title}</h2><p className="learning-description">{item.description}</p><article className={`learning-content${item.type === "Foro" ? " learning-content-foro" : ""}`}><span className="learning-content-type">{item.type} · {item.time} min</span>{item.type === "Foro" ? <ForumExperience contenido={item.content} onPublish={() => setMessage("Tu participación fue registrada.")}/> : item.type === "Evaluación" ? <div className="assessment-preview"><FileText size={30}/><h3>Evaluación disponible</h3><p>{item.content}</p><button onClick={() => setMessage("Evaluación preparada para iniciar en modo demostración.")}>Comenzar evaluación</button></div> : <div className="video-placeholder"><BookOpen size={32}/><strong>{item.type === "Video" ? "Recurso audiovisual" : "Contenido interactivo"}</strong><span>{item.content}</span><button onClick={() => setMessage("Contenido abierto en modo demostración.")}>Abrir contenido</button></div>}</article><footer className="learning-navigation"><button disabled={active === 0} onClick={() => setActive((value) => value - 1)}><ChevronLeft size={17}/>Anterior</button><span>{active + 1} de {learningItems.length}</span><button disabled={active === learningItems.length - 1} onClick={() => setActive((value) => value + 1)}>Siguiente<ChevronRight size={17}/></button></footer></div>
        </div>
      </section>
    </>}
  </>;
}

type StudentEvent = {
  id: string;
  day: number;
  start: string;
  end: string;
  course: Course;
  type: "Sesión" | "Evaluación";
  mode: "Virtual" | "Presencial";
  location: string;
};

const studentEvents: StudentEvent[] = [
  { id: "SES-01", day: 0, start: "18:00", end: "19:30", course: courses[0], type: "Sesión", mode: "Virtual", location: "Sala virtual 03" },
  { id: "SES-02", day: 1, start: "19:00", end: "20:30", course: courses[1], type: "Sesión", mode: "Virtual", location: "Sala virtual 05" },
  { id: "SES-03", day: 2, start: "18:00", end: "19:30", course: courses[0], type: "Sesión", mode: "Virtual", location: "Sala virtual 03" },
  { id: "EVL-01", day: 3, start: "20:00", end: "21:00", course: courses[1], type: "Evaluación", mode: "Virtual", location: "Campus virtual" },
  { id: "SES-04", day: 4, start: "18:00", end: "19:30", course: courses[0], type: "Sesión", mode: "Presencial", location: "Laboratorio 2" },
];

const monthName = new Intl.DateTimeFormat("es-PE", { month: "long" });
const dayName = new Intl.DateTimeFormat("es-PE", { weekday: "short" });

export function StudentCalendar() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [view, setView] = useState<"SEMANA" | "DIA">("SEMANA");
  const [selectedDay, setSelectedDay] = useState(0);
  const [course, setCourse] = useState<"TODOS" | Course>("TODOS");
  const [selectedEvent, setSelectedEvent] = useState<StudentEvent | null>(null);
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
  const events = studentEvents.filter((event) => course === "TODOS" || event.course === course);

  return <>
    <header className="page-header"><div><span className="page-kicker">Gestión operativa</span><h1>Mi calendario</h1><p>Consulta las fechas, horarios y accesos de las sesiones de tus cursos.</p></div></header>
    {message && <div className="feedback feedback-success"><Check size={16}/>{message}</div>}
    <section className="metric-grid compact agenda-metrics">
      <article className="metric-card"><div className="metric-head"><span>Sesiones esta semana</span><CalendarDays size={16}/></div><strong>{studentEvents.filter((event) => event.type === "Sesión").length}</strong><small>En tus cursos activos</small></article>
      <article className="metric-card"><div className="metric-head"><span>Próxima sesión</span><Clock3 size={16}/></div><strong>18:00</strong><small>Hoy · Analítica de datos</small></article>
      <article className="metric-card"><div className="metric-head"><span>Evaluaciones</span><span className="metric-signal attention"/></div><strong>1</strong><small>Programada esta semana</small></article>
      <article className="metric-card"><div className="metric-head"><span>Cursos activos</span><span className="metric-signal positive"/></div><strong>2</strong><small>Periodo actual</small></article>
    </section>
    <section className="panel agenda-panel">
      <header className="agenda-toolbar">
        <div className="agenda-navigation">
          <button className="icon-button" onClick={() => setWeekOffset((value) => value - 1)} aria-label="Semana anterior"><ChevronLeft size={17}/></button>
          <button className="btn btn-secondary" onClick={() => setWeekOffset(0)}>Hoy</button>
          <button className="icon-button" onClick={() => setWeekOffset((value) => value + 1)} aria-label="Semana siguiente"><ChevronRight size={17}/></button>
          <div><strong>{weekStart.getDate()} – {days[4]!.getDate()} de {monthName.format(days[4]!)}</strong><small>Semana académica</small></div>
        </div>
        <div className="agenda-controls">
          <select aria-label="Filtrar calendario por curso" value={course} onChange={(event) => setCourse(event.target.value as typeof course)}><option value="TODOS">Todos mis cursos</option>{courses.map((item) => <option key={item}>{item}</option>)}</select>
          <div className="segmented-control"><button className={view === "SEMANA" ? "is-active" : ""} onClick={() => setView("SEMANA")}>Semana</button><button className={view === "DIA" ? "is-active" : ""} onClick={() => setView("DIA")}>Día</button></div>
        </div>
      </header>
      <div className={`agenda-calendar ${view === "DIA" ? "day-view" : ""}`}>
        <div className="agenda-time-head"/>
        {visibleDays.map((date) => <button className="agenda-day-head" onClick={() => { setSelectedDay(days.indexOf(date)); setView("DIA"); }} key={date.toISOString()}><span>{dayName.format(date)}</span><strong>{date.getDate()}</strong></button>)}
        {["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"].map((time, row) => <div className="agenda-row" key={time} style={{ gridColumn: `1 / ${visibleDays.length + 2}`, gridRow: row + 2 }}><span>{time}</span>{visibleDays.map((date) => <i key={date.toISOString()}/>)}</div>)}
        {events.map((event) => {
          const dayIndex = view === "DIA" ? (event.day === selectedDay ? 0 : -1) : event.day;
          if (dayIndex < 0) return null;
          const row = Math.max(1, Math.floor((Number(event.start.slice(0, 2)) - 8) / 2) + 1);
          return <button data-testid={`student-event-${event.id}`} className={`agenda-event ${event.type === "Evaluación" ? "pendiente" : "confirmada"}`} style={{ gridColumn: dayIndex + 2, gridRow: row + 1 }} onClick={() => setSelectedEvent(event)} key={event.id}><span>{event.start} – {event.end}</span><strong>{event.course}</strong><small>{event.type} · {event.mode}</small></button>;
        })}
      </div>
      <footer className="agenda-legend"><span><i className="confirmed"/>Sesión</span><span><i className="pending"/>Evaluación</span><small>Selecciona un evento para consultar todos sus detalles.</small></footer>
    </section>
    {selectedEvent && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="student-event-title"><header><div><span className="page-kicker">{selectedEvent.type}</span><h2 id="student-event-title">{selectedEvent.course}</h2><p>{selectedEvent.start} – {selectedEvent.end}</p></div><button className="icon-button" onClick={() => setSelectedEvent(null)} aria-label="Cerrar detalle"><X size={18}/></button></header><div className="agenda-event-detail"><div><Clock3 size={17}/><span><small>Horario</small><strong>{selectedEvent.start} – {selectedEvent.end}</strong></span></div><div><MapPin size={17}/><span><small>Modalidad y ubicación</small><strong>{selectedEvent.mode} · {selectedEvent.location}</strong></span></div><div><Video size={17}/><span><small>Acceso</small><strong>{selectedEvent.mode === "Virtual" ? "Disponible 10 minutos antes" : "Asistencia presencial"}</strong></span></div></div><footer className="modal-actions"><button className="btn btn-secondary" onClick={() => setSelectedEvent(null)}>Cerrar</button>{selectedEvent.mode === "Virtual" && <button className="btn btn-primary" onClick={() => { setMessage("Acceso a la sala preparado en modo demostración."); setSelectedEvent(null); }}><Video size={16}/>Abrir sala</button>}</footer></section></div>}
  </>;
}

type StudentAttendanceCourse={id:string;name:string;progress:number};
type StudentAttendanceSession={
  id:string;title:string;startsAt:string|null;endsAt:string|null;groupCode:string;courseId:string;courseName:string;
  window:{status:"NOT_OPEN"|"OPEN"|"CLOSED"|"VALIDATED";openedAt:string|null;closesAt:string|null;validatedAt:string|null;durationMinutes:number};
  mark:{status:string;markedAt:string|null;validationStatus:string;observation:string}|null;
};
type StudentAttendanceResponse={courses:StudentAttendanceCourse[];sessions:StudentAttendanceSession[]};

function studentAttendanceDate(value:string|null){
  return value?new Intl.DateTimeFormat("es-PE",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value)):"Sin fecha";
}

function studentAttendanceCountdown(value:string|null,now:number){
  if(!value)return"";
  const seconds=Math.max(0,Math.ceil((new Date(value).getTime()-now)/1000));
  return `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`;
}

export function StudentAttendance() {
  const [data,setData]=useState<StudentAttendanceResponse>({courses:[],sessions:[]});
  const [courseId,setCourseId]=useState("");
  const [status,setStatus]=useState("TODOS");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [now,setNow]=useState(Date.now());
  async function loadAttendance(silent=false){
    if(!silent)setLoading(true);
    try{
      const response=await api<StudentAttendanceResponse>("/academico/attendance/student");
      setData(response);setCourseId((current)=>current||response.courses[0]?.id||"");setError("");
    }catch(reason){setError(reason instanceof Error?reason.message:"No se pudo cargar tu asistencia");}
    finally{if(!silent)setLoading(false);}
  }
  useEffect(()=>{void loadAttendance();const polling=window.setInterval(()=>void loadAttendance(true),15000);return()=>window.clearInterval(polling);},[]);
  useEffect(()=>{const ticker=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(ticker);},[]);
  const course=data.courses.find((item)=>item.id===courseId);
  const sessions=data.sessions.filter((item)=>item.courseId===courseId);
  const sessionState=(session:StudentAttendanceSession)=>session.window.status==="OPEN"&&session.window.closesAt&&new Date(session.window.closesAt).getTime()<=now?"CLOSED":session.window.status;
  const openSession=sessions.find((session)=>sessionState(session)==="OPEN"&&!session.mark);
  const visible=sessions.filter((session)=>status==="TODOS"||(session.mark?.status??(sessionState(session)==="CLOSED"?"FALTA":"PENDIENTE"))===status);
  const validated=sessions.filter((session)=>session.mark?.validationStatus==="VALIDATED");
  const present=validated.filter((session)=>session.mark?.status==="PRESENTE").length;
  const late=validated.filter((session)=>session.mark?.status==="TARDANZA").length;
  const absent=validated.filter((session)=>session.mark?.status==="FALTA").length;
  const attendance=validated.length?Math.round(((present+late)/validated.length)*100):0;
  async function checkIn(){
    if(!openSession)return;
    setBusy(true);setMessage("");setError("");
    try{
      await api(`/academico/attendance/sessions/${openSession.id}/check-in`,{method:"POST"});
      setMessage("Tu asistencia fue registrada y quedó pendiente de validación docente.");
      await loadAttendance(true);
    }catch(reason){setError(reason instanceof Error?reason.message:"No se pudo registrar tu asistencia");}
    finally{setBusy(false);}
  }
  return <>
    <header className="page-header"><div><span className="page-kicker">Seguimiento académico</span><h1>Mis asistencias</h1><p>Marca tu asistencia durante la ventana habilitada por el docente y consulta su validación.</p></div></header>
    {message&&<div className="feedback feedback-success"><CheckCircle2 size={16}/>{message}</div>}
    {error&&<div className="feedback feedback-error">{error}</div>}
    <section className="panel student-filter-panel"><label className="form-field"><span>Curso asignado</span><select aria-label="Curso de asistencia" disabled={loading} value={courseId} onChange={(event)=>{setCourseId(event.target.value);setMessage("");}}><option value="">{loading?"Cargando cursos...":"Selecciona un curso"}</option>{data.courses.map((item)=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label><div><strong>{attendance}% de asistencia</strong><span>Meta mínima: 80%</span></div></section>
    <section className={`panel student-checkin-card ${openSession?"is-open":""}`}>
      <div className="student-checkin-icon">{openSession?<Clock3 size={27}/>:<CheckCircle2 size={27}/>}</div>
      <div><span className="page-kicker">Marcación personal</span><h2>{openSession?"Asistencia habilitada":"No hay una marcación abierta"}</h2><p>{openSession?`${openSession.title} · ${openSession.groupCode}. Tienes ${studentAttendanceCountdown(openSession.window.closesAt,now)} para registrar tu presencia.`:"Cuando el docente habilite una sesión de este curso, aparecerá aquí el botón para marcar. La pantalla se actualiza automáticamente."}</p>{openSession&&<small>La marca es personal, única y quedará pendiente de validación docente.</small>}</div>
      <div className="student-checkin-action">{openSession?<><strong>{studentAttendanceCountdown(openSession.window.closesAt,now)}</strong><button className="btn btn-primary" disabled={busy} onClick={checkIn}><Check size={16}/>{busy?"Registrando...":"Marcar mi asistencia"}</button></>:<span className="status-badge info">En espera del docente</span>}</div>
    </section>
    <section className="metric-grid compact"><article className="metric-card"><div className="metric-head"><span>Asistencia</span></div><strong>{attendance}%</strong><small>Registros validados</small></article><article className="metric-card"><div className="metric-head"><span>Presentes</span></div><strong>{present}</strong><small>Sesiones validadas</small></article><article className="metric-card"><div className="metric-head"><span>Faltas</span></div><strong>{absent}</strong><small>Revisa tus justificaciones</small></article><article className="metric-card"><div className="metric-head"><span>Tardanzas</span></div><strong>{late}</strong><small>Periodo actual</small></article></section>
    <section className="student-two-columns">
      <article className="panel comparison-card"><header className="panel-header"><div><h2>Avance del curso vs. asistencia</h2><p>{course?.name??"Curso seleccionado"}</p></div></header><div className="comparison-bars"><div><span><strong>Avance académico</strong><b>{course?.progress??0}%</b></span><div><i style={{width:`${course?.progress??0}%`}}/></div></div><div><span><strong>Asistencia acumulada</strong><b>{attendance}%</b></span><div><i className="green" style={{width:`${attendance}%`}}/></div></div></div><p className="comparison-insight">{attendance>=80?"Cumples el requisito mínimo de asistencia.":"Tu asistencia está por debajo del mínimo requerido para certificarte."}</p></article>
      <article className="panel attendance-summary"><header className="panel-header"><div><h2>Resumen académico</h2><p>Relación entre participación y avance.</p></div></header><strong>{Math.round((attendance+(course?.progress??0))/2)}%</strong><span>Índice integral del curso</span><small>Combina asistencia y progreso LMS.</small></article>
    </section>
    <section className="panel table-panel"><div className="table-toolbar"><div><h2>Historial de sesiones</h2><p>{visible.length} sesiones del curso seleccionado</p></div><select aria-label="Filtrar historial por estado" value={status} onChange={(event)=>setStatus(event.target.value)}><option value="TODOS">Todos los estados</option><option value="PRESENTE">Presente</option><option value="TARDANZA">Tardanza</option><option value="FALTA">Falta</option><option value="PENDIENTE">Pendiente</option></select></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Fecha y hora</th><th>Sesión</th><th>Estado</th><th>Registro</th><th>Validación</th></tr></thead><tbody>{visible.map((session)=>{const markStatus=session.mark?.status??(sessionState(session)==="CLOSED"?"FALTA":"PENDIENTE");return <tr key={session.id}><td>{studentAttendanceDate(session.startsAt)}</td><td><strong>{session.title}</strong><small className="table-subline">{session.groupCode}</small></td><td><span className={`status-badge ${markStatus==="PRESENTE"?"success":markStatus==="FALTA"?"danger":markStatus==="PENDIENTE"?"info":"warning"}`}>{markStatus==="PENDIENTE"?"Pendiente":markStatus.toLowerCase()}</span></td><td>{session.mark?.markedAt?studentAttendanceDate(session.mark.markedAt):"—"}</td><td>{session.mark?.validationStatus==="VALIDATED"?<span className="status-badge success">Validada</span>:session.mark?<span className="status-badge warning">Por validar</span>:<span className="status-badge info">{session.window.status==="NOT_OPEN"?"No habilitada":"Sin marca"}</span>}</td></tr>;})}{!loading&&visible.length===0&&<tr><td colSpan={5}><div className="empty-table-state">No hay sesiones para mostrar.</div></td></tr>}</tbody></table></div></section>
  </>;
}

type Grade = { title: string; type: string; date: string; score: number | null; status: "Aprobada" | "Pendiente" | "Por calificar"; feedback: string; criteria: Array<[string, string]> };
const gradeData: Record<Course, Grade[]> = {
  "Analítica de datos aplicada": [
    { title: "Evaluación diagnóstica", type: "Cuestionario", date: "08/07/2026", score: 18, status: "Aprobada", feedback: "Buen dominio de conceptos base. Refuerza la selección de fuentes.", criteria: [["Conceptos", "9/10"], ["Aplicación", "9/10"]] },
    { title: "Caso práctico de limpieza", type: "Caso práctico", date: "18/07/2026", score: 16.5, status: "Aprobada", feedback: "Proceso correcto; documenta mejor los supuestos.", criteria: [["Procedimiento", "8/10"], ["Sustento", "8.5/10"]] },
    { title: "Proyecto parcial", type: "Proyecto", date: "30/07/2026", score: null, status: "Pendiente", feedback: "Aún no presentado.", criteria: [] },
  ],
  "Estrategias de marketing digital": [
    { title: "Mapa de audiencias", type: "Tarea", date: "10/07/2026", score: 17, status: "Aprobada", feedback: "Segmentación coherente y bien sustentada.", criteria: [["Análisis", "8/10"], ["Propuesta", "9/10"]] },
    { title: "Evaluación de canales", type: "Cuestionario", date: "29/07/2026", score: null, status: "Pendiente", feedback: "Disponible desde el 27 de julio.", criteria: [] },
    { title: "Campaña integrada", type: "Proyecto", date: "22/07/2026", score: null, status: "Por calificar", feedback: "Entrega recibida. El docente publicará el resultado.", criteria: [] },
  ],
};

export function StudentGrades() {
  const [course, setCourse] = useState<Course>(courses[0]);
  const [selected, setSelected] = useState<Grade | null>(null);
  const [message, setMessage] = useState("");
  const grades = gradeData[course];
  const scored = grades.filter((item) => item.score !== null);
  const average = scored.length ? (scored.reduce((sum, item) => sum + item.score!, 0) / scored.length).toFixed(1) : "—";
  return <>
    <header className="page-header"><div><span className="page-kicker">Resultados académicos</span><h1>Mis notas</h1><p>Consulta evaluaciones, intentos, criterios y retroalimentación docente por curso.</p></div></header>
    {message && <div className="feedback feedback-success"><CheckCircle2 size={16}/>{message}</div>}
    <section className="panel student-filter-panel"><label className="form-field"><span>Curso asignado</span><select aria-label="Curso de notas" value={course} onChange={(event) => { setCourse(event.target.value as Course); setMessage(""); }}>{courses.map((item) => <option key={item}>{item}</option>)}</select></label><div><strong>Escala vigesimal</strong><span>Nota mínima aprobatoria: 13</span></div></section>
    <section className="metric-grid compact"><article className="metric-card"><div className="metric-head"><span>Promedio</span></div><strong>{average}</strong><small>Sobre 20</small></article><article className="metric-card"><div className="metric-head"><span>Aprobadas</span></div><strong>{grades.filter((item) => item.status === "Aprobada").length}</strong><small>Evaluaciones</small></article><article className="metric-card"><div className="metric-head"><span>Pendientes</span></div><strong>{grades.filter((item) => item.status === "Pendiente").length}</strong><small>Requieren acción</small></article><article className="metric-card"><div className="metric-head"><span>Nota más alta</span></div><strong>{scored.length ? Math.max(...scored.map((item) => item.score!)) : "—"}</strong><small>Resultado publicado</small></article></section>
    <section className="panel table-panel"><div className="panel-header"><div><h2>Evaluaciones del curso</h2><p>Resultados, estados y fechas de entrega.</p></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Evaluación</th><th>Tipo</th><th>Fecha</th><th>Estado</th><th>Nota</th><th className="align-right">Acción</th></tr></thead><tbody>{grades.map((item) => <tr key={item.title}><td><strong>{item.title}</strong></td><td>{item.type}</td><td>{item.date}</td><td><span className={`status-badge ${item.status === "Aprobada" ? "success" : item.status === "Pendiente" ? "warning" : "info"}`}>{item.status}</span></td><td><span className="grade-score">{item.score ?? "—"}</span></td><td className="align-right"><button className="row-action" onClick={() => setSelected(item)}>{item.status === "Pendiente" ? "Ver evaluación" : "Ver detalle"}</button></td></tr>)}</tbody></table></div></section>
    {selected && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="grade-title"><header><div><span className="page-kicker">{selected.type}</span><h2 id="grade-title">{selected.title}</h2><p>{course}</p></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Cerrar detalle"><X size={18}/></button></header><div className="grade-detail"><div className="grade-hero"><span>Resultado</span><strong>{selected.score ?? "Pendiente"}</strong><small>{selected.score !== null ? "Sobre 20" : `Fecha límite: ${selected.date}`}</small></div><div><h3>Retroalimentación docente</h3><p>{selected.feedback}</p>{selected.criteria.length > 0 && <div className="rubric-list">{selected.criteria.map(([label, value]) => <span key={label}><b>{label}</b><strong>{value}</strong></span>)}</div>}</div></div><footer className="modal-actions"><button className="btn btn-secondary" onClick={() => setSelected(null)}>Cerrar</button>{selected.status === "Pendiente" && <button className="btn btn-primary" onClick={() => { setMessage(`Evaluación “${selected.title}” preparada para iniciar en modo demostración.`); setSelected(null); }}><FileText size={16}/>Iniciar evaluación</button>}</footer></section></div>}
  </>;
}

type Certificate = { course: string; code: string; date: string; status: "Disponible" | "En progreso"; progress: number };
const initialCertificates: Certificate[] = [
  { course: "Fundamentos de gestión", code: "SIGA-CER-2026-00184", date: "12/05/2026", status: "Disponible", progress: 100 },
  { course: "Introducción al marketing", code: "SIGA-CER-2026-00231", date: "30/06/2026", status: "Disponible", progress: 100 },
  { course: "Analítica de datos aplicada", code: "Pendiente de emisión", date: "Finaliza 07/08/2026", status: "En progreso", progress: 72 },
];

export function StudentCertificates() {
  const [selected, setSelected] = useState<Certificate | null>(null);
  const [message, setMessage] = useState("");
  return <>
    <header className="page-header"><div><span className="page-kicker">Acreditación académica</span><h1>Mis certificados</h1><p>Descarga certificados emitidos y revisa tu elegibilidad para los próximos.</p></div></header>
    {message && <div className="feedback feedback-success"><CheckCircle2 size={16}/>{message}</div>}
    <section className="metric-grid compact"><article className="metric-card"><div className="metric-head"><span>Disponibles</span><Award size={16}/></div><strong>2</strong><small>Certificados emitidos</small></article><article className="metric-card"><div className="metric-head"><span>En progreso</span></div><strong>1</strong><small>Curso activo</small></article><article className="metric-card"><div className="metric-head"><span>Validados</span></div><strong>2</strong><small>Sin observaciones</small></article></section>
    <section className="certificate-grid">{initialCertificates.map((item) => <article className="panel certificate-card" key={item.course}><div className="certificate-icon"><Award size={25}/></div><div><span className={`status-badge ${item.status === "Disponible" ? "success" : "warning"}`}>{item.status}</span><h2>{item.course}</h2><p>{item.code}</p><small>{item.date}</small>{item.status === "En progreso" && <div className="certificate-progress"><span><b>Elegibilidad</b><strong>{item.progress}%</strong></span><div><i style={{ width: `${item.progress}%` }}/></div></div>}</div><footer>{item.status === "Disponible" ? <><button className="btn btn-secondary" onClick={() => setSelected(item)}>Verificar</button><button className="btn btn-primary" onClick={() => setMessage(`Descarga de “${item.course}” preparada en modo demostración.`)}><Download size={16}/>Descargar</button></> : <button className="btn btn-secondary" onClick={() => setSelected(item)}>Ver requisitos</button>}</footer></article>)}</section>
    {selected && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="certificate-title"><header><div><span className="page-kicker">Certificado</span><h2 id="certificate-title">{selected.course}</h2><p>{selected.status}</p></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Cerrar certificado"><X size={18}/></button></header><div className="certificate-verification"><Award size={42}/>{selected.status === "Disponible" ? <><strong>Certificado válido</strong><p>Código único: {selected.code}</p><p>Fecha de emisión: {selected.date}</p><span className="status-badge success">Identidad y emisión verificadas</span></> : <><strong>Elegibilidad en progreso</strong><p>Avance del curso: {selected.progress}%</p><p>Requisitos: 80% de asistencia, nota mínima 13 y ruta completa.</p></>}</div><footer className="modal-actions"><button className="btn btn-primary" onClick={() => setSelected(null)}>Entendido</button></footer></section></div>}
  </>;
}

type RequestItem = { id: string; type: string; course: string; subject: string; date: string; status: "En atención" | "Resuelta" | "Recibida"; detail: string };
const initialRequests: RequestItem[] = [
  { id: "SOL-2026-0184", type: "Justificación de falta", course: courses[1], subject: "Inasistencia del 9 de julio", date: "10/07/2026", status: "En atención", detail: "La solicitud fue derivada a Gestión al estudiante para validar el sustento." },
  { id: "SOL-2026-0142", type: "Consulta académica", course: courses[0], subject: "Revisión de nota", date: "02/07/2026", status: "Resuelta", detail: "El docente revisó el intento y confirmó la calificación publicada." },
];

export function StudentRequests() {
  const [requests, setRequests] = useState(initialRequests);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const [message, setMessage] = useState("");
  function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const item: RequestItem = { id: `SOL-2026-${String(requests.length + 185).padStart(4, "0")}`, type: String(data.get("type")), course: String(data.get("course")), subject: String(data.get("subject")), date: "26/07/2026", status: "Recibida", detail: String(data.get("detail")) };
    setRequests((current) => [item, ...current]);
    setFormOpen(false);
    setMessage(`Solicitud ${item.id} registrada correctamente.`);
  }
  return <>
    <header className="page-header"><div><span className="page-kicker">Atención al estudiante</span><h1>Mis solicitudes</h1><p>Registra consultas académicas, justificaciones y requerimientos, y consulta su trazabilidad.</p></div><button className="btn btn-primary" onClick={() => setFormOpen(true)}><Plus size={17}/>Nueva solicitud</button></header>
    {message && <div className="feedback feedback-success"><CheckCircle2 size={16}/>{message}</div>}
    <section className="metric-grid compact"><article className="metric-card"><div className="metric-head"><span>Abiertas</span></div><strong>{requests.filter((item) => item.status !== "Resuelta").length}</strong><small>En seguimiento</small></article><article className="metric-card"><div className="metric-head"><span>Resueltas</span></div><strong>{requests.filter((item) => item.status === "Resuelta").length}</strong><small>Historial</small></article><article className="metric-card"><div className="metric-head"><span>Tiempo medio</span></div><strong>8 h</strong><small>Primera respuesta</small></article></section>
    <section className="panel table-panel"><div className="panel-header"><div><h2>Historial de solicitudes</h2><p>Seguimiento completo de tus requerimientos.</p></div></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Código</th><th>Tipo y asunto</th><th>Curso</th><th>Fecha</th><th>Estado</th><th className="align-right">Acción</th></tr></thead><tbody>{requests.map((item) => <tr key={item.id}><td><span className="record-code">{item.id}</span></td><td><strong>{item.type}</strong><small className="table-subtitle">{item.subject}</small></td><td>{item.course}</td><td>{item.date}</td><td><span className={`status-badge ${item.status === "Resuelta" ? "success" : item.status === "Recibida" ? "info" : "warning"}`}>{item.status}</span></td><td className="align-right"><button className="row-action" onClick={() => setSelected(item)}>Ver detalle</button></td></tr>)}</tbody></table></div></section>
    {formOpen && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="request-title"><header><div><span className="page-kicker">Nueva solicitud</span><h2 id="request-title">Registrar requerimiento</h2><p>Completa los datos para iniciar el seguimiento.</p></div><button className="icon-button" onClick={() => setFormOpen(false)} aria-label="Cerrar solicitud"><X size={18}/></button></header><form onSubmit={submitRequest}><div className="form-row"><label className="form-field"><span>Tipo</span><select name="type" required><option>Consulta académica</option><option>Justificación de falta</option><option>Problema con la plataforma</option><option>Solicitud de certificado</option></select></label><label className="form-field"><span>Curso</span><select name="course" required>{courses.map((item) => <option key={item}>{item}</option>)}</select></label></div><label className="form-field"><span>Asunto</span><input name="subject" required placeholder="Resume tu solicitud"/></label><label className="form-field"><span>Detalle</span><textarea name="detail" required rows={5} placeholder="Describe el caso y la solución que necesitas"/></label><footer><button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>Cancelar</button><button className="btn btn-primary" type="submit"><Send size={16}/>Enviar solicitud</button></footer></form></section></div>}
    {selected && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="request-detail-title"><header><div><span className="page-kicker">{selected.id}</span><h2 id="request-detail-title">{selected.subject}</h2><p>{selected.type}</p></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Cerrar detalle"><X size={18}/></button></header><div className="request-detail"><span className={`status-badge ${selected.status === "Resuelta" ? "success" : "warning"}`}>{selected.status}</span><h3>Última actualización</h3><p>{selected.detail}</p><div className="request-timeline"><span><i/><b>{selected.date}</b> Solicitud registrada</span><span><i/><b>Última actualización</b> {selected.status === "Resuelta" ? "Respuesta publicada y caso cerrado" : "Revisión académica en curso"}</span></div></div><footer className="modal-actions"><button className="btn btn-primary" onClick={() => setSelected(null)}>Cerrar</button></footer></section></div>}
  </>;
}
