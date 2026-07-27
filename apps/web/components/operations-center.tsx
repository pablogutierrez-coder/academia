"use client";

import * as XLSX from "xlsx";
import { AlertTriangle, CheckCircle2, Clock3, Download, FileSpreadsheet, GraduationCap, MessageSquare, Search, TicketCheck, UserRound, UsersRound, X } from "lucide-react";
import { useMemo, useState } from "react";

type TicketStatus = "NUEVO" | "EN_PROCESO" | "EN_ESPERA" | "RESUELTO" | "CERRADO";
type TicketPriority = "CRÍTICA" | "ALTA" | "MEDIA" | "BAJA";
type TicketComment = { id: string; author: string; date: string; message: string; internal: boolean };
type SupportTicket = {
  id: string; subject: string; description: string; origin: "Docente" | "Estudiante"; reporter: string;
  course: string; category: string; priority: TicketPriority; status: TicketStatus; responsible: string;
  createdAt: string; sla: string; comments: TicketComment[];
};

const initialTickets: SupportTicket[] = [
  { id: "INC-2026-0142", subject: "No puedo registrar asistencia de la sesión 4", description: "La sesión aparece bloqueada aunque se encuentra dentro del horario permitido.", origin: "Docente", reporter: "Oscar Vildoso García", course: "Analítica de datos aplicada", category: "Asistencia", priority: "ALTA", status: "NUEVO", responsible: "Mesa académica", createdAt: "26/07/2026 08:42", sla: "1 h 18 min", comments: [{ id: "C-01", author: "Oscar Vildoso García", date: "26/07/2026 08:42", message: "Adjunto captura del bloqueo mostrado al ingresar.", internal: false }] },
  { id: "INC-2026-0141", subject: "Nota de evaluación no actualizada", description: "Completé la evaluación diagnóstica, pero aún figura como pendiente en Mis notas.", origin: "Estudiante", reporter: "Mariana Torres López", course: "Analítica de datos aplicada", category: "Evaluaciones y notas", priority: "MEDIA", status: "EN_PROCESO", responsible: "Elena Campos", createdAt: "25/07/2026 19:15", sla: "4 h 30 min", comments: [{ id: "C-02", author: "Elena Campos", date: "26/07/2026 09:10", message: "Se está validando la sincronización del intento con el libro de notas.", internal: false }] },
  { id: "INC-2026-0138", subject: "Enlace de clase virtual incorrecto", description: "El enlace publicado corresponde a una sesión anterior.", origin: "Estudiante", reporter: "Luis Mendoza Ruiz", course: "Estrategias de marketing digital", category: "Acceso a clase", priority: "CRÍTICA", status: "EN_ESPERA", responsible: "Javier Ponce", createdAt: "25/07/2026 16:20", sla: "Vencido 2 h", comments: [{ id: "C-03", author: "Javier Ponce", date: "25/07/2026 17:05", message: "Solicitamos al docente el enlace actualizado.", internal: false }, { id: "C-04", author: "Mesa académica", date: "25/07/2026 17:20", message: "Pendiente confirmación del responsable del curso.", internal: true }] },
  { id: "INC-2026-0135", subject: "Solicitud de reapertura de evaluación", description: "El estudiante tuvo una incidencia de conectividad durante su único intento.", origin: "Docente", reporter: "Claudia Rivas Soto", course: "Estrategias de marketing digital", category: "Evaluaciones y notas", priority: "ALTA", status: "RESUELTO", responsible: "María Costa", createdAt: "24/07/2026 12:10", sla: "Atendido en 3 h", comments: [{ id: "C-05", author: "María Costa", date: "24/07/2026 15:02", message: "Evaluación reabierta por un intento adicional hasta el 25/07.", internal: false }] },
  { id: "INC-2026-0129", subject: "Certificado sin segundo apellido", description: "Solicito corregir mi nombre antes de emitir nuevamente el certificado.", origin: "Estudiante", reporter: "Rosa Medina Castro", course: "Fundamentos de gestión empresarial", category: "Certificados", priority: "BAJA", status: "CERRADO", responsible: "Mesa académica", createdAt: "22/07/2026 10:05", sla: "Atendido en 6 h", comments: [{ id: "C-06", author: "Mesa académica", date: "22/07/2026 16:01", message: "Datos corregidos y certificado emitido nuevamente.", internal: false }] },
];

const statusLabels: Record<TicketStatus, string> = { NUEVO: "Nuevo", EN_PROCESO: "En proceso", EN_ESPERA: "En espera", RESUELTO: "Resuelto", CERRADO: "Cerrado" };
const statusClasses: Record<TicketStatus, string> = { NUEVO: "info", EN_PROCESO: "warning", EN_ESPERA: "danger", RESUELTO: "success", CERRADO: "neutral" };
const priorityClasses: Record<TicketPriority, string> = { CRÍTICA: "critical", ALTA: "high", MEDIA: "medium", BAJA: "low" };

export function TicketCenter() {
  const [tickets, setTickets] = useState(initialTickets);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"TODOS" | TicketStatus>("TODOS");
  const [origin, setOrigin] = useState("TODOS");
  const [priority, setPriority] = useState("TODAS");
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [message, setMessage] = useState("");
  const visible = useMemo(() => tickets.filter((item) =>
    `${item.id} ${item.subject} ${item.reporter} ${item.course}`.toLowerCase().includes(search.toLowerCase()) &&
    (status === "TODOS" || item.status === status) &&
    (origin === "TODOS" || item.origin === origin) &&
    (priority === "TODAS" || item.priority === priority)
  ), [origin, priority, search, status, tickets]);

  function updateTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const comment = String(form.get("comment")).trim();
    const updated: SupportTicket = {
      ...selected,
      status: String(form.get("status")) as TicketStatus,
      priority: String(form.get("priority")) as TicketPriority,
      responsible: String(form.get("responsible")),
      comments: comment ? [...selected.comments, { id: `C-${Date.now()}`, author: "Administración SIGA", date: "26/07/2026 12:30", message: comment, internal: form.get("internal") === "on" }] : selected.comments,
    };
    setTickets((current) => current.map((item) => item.id === updated.id ? updated : item));
    setSelected(updated);
    setMessage(`${updated.id} actualizado a “${statusLabels[updated.status]}”.`);
    event.currentTarget.reset();
  }

  return <>
    <header className="page-header"><div><span className="page-kicker">Mesa de ayuda académica</span><h1>Incidencias y tickets</h1><p>Centraliza los casos generados por docentes y estudiantes, con trazabilidad, responsables y SLA.</p></div></header>
    {message && <div className="feedback feedback-success"><CheckCircle2 size={16}/>{message}</div>}
    <section className="metric-grid compact">
      <article className="metric-card"><div className="metric-head"><span>Tickets abiertos</span><TicketCheck size={17}/></div><strong>{tickets.filter((item) => !["RESUELTO", "CERRADO"].includes(item.status)).length}</strong><small>Requieren gestión</small></article>
      <article className="metric-card"><div className="metric-head"><span>Nuevos</span><MessageSquare size={17}/></div><strong>{tickets.filter((item) => item.status === "NUEVO").length}</strong><small>Sin primera respuesta</small></article>
      <article className="metric-card"><div className="metric-head"><span>Prioridad alta</span><AlertTriangle size={17}/></div><strong>{tickets.filter((item) => ["CRÍTICA", "ALTA"].includes(item.priority) && !["RESUELTO", "CERRADO"].includes(item.status)).length}</strong><small>Atención inmediata</small></article>
      <article className="metric-card"><div className="metric-head"><span>SLA vencido</span><Clock3 size={17}/></div><strong>{tickets.filter((item) => item.sla.startsWith("Vencido")).length}</strong><small>Escalamiento requerido</small></article>
    </section>
    <section className="panel ticket-workspace">
      <div className="ticket-filters"><label className="search-control"><Search size={17}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar ticket, persona o curso"/></label><select value={status} onChange={(event) => setStatus(event.target.value as "TODOS" | TicketStatus)}><option value="TODOS">Todos los estados</option>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><select value={origin} onChange={(event) => setOrigin(event.target.value)}><option value="TODOS">Todos los orígenes</option><option>Docente</option><option>Estudiante</option></select><select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="TODAS">Todas las prioridades</option><option>CRÍTICA</option><option>ALTA</option><option>MEDIA</option><option>BAJA</option></select><span>{visible.length} tickets</span></div>
      <div className="ticket-board">
        <aside className="ticket-list">{visible.map((item) => <button className={`ticket-list-item ${selected?.id === item.id ? "is-active" : ""}`} onClick={() => setSelected(item)} key={item.id}><div><span className={`ticket-priority ${priorityClasses[item.priority]}`}>{item.priority}</span><small>{item.id}</small></div><strong>{item.subject}</strong><p>{item.reporter} · {item.origin}</p><footer><span className={`status-badge ${statusClasses[item.status]}`}>{statusLabels[item.status]}</span><small className={item.sla.startsWith("Vencido") ? "sla-overdue" : ""}>{item.sla}</small></footer></button>)}{!visible.length && <div className="empty-state"><TicketCheck size={25}/><strong>No hay tickets</strong><p>Modifica los filtros de búsqueda.</p></div>}</aside>
        <div className="ticket-empty-panel"><TicketCheck size={34}/><h2>Selecciona un ticket</h2><p>Consulta la conversación, cambia el estado y registra comentarios.</p></div>
      </div>
    </section>
    {selected && <div className="modal-backdrop"><section className="modal ticket-modal" role="dialog" aria-modal="true" aria-labelledby="ticket-title"><header><div><span className="page-kicker">{selected.id} · {selected.origin}</span><h2 id="ticket-title">{selected.subject}</h2><p>{selected.reporter} · {selected.course}</p></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Cerrar ticket"><X size={18}/></button></header><div className="ticket-modal-body">
      <section className="ticket-summary"><div><span className={`ticket-priority ${priorityClasses[selected.priority]}`}>{selected.priority}</span><span className={`status-badge ${statusClasses[selected.status]}`}>{statusLabels[selected.status]}</span></div><p>{selected.description}</p><dl><div><dt>Categoría</dt><dd>{selected.category}</dd></div><div><dt>Responsable</dt><dd>{selected.responsible}</dd></div><div><dt>Creado</dt><dd>{selected.createdAt}</dd></div><div><dt>SLA</dt><dd className={selected.sla.startsWith("Vencido") ? "sla-overdue" : ""}>{selected.sla}</dd></div></dl></section>
      <section className="ticket-conversation"><h3>Comentarios y actividad</h3>{selected.comments.map((comment) => <article className={`ticket-comment ${comment.internal ? "internal" : ""}`} key={comment.id}><header><strong>{comment.author}</strong><span>{comment.date}</span>{comment.internal && <small>Nota interna</small>}</header><p>{comment.message}</p></article>)}</section>
      <form className="ticket-update-form" onSubmit={updateTicket}><h3>Actualizar ticket</h3><div className="form-row"><label className="form-field"><span>Estado</span><select name="status" defaultValue={selected.status}>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className="form-field"><span>Prioridad</span><select name="priority" defaultValue={selected.priority}><option>CRÍTICA</option><option>ALTA</option><option>MEDIA</option><option>BAJA</option></select></label></div><label className="form-field"><span>Responsable</span><select name="responsible" defaultValue={selected.responsible}><option>Mesa académica</option><option>Elena Campos</option><option>Javier Ponce</option><option>María Costa</option><option>Soporte técnico</option></select></label><label className="form-field"><span>Nuevo comentario</span><textarea name="comment" rows={3} placeholder="Registra respuesta, avance o solución"/></label><label className="ticket-internal-check"><input name="internal" type="checkbox"/><span>Comentario interno, no visible para el solicitante</span></label><button className="btn btn-primary" type="submit">Guardar actualización</button></form>
    </div></section></div>}
  </>;
}

type ReportDefinition = { id: string; name: string; description: string; category: string; icon: "attendance" | "grades" | "students" | "courses" | "retention" | "absence" | "tickets"; rows: Record<string, string | number>[] };
const reports: ReportDefinition[] = [
  { id: "REP-ASIS", name: "Asistencia por curso y sesión", description: "Presentes, tardanzas, faltas y porcentaje de asistencia.", category: "Académico", icon: "attendance", rows: [{ Curso: "Analítica de datos aplicada", Grupo: "GRP-03", Sesión: 4, Fecha: "2026-07-26", Presentes: 20, Tardanzas: 1, Faltas: 3, "Asistencia %": 88 }, { Curso: "Marketing digital", Grupo: "GRP-05", Sesión: 3, Fecha: "2026-07-25", Presentes: 23, Tardanzas: 2, Faltas: 3, "Asistencia %": 89 }] },
  { id: "REP-NOTAS", name: "Notas y evaluaciones", description: "Calificaciones, promedios, aprobados y pendientes.", category: "Académico", icon: "grades", rows: [{ Estudiante: "Mariana Torres López", Curso: "Analítica de datos aplicada", Evaluación: "Diagnóstica", Nota: 18, Estado: "Aprobado" }, { Estudiante: "Luis Mendoza Ruiz", Curso: "Analítica de datos aplicada", Evaluación: "Caso práctico", Nota: 13, Estado: "Aprobado" }] },
  { id: "REP-EST", name: "Matrícula de estudiantes", description: "Estudiantes, documentos, cursos y estado de matrícula.", category: "Personas", icon: "students", rows: [{ DNI: "70399200", Estudiante: "Mariana Torres López", Curso: "Analítica de datos aplicada", Grupo: "GRP-03", Estado: "Activo" }, { DNI: "71402854", Estudiante: "Luis Mendoza Ruiz", Curso: "Marketing digital", Grupo: "GRP-05", Estado: "Activo" }] },
  { id: "REP-CUR", name: "Cursos y programación", description: "Cursos, grupos, docentes, modalidad y avance.", category: "Operación", icon: "courses", rows: [{ Código: "CUR-AD-2026-03", Curso: "Analítica de datos aplicada", Grupo: "GRP-03", Docente: "Oscar Vildoso García", Modalidad: "Virtual", Avance: "64%" }, { Código: "CUR-MD-2026-02", Curso: "Marketing digital", Grupo: "GRP-05", Docente: "Claudia Rivas Soto", Modalidad: "Virtual", Avance: "42%" }] },
  { id: "REP-RET", name: "Retención y reinserción", description: "Estudiantes recuperados y asistencia posterior.", category: "Seguimiento", icon: "retention", rows: [{ Estudiante: "Valeria Campos León", Curso: "Liderazgo", Resultado: "Reinsertado", "Fecha retorno": "2026-07-20", "Asistencia posterior": "100%" }, { Estudiante: "Rosa Medina Castro", Curso: "Gestión empresarial", Resultado: "Reinsertado", "Fecha retorno": "2026-07-22", "Asistencia posterior": "100%" }] },
  { id: "REP-FAL", name: "Faltas y seguimiento", description: "Ausencias, prioridad, responsable y próxima acción.", category: "Seguimiento", icon: "absence", rows: [{ Estudiante: "Carlos Paredes Núñez", Curso: "Analítica de datos", Faltas: 5, Consecutivas: 3, Prioridad: "Crítica", Responsable: "Elena Campos" }, { Estudiante: "Andrea Salas Vega", Curso: "Analítica de datos", Faltas: 3, Consecutivas: 2, Prioridad: "Alta", Responsable: "Elena Campos" }] },
  { id: "REP-INC", name: "Incidencias y SLA", description: "Tickets, origen, categoría, prioridad, estado y tiempos.", category: "Operación", icon: "tickets", rows: initialTickets.map((item) => ({ Ticket: item.id, Asunto: item.subject, Origen: item.origin, Solicitante: item.reporter, Categoría: item.category, Prioridad: item.priority, Estado: statusLabels[item.status], Responsable: item.responsible, SLA: item.sla })) },
];

const reportIcons = { attendance: CheckCircle2, grades: GraduationCap, students: UsersRound, courses: FileSpreadsheet, retention: UserRound, absence: AlertTriangle, tickets: TicketCheck };

export function ManagementReports() {
  const [category, setCategory] = useState("TODAS");
  const [format, setFormat] = useState<"XLSX" | "CSV">("XLSX");
  const [period, setPeriod] = useState("2026-07");
  const [message, setMessage] = useState("");
  const visible = reports.filter((item) => category === "TODAS" || item.category === category);

  function downloadReport(report: ReportDefinition) {
    const sheet = XLSX.utils.json_to_sheet(report.rows);
    sheet["!cols"] = Object.keys(report.rows[0] ?? {}).map((key) => ({ wch: Math.max(14, key.length + 3) }));
    const safeName = report.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (format === "CSV") {
      const csv = XLSX.utils.sheet_to_csv(sheet);
      const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${safeName}-${period}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } else {
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "Reporte");
      XLSX.writeFile(workbook, `${safeName}-${period}.xlsx`);
    }
    setMessage(`${report.name} generado en formato ${format}.`);
  }

  function downloadAll() {
    const workbook = XLSX.utils.book_new();
    for (const report of visible) {
      const sheet = XLSX.utils.json_to_sheet(report.rows);
      XLSX.utils.book_append_sheet(workbook, sheet, report.id.slice(4, 10));
    }
    XLSX.writeFile(workbook, `reportes-gestion-${period}.xlsx`);
    setMessage(`${visible.length} reportes consolidados en un libro Excel.`);
  }

  return <>
    <header className="page-header"><div><span className="page-kicker">Analítica y exportación</span><h1>Reportes de gestión</h1><p>Genera y descarga la información académica, operativa y de seguimiento de la plataforma.</p></div><button className="btn btn-primary" onClick={downloadAll}><Download size={17}/>Descargar paquete completo</button></header>
    {message && <div className="feedback feedback-success"><CheckCircle2 size={16}/>{message}</div>}
    <section className="report-controls panel"><label className="form-field"><span>Periodo del reporte</span><input type="month" value={period} onChange={(event) => setPeriod(event.target.value)}/></label><label className="form-field"><span>Categoría</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="TODAS">Todas las categorías</option><option>Académico</option><option>Personas</option><option>Operación</option><option>Seguimiento</option></select></label><label className="form-field"><span>Formato de descarga</span><select value={format} onChange={(event) => setFormat(event.target.value as "XLSX" | "CSV")}><option value="XLSX">Excel (.xlsx)</option><option value="CSV">CSV (.csv)</option></select></label><div><strong>{visible.length} reportes disponibles</strong><span>Datos preparados para el periodo seleccionado.</span></div></section>
    <section className="report-grid">{visible.map((report) => { const Icon = reportIcons[report.icon]; return <article className="panel report-card" key={report.id}><header><span className="report-icon"><Icon size={21}/></span><span className="status-badge info">{report.category}</span></header><h2>{report.name}</h2><p>{report.description}</p><div><span><strong>{report.rows.length}</strong><small>registros de muestra</small></span><span><strong>{Object.keys(report.rows[0] ?? {}).length}</strong><small>campos</small></span></div><footer><small>Actualizado: 26/07/2026 12:30</small><button className="btn btn-secondary" onClick={() => downloadReport(report)}><Download size={15}/>Descargar {format}</button></footer></article>; })}</section>
  </>;
}
